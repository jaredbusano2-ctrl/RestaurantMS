using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantMS.Core.Entities
{
    [Table("MenuItemIngredients")]
    public class MenuItemIngredient
    {
        [Key]
        public int Id { get; set; }

        public int MenuItemId { get; set; }
        public virtual MenuItem MenuItem { get; set; } = null!;

        public int InventoryItemId { get; set; }
        public virtual InventoryItem InventoryItem { get; set; } = null!;

        [Column(TypeName = "decimal(10,2)")]
        public decimal QuantityRequired { get; set; } = 1;
    }
}