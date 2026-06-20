using RestaurantMS.Core.Entities;

namespace RestaurantMS.Core.Interfaces
{
    public interface IBillingRepository
    {
        Task<Bill?> GetByIdAsync(int id);
        Task<Bill?> GetByOrderIdAsync(int orderId);
        Task AddAsync(Bill bill);
        Task UpdateAsync(Bill bill);
        Task AddPaymentAsync(Payment payment);
        Task<List<Bill>> GetPaidBillsAsync();
    }
}