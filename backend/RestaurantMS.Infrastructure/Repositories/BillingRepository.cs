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
            var result = await _context.SaveChangesAsync();
            Console.WriteLine($"✅ Bill added: {bill.Id}, Rows affected: {result}");
        }

        public async Task UpdateAsync(Bill bill)
        {
            _context.Bills.Update(bill);
            var result = await _context.SaveChangesAsync();
            Console.WriteLine($"✅ Bill updated: {bill.Id}, Rows affected: {result}");

            if (result == 0)
            {
                Console.WriteLine($"⚠️ WARNING: No rows were updated for bill {bill.Id}!");
            }
        }

        public async Task AddPaymentAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
            var result = await _context.SaveChangesAsync();
            Console.WriteLine($"✅ Payment added: {payment.Id}, Rows affected: {result}");
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

        public async Task<Payment?> GetPaymentByBillIdAsync(int billId)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.BillId == billId);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var bill = await _context.Bills
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bill == null) return false;

            if (bill.Payment != null)
            {
                _context.Payments.Remove(bill.Payment);
            }

            _context.Bills.Remove(bill);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> DeleteAllPaidAsync()
        {
            var paidBills = await _context.Bills
                .Include(b => b.Payment)
                .Where(b => b.Status == "Paid")
                .ToListAsync();

            foreach (var bill in paidBills)
            {
                if (bill.Payment != null)
                {
                    _context.Payments.Remove(bill.Payment);
                }
            }

            _context.Bills.RemoveRange(paidBills);
            await _context.SaveChangesAsync();
            return paidBills.Count;
        }
    }
}