using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.Core.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _inventoryRepository;

        public InventoryService(IInventoryRepository inventoryRepository)
        {
            _inventoryRepository = inventoryRepository;
        }

        public async Task<List<InventoryResponseDto>> GetAllItemsAsync()
        {
            var items = await _inventoryRepository.GetAllAsync();
            return items.Select(MapToDto).ToList();
        }

        public async Task<InventoryResponseDto?> GetItemByIdAsync(int id)
        {
            var item = await _inventoryRepository.GetByIdAsync(id);
            return item == null ? null : MapToDto(item);
        }

        public async Task<List<InventoryResponseDto>> GetLowStockItemsAsync()
        {
            var items = await _inventoryRepository.GetLowStockAsync();
            return items.Select(MapToDto).ToList();
        }

        public async Task<InventoryResponseDto> CreateItemAsync(CreateInventoryDto dto)
        {
            var item = new InventoryItem
            {
                Name = dto.Name,
                Unit = dto.Unit,
                CurrentStock = dto.CurrentStock,
                MinimumStock = dto.MinimumStock,
                LastUpdated = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            var created = await _inventoryRepository.CreateAsync(item);
            return MapToDto(created);
        }

        public async Task<bool> UpdateStockAsync(int id, UpdateInventoryDto dto, int userId)
        {
            var item = await _inventoryRepository.GetByIdAsync(id);
            if (item == null) return false;

            var change = dto.CurrentStock - item.CurrentStock;
            item.Name = dto.Name;
            item.Unit = dto.Unit;
            item.CurrentStock = dto.CurrentStock;
            item.MinimumStock = dto.MinimumStock;
            item.LastUpdated = DateTime.UtcNow;

            await _inventoryRepository.UpdateAsync(item);

            if (change != 0)
            {
                await _inventoryRepository.AddLogAsync(new InventoryLog
                {
                    InventoryItemId = id,
                    ChangeAmount = change,
                    Reason = dto.Reason ?? "Manual adjustment",
                    ChangedBy = userId
                });
            }

            return true;
        }

        public async Task<bool> DeleteItemAsync(int id)
        {
            return await _inventoryRepository.DeleteAsync(id);
        }

        private static InventoryResponseDto MapToDto(InventoryItem i) => new()
        {
            Id = i.Id,
            Name = i.Name,
            Unit = i.Unit,
            CurrentStock = i.CurrentStock,
            MinimumStock = i.MinimumStock,
            LastUpdated = i.LastUpdated
        };
    }
}
