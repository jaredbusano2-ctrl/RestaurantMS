using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.API.Controllers
{
    [ApiController]
    [Route("api/tables")]
    [Authorize]
    public class TableController : ControllerBase
    {
        private readonly ITableService _tableService;

        public TableController(ITableService tableService)
        {
            _tableService = tableService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var tables = await _tableService.GetAllTablesAsync();
                return Ok(ApiResponse<List<TableResponseDto>>.Ok(tables));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var table = await _tableService.GetTableByIdAsync(id);
                if (table == null)
                    return NotFound(ApiResponse<string>.Fail("Table not found."));
                return Ok(ApiResponse<TableResponseDto>.Ok(table));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin,Manager,Waiter")]
        public async Task<IActionResult> Create([FromBody] CreateTableDto dto)
        {
            try
            {
                await _tableService.CreateTableAsync(dto);
                return Ok(ApiResponse<string>.Ok("Table created."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,SuperAdmin,Manager,Waiter")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTableStatusDto dto)
        {
            try
            {
                var result = await _tableService.UpdateTableStatusAsync(id, dto.Status, dto.ReservedBy);
                if (!result)
                    return NotFound(ApiResponse<string>.Fail("Table not found."));
                return Ok(ApiResponse<string>.Ok("Table status updated."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpDelete("{id}/status")]
        [Authorize(Roles = "Admin,SuperAdmin,Manager,Waiter")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _tableService.DeleteTableAsync(id);
                if (!result)
                    return NotFound(ApiResponse<string>.Fail("Table not found."));
                return Ok(ApiResponse<string>.Ok("Table deleted."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}