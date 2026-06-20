using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.Core.Services
{
    public class TableService : ITableService
    {
        private readonly ITableRepository _tableRepository;

        public TableService(ITableRepository tableRepository)
        {
            _tableRepository = tableRepository;
        }

        public async Task<List<TableResponseDto>> GetAllTablesAsync()
        {
            var tables = await _tableRepository.GetAllAsync();
            return tables.Select(MapToDto).ToList();
        }

        public async Task<TableResponseDto?> GetTableByIdAsync(int id)
        {
            var table = await _tableRepository.GetByIdAsync(id);
            return table == null ? null : MapToDto(table);
        }

        public async Task<bool> CreateTableAsync(CreateTableDto dto)
        {
            var table = new Table
            {
                TableNumber = dto.TableNumber,
                Capacity = dto.Capacity,
                Status = "Available"
            };
            await _tableRepository.AddAsync(table);
            return true;
        }

            public async Task<bool> UpdateTableStatusAsync(int id, string status, string? reservedBy = null)
        {
            var table = await _tableRepository.GetByIdAsync(id);
            if (table == null) return false;
            table.Status = status;
            table.ReservedBy = status == "Reserved" ? reservedBy : null;
            table.UpdatedAt = DateTime.UtcNow;
            await _tableRepository.UpdateAsync(table);
            return true;
        }

        public async Task<bool> DeleteTableAsync(int id)
        {
            var table = await _tableRepository.GetByIdAsync(id);
            if (table == null) return false;
            await _tableRepository.DeleteAsync(id);
            return true;
        }

        private static TableResponseDto MapToDto(Table t) => new()
{
    Id = t.Id,
    TableNumber = t.TableNumber,
    Capacity = t.Capacity,
    Status = t.Status,
    ReservedBy = t.ReservedBy
};
    }
}