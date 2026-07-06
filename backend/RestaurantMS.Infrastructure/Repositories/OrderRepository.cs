using Microsoft.EntityFrameworkCore;
using RestaurantMS.Core.Entities;
using RestaurantMS.Core.Interfaces;
using RestaurantMS.Infrastructure.Data;

namespace RestaurantMS.Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _context;

        public OrderRepository(AppDbContext context)
        {
            _context = context;
        }


        public async Task<List<Order>> GetAllAsync()
        {
            return await _context.Orders
                .Include(o => o.Table)
                .Include(o => o.Waiter)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.Table)
                .Include(o => o.Waiter)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<List<Order>> GetByStatusAsync(string status)
        {
            return await _context.Orders
                .Include(o => o.Table)
                .Include(o => o.Waiter)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .Where(o => o.Status == status)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Order>> GetByTableIdAsync(int tableId)
        {
            return await _context.Orders
                .Include(o => o.Table)
                .Include(o => o.Waiter)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .Where(o => o.TableId == tableId)
                .ToListAsync();
        }

        public async Task AddAsync(Order order)
        {
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Order order)
        {
            _context.Orders.Update(order);

            // ✅ FIX: Only call SaveChangesAsync ONCE
            var result = await _context.SaveChangesAsync();
            Console.WriteLine($"✅ Order updated: {order.Id}, Rows affected: {result}");

            // Optional: Log warning if no rows were updated
            if (result == 0)
            {
                Console.WriteLine($"⚠️ WARNING: No rows were updated for order {order.Id}!");
            }
        }


        public async Task<Order?> GetOrderWithItemsAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<List<Order>> GetOrdersWithItemsAsync(List<int> ids)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .Where(o => ids.Contains(o.Id))
                .ToListAsync();
        }
    }
}