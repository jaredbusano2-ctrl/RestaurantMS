using RestaurantMS.Core.Entities;

namespace RestaurantMS.Core.Interfaces
{
    public interface IMenuRepository
    {
        Task<List<MenuItem>> GetAllAsync();
        Task<MenuItem?> GetByIdAsync(int id);
        Task<List<MenuItem>> GetByCategoryAsync(int categoryId);
        Task AddAsync(MenuItem item);
        Task UpdateAsync(MenuItem item);
        Task DeleteAsync(int id);
        Task<List<MenuCategory>> GetCategoriesAsync();
    }
}