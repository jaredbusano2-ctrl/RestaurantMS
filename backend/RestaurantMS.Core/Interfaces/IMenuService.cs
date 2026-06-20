using RestaurantMS.Core.DTOs;

namespace RestaurantMS.Core.Interfaces
{
    public interface IMenuService
    {
        Task<List<MenuItemResponseDto>> GetAllItemsAsync();
        Task<MenuItemResponseDto?> GetItemByIdAsync(int id);
        Task<List<MenuItemResponseDto>> GetItemsByCategoryAsync(int categoryId);
        Task<bool> CreateItemAsync(CreateMenuItemDto dto);
        Task<bool> UpdateItemAsync(int id, UpdateMenuItemDto dto);
        Task<bool> DeleteItemAsync(int id);
        Task<List<MenuCategoryResponseDto>> GetCategoriesAsync();
    }
}