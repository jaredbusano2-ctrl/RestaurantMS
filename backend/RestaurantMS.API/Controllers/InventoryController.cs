using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;
using System.Security.Claims;

namespace RestaurantMS.API.Controllers
{
    [ApiController]
    [Route("api/inventory")]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,SuperAdmin,Manager,KitchenStaff")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var items = await _inventoryService.GetAllItemsAsync();
                return Ok(ApiResponse<List<InventoryResponseDto>>.Ok(items));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpGet("low-stock")]
        [Authorize(Roles = "Admin,SuperAdmin,Manager,KitchenStaff")]
        public async Task<IActionResult> GetLowStock()
        {
            try
            {
                var items = await _inventoryService.GetLowStockItemsAsync();
                return Ok(ApiResponse<List<InventoryResponseDto>>.Ok(items));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateInventoryDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _inventoryService.UpdateStockAsync(id, dto, userId);
                if (!result)
                    return NotFound(ApiResponse<string>.Fail("Inventory item not found."));
                return Ok(ApiResponse<string>.Ok("Stock updated."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}