using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMaCTHDToDelivery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaCTHD",
                table: "CTPHIEUGIAOHANG",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CTPHIEUGIAOHANG_MaCTHD",
                table: "CTPHIEUGIAOHANG",
                column: "MaCTHD");

            migrationBuilder.AddForeignKey(
                name: "FK_CTPHIEUGIAOHANG_CTHD_MaCTHD",
                table: "CTPHIEUGIAOHANG",
                column: "MaCTHD",
                principalTable: "CTHD",
                principalColumn: "MaCTHD");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CTPHIEUGIAOHANG_CTHD_MaCTHD",
                table: "CTPHIEUGIAOHANG");

            migrationBuilder.DropIndex(
                name: "IX_CTPHIEUGIAOHANG_MaCTHD",
                table: "CTPHIEUGIAOHANG");

            migrationBuilder.DropColumn(
                name: "DonViTrongLuong",
                table: "SANPHAM");

            migrationBuilder.DropColumn(
                name: "IsGift",
                table: "SANPHAM");

            migrationBuilder.DropColumn(
                name: "KichThuoc",
                table: "SANPHAM");

            migrationBuilder.DropColumn(
                name: "TrongLuong",
                table: "SANPHAM");

            migrationBuilder.DropColumn(
                name: "MaCTHD",
                table: "CTPHIEUGIAOHANG");

            migrationBuilder.DropColumn(
                name: "SdtNguoiNhan",
                table: "CTHD");

            migrationBuilder.DropColumn(
                name: "TenNguoiNhan",
                table: "CTHD");
        }
    }
}
