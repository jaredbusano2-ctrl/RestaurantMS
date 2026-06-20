using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantMS.Core.Entities
{
    [Table("Tables")]
    public class Table
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string TableNumber { get; set; } = string.Empty;

        public int Capacity { get; set; } = 4;

        [Required]
        public string Status { get; set; } = "Available";

        [MaxLength(100)]
        public string? ReservedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}