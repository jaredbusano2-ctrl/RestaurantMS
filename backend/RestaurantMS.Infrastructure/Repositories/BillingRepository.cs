using Microsoft.EntityFrameworkCore;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;
using RestaurantMS.Infrastructure.Data;

namespace RestaurantMS.Infrastructure.Repositories
{
    public class BillingRepository : IBillingRepository
    {
        private readonly AppDbContext _context;

        public BillingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Bill?> GetByIdAsync(int id)
        {
            return await _context.Bills
                .Include(b => b.Order)
                    .ThenInclude(o => o.Table)
                .Include(b => b.Order)
                    .ThenInclude(o => o.OrderItems)
                        .ThenInclude(oi => oi.MenuItem)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<Bill?> GetByOrderIdAsync(int orderId)
        {
            return await _context.Bills
                .Include(b => b.Order)
                    .ThenInclude(o => o.Table)
                .FirstOrDefaultAsync(b => b.OrderId == orderId);
        }

        public async Task AddAsync(Bill bill)
        {
            await _context.Bills.AddAsync(bill);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Bill bill)
        {
            _context.Bills.Update(bill);
            await _context.SaveChangesAsync();
        }

        public async Task AddPaymentAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Bill>> GetPaidBillsAsync()
        {
            return await _context.Bills
                .Include(b => b.Order)
                    .ThenInclude(o => o.Table)
                .Include(b => b.Order)
                    .ThenInclude(o => o.Waiter)
                .Include(b => b.Payment)
                .Where(b => b.Status == "Paid")
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        // ← ADD THIS MISSING METHOD
        public async Task<Payment?> GetPaymentByBillIdAsync(int billId)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.BillId == billId);
        }
    }
}