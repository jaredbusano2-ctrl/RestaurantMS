using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.API.Controllers
{
    [ApiController]
    [Route("api/menu")]
    [Authorize]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var items = await _menuService.GetAllItemsAsync();
                return Ok(ApiResponse<List<MenuItemResponseDto>>.Ok(items));
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
                var item = await _menuService.GetItemByIdAsync(id);
                if (item == null)
                    return NotFound(ApiResponse<string>.Fail("Menu item not found."));
                return Ok(ApiResponse<MenuItemResponseDto>.Ok(item));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _menuService.GetCategoriesAsync();
                return Ok(ApiResponse<List<MenuCategoryResponseDto>>.Ok(categories));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] CreateMenuItemDto dto)
        {
            try
            {
                await _menuService.CreateItemAsync(dto);
                return Ok(ApiResponse<string>.Ok("Menu item created."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMenuItemDto dto)
        {
            try
            {
                var result = await _menuService.UpdateItemAsync(id, dto);
                if (!result)
                    return NotFound(ApiResponse<string>.Fail("Menu item not found."));
                return Ok(ApiResponse<string>.Ok("Menu item updated."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _menuService.DeleteItemAsync(id);
                if (!result)
                    return NotFound(ApiResponse<string>.Fail("Menu item not found."));
                return Ok(ApiResponse<string>.Ok("Menu item deleted."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}