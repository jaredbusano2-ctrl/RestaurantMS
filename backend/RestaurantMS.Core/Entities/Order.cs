using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantMS.Core.Entities
{
    [Table("Orders")]
    public class Order
    {
        [Key]
        public int Id { get; set; }

        public int TableId { get; set; }
        public int WaiterId { get; set; }

        [Required]
        public string Status { get; set; } = "Pending";

        public string? SpecialInstructions { get; set; }

        public bool InventoryDeducted { get; set; } = false;

        // ✅ Remove any default value - let the service set it
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("TableId")]
        public virtual Table Table { get; set; } = null!;

        [ForeignKey("WaiterId")]
        public virtual User Waiter { get; set; } = null!;

        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public virtual Bill? Bill { get; set; }
    }
}
