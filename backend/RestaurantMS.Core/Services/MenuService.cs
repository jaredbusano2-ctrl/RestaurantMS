using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.Core.Services
{
    public class MenuService : IMenuService
    {
        private readonly IMenuRepository _menuRepository;

        public MenuService(IMenuRepository menuRepository)
        {
            _menuRepository = menuRepository;
        }

        public async Task<List<MenuItemResponseDto>> GetAllItemsAsync()
        {
            var items = await _menuRepository.GetAllAsync();
            return items.Select(MapToDto).ToList();
        }

        public async Task<MenuItemResponseDto?> GetItemByIdAsync(int id)
        {
            var item = await _menuRepository.GetByIdAsync(id);
            return item == null ? null : MapToDto(item);
        }

        public async Task<List<MenuItemResponseDto>> GetItemsByCategoryAsync(int categoryId)
        {
            var items = await _menuRepository.GetByCategoryAsync(categoryId);
            return items.Select(MapToDto).ToList();
        }

        public async Task<bool> CreateItemAsync(CreateMenuItemDto dto)
        {
            var item = new MenuItem
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                CategoryId = dto.CategoryId,
                InventoryItemId = dto.InventoryItemId,
                IsAvailable = dto.IsAvailable
            };
            await _menuRepository.AddAsync(item);
            return true;
        }

        public async Task<bool> UpdateItemAsync(int id, UpdateMenuItemDto dto)
        {
            var item = await _menuRepository.GetByIdAsync(id);
            if (item == null) return false;

            item.Name = dto.Name;
            item.Description = dto.Description;
            item.Price = dto.Price;
            item.CategoryId = dto.CategoryId;
            item.InventoryItemId = dto.InventoryItemId;
            item.IsAvailable = dto.IsAvailable;
            item.UpdatedAt = DateTime.UtcNow;

            await _menuRepository.UpdateAsync(item);
            return true;
        }

        public async Task<bool> DeleteItemAsync(int id)
        {
            var item = await _menuRepository.GetByIdAsync(id);
            if (item == null) return false;
            await _menuRepository.DeleteAsync(id);
            return true;
        }

        public async Task<List<MenuCategoryResponseDto>> GetCategoriesAsync()
        {
            var categories = await _menuRepository.GetCategoriesAsync();
            return categories.Select(c => new MenuCategoryResponseDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description
            }).ToList();
        }

        private static MenuItemResponseDto MapToDto(MenuItem item) => new()
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Price = item.Price,
            Category = item.Category?.Name ?? string.Empty,
            CategoryId = item.CategoryId,
            InventoryItemId = item.InventoryItemId,
            InventoryItemName = item.InventoryItem?.Name,
            IsAvailable = item.IsAvailable,
            CreatedAt = item.CreatedAt
        };
    }
}