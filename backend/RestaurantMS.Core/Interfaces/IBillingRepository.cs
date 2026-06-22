using RestaurantMS.Core.Entities;

namespace RestaurantMS.Core.Interfaces
{
    public interface IBillingRepository
    {
        Task<Bill?> GetByIdAsync(int id);
        Task<Bill?> GetByOrderIdAsync(int orderId);
        Task<List<Bill>> GetPaidBillsAsync();
        Task AddAsync(Bill bill);
        Task UpdateAsync(Bill bill);
        Task AddPaymentAsync(Payment payment);
        Task<Payment?> GetPaymentByBillIdAsync(int billId);
        Task<bool> DeleteAsync(int id);
        Task<int> DeleteAllPaidAsync();
    }
}