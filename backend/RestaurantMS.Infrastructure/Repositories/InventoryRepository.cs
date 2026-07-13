using Microsoft.EntityFrameworkCore;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;
using RestaurantMS.Infrastructure.Data;

namespace RestaurantMS.Infrastructure.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly AppDbContext _context;

        public InventoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<InventoryItem>> GetAllAsync()
        {
            return await _context.InventoryItems
                .Where(i => !i.IsArchived)
                .ToListAsync();
        }

        public async Task<List<InventoryItem>> GetArchivedAsync()
        {
            return await _context.InventoryItems
                .Where(i => i.IsArchived)
                .ToListAsync();
        }

        public async Task<InventoryItem?> GetByIdAsync(int id)
        {
            return await _context.InventoryItems.FindAsync(id);
        }

        public async Task<List<InventoryItem>> GetLowStockAsync()
        {
            return await _context.InventoryItems
                .Where(i => !i.IsArchived && i.CurrentStock <= i.MinimumStock)
                .ToListAsync();
        }

        public async Task<InventoryItem> CreateAsync(InventoryItem item)
        {
            await _context.InventoryItems.AddAsync(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task UpdateAsync(InventoryItem item)
        {
            _context.InventoryItems.Update(item);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ArchiveAsync(int id)
        {
            var item = await _context.InventoryItems
                .Include(i => i.MenuItems)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (item == null) return false;

            if (item.MenuItems.Any())
            {
                var linkedNames = string.Join(", ", item.MenuItems.Select(m => m.Name));
                throw new InvalidOperationException(
                    $"Cannot archive '{item.Name}' — it's still linked to menu item(s): {linkedNames}. " +
                    "Unlink it from those menu items first."
                );
            }

            item.IsArchived = true;
            item.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnarchiveAsync(int id)
        {
            var item = await _context.InventoryItems.FindAsync(id);
            if (item == null) return false;

            item.IsArchived = false;
            item.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task AddLogAsync(InventoryLog log)
        {
            await _context.InventoryLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }
    }
}