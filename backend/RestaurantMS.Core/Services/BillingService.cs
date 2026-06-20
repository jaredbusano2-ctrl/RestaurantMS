using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.Core.Services
{
    public class BillingService : IBillingService
    {
        private readonly IBillingRepository _billingRepository;
        private readonly IOrderRepository _orderRepository;

        public BillingService(IBillingRepository billingRepository, IOrderRepository orderRepository)
        {
            _billingRepository = billingRepository;
            _orderRepository = orderRepository;
        }

        public async Task<BillResponseDto?> GenerateBillAsync(int orderId, int cashierId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return null;

            var existing = await _billingRepository.GetByOrderIdAsync(orderId);
            if (existing != null) return MapToDto(existing, order.Table?.TableNumber ?? "");

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
            if (bill == null) return null;

            bill.DiscountType = dto.DiscountType;
            bill.DiscountValue = dto.DiscountValue;

            bill.Total = dto.DiscountType switch
            {
                "Percentage" => bill.Subtotal - (bill.Subtotal * dto.DiscountValue / 100),
                "Fixed" => bill.Subtotal - dto.DiscountValue,
                _ => bill.Subtotal
            };

            await _billingRepository.UpdateAsync(bill);
            return MapToDto(bill, bill.Order?.Table?.TableNumber ?? "");
        }

        public async Task<PaymentResponseDto?> ProcessPaymentAsync(ProcessPaymentDto dto, int cashierId)
        {
            var bill = await _billingRepository.GetByIdAsync(dto.BillId);
            if (bill == null) return null;

            var payment = new Payment
            {
                BillId = dto.BillId,
                Method = dto.Method,
                Amount = dto.Amount,
                Status = "Completed",
                ProcessedBy = cashierId
            };

            await _billingRepository.AddPaymentAsync(payment);

            bill.Status = "Paid";
            await _billingRepository.UpdateAsync(bill);

            return new PaymentResponseDto
            {
                Id = payment.Id,
                BillId = payment.BillId,
                Method = payment.Method,
                Amount = payment.Amount,
                Status = payment.Status,
                CreatedAt = payment.CreatedAt
            };
        }

        public async Task<List<BillResponseDto>> GetPaidBillsAsync()
{
    var bills = await _billingRepository.GetPaidBillsAsync();
    return bills.Select(b => MapToDto(b, b.Order?.Table?.TableNumber ?? "")).ToList();
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
    }
}