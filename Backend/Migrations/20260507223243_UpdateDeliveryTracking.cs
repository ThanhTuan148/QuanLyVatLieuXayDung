using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDeliveryTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Lat",
                table: "PHIEUGIAOHANG",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Lng",
                table: "PHIEUGIAOHANG",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ViTriHienTai",
                table: "PHIEUGIAOHANG",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LoiDo",
                table: "PHIEUDOITRA",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PhiVanChuyenMoi",
                table: "PHIEUDOITRA",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrangThai",
                table: "CTPHIEUGIAOHANG",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Lat",
                table: "PHIEUGIAOHANG");

            migrationBuilder.DropColumn(
                name: "Lng",
                table: "PHIEUGIAOHANG");

            migrationBuilder.DropColumn(
                name: "ViTriHienTai",
                table: "PHIEUGIAOHANG");

            migrationBuilder.DropColumn(
                name: "LoiDo",
                table: "PHIEUDOITRA");

            migrationBuilder.DropColumn(
                name: "PhiVanChuyenMoi",
                table: "PHIEUDOITRA");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "CTPHIEUGIAOHANG");
        }
    }
}
