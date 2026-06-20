using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.Core.Services
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;

        public ReportService(IReportRepository reportRepository)
        {
            _reportRepository = reportRepository;
        }

        public async Task<List<DailySalesDto>> GetDailySalesAsync(DateTime from, DateTime to)
        {
            return await _reportRepository.GetDailySalesAsync(from, to);
        }

        public async Task<List<TopMenuItemDto>> GetTopMenuItemsAsync(DateTime from, DateTime to)
        {
            return await _reportRepository.GetTopMenuItemsAsync(from, to);
        }

        public async Task<List<PaymentMethodSummaryDto>> GetPaymentMethodSummaryAsync(DateTime from, DateTime to)
        {
            return await _reportRepository.GetPaymentMethodSummaryAsync(from, to);
        }
    }
}