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
                IsAvailable = dto.IsAvailable,
                ImageUrl = dto.ImageUrl,
                Ingredients = (dto.Ingredients ?? new List<MenuItemIngredientDto>())
                    .Where(i => i.InventoryItemId > 0 && i.QuantityRequired > 0)
                    .Select(i => new MenuItemIngredient
                    {
                        InventoryItemId = i.InventoryItemId,
                        QuantityRequired = i.QuantityRequired
                    }).ToList()
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
            item.ImageUrl = dto.ImageUrl;
            item.UpdatedAt = DateTime.UtcNow;

            // Replace the ingredient list entirely with what was submitted
            item.Ingredients.Clear();
            foreach (var ing in (dto.Ingredients ?? new List<MenuItemIngredientDto>())
                         .Where(i => i.InventoryItemId > 0 && i.QuantityRequired > 0))
            {
                item.Ingredients.Add(new MenuItemIngredient
                {
                    InventoryItemId = ing.InventoryItemId,
                    QuantityRequired = ing.QuantityRequired
                });
            }

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

        private static bool HasSufficientStock(MenuItem item)
        {
            if (item.Ingredients != null && item.Ingredients.Any())
            {
                return item.Ingredients.All(ing =>
                    ing.InventoryItem != null && ing.InventoryItem.CurrentStock >= ing.QuantityRequired);
            }

            if (item.InventoryItem != null)
            {
                return item.InventoryItem.CurrentStock > 0;
            }

            // No inventory tracking configured at all — treat as always in stock
            return true;
        }

        private static MenuItemResponseDto MapToDto(MenuItem item)
        {
            var hasSufficientStock = HasSufficientStock(item);

            return new MenuItemResponseDto
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                Price = item.Price,
                Category = item.Category?.Name ?? string.Empty,
                CategoryId = item.CategoryId,
                InventoryItemId = item.InventoryItemId,
                InventoryItemName = item.InventoryItem?.Name,
                // Manual toggle AND stock check both have to be true to actually show as available
                IsAvailable = item.IsAvailable && hasSufficientStock,
                IsOutOfStock = !hasSufficientStock,
                ImageUrl = item.ImageUrl,
                CreatedAt = item.CreatedAt,
                Ingredients = item.Ingredients?.Select(i => new MenuItemIngredientResponseDto
                {
                    InventoryItemId = i.InventoryItemId,
                    InventoryItemName = i.InventoryItem?.Name ?? string.Empty,
                    Unit = i.InventoryItem?.Unit ?? string.Empty,
                    QuantityRequired = i.QuantityRequired
                }).ToList() ?? new List<MenuItemIngredientResponseDto>()
            };
        }
    }
}