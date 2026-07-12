using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.Core.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IMenuRepository _menuRepository;
        private readonly ITableRepository _tableRepository;
        private readonly IInventoryRepository _inventoryRepository;

        public OrderService(
            IOrderRepository orderRepository,
            IMenuRepository menuRepository,
            ITableRepository tableRepository,
            IInventoryRepository inventoryRepository)
        {
            _orderRepository = orderRepository;
            _menuRepository = menuRepository;
            _tableRepository = tableRepository;
            _inventoryRepository = inventoryRepository;
        }

        public async Task<List<OrderResponseDto>> GetAllOrdersAsync()
        {
            var orders = await _orderRepository.GetAllAsync();
            return orders.Select(MapToDto).ToList();
        }

        public async Task<OrderResponseDto?> GetOrderByIdAsync(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            return order == null ? null : MapToDto(order);
        }

        public async Task<List<OrderResponseDto>> GetOrdersByStatusAsync(string status)
        {
            var orders = await _orderRepository.GetByStatusAsync(status);
            return orders.Select(MapToDto).ToList();
        }

        public async Task<int> CreateOrderAsync(CreateOrderDto dto, int waiterId)
        {
            var now = DateTime.Now;

            var order = new Order
            {
                TableId = dto.TableId,
                WaiterId = waiterId,
                Status = "Pending",
                SpecialInstructions = dto.SpecialInstructions,
                CreatedAt = now,
                UpdatedAt = now,
                InventoryDeducted = false,
                OrderItems = new List<OrderItem>()
            };

            foreach (var item in dto.Items)
            {
                var menuItem = await _menuRepository.GetByIdAsync(item.MenuItemId);
                if (menuItem == null) continue;

                order.OrderItems.Add(new OrderItem
                {
                    MenuItemId = item.MenuItemId,
                    Quantity = item.Quantity,
                    UnitPrice = menuItem.Price,
                    SpecialNote = item.SpecialNote,
                    CreatedAt = now
                });
            }

            Console.WriteLine($"🟡 Creating order at: {now}");

            await _orderRepository.AddAsync(order);

            Console.WriteLine($"✅ Order created: Id={order.Id}, CreatedAt={order.CreatedAt}");

            var table = await _tableRepository.GetByIdAsync(dto.TableId);
            if (table != null)
            {
                table.Status = "Occupied";
                table.UpdatedAt = now;
                await _tableRepository.UpdateAsync(table);
            }

            return order.Id;
        }

        public async Task<bool> UpdateOrderStatusAsync(int id, string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                throw new ArgumentException("Status cannot be empty.");

            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return false;

            var validTransitions = new Dictionary<string, string[]>
            {
                { "Pending", new[] { "Cooking", "Cancelled" } },
                { "Cooking", new[] { "Ready", "Cancelled" } },
                { "Ready", new[] { "Cancelled" } },
                { "Served", new string[] { } },
                { "Cancelled", new string[] { } }
            };

            if (validTransitions.ContainsKey(order.Status) &&
                !validTransitions[order.Status].Contains(status))
            {
                throw new InvalidOperationException(
                    $"Cannot transition from '{order.Status}' to '{status}'. " +
                    $"Allowed transitions: {string.Join(", ", validTransitions[order.Status])}"
                );
            }

            // ✅ NEW: Block Cooking if any required ingredient is out of stock
            if (status == "Cooking" && !order.InventoryDeducted)
            {
                var shortages = await GetInventoryShortagesAsync(order);
                if (shortages.Any())
                {
                    throw new InvalidOperationException(
                        $"Cannot start cooking — insufficient stock: {string.Join(", ", shortages)}"
                    );
                }
            }

            order.Status = status;
            order.UpdatedAt = DateTime.UtcNow;

            if (status == "Cooking" && !order.InventoryDeducted)
            {
                await DeductInventoryForOrderAsync(order);
                order.InventoryDeducted = true;
            }

            await _orderRepository.UpdateAsync(order);

            if (status == "Served")
            {
                var table = await _tableRepository.GetByIdAsync(order.TableId);
                if (table != null)
                {
                    table.Status = "Available";
                    await _tableRepository.UpdateAsync(table);
                }
            }

            return true;
        }

        private async Task<List<string>> GetInventoryShortagesAsync(Order order)
        {
            var shortages = new List<string>();

            foreach (var orderItem in order.OrderItems)
            {
                var menuItem = await _menuRepository.GetByIdAsync(orderItem.MenuItemId);
                if (menuItem == null) continue;

                var requirements = GetIngredientRequirements(menuItem);

                foreach (var (inventoryItemId, qtyPerUnit) in requirements)
                {
                    var inventoryItem = await _inventoryRepository.GetByIdAsync(inventoryItemId);
                    if (inventoryItem == null) continue;

                    var neededTotal = qtyPerUnit * orderItem.Quantity;
                    if (inventoryItem.CurrentStock < neededTotal)
                    {
                        shortages.Add($"{inventoryItem.Name} (has {inventoryItem.CurrentStock}, needs {neededTotal})");
                    }
                }
            }

            return shortages;
        }

        private async Task DeductInventoryForOrderAsync(Order order)
        {
            foreach (var orderItem in order.OrderItems)
            {
                var menuItem = await _menuRepository.GetByIdAsync(orderItem.MenuItemId);
                if (menuItem == null) continue;

                var requirements = GetIngredientRequirements(menuItem);

                foreach (var (inventoryItemId, qtyPerUnit) in requirements)
                {
                    var inventoryItem = await _inventoryRepository.GetByIdAsync(inventoryItemId);
                    if (inventoryItem == null) continue;

                    var deduction = qtyPerUnit * orderItem.Quantity;
                    inventoryItem.CurrentStock -= deduction;
                    if (inventoryItem.CurrentStock < 0) inventoryItem.CurrentStock = 0;
                    inventoryItem.LastUpdated = DateTime.UtcNow;

                    await _inventoryRepository.UpdateAsync(inventoryItem);
                    await _inventoryRepository.AddLogAsync(new InventoryLog
                    {
                        InventoryItemId = inventoryItem.Id,
                        ChangeAmount = -deduction,
                        Reason = $"Order #{order.Id} - {menuItem.Name} x{orderItem.Quantity}",
                        OrderId = order.Id,
                        ChangedBy = order.WaiterId
                    });
                }
            }
        }

        // Returns (InventoryItemId, QuantityRequired) pairs for a menu item.
        // Uses the new multi-ingredient table if configured; falls back to the
        // legacy single InventoryItemId link if no ingredients are set up yet.
        private static List<(int InventoryItemId, decimal QtyPerUnit)> GetIngredientRequirements(MenuItem menuItem)
        {
            if (menuItem.Ingredients != null && menuItem.Ingredients.Any())
            {
                return menuItem.Ingredients
                    .Select(i => (i.InventoryItemId, i.QuantityRequired))
                    .ToList();
            }

            if (menuItem.InventoryItemId.HasValue)
            {
                return new List<(int, decimal)> { (menuItem.InventoryItemId.Value, 1) };
            }

            return new List<(int, decimal)>();
        }

        private static OrderResponseDto MapToDto(Order o) => new()
        {
            Id = o.Id,
            TableNumber = o.Table?.TableNumber ?? string.Empty,
            TableId = o.TableId,
            WaiterName = o.Waiter?.FullName ?? string.Empty,
            WaiterId = o.WaiterId,
            Status = o.Status,
            SpecialInstructions = o.SpecialInstructions,
            CreatedAt = o.CreatedAt,
            UpdatedAt = o.UpdatedAt,
            Items = o.OrderItems?.Select(i => new OrderItemResponseDto
            {
                Id = i.Id,
                MenuItemName = i.MenuItem?.Name ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                SpecialNote = i.SpecialNote
            }).ToList() ?? new()
        };
    }
}