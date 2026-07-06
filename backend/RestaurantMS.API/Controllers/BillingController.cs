using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;
using System.Security.Claims;

namespace RestaurantMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BillingController : ControllerBase
    {
        private readonly IBillingService _billingService;

        public BillingController(IBillingService billingService)
        {
            _billingService = billingService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateBill([FromBody] GenerateBillDto dto)
        {
            try
            {
                var cashierId = GetUserId();
                var result = await _billingService.GenerateBillAsync(dto.OrderId, cashierId);
                if (result == null)
                    return BadRequest(new { error = "Failed to generate bill" });

                return Ok(new { data = result });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("discount")]
        public async Task<IActionResult> ApplyDiscount([FromBody] ApplyDiscountDto dto)
        {
            try
            {
                var result = await _billingService.ApplyDiscountAsync(dto);
                if (result == null)
                    return BadRequest(new { error = "Failed to apply discount" });

                return Ok(new { data = result });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("pay")]
        public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentDto dto)
        {
            try
            {
                var cashierId = GetUserId();
                var result = await _billingService.ProcessPaymentAsync(dto, cashierId);
                if (result == null)
                    return BadRequest(new { error = "Failed to process payment" });

                return Ok(new { data = result });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while processing payment", details = ex.Message });
            }
        }

        // ✅ GET: api/billing/payment/{billId} - Cleaner endpoint
        [HttpGet("payment/{billId}")]
        public async Task<IActionResult> GetPaymentByBillId(int billId)
        {
            try
            {
                var payment = await _billingService.GetPaymentByBillIdAsync(billId);
                if (payment == null)
                    return NotFound(new { error = "No payment found for this bill" });

                return Ok(payment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ✅ GET: api/billing/bill/{billId}/payment - Kept for backward compatibility
        [HttpGet("bill/{billId}/payment")]
        public async Task<IActionResult> GetPaymentByBillIdAlt(int billId)
        {
            try
            {
                var payment = await _billingService.GetPaymentByBillIdAsync(billId);
                if (payment == null)
                    return NotFound(new { error = "No payment found for this bill" });

                return Ok(payment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("bill/{id}")]
        public async Task<IActionResult> GetBillById(int id)
        {
            try
            {
                var bill = await _billingService.GetBillByIdAsync(id);
                if (bill == null)
                    return NotFound(new { error = "Bill not found" });

                return Ok(new { data = bill });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("paid")]
        public async Task<IActionResult> GetPaidBills()
        {
            try
            {
                var bills = await _billingService.GetPaidBillsAsync();
                return Ok(new { data = bills });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteBill(int id)
        {
            try
            {
                var result = await _billingService.DeleteBillAsync(id);
                if (!result)
                    return NotFound(new { error = "Bill not found" });

                return Ok(new { message = "Bill deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("paid")]
        public async Task<IActionResult> DeleteAllPaidBills()
        {
            try
            {
                var count = await _billingService.DeleteAllPaidBillsAsync();
                return Ok(new { message = $"{count} paid bill(s) deleted successfully", count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("User ID not found");

            return int.Parse(userIdClaim);
        }
    }
}