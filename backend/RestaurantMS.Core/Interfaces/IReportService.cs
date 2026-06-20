using RestaurantMS.Core.DTOs;

namespace RestaurantMS.Core.Interfaces
{
    public interface IReportService
    {
        Task<List<DailySalesDto>> GetDailySalesAsync(DateTime from, DateTime to);
        Task<List<TopMenuItemDto>> GetTopMenuItemsAsync(DateTime from, DateTime to);
        Task<List<PaymentMethodSummaryDto>> GetPaymentMethodSummaryAsync(DateTime from, DateTime to);
    }
}