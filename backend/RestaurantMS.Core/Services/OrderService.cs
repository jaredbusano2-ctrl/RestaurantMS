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
            var order = new Order
            {
                TableId = dto.TableId,
                WaiterId = waiterId,
                Status = "Pending",
                SpecialInstructions = dto.SpecialInstructions,
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
                    SpecialNote = item.SpecialNote
                });
            }

            await _orderRepository.AddAsync(order);

            var table = await _tableRepository.GetByIdAsync(dto.TableId);
            if (table != null)
            {
                table.Status = "Occupied";
                await _tableRepository.UpdateAsync(table);
            }

            return order.Id;
        }

        public async Task<bool> UpdateOrderStatusAsync(int id, string status)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return false;

            order.Status = status;
            order.UpdatedAt = DateTime.UtcNow;

            // Deduct inventory when kitchen starts cooking, exactly once per order
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

        private async Task DeductInventoryForOrderAsync(Order order)
        {
            foreach (var orderItem in order.OrderItems)
            {
                var menuItem = await _menuRepository.GetByIdAsync(orderItem.MenuItemId);
                if (menuItem?.InventoryItemId == null) continue;

                var inventoryItem = await _inventoryRepository.GetByIdAsync(menuItem.InventoryItemId.Value);
                if (inventoryItem == null) continue;

                var deduction = orderItem.Quantity;
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
