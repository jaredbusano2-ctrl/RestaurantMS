using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RestaurantMS.Core.Entities;
using System.Security.Claims;

namespace RestaurantMS.API.Hubs
{
    [Authorize]
    public class KitchenHub : Hub
    {
        private readonly ILogger<KitchenHub> _logger;

        public KitchenHub(ILogger<KitchenHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            _logger.LogInformation($"Client connected: {Context.ConnectionId}, UserId: {userId}, Role: {role}");

            if (role == "KitchenStaff" || role == "SuperAdmin" || role == "Admin")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "kitchen");
                _logger.LogInformation($"Added {Context.ConnectionId} to kitchen group");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (exception != null)
            {
                _logger.LogError(exception, $"Client disconnected with error: {Context.ConnectionId}");
            }
            else
            {
                _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            }
            await base.OnDisconnectedAsync(exception);
        }

        // ✅ Send new order to kitchen
        public async Task SendNewOrder(Order order)
        {
            _logger.LogInformation($"📦 Sending new order: {order.Id} to kitchen group");
            await Clients.Group("kitchen").SendAsync("NewOrder", order);
        }

        // ✅ Send order status update to kitchen
        public async Task SendOrderUpdate(int orderId, string status)
        {
            _logger.LogInformation($"🔄 Order {orderId} status updated to: {status}");
            await Clients.Group("kitchen").SendAsync("OrderStatusUpdated", new { OrderId = orderId, Status = status });
        }

        // ✅ Send order status update with full order object
        public async Task SendOrderUpdated(Order order)
        {
            _logger.LogInformation($"🔄 Order {order.Id} updated to: {order.Status}");
            await Clients.Group("kitchen").SendAsync("OrderStatusUpdated", order);
        }

        // ✅ Send low stock alert
        public async Task SendLowStockAlert(List<InventoryItem> items)
        {
            _logger.LogInformation($"⚠️ Low stock alert: {items.Count} items");
            await Clients.Group("kitchen").SendAsync("LowStockAlert", items);
        }

        // Table-specific methods
        public async Task JoinTableGroup(string tableId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"table-{tableId}");
            _logger.LogInformation($"Client {Context.ConnectionId} joined table-{tableId} group");
        }

        public async Task NotifyTableOrderReady(string tableId, int orderId)
        {
            _logger.LogInformation($"🔔 Order {orderId} ready for table {tableId}");
            await Clients.Group($"table-{tableId}").SendAsync("OrderReady", orderId);
        }

        // ✅ Send to all clients (for important notifications)
        public async Task SendNotification(string message, string type = "info")
        {
            await Clients.All.SendAsync("Notification", new { Message = message, Type = type });
        }
    }
}