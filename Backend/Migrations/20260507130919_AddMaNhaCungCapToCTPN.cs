using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMaNhaCungCapToCTPN : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CTPHIEUGIAOHANG_CTHD_MaCTHD",
                table: "CTPHIEUGIAOHANG");

            migrationBuilder.DropIndex(
                name: "IX_CTPHIEUGIAOHANG_MaCTHD",
                table: "CTPHIEUGIAOHANG");

            migrationBuilder.AddColumn<decimal>(
                name: "SoTienThu",
                table: "PHIEUGIAOHANG",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Loai",
                table: "PHIEUDOITRA",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaNhaCungCap",
                table: "CTPN",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Loai",
                table: "CTPHIEUDOITRA",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrangThai",
                table: "CTPHIEUDOITRA",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DANHGIA",
                columns: table => new
                {
                    MaDanhGia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    MaKhachHang = table.Column<int>(type: "int", nullable: false),
                    MaHoaDon = table.Column<int>(type: "int", nullable: true),
                    SoSao = table.Column<int>(type: "int", nullable: false),
                    NoiDung = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    HinhAnh = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Video = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DANHGIA", x => x.MaDanhGia);
                    table.ForeignKey(
                        name: "FK_DANHGIA_HOADON_MaHoaDon",
                        column: x => x.MaHoaDon,
                        principalTable: "HOADON",
                        principalColumn: "MaHoaDon",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DANHGIA_KHACHHANG_MaKhachHang",
                        column: x => x.MaKhachHang,
                        principalTable: "KHACHHANG",
                        principalColumn: "MaKhachHang",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DANHGIA_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CTPN_MaNhaCungCap",
                table: "CTPN",
                column: "MaNhaCungCap");

            migrationBuilder.CreateIndex(
                name: "IX_DANHGIA_MaHoaDon",
                table: "DANHGIA",
                column: "MaHoaDon");

            migrationBuilder.CreateIndex(
                name: "IX_DANHGIA_MaKhachHang",
                table: "DANHGIA",
                column: "MaKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_DANHGIA_MaSanPham",
                table: "DANHGIA",
                column: "MaSanPham");

            migrationBuilder.AddForeignKey(
                name: "FK_CTPN_NHACUNGCAP_MaNhaCungCap",
                table: "CTPN",
                column: "MaNhaCungCap",
                principalTable: "NHACUNGCAP",
                principalColumn: "MaNhaCungCap");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CTPN_NHACUNGCAP_MaNhaCungCap",
                table: "CTPN");

            migrationBuilder.DropTable(
                name: "DANHGIA");

            migrationBuilder.DropIndex(
                name: "IX_CTPN_MaNhaCungCap",
                table: "CTPN");

            migrationBuilder.DropColumn(
                name: "SoTienThu",
                table: "PHIEUGIAOHANG");

            migrationBuilder.DropColumn(
                name: "Loai",
                table: "PHIEUDOITRA");

            migrationBuilder.DropColumn(
                name: "MaNhaCungCap",
                table: "CTPN");

            migrationBuilder.DropColumn(
                name: "Loai",
                table: "CTPHIEUDOITRA");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "CTPHIEUDOITRA");

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
    }
}
