using Microsoft.EntityFrameworkCore;
using RestaurantMS.Core.Entities;

namespace RestaurantMS.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<MenuCategory> MenuCategories { get; set; }
        public DbSet<Table> Tables { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Bill> Bills { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<InventoryItem> InventoryItems { get; set; }
        public DbSet<InventoryLog> InventoryLogs { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<MenuItemIngredient> MenuItemIngredients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User -> Role
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order -> Table
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Table)
                .WithMany(t => t.Orders)
                .HasForeignKey(o => o.TableId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order -> Waiter (User)
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Waiter)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.WaiterId)
                .OnDelete(DeleteBehavior.Restrict);

            // OrderItem -> Order
            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // OrderItem -> MenuItem
            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.MenuItem)
                .WithMany(m => m.OrderItems)
                .HasForeignKey(oi => oi.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);

            // MenuItem -> MenuCategory
            modelBuilder.Entity<MenuItem>()
                .HasOne(m => m.Category)
                .WithMany(c => c.MenuItems)
                .HasForeignKey(m => m.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // MenuItem -> InventoryItem (legacy single-item link, kept as fallback)
            modelBuilder.Entity<MenuItem>()
                .HasOne(m => m.InventoryItem)
                .WithMany(i => i.MenuItems)
                .HasForeignKey(m => m.InventoryItemId)
                .OnDelete(DeleteBehavior.SetNull);

            // MenuItemIngredient -> MenuItem
            modelBuilder.Entity<MenuItemIngredient>()
                .HasOne(mi => mi.MenuItem)
                .WithMany(m => m.Ingredients)
                .HasForeignKey(mi => mi.MenuItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // MenuItemIngredient -> InventoryItem
            modelBuilder.Entity<MenuItemIngredient>()
                .HasOne(mi => mi.InventoryItem)
                .WithMany()
                .HasForeignKey(mi => mi.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);

            // Prevent duplicate ingredient rows for the same menu item
            modelBuilder.Entity<MenuItemIngredient>()
                .HasIndex(mi => new { mi.MenuItemId, mi.InventoryItemId })
                .IsUnique();

            // Bill -> Order (one-to-one)
            modelBuilder.Entity<Bill>()
                .HasOne(b => b.Order)
                .WithOne(o => o.Bill)
                .HasForeignKey<Bill>(b => b.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Bill -> Cashier (User)
            modelBuilder.Entity<Bill>()
                .HasOne(b => b.Cashier)
                .WithMany()
                .HasForeignKey(b => b.GeneratedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Payment -> Bill (one-to-one)
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Bill)
                .WithOne(b => b.Payment)
                .HasForeignKey<Payment>(p => p.BillId)
                .OnDelete(DeleteBehavior.Restrict);

            // Payment -> Cashier (User)
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Cashier)
                .WithMany()
                .HasForeignKey(p => p.ProcessedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // InventoryLog -> InventoryItem
            modelBuilder.Entity<InventoryLog>()
                .HasOne(il => il.InventoryItem)
                .WithMany(i => i.InventoryLogs)
                .HasForeignKey(il => il.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);

            // InventoryLog -> User
            modelBuilder.Entity<InventoryLog>()
                .HasOne(il => il.User)
                .WithMany()
                .HasForeignKey(il => il.ChangedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // AuditLog -> User
            modelBuilder.Entity<AuditLog>()
                .HasOne(al => al.User)
                .WithMany()
                .HasForeignKey(al => al.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ==========================================
            // FIX: Convert all table names to lowercase
            // This fixes case sensitivity on Linux MySQL
            // ==========================================
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                var tableName = entity.GetTableName();
                if (tableName != null)
                {
                    entity.SetTableName(tableName.ToLowerInvariant());
                }
            }
        }
    }
}
