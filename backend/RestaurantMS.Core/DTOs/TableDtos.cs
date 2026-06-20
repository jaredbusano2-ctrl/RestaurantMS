namespace RestaurantMS.Core.DTOs
{
    public class CreateTableDto
    {
        public string TableNumber { get; set; } = string.Empty;
        public int Capacity { get; set; } = 4;
    }

    public class UpdateTableStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? ReservedBy { get; set; }
    }

    public class TableResponseDto
    {
        public int Id { get; set; }
        public string TableNumber { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ReservedBy { get; set; }
    }
}