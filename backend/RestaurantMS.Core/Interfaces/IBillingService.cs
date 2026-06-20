using RestaurantMS.Core.DTOs;

namespace RestaurantMS.Core.Interfaces
{
    public interface IBillingService
    {
        Task<BillResponseDto?> GenerateBillAsync(int orderId, int cashierId);
        Task<BillResponseDto?> ApplyDiscountAsync(ApplyDiscountDto dto);
        Task<PaymentResponseDto?> ProcessPaymentAsync(ProcessPaymentDto dto, int cashierId);
        Task<BillResponseDto?> GetBillByIdAsync(int id);
        Task<List<BillResponseDto>> GetPaidBillsAsync();
        Task<PaymentDto?> GetPaymentByBillIdAsync(int billId);
    }
}