using RestaurantMS.Core.Entities;

namespace RestaurantMS.Core.Interfaces
{
    public interface IInventoryRepository
    {
        Task<List<InventoryItem>> GetAllAsync();
        Task<InventoryItem?> GetByIdAsync(int id);
        Task<List<InventoryItem>> GetLowStockAsync();
        Task UpdateAsync(InventoryItem item);
        Task AddLogAsync(InventoryLog log);
    }
}