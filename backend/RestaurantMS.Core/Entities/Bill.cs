using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantMS.Core.Entities
{
    [Table("Bills")]
    public class Bill
    {
        [Key]
        public int Id { get; set; }

        public int OrderId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Subtotal { get; set; }

        public string DiscountType { get; set; } = "None";

        [Column(TypeName = "decimal(10,2)")]
        public decimal DiscountValue { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Total { get; set; }

        public string Status { get; set; } = "Unpaid";

        public int GeneratedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;

        [ForeignKey("GeneratedBy")]
        public virtual User Cashier { get; set; } = null!;

        public virtual Payment? Payment { get; set; }
    }
}