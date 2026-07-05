using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteToMenuItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "MenuItems",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "MenuItems");
        }
    }
}
