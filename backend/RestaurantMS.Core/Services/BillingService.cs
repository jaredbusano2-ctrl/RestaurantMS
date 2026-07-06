using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.Core.Services
{
    public class BillingService : IBillingService
    {
        private readonly IBillingRepository _billingRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly ITableRepository _tableRepository;
        private readonly IOrderService _orderService;

        public BillingService(
            IBillingRepository billingRepository,
            IOrderRepository orderRepository,
            ITableRepository tableRepository,
            IOrderService orderService)
        {
            _billingRepository = billingRepository;
            _orderRepository = orderRepository;
            _tableRepository = tableRepository;
            _orderService = orderService;
        }

        public async Task<BillResponseDto?> GenerateBillAsync(int orderId, int cashierId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new ArgumentException("Order not found");

            var existing = await _billingRepository.GetByOrderIdAsync(orderId);
            if (existing != null)
                return MapToDto(existing, order.Table?.TableNumber ?? "");

            var subtotal = order.OrderItems.Sum(i => i.UnitPrice * i.Quantity);

            var bill = new Bill
            {
                OrderId = orderId,
                Subtotal = subtotal,
                DiscountType = "None",
                DiscountValue = 0,
                Total = subtotal,
                Status = "Unpaid",
                GeneratedBy = cashierId
            };

            await _billingRepository.AddAsync(bill);
            return MapToDto(bill, order.Table?.TableNumber ?? "");
        }

        public async Task<BillResponseDto?> ApplyDiscountAsync(ApplyDiscountDto dto)
        {
            var bill = await _billingRepository.GetByIdAsync(dto.BillId);
            if (bill == null)
                throw new ArgumentException("Bill not found");

            if (bill.Status == "Paid")
                throw new InvalidOperationException("Cannot apply discount to a paid bill");

            bill.DiscountType = dto.DiscountType;
            bill.DiscountValue = dto.DiscountValue;

            bill.Total = dto.DiscountType switch
            {
                "Percentage" => bill.Subtotal - (bill.Subtotal * dto.DiscountValue / 100),
                "Fixed" => bill.Subtotal - dto.DiscountValue,
                _ => bill.Subtotal
            };

            if (bill.Total < 0)
                bill.Total = 0;

            await _billingRepository.UpdateAsync(bill);
            return MapToDto(bill, bill.Order?.Table?.TableNumber ?? "");
        }

        public async Task<PaymentDto?> GetPaymentByBillIdAsync(int billId)
        {
            try
            {
                var payment = await _billingRepository.GetPaymentByBillIdAsync(billId);
                if (payment == null) return null;

                return new PaymentDto
                {
                    Id = payment.Id,
                    BillId = payment.BillId,
                    Method = payment.Method,
                    Amount = payment.Amount,
                    Status = payment.Status,
                    ProcessedBy = payment.ProcessedBy,
                    PayMongoReference = payment.PayMongoReference,
                    CreatedAt = payment.CreatedAt
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting payment: {ex.Message}");
                return null;
            }
        }

        public async Task<PaymentResponseDto?> ProcessPaymentAsync(ProcessPaymentDto dto, int cashierId)
        {
            Console.WriteLine($"🟡 === STARTING PAYMENT PROCESS ===");
            Console.WriteLine($"🟡 BillId: {dto.BillId}, Amount: {dto.Amount}, Method: {dto.Method}");

            var bill = await _billingRepository.GetByIdAsync(dto.BillId);
            if (bill == null)
                throw new ArgumentException("Bill not found");

            Console.WriteLine($"🟡 Bill found: Id={bill.Id}, OrderId={bill.OrderId}, Status={bill.Status}");

            if (bill.Status == "Paid")
                throw new InvalidOperationException("This bill has already been paid");

            var existingPayment = await _billingRepository.GetPaymentByBillIdAsync(dto.BillId);
            if (existingPayment != null)
            {
                Console.WriteLine($"⚠️ Payment already exists for BillId: {dto.BillId}");
                return new PaymentResponseDto
                {
                    Id = existingPayment.Id,
                    BillId = existingPayment.BillId,
                    Method = existingPayment.Method,
                    Amount = existingPayment.Amount,
                    Status = existingPayment.Status,
                    CreatedAt = existingPayment.CreatedAt,
                    Message = "Payment already processed"
                };
            }

            if (Math.Abs(dto.Amount - bill.Total) > 0.01m)
                throw new ArgumentException($"Payment amount (₱{dto.Amount:F2}) does not match bill total (₱{bill.Total:F2})");

            var payment = new Payment
            {
                BillId = dto.BillId,
                Method = dto.Method,
                Amount = dto.Amount,
                Status = "Completed",
                ProcessedBy = cashierId,
                CreatedAt = DateTime.UtcNow
            };

            await _billingRepository.AddPaymentAsync(payment);
            Console.WriteLine($"✅ Payment created: Id={payment.Id}");

            bill.Status = "Paid";
            await _billingRepository.UpdateAsync(bill);
            Console.WriteLine($"✅ Bill updated: Id={bill.Id}, Status={bill.Status}");

            Console.WriteLine($"🟡 Updating order status to 'Served'... OrderId: {bill.OrderId}");

            try
            {
                var result = await _orderService.UpdateOrderStatusAsync(bill.OrderId, "Served");

                if (result)
                {
                    Console.WriteLine($"✅ Order #{bill.OrderId} status updated to 'Served' via OrderService");
                }
                else
                {
                    Console.WriteLine($"❌ OrderService failed to update order #{bill.OrderId}");
                    await UpdateOrderDirectlyAsync(bill.OrderId);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error updating order via OrderService: {ex.Message}");
                await UpdateOrderDirectlyAsync(bill.OrderId);
            }

            var verifyOrder = await _orderRepository.GetByIdAsync(bill.OrderId);
            if (verifyOrder != null)
            {
                Console.WriteLine($"✅ VERIFICATION: Order {verifyOrder.Id} status is now: '{verifyOrder.Status}'");
            }

            Console.WriteLine($"🟡 === PAYMENT PROCESS COMPLETED ===");

            return new PaymentResponseDto
            {
                Id = payment.Id,
                BillId = payment.BillId,
                Method = payment.Method,
                Amount = payment.Amount,
                Status = payment.Status,
                CreatedAt = payment.CreatedAt,
                Message = "Payment processed successfully"
            };
        }

        private async Task UpdateOrderDirectlyAsync(int orderId)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order != null)
                {
                    order.Status = "Served";
                    order.UpdatedAt = DateTime.UtcNow;
                    await _orderRepository.UpdateAsync(order);
                    Console.WriteLine($"✅ Order updated via repository: {order.Id}");

                    if (order.TableId > 0)
                    {
                        var table = await _tableRepository.GetByIdAsync(order.TableId);
                        if (table != null)
                        {
                            table.Status = "Available";
                            table.ReservedBy = null;
                            table.UpdatedAt = DateTime.UtcNow;
                            await _tableRepository.UpdateAsync(table);
                            Console.WriteLine($"✅ Table updated via repository: {table.Id}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Fallback update failed: {ex.Message}");
            }
        }

        public async Task<List<BillResponseDto>> GetPaidBillsAsync()
        {
            var bills = await _billingRepository.GetPaidBillsAsync();
            return bills.Select(b => MapToDto(b, b.Order?.Table?.TableNumber ?? "")).ToList();
        }

        public async Task<bool> DeleteBillAsync(int id)
        {
            return await _billingRepository.DeleteAsync(id);
        }

        public async Task<BillResponseDto?> GetBillByIdAsync(int id)
        {
            var bill = await _billingRepository.GetByIdAsync(id);
            if (bill == null) return null;
            return MapToDto(bill, bill.Order?.Table?.TableNumber ?? "");
        }

        private static BillResponseDto MapToDto(Bill b, string tableNumber) => new()
        {
            Id = b.Id,
            OrderId = b.OrderId,
            TableNumber = tableNumber,
            Subtotal = b.Subtotal,
            DiscountType = b.DiscountType,
            DiscountValue = b.DiscountValue,
            Total = b.Total,
            Status = b.Status,
            CreatedAt = b.CreatedAt
        };

        public async Task<int> DeleteAllPaidBillsAsync()
        {
            return await _billingRepository.DeleteAllPaidAsync();
        }
    }
}