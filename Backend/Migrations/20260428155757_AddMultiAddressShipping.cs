using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiAddressShipping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HinhAnhMinhChung",
                table: "PHIEUDOITRA",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrangThaiNhapKho",
                table: "PHIEUDOITRA",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PhiVanChuyen",
                table: "HOADON",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "DiaChiGiaoHang",
                table: "CTHD",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CTPHIEUGIAOHANG",
                columns: table => new
                {
                    MaCTGH = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPhieuGH = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    SoLuongGiao = table.Column<int>(type: "int", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CTPHIEUGIAOHANG", x => x.MaCTGH);
                    table.ForeignKey(
                        name: "FK_CTPHIEUGIAOHANG_PHIEUGIAOHANG_MaPhieuGH",
                        column: x => x.MaPhieuGH,
                        principalTable: "PHIEUGIAOHANG",
                        principalColumn: "MaPhieuGH",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CTPHIEUGIAOHANG_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LICHSUHOADON",
                columns: table => new
                {
                    MaLichSu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaHoaDon = table.Column<int>(type: "int", nullable: false),
                    TrangThaiCu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThaiMoi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NoiDungThayDoi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaNguoiThucHien = table.Column<int>(type: "int", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LICHSUHOADON", x => x.MaLichSu);
                    table.ForeignKey(
                        name: "FK_LICHSUHOADON_HOADON_MaHoaDon",
                        column: x => x.MaHoaDon,
                        principalTable: "HOADON",
                        principalColumn: "MaHoaDon",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LICHSUHOADON_NHANVIEN_MaNguoiThucHien",
                        column: x => x.MaNguoiThucHien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CTPHIEUGIAOHANG_MaPhieuGH",
                table: "CTPHIEUGIAOHANG",
                column: "MaPhieuGH");

            migrationBuilder.CreateIndex(
                name: "IX_CTPHIEUGIAOHANG_MaSanPham",
                table: "CTPHIEUGIAOHANG",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_LICHSUHOADON_MaHoaDon",
                table: "LICHSUHOADON",
                column: "MaHoaDon");

            migrationBuilder.CreateIndex(
                name: "IX_LICHSUHOADON_MaNguoiThucHien",
                table: "LICHSUHOADON",
                column: "MaNguoiThucHien");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CTPHIEUGIAOHANG");

            migrationBuilder.DropTable(
                name: "LICHSUHOADON");

            migrationBuilder.DropColumn(
                name: "HinhAnhMinhChung",
                table: "PHIEUDOITRA");

            migrationBuilder.DropColumn(
                name: "TrangThaiNhapKho",
                table: "PHIEUDOITRA");

            migrationBuilder.DropColumn(
                name: "PhiVanChuyen",
                table: "HOADON");

            migrationBuilder.DropColumn(
                name: "DiaChiGiaoHang",
                table: "CTHD");
        }
    }
}
