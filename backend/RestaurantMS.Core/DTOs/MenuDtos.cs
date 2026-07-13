namespace RestaurantMS.Core.DTOs
{
    public class MenuItemIngredientDto
    {
        public int InventoryItemId { get; set; }
        public decimal QuantityRequired { get; set; }
    }

    public class MenuItemIngredientResponseDto
    {
        public int InventoryItemId { get; set; }
        public string InventoryItemName { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal QuantityRequired { get; set; }
    }

    public class CreateMenuItemDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public int? InventoryItemId { get; set; }
        public bool IsAvailable { get; set; } = true;
        public string? ImageUrl { get; set; }
        public List<MenuItemIngredientDto>? Ingredients { get; set; }
    }

    public class UpdateMenuItemDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public int? InventoryItemId { get; set; }
        public bool IsAvailable { get; set; }
        public string? ImageUrl { get; set; }
        public List<MenuItemIngredientDto>? Ingredients { get; set; }
    }

    public class MenuItemResponseDto
    {   
        public bool IsOutOfStock { get; set; }
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public int? InventoryItemId { get; set; }
        public string? InventoryItemName { get; set; }
        public bool IsAvailable { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<MenuItemIngredientResponseDto> Ingredients { get; set; } = new();
    }

    public class MenuCategoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}