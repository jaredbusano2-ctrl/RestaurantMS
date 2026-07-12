using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsArchivedToInventoryItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "InventoryItems",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "InventoryItems");
        }
    }
}
