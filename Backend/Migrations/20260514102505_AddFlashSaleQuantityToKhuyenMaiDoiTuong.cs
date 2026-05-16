using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddFlashSaleQuantityToKhuyenMaiDoiTuong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ViTri",
                table: "CTKHOHANG");

            migrationBuilder.AddColumn<string>(
                name: "ChuKy",
                table: "NHANVIEN",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SoLuongDaBan",
                table: "KHUYENMAI_DOITUONG",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SoLuongKhuyenMai",
                table: "KHUYENMAI_DOITUONG",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TenKho",
                table: "KHOHANG",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "NgayTao",
                table: "KHOHANG",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<DateTime>(
                name: "NgayCapNhat",
                table: "KHOHANG",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "MaKho",
                table: "KHOHANG",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "AnhBangChung",
                table: "HOADON",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SoTienPhaiThu",
                table: "HOADON",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "GhiChu",
                table: "CTPN",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LaiPhat",
                table: "CONGNO",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayNhacNoEmail",
                table: "CONGNO",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnhBangChung",
                table: "CHITETTRANO",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LICHHENTRANO",
                columns: table => new
                {
                    MaHen = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaCongNo = table.Column<int>(type: "int", nullable: false),
                    NgayHen = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SoTienDuKien = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LICHHENTRANO", x => x.MaHen);
                    table.ForeignKey(
                        name: "FK_LICHHENTRANO_CONGNO_MaCongNo",
                        column: x => x.MaCongNo,
                        principalTable: "CONGNO",
                        principalColumn: "MaCongNo",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LICHSUGIAOHANG",
                columns: table => new
                {
                    MaLichSu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPhieuGH = table.Column<int>(type: "int", nullable: false),
                    TrangThaiCu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThaiMoi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NoiDungThayDoi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HinhAnhXacNhan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MaNguoiThucHien = table.Column<int>(type: "int", nullable: true),
                    ViTriCapNhat = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LICHSUGIAOHANG", x => x.MaLichSu);
                    table.ForeignKey(
                        name: "FK_LICHSUGIAOHANG_PHIEUGIAOHANG_MaPhieuGH",
                        column: x => x.MaPhieuGH,
                        principalTable: "PHIEUGIAOHANG",
                        principalColumn: "MaPhieuGH",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LICHSUTHANGHANG",
                columns: table => new
                {
                    MaLichSu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaKhachHang = table.Column<int>(type: "int", nullable: false),
                    HangCu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HangMoi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TongChiTieuHienTai = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LyDo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayThayDoi = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LICHSUTHANGHANG", x => x.MaLichSu);
                    table.ForeignKey(
                        name: "FK_LICHSUTHANGHANG_KHACHHANG_MaKhachHang",
                        column: x => x.MaKhachHang,
                        principalTable: "KHACHHANG",
                        principalColumn: "MaKhachHang",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PHIEUXUATKHO",
                columns: table => new
                {
                    MaPhieuXK = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaXK = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayXuat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NguoiXuat = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaPhieuGH = table.Column<int>(type: "int", nullable: true),
                    MaHoaDon = table.Column<int>(type: "int", nullable: true),
                    MaNhanVien = table.Column<int>(type: "int", nullable: true),
                    MaNguoiDuyet = table.Column<int>(type: "int", nullable: true),
                    NgayDuyet = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ChuKyNguoiLap = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChuKyQuanLy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaNguoiXuatKho = table.Column<int>(type: "int", nullable: true),
                    ChuKyNguoiXuatKho = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaNguoiNhan = table.Column<int>(type: "int", nullable: true),
                    ChuKyNguoiNhan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PHIEUXUATKHO", x => x.MaPhieuXK);
                    table.ForeignKey(
                        name: "FK_PHIEUXUATKHO_HOADON_MaHoaDon",
                        column: x => x.MaHoaDon,
                        principalTable: "HOADON",
                        principalColumn: "MaHoaDon");
                    table.ForeignKey(
                        name: "FK_PHIEUXUATKHO_NHANVIEN_MaNguoiDuyet",
                        column: x => x.MaNguoiDuyet,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien");
                    table.ForeignKey(
                        name: "FK_PHIEUXUATKHO_NHANVIEN_MaNhanVien",
                        column: x => x.MaNhanVien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien");
                    table.ForeignKey(
                        name: "FK_PHIEUXUATKHO_PHIEUGIAOHANG_MaPhieuGH",
                        column: x => x.MaPhieuGH,
                        principalTable: "PHIEUGIAOHANG",
                        principalColumn: "MaPhieuGH");
                });

            migrationBuilder.CreateTable(
                name: "CTPHIEUXUATKHO",
                columns: table => new
                {
                    MaCTXK = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPhieuXK = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    SoLuongThucNhan = table.Column<int>(type: "int", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaKho = table.Column<int>(type: "int", nullable: true),
                    DonGiaVon = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CTPHIEUXUATKHO", x => x.MaCTXK);
                    table.ForeignKey(
                        name: "FK_CTPHIEUXUATKHO_KHOHANG_MaKho",
                        column: x => x.MaKho,
                        principalTable: "KHOHANG",
                        principalColumn: "MaKhoHang");
                    table.ForeignKey(
                        name: "FK_CTPHIEUXUATKHO_PHIEUXUATKHO_MaPhieuXK",
                        column: x => x.MaPhieuXK,
                        principalTable: "PHIEUXUATKHO",
                        principalColumn: "MaPhieuXK",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CTPHIEUXUATKHO_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LICHSUPHIEUXUATKHO",
                columns: table => new
                {
                    MaLichSu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPhieuXK = table.Column<int>(type: "int", nullable: false),
                    TrangThaiCu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThaiMoi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NoiDungThayDoi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MaNguoiThucHien = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LICHSUPHIEUXUATKHO", x => x.MaLichSu);
                    table.ForeignKey(
                        name: "FK_LICHSUPHIEUXUATKHO_NHANVIEN_MaNguoiThucHien",
                        column: x => x.MaNguoiThucHien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien");
                    table.ForeignKey(
                        name: "FK_LICHSUPHIEUXUATKHO_PHIEUXUATKHO_MaPhieuXK",
                        column: x => x.MaPhieuXK,
                        principalTable: "PHIEUXUATKHO",
                        principalColumn: "MaPhieuXK",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CTPHIEUXUATKHO_MaKho",
                table: "CTPHIEUXUATKHO",
                column: "MaKho");

            migrationBuilder.CreateIndex(
                name: "IX_CTPHIEUXUATKHO_MaPhieuXK",
                table: "CTPHIEUXUATKHO",
                column: "MaPhieuXK");

            migrationBuilder.CreateIndex(
                name: "IX_CTPHIEUXUATKHO_MaSanPham",
                table: "CTPHIEUXUATKHO",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_LICHHENTRANO_MaCongNo",
                table: "LICHHENTRANO",
                column: "MaCongNo");

            migrationBuilder.CreateIndex(
                name: "IX_LICHSUGIAOHANG_MaPhieuGH",
                table: "LICHSUGIAOHANG",
                column: "MaPhieuGH");

            migrationBuilder.CreateIndex(
                name: "IX_LICHSUPHIEUXUATKHO_MaNguoiThucHien",
                table: "LICHSUPHIEUXUATKHO",
                column: "MaNguoiThucHien");

            migrationBuilder.CreateIndex(
                name: "IX_LICHSUPHIEUXUATKHO_MaPhieuXK",
                table: "LICHSUPHIEUXUATKHO",
                column: "MaPhieuXK");

            migrationBuilder.CreateIndex(
                name: "IX_LICHSUTHANGHANG_MaKhachHang",
                table: "LICHSUTHANGHANG",
                column: "MaKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUXUATKHO_MaHoaDon",
                table: "PHIEUXUATKHO",
                column: "MaHoaDon");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUXUATKHO_MaNguoiDuyet",
                table: "PHIEUXUATKHO",
                column: "MaNguoiDuyet");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUXUATKHO_MaNhanVien",
                table: "PHIEUXUATKHO",
                column: "MaNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUXUATKHO_MaPhieuGH",
                table: "PHIEUXUATKHO",
                column: "MaPhieuGH");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CTPHIEUXUATKHO");

            migrationBuilder.DropTable(
                name: "LICHHENTRANO");

            migrationBuilder.DropTable(
                name: "LICHSUGIAOHANG");

            migrationBuilder.DropTable(
                name: "LICHSUPHIEUXUATKHO");

            migrationBuilder.DropTable(
                name: "LICHSUTHANGHANG");

            migrationBuilder.DropTable(
                name: "PHIEUXUATKHO");

            migrationBuilder.DropColumn(
                name: "ChuKy",
                table: "NHANVIEN");

            migrationBuilder.DropColumn(
                name: "SoLuongDaBan",
                table: "KHUYENMAI_DOITUONG");

            migrationBuilder.DropColumn(
                name: "SoLuongKhuyenMai",
                table: "KHUYENMAI_DOITUONG");

            migrationBuilder.DropColumn(
                name: "AnhBangChung",
                table: "HOADON");

            migrationBuilder.DropColumn(
                name: "SoTienPhaiThu",
                table: "HOADON");

            migrationBuilder.DropColumn(
                name: "GhiChu",
                table: "CTPN");

            migrationBuilder.DropColumn(
                name: "LaiPhat",
                table: "CONGNO");

            migrationBuilder.DropColumn(
                name: "NgayNhacNoEmail",
                table: "CONGNO");

            migrationBuilder.DropColumn(
                name: "AnhBangChung",
                table: "CHITETTRANO");

            migrationBuilder.AlterColumn<string>(
                name: "TenKho",
                table: "KHOHANG",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "NgayTao",
                table: "KHOHANG",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "NgayCapNhat",
                table: "KHOHANG",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MaKho",
                table: "KHOHANG",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ViTri",
                table: "CTKHOHANG",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
