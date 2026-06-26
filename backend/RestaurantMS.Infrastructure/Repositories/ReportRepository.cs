using Microsoft.EntityFrameworkCore;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;
using RestaurantMS.Infrastructure.Data;

namespace RestaurantMS.Infrastructure.Repositories
{
    public class ReportRepository : IReportRepository
    {
        private readonly AppDbContext _context;

        public ReportRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<DailySalesDto>> GetDailySalesAsync(DateTime from, DateTime to)
        {
            var payments = await _context.Payments
                .Include(p => p.Bill)
                .Where(p => p.Status == "Completed" && p.CreatedAt.Date >= from.Date && p.CreatedAt.Date <= to.Date)
                .ToListAsync();

            return payments
                .GroupBy(p => p.CreatedAt.Date)
                .Select(g => new DailySalesDto
                {
                    Date = g.Key,
                    TotalOrders = g.Count(),
                    TotalRevenue = g.Sum(p => p.Amount)
                })
                .OrderBy(d => d.Date)
                .ToList();
        }

        public async Task<List<TopMenuItemDto>> GetTopMenuItemsAsync(DateTime from, DateTime to)
        {
            var items = await _context.OrderItems
                .Include(oi => oi.MenuItem)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.Status == "Served" &&
                             oi.CreatedAt >= from && oi.CreatedAt <= to)
                .ToListAsync();

            return items
                .GroupBy(oi => oi.MenuItem.Name)
                .Select(g => new TopMenuItemDto
                {
                    ItemName = g.Key,
                    TotalQuantitySold = g.Sum(i => i.Quantity),
                    TotalRevenue = g.Sum(i => i.UnitPrice * i.Quantity)
                })
                .OrderByDescending(i => i.TotalQuantitySold)
                .Take(10)
                .ToList();
        }

        public async Task<List<PaymentMethodSummaryDto>> GetPaymentMethodSummaryAsync(DateTime from, DateTime to)
        {
            var payments = await _context.Payments
                .Where(p => p.Status == "Completed" && p.CreatedAt.Date >= from.Date && p.CreatedAt.Date <= to.Date)
                .ToListAsync();

            return payments
                .GroupBy(p => p.Method)
                .Select(g => new PaymentMethodSummaryDto
                {
                    Method = g.Key,
                    Count = g.Count(),
                    TotalAmount = g.Sum(p => p.Amount)
                })
                .ToList();
        }
    }
}