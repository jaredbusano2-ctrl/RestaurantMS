using RestaurantMS.Core.Entities;

namespace RestaurantMS.Core.Interfaces
{
    public interface IInventoryRepository
    {
        Task<List<InventoryItem>> GetAllAsync();
        Task<InventoryItem?> GetByIdAsync(int id);
        Task<List<InventoryItem>> GetLowStockAsync();
        Task<InventoryItem> CreateAsync(InventoryItem item);
        Task UpdateAsync(InventoryItem item);
        Task<bool> DeleteAsync(int id);
        Task AddLogAsync(InventoryLog log);
    }
}
