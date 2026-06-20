namespace RestaurantMS.Core.DTOs
{
    public class CreateOrderDto
    {
        public int TableId { get; set; }
        public string? SpecialInstructions { get; set; }
        public List<CreateOrderItemDto> Items { get; set; } = new();
    }

    public class CreateOrderItemDto
    {
        public int MenuItemId { get; set; }
        public int Quantity { get; set; }
        public string? SpecialNote { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class OrderItemResponseDto
    {
        public int Id { get; set; }
        public string MenuItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal => UnitPrice * Quantity;
        public string? SpecialNote { get; set; }
    }

    public class OrderResponseDto
    {
        public int Id { get; set; }
        public string TableNumber { get; set; } = string.Empty;
        public int TableId { get; set; }
        public string WaiterName { get; set; } = string.Empty;
        public int WaiterId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? SpecialInstructions { get; set; }
        public List<OrderItemResponseDto> Items { get; set; } = new();
        public decimal Total => Items.Sum(i => i.Subtotal);
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}