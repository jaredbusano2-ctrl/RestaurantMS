using Microsoft.EntityFrameworkCore;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;
using RestaurantMS.Infrastructure.Data;

namespace RestaurantMS.Infrastructure.Repositories
{
    public class MenuRepository : IMenuRepository
    {
        private readonly AppDbContext _context;

        public MenuRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<MenuItem>> GetAllAsync()
        {
            return await _context.MenuItems
                .Where(m => !m.IsDeleted)
                .Include(m => m.Category)
                .Include(m => m.InventoryItem)
                .Include(m => m.Ingredients)
                    .ThenInclude(i => i.InventoryItem)
                .ToListAsync();
        }

        public async Task<MenuItem?> GetByIdAsync(int id)
        {
            return await _context.MenuItems
                .Where(m => !m.IsDeleted)
                .Include(m => m.Category)
                .Include(m => m.InventoryItem)
                .Include(m => m.Ingredients)
                    .ThenInclude(i => i.InventoryItem)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<List<MenuItem>> GetByCategoryAsync(int categoryId)
        {
            return await _context.MenuItems
                .Where(m => !m.IsDeleted && m.CategoryId == categoryId)
                .Include(m => m.Category)
                .Include(m => m.InventoryItem)
                .Include(m => m.Ingredients)
                    .ThenInclude(i => i.InventoryItem)
                .ToListAsync();
        }

        public async Task AddAsync(MenuItem item)
        {
            await _context.MenuItems.AddAsync(item);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(MenuItem item)
        {
            _context.MenuItems.Update(item);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var item = await _context.MenuItems.FindAsync(id);
            if (item != null)
            {
                item.IsDeleted = true;
                item.IsAvailable = false;
                item.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<MenuCategory>> GetCategoriesAsync()
        {
            return await _context.MenuCategories.ToListAsync();
        }
    }
}