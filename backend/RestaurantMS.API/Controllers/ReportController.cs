using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.API.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "Admin,SuperAdmin,Manager")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("daily")]
        public async Task<IActionResult> GetDailySales([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            try
            {
                var fromDate = from ?? DateTime.UtcNow.Date;
                var toDate = to ?? DateTime.UtcNow.Date.AddDays(1);
                var result = await _reportService.GetDailySalesAsync(fromDate, toDate);
                return Ok(ApiResponse<List<DailySalesDto>>.Ok(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpGet("items")]
        public async Task<IActionResult> GetTopItems([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            try
            {
                var fromDate = from ?? DateTime.UtcNow.Date;
                var toDate = to ?? DateTime.UtcNow.Date.AddDays(1);
                var result = await _reportService.GetTopMenuItemsAsync(fromDate, toDate);
                return Ok(ApiResponse<List<TopMenuItemDto>>.Ok(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }

        [HttpGet("payments")]
        public async Task<IActionResult> GetPaymentSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            try
            {
                var fromDate = from ?? DateTime.UtcNow.Date;
                var toDate = to ?? DateTime.UtcNow.Date.AddDays(1);
                var result = await _reportService.GetPaymentMethodSummaryAsync(fromDate, toDate);
                return Ok(ApiResponse<List<PaymentMethodSummaryDto>>.Ok(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}