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
        private readonly IWebHostEnvironment _env;

        public MenuController(IMenuService menuService, IWebHostEnvironment env)
        {
            _menuService = menuService;
            _env = env;
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

        [HttpPost("upload-image")]
        [Authorize(Roles = "Admin,SuperAdmin,Manager")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(ApiResponse<string>.Fail("No file uploaded."));

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(ext))
                    return BadRequest(ApiResponse<string>.Fail("Only JPG, PNG, and WEBP images are allowed."));

                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest(ApiResponse<string>.Fail("Image must be under 5MB."));

                var fileName = $"{Guid.NewGuid()}{ext}";
                var uploadsFolder = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "menu");
                Directory.CreateDirectory(uploadsFolder);
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/menu/{fileName}";
                return Ok(ApiResponse<string>.Ok(imageUrl, "Image uploaded successfully."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin,Manager")]
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
        [Authorize(Roles = "Admin,SuperAdmin,Manager")]
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
        [Authorize(Roles = "Admin,SuperAdmin,Manager")]
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
