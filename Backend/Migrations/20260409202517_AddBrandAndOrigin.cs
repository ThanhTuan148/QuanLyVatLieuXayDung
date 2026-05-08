using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddBrandAndOrigin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThuongHieu",
                table: "SANPHAM",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "XuatXu",
                table: "SANPHAM",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThuongHieu",
                table: "SANPHAM");

            migrationBuilder.DropColumn(
                name: "XuatXu",
                table: "SANPHAM");
        }
    }
}
