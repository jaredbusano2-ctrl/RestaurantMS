using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;
using System.Security.Claims;

namespace RestaurantMS.API.Controllers
{
    [ApiController]
    [Route("api/billing")]
    [Authorize]
    public class BillingController : ControllerBase
    {
        private readonly IBillingService _billingService;

        public BillingController(IBillingService billingService)
        {
            _billingService = billingService;
        }

        [HttpPost("generate")]
        [Authorize(Roles = "Cashier,Admin,SuperAdmin")]
        public async Task<IActionResult> GenerateBill([FromBody] GenerateBillDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var bill = await _billingService.GenerateBillAsync(dto.OrderId, userId);
                if (bill == null)
                    return NotFound(ApiResponse<string>.Fail("Order not found."));
                return Ok(ApiResponse<BillResponseDto>.Ok(bill, "Bill generated."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message, stack = ex.StackTrace });
            }
        }

        [HttpPost("discount")]
        [Authorize(Roles = "Cashier,Admin,SuperAdmin")]
        public async Task<IActionResult> ApplyDiscount([FromBody] ApplyDiscountDto dto)
        {
            try
            {
                var bill = await _billingService.ApplyDiscountAsync(dto);
                if (bill == null)
                    return NotFound(ApiResponse<string>.Fail("Bill not found."));
                return Ok(ApiResponse<BillResponseDto>.Ok(bill, "Discount applied."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message, stack = ex.StackTrace });
            }
        }

        [HttpPost("pay")]
        [Authorize(Roles = "Cashier,Admin,SuperAdmin")]
        public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var payment = await _billingService.ProcessPaymentAsync(dto, userId);
                if (payment == null)
                    return NotFound(ApiResponse<string>.Fail("Bill not found."));
                return Ok(ApiResponse<PaymentResponseDto>.Ok(payment, "Payment processed."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message, stack = ex.StackTrace });
            }
        }

        [HttpGet("history")]
        [Authorize(Roles = "Cashier,Admin,SuperAdmin,Manager,Waiter")]
        public async Task<IActionResult> GetHistory()
        {
            try
            {
                var result = await _billingService.GetPaidBillsAsync();
                return Ok(ApiResponse<List<BillResponseDto>>.Ok(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message, stack = ex.StackTrace });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Cashier,Admin,SuperAdmin,Manager")]
        public async Task<IActionResult> GetBill(int id)
        {
            try
            {
                var bill = await _billingService.GetBillByIdAsync(id);
                if (bill == null)
                    return NotFound(ApiResponse<string>.Fail("Bill not found."));
                return Ok(ApiResponse<BillResponseDto>.Ok(bill));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}