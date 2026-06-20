using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantMS.Core.Entities
{
    [Table("Payments")]
    public class Payment
    {
        [Key]
        public int Id { get; set; }

        public int BillId { get; set; }

        [Required]
        public string Method { get; set; } = "Cash";

        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [MaxLength(255)]
        public string? PayMongoReference { get; set; }

        public string Status { get; set; } = "Pending";

        public int ProcessedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("BillId")]
        public virtual Bill Bill { get; set; } = null!;

        [ForeignKey("ProcessedBy")]
        public virtual User Cashier { get; set; } = null!;
    }
}