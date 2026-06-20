using RestaurantMS.Core.DTOs;

namespace RestaurantMS.Core.Interfaces
{
    public interface IInventoryService
    {
        Task<List<InventoryResponseDto>> GetAllItemsAsync();
        Task<InventoryResponseDto?> GetItemByIdAsync(int id);
        Task<List<InventoryResponseDto>> GetLowStockItemsAsync();
        Task<bool> UpdateStockAsync(int id, UpdateInventoryDto dto, int userId);
    }
}