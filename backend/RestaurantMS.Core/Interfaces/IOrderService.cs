using RestaurantMS.Core.DTOs;

namespace RestaurantMS.Core.Interfaces
{
    public interface IOrderService
    {
        Task<List<OrderResponseDto>> GetAllOrdersAsync();
        Task<OrderResponseDto?> GetOrderByIdAsync(int id);
        Task<List<OrderResponseDto>> GetOrdersByStatusAsync(string status);
        Task<int> CreateOrderAsync(CreateOrderDto dto, int waiterId);
        Task<bool> UpdateOrderStatusAsync(int id, string status);
    }
}