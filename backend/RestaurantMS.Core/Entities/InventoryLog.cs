using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantMS.Core.Entities
{
    [Table("InventoryLogs")]
    public class InventoryLog
    {
        [Key]
        public int Id { get; set; }

        public int InventoryItemId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal ChangeAmount { get; set; }

        [MaxLength(255)]
        public string? Reason { get; set; }

        public int? OrderId { get; set; }
        public int ChangedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("InventoryItemId")]
        public virtual InventoryItem InventoryItem { get; set; } = null!;

        [ForeignKey("ChangedBy")]
        public virtual User User { get; set; } = null!;
    }
}