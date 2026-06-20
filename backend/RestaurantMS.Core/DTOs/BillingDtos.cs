namespace RestaurantMS.Core.DTOs
{
    public class GenerateBillDto
    {
        public int OrderId { get; set; }
    }

    public class ApplyDiscountDto
    {
        public int BillId { get; set; }
        public string DiscountType { get; set; } = "None";
        public decimal DiscountValue { get; set; }
    }

    public class ProcessPaymentDto
    {
        public int BillId { get; set; }
        public string Method { get; set; } = "Cash";
        public decimal Amount { get; set; }
    }

    public class BillResponseDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string TableNumber { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public string DiscountType { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class PaymentResponseDto
    {
        public int Id { get; set; }
        public int BillId { get; set; }
        public string Method { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? PayMongoReference { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Message { get; set; }  // Added for success messages
    }

    // Add this missing DTO
    public class PaymentDto
    {
        public int Id { get; set; }
        public int BillId { get; set; }
        public string Method { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ProcessedBy { get; set; }
        public string? PayMongoReference { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}