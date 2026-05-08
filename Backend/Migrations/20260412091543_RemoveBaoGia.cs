using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBaoGia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CTBAOGIA");

            migrationBuilder.DropTable(
                name: "BAOGIA");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BAOGIA",
                columns: table => new
                {
                    MaBaoGia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaKhachHang = table.Column<int>(type: "int", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    KhachHangMaKhachHang = table.Column<int>(type: "int", nullable: true),
                    MaBG = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayLap = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TongTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BAOGIA", x => x.MaBaoGia);
                    table.ForeignKey(
                        name: "FK_BAOGIA_KHACHHANG_KhachHangMaKhachHang",
                        column: x => x.KhachHangMaKhachHang,
                        principalTable: "KHACHHANG",
                        principalColumn: "MaKhachHang");
                    table.ForeignKey(
                        name: "FK_BAOGIA_KHACHHANG_MaKhachHang",
                        column: x => x.MaKhachHang,
                        principalTable: "KHACHHANG",
                        principalColumn: "MaKhachHang",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CTBAOGIA",
                columns: table => new
                {
                    MaCTBG = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaBaoGia = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    DonGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    ThanhTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CTBAOGIA", x => x.MaCTBG);
                    table.ForeignKey(
                        name: "FK_CTBAOGIA_BAOGIA_MaBaoGia",
                        column: x => x.MaBaoGia,
                        principalTable: "BAOGIA",
                        principalColumn: "MaBaoGia",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CTBAOGIA_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BAOGIA_KhachHangMaKhachHang",
                table: "BAOGIA",
                column: "KhachHangMaKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_BAOGIA_MaKhachHang",
                table: "BAOGIA",
                column: "MaKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_CTBAOGIA_MaBaoGia",
                table: "CTBAOGIA",
                column: "MaBaoGia");

            migrationBuilder.CreateIndex(
                name: "IX_CTBAOGIA_MaSanPham",
                table: "CTBAOGIA",
                column: "MaSanPham");
        }
    }
}
