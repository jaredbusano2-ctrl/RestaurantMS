using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace RestaurantMS.API.Hubs
{
    [Authorize]
    public class KitchenHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (role == "KitchenStaff")
                await Groups.AddToGroupAsync(Context.ConnectionId, "kitchen");

            await base.OnConnectedAsync();
        }

        public async Task SendOrderUpdate(int orderId, string status)
        {
            await Clients.Group("kitchen").SendAsync("OrderUpdated", orderId, status);
        }

        public async Task JoinTableGroup(string tableId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"table-{tableId}");
        }

        public async Task NotifyTableOrderReady(string tableId, int orderId)
        {
            await Clients.Group($"table-{tableId}").SendAsync("OrderReady", orderId);
        }
    }
}