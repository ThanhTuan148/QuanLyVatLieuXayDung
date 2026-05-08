using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddKhachHangAnhDaiDien : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AnhDaiDien",
                table: "KHACHHANG",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnhDaiDien",
                table: "KHACHHANG");
        }
    }
}
