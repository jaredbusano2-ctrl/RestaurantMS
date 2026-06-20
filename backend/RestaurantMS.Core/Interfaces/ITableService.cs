using RestaurantMS.Core.DTOs;

namespace RestaurantMS.Core.Interfaces
{
    public interface ITableService
    {
        Task<List<TableResponseDto>> GetAllTablesAsync();
        Task<TableResponseDto?> GetTableByIdAsync(int id);
        Task<bool> CreateTableAsync(CreateTableDto dto);
        Task<bool> UpdateTableStatusAsync(int id, string status, string? reservedBy = null);
        Task<bool> DeleteTableAsync(int id);
    }
}