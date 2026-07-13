using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;
using System.Security.Claims;

namespace RestaurantMS.API.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,SuperAdmin,Manager,Waiter")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var orders = await _orderService.GetAllOrdersAsync();
                return Ok(ApiResponse<List<OrderResponseDto>>.Ok(orders));
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
                var order = await _orderService.GetOrderByIdAsync(id);
                if (order == null)
                    return NotFound(ApiResponse<string>.Fail("Order not found."));
                return Ok(ApiResponse<OrderResponseDto>.Ok(order));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            try
            {
                var orders = await _orderService.GetOrdersByStatusAsync(status);
                return Ok(ApiResponse<List<OrderResponseDto>>.Ok(orders));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Waiter,Admin,SuperAdmin,Manager")]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var orderId = await _orderService.CreateOrderAsync(dto, userId);
                return Ok(ApiResponse<int>.Ok(orderId, "Order created successfully."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Waiter,KitchenStaff,Admin,SuperAdmin,Manager")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            try
            {
                var result = await _orderService.UpdateOrderStatusAsync(id, dto.Status);
                if (!result)
                    return NotFound(ApiResponse<string>.Fail("Order not found."));
                return Ok(ApiResponse<string>.Ok("Order status updated."));
            }
            catch (InvalidOperationException ex)
            {
                // Business-rule rejection (e.g. insufficient stock, invalid status transition)
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}