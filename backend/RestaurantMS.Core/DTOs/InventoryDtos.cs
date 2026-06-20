namespace RestaurantMS.Core.DTOs
{
    public class UpdateInventoryDto
    {
        public decimal CurrentStock { get; set; }
        public decimal MinimumStock { get; set; }
        public string? Reason { get; set; }
    }

    public class InventoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal CurrentStock { get; set; }
        public decimal MinimumStock { get; set; }
        public bool IsLowStock => CurrentStock <= MinimumStock;
        public DateTime LastUpdated { get; set; }
    }
}