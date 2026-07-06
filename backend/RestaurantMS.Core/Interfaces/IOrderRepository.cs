using RestaurantMS.Core.Entities;

namespace RestaurantMS.Core.Interfaces
{
    public interface IOrderRepository
    {
        Task<List<Order>> GetAllAsync();
        Task<Order?> GetByIdAsync(int id);
        Task<List<Order>> GetByStatusAsync(string status);
        Task<List<Order>> GetByTableIdAsync(int tableId);
        Task AddAsync(Order order);
        Task UpdateAsync(Order order);

    }
}