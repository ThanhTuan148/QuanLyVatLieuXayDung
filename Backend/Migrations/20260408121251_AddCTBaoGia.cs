using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCTBaoGia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "COUPON",
                columns: table => new
                {
                    MaCoupon = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaCP = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LoaiCoupon = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GiaTriGiam = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DonHangToiThieu = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GiamToiDa = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    NgayBatDau = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayKetThuc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SoLanDungToiDa = table.Column<int>(type: "int", nullable: true),
                    SoLanDaDung = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COUPON", x => x.MaCoupon);
                });

            migrationBuilder.CreateTable(
                name: "FLASHSALE",
                columns: table => new
                {
                    MaFlashSale = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TieuDe = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThoiGianBatDau = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ThoiGianKetThuc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FLASHSALE", x => x.MaFlashSale);
                });

            migrationBuilder.CreateTable(
                name: "KHOHANG",
                columns: table => new
                {
                    MaKhoHang = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaKho = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenKho = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DiaChi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KHOHANG", x => x.MaKhoHang);
                });

            migrationBuilder.CreateTable(
                name: "KHUYENMAI",
                columns: table => new
                {
                    MaKhuyenMai = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaKM = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenKM = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhanTramGiam = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    SoTienGiam = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ThoiGianBatDau = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ThoiGianKetThuc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SoLanToiDa = table.Column<int>(type: "int", nullable: true),
                    SoLanDaDung = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HangThanhVien = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KHUYENMAI", x => x.MaKhuyenMai);
                });

            migrationBuilder.CreateTable(
                name: "LOAISANPHAM",
                columns: table => new
                {
                    MaLoaiSP = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaLoai = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenLoai = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LOAISANPHAM", x => x.MaLoaiSP);
                });

            migrationBuilder.CreateTable(
                name: "NHACUNGCAP",
                columns: table => new
                {
                    MaNhaCungCap = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaNCC = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenNCC = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NguoiLienHe = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Sdt = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DiaChi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThanhPho = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaSoThue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NHACUNGCAP", x => x.MaNhaCungCap);
                });

            migrationBuilder.CreateTable(
                name: "QUYEN",
                columns: table => new
                {
                    MaQuyen = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaQ = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenQ = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QUYEN", x => x.MaQuyen);
                });

            migrationBuilder.CreateTable(
                name: "VAITRO",
                columns: table => new
                {
                    MaVaiTro = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaVT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenVT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VAITRO", x => x.MaVaiTro);
                });

            migrationBuilder.CreateTable(
                name: "SANPHAM",
                columns: table => new
                {
                    MaSanPham = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaSP = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenSP = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HinhAnh = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AnhPhu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DonViTinh = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GiaBan = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GiaNhap = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MucTonToiThieu = table.Column<int>(type: "int", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaLoaiSP = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SANPHAM", x => x.MaSanPham);
                    table.ForeignKey(
                        name: "FK_SANPHAM_LOAISANPHAM_MaLoaiSP",
                        column: x => x.MaLoaiSP,
                        principalTable: "LOAISANPHAM",
                        principalColumn: "MaLoaiSP",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PHANQUYEN",
                columns: table => new
                {
                    MaPhanQuyen = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaVaiTro = table.Column<int>(type: "int", nullable: false),
                    MaQuyen = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PHANQUYEN", x => x.MaPhanQuyen);
                    table.ForeignKey(
                        name: "FK_PHANQUYEN_QUYEN_MaQuyen",
                        column: x => x.MaQuyen,
                        principalTable: "QUYEN",
                        principalColumn: "MaQuyen",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PHANQUYEN_VAITRO_MaVaiTro",
                        column: x => x.MaVaiTro,
                        principalTable: "VAITRO",
                        principalColumn: "MaVaiTro",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TAIKHOAN",
                columns: table => new
                {
                    MaTaiKhoan = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaTK = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenTK = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MatKhau = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaVaiTro = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DangNhapCuoi = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResetOTP = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OTPExpiry = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TAIKHOAN", x => x.MaTaiKhoan);
                    table.ForeignKey(
                        name: "FK_TAIKHOAN_VAITRO_MaVaiTro",
                        column: x => x.MaVaiTro,
                        principalTable: "VAITRO",
                        principalColumn: "MaVaiTro",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CTFLASHSALE",
                columns: table => new
                {
                    MaCTFlashSale = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaFlashSale = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    GiaKhuyenMai = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PhanTramGiam = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    DaBan = table.Column<int>(type: "int", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CTFLASHSALE", x => x.MaCTFlashSale);
                    table.ForeignKey(
                        name: "FK_CTFLASHSALE_FLASHSALE_MaFlashSale",
                        column: x => x.MaFlashSale,
                        principalTable: "FLASHSALE",
                        principalColumn: "MaFlashSale",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CTFLASHSALE_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CTKHOHANG",
                columns: table => new
                {
                    MaCTKho = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaKhoHang = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    SoLuongNhap = table.Column<int>(type: "int", nullable: false),
                    SoLuongTon = table.Column<int>(type: "int", nullable: false),
                    ViTri = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayNhapCuoi = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CTKHOHANG", x => x.MaCTKho);
                    table.ForeignKey(
                        name: "FK_CTKHOHANG_KHOHANG_MaKhoHang",
                        column: x => x.MaKhoHang,
                        principalTable: "KHOHANG",
                        principalColumn: "MaKhoHang",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CTKHOHANG_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KHUYENMAI_SANPHAM",
                columns: table => new
                {
                    MaKMSP = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaKhuyenMai = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KHUYENMAI_SANPHAM", x => x.MaKMSP);
                    table.ForeignKey(
                        name: "FK_KHUYENMAI_SANPHAM_KHUYENMAI_MaKhuyenMai",
                        column: x => x.MaKhuyenMai,
                        principalTable: "KHUYENMAI",
                        principalColumn: "MaKhuyenMai",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KHUYENMAI_SANPHAM_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KHACHHANG",
                columns: table => new
                {
                    MaKhachHang = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaKH = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenKH = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sdt = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DiaChi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LoaiKH = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaSoThue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NguoiLienHe = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaTaiKhoan = table.Column<int>(type: "int", nullable: true),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HangThanhVien = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TongChiTieu = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KHACHHANG", x => x.MaKhachHang);
                    table.ForeignKey(
                        name: "FK_KHACHHANG_TAIKHOAN_MaTaiKhoan",
                        column: x => x.MaTaiKhoan,
                        principalTable: "TAIKHOAN",
                        principalColumn: "MaTaiKhoan",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NHANVIEN",
                columns: table => new
                {
                    MaNhanVien = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaNV = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenNV = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sdt = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DiaChi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaTaiKhoan = table.Column<int>(type: "int", nullable: true),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NHANVIEN", x => x.MaNhanVien);
                    table.ForeignKey(
                        name: "FK_NHANVIEN_TAIKHOAN_MaTaiKhoan",
                        column: x => x.MaTaiKhoan,
                        principalTable: "TAIKHOAN",
                        principalColumn: "MaTaiKhoan",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NHATKY",
                columns: table => new
                {
                    MaNhatKy = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaTaiKhoan = table.Column<int>(type: "int", nullable: false),
                    HanhDong = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenBang = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaBanGhi = table.Column<int>(type: "int", nullable: true),
                    GiaTriCu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GiaTriMoi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThoiGian = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NHATKY", x => x.MaNhatKy);
                    table.ForeignKey(
                        name: "FK_NHATKY_TAIKHOAN_MaTaiKhoan",
                        column: x => x.MaTaiKhoan,
                        principalTable: "TAIKHOAN",
                        principalColumn: "MaTaiKhoan",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BAOGIA",
                columns: table => new
                {
                    MaBaoGia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaBG = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayLap = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TongTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaKhachHang = table.Column<int>(type: "int", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    KhachHangMaKhachHang = table.Column<int>(type: "int", nullable: true)
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
                name: "BAOCAO",
                columns: table => new
                {
                    MaBaoCao = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoaiBaoCao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenBaoCao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayBaoCao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NguoiTao = table.Column<int>(type: "int", nullable: false),
                    NoiDung = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BAOCAO", x => x.MaBaoCao);
                    table.ForeignKey(
                        name: "FK_BAOCAO_NHANVIEN_NguoiTao",
                        column: x => x.NguoiTao,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HOADON",
                columns: table => new
                {
                    MaHoaDon = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaHD = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayLap = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayGiao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TongTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    GiamGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ThanhToan = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTTT = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaNhanVien = table.Column<int>(type: "int", nullable: true),
                    MaKhachHang = table.Column<int>(type: "int", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MaCoupon = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HOADON", x => x.MaHoaDon);
                    table.ForeignKey(
                        name: "FK_HOADON_COUPON_MaCoupon",
                        column: x => x.MaCoupon,
                        principalTable: "COUPON",
                        principalColumn: "MaCoupon");
                    table.ForeignKey(
                        name: "FK_HOADON_KHACHHANG_MaKhachHang",
                        column: x => x.MaKhachHang,
                        principalTable: "KHACHHANG",
                        principalColumn: "MaKhachHang",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HOADON_NHANVIEN_MaNhanVien",
                        column: x => x.MaNhanVien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NHANVIEN_MODULE_QUYEN",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaNhanVien = table.Column<int>(type: "int", nullable: false),
                    Module = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenModule = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoTheXem = table.Column<bool>(type: "bit", nullable: false),
                    CoTheTao = table.Column<bool>(type: "bit", nullable: false),
                    CoTheSua = table.Column<bool>(type: "bit", nullable: false),
                    CoTheXoa = table.Column<bool>(type: "bit", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NHANVIEN_MODULE_QUYEN", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NHANVIEN_MODULE_QUYEN_NHANVIEN_MaNhanVien",
                        column: x => x.MaNhanVien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PHIEUNHAP",
                columns: table => new
                {
                    MaPhieuNhap = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayNhap = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayGiaoHang = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TongTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ThanhToan = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaNhaCungCap = table.Column<int>(type: "int", nullable: false),
                    MaNhanVien = table.Column<int>(type: "int", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PHIEUNHAP", x => x.MaPhieuNhap);
                    table.ForeignKey(
                        name: "FK_PHIEUNHAP_NHACUNGCAP_MaNhaCungCap",
                        column: x => x.MaNhaCungCap,
                        principalTable: "NHACUNGCAP",
                        principalColumn: "MaNhaCungCap",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PHIEUNHAP_NHANVIEN_MaNhanVien",
                        column: x => x.MaNhanVien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien",
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
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    DonGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ThanhTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "CTHD",
                columns: table => new
                {
                    MaCTHD = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaHoaDon = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    DonGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GiamGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ThanhTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CTHD", x => x.MaCTHD);
                    table.ForeignKey(
                        name: "FK_CTHD_HOADON_MaHoaDon",
                        column: x => x.MaHoaDon,
                        principalTable: "HOADON",
                        principalColumn: "MaHoaDon",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CTHD_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PHIEUDOITRA",
                columns: table => new
                {
                    MaPhieuDT = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaDT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayDT = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TongTienHoan = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    LyDo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaHoaDon = table.Column<int>(type: "int", nullable: false),
                    MaNhanVien = table.Column<int>(type: "int", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PHIEUDOITRA", x => x.MaPhieuDT);
                    table.ForeignKey(
                        name: "FK_PHIEUDOITRA_HOADON_MaHoaDon",
                        column: x => x.MaHoaDon,
                        principalTable: "HOADON",
                        principalColumn: "MaHoaDon",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PHIEUDOITRA_NHANVIEN_MaNhanVien",
                        column: x => x.MaNhanVien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PHIEUGIAOHANG",
                columns: table => new
                {
                    MaPhieuGH = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaGH = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NguoiGiao = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayGiao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayGiaoDuKien = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NgayGiaoThucTe = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DiaChi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaHoaDon = table.Column<int>(type: "int", nullable: true),
                    MaNhanVien = table.Column<int>(type: "int", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PHIEUGIAOHANG", x => x.MaPhieuGH);
                    table.ForeignKey(
                        name: "FK_PHIEUGIAOHANG_HOADON_MaHoaDon",
                        column: x => x.MaHoaDon,
                        principalTable: "HOADON",
                        principalColumn: "MaHoaDon",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PHIEUGIAOHANG_NHANVIEN_MaNhanVien",
                        column: x => x.MaNhanVien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CONGNO",
                columns: table => new
                {
                    MaCongNo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaCN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SoTienNo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SoTienDaTra = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SoTienConLai = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    HanThanhToan = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LoaiCongNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaKhachHang = table.Column<int>(type: "int", nullable: true),
                    MaNhaCungCap = table.Column<int>(type: "int", nullable: true),
                    MaHoaDon = table.Column<int>(type: "int", nullable: true),
                    MaPhieuNhap = table.Column<int>(type: "int", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CONGNO", x => x.MaCongNo);
                    table.ForeignKey(
                        name: "FK_CONGNO_HOADON_MaHoaDon",
                        column: x => x.MaHoaDon,
                        principalTable: "HOADON",
                        principalColumn: "MaHoaDon");
                    table.ForeignKey(
                        name: "FK_CONGNO_KHACHHANG_MaKhachHang",
                        column: x => x.MaKhachHang,
                        principalTable: "KHACHHANG",
                        principalColumn: "MaKhachHang",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CONGNO_NHACUNGCAP_MaNhaCungCap",
                        column: x => x.MaNhaCungCap,
                        principalTable: "NHACUNGCAP",
                        principalColumn: "MaNhaCungCap",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CONGNO_PHIEUNHAP_MaPhieuNhap",
                        column: x => x.MaPhieuNhap,
                        principalTable: "PHIEUNHAP",
                        principalColumn: "MaPhieuNhap",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CTPN",
                columns: table => new
                {
                    MaCTPN = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPhieuNhap = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    DonGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ThanhTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    SoLuongDaNhan = table.Column<int>(type: "int", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CTPN", x => x.MaCTPN);
                    table.ForeignKey(
                        name: "FK_CTPN_PHIEUNHAP_MaPhieuNhap",
                        column: x => x.MaPhieuNhap,
                        principalTable: "PHIEUNHAP",
                        principalColumn: "MaPhieuNhap",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CTPN_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PHIEUTRAHANG_NCC",
                columns: table => new
                {
                    MaPhieuTra = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaPhieuNhap = table.Column<int>(type: "int", nullable: false),
                    MaNhanVien = table.Column<int>(type: "int", nullable: false),
                    NgayTra = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TongTienHoan = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    LyDo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PHIEUTRAHANG_NCC", x => x.MaPhieuTra);
                    table.ForeignKey(
                        name: "FK_PHIEUTRAHANG_NCC_NHANVIEN_MaNhanVien",
                        column: x => x.MaNhanVien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PHIEUTRAHANG_NCC_PHIEUNHAP_MaPhieuNhap",
                        column: x => x.MaPhieuNhap,
                        principalTable: "PHIEUNHAP",
                        principalColumn: "MaPhieuNhap",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CTPHIEUDOITRA",
                columns: table => new
                {
                    MaCTDT = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPhieuDT = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    DonGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ThanhTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CTPHIEUDOITRA", x => x.MaCTDT);
                    table.ForeignKey(
                        name: "FK_CTPHIEUDOITRA_PHIEUDOITRA_MaPhieuDT",
                        column: x => x.MaPhieuDT,
                        principalTable: "PHIEUDOITRA",
                        principalColumn: "MaPhieuDT",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CTPHIEUDOITRA_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CHITETTRANO",
                columns: table => new
                {
                    MaChiTietTN = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaTT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayTT = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SoTien = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PTTT = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SoGiaoDich = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaHoaDon = table.Column<int>(type: "int", nullable: true),
                    MaPhieuNhap = table.Column<int>(type: "int", nullable: true),
                    MaCongNo = table.Column<int>(type: "int", nullable: false),
                    MaNhanVien = table.Column<int>(type: "int", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHITETTRANO", x => x.MaChiTietTN);
                    table.ForeignKey(
                        name: "FK_CHITETTRANO_CONGNO_MaCongNo",
                        column: x => x.MaCongNo,
                        principalTable: "CONGNO",
                        principalColumn: "MaCongNo",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CHITETTRANO_HOADON_MaHoaDon",
                        column: x => x.MaHoaDon,
                        principalTable: "HOADON",
                        principalColumn: "MaHoaDon",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CHITETTRANO_NHANVIEN_MaNhanVien",
                        column: x => x.MaNhanVien,
                        principalTable: "NHANVIEN",
                        principalColumn: "MaNhanVien",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CHITETTRANO_PHIEUNHAP_MaPhieuNhap",
                        column: x => x.MaPhieuNhap,
                        principalTable: "PHIEUNHAP",
                        principalColumn: "MaPhieuNhap",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CT_PHIEUTRAHANG_NCC",
                columns: table => new
                {
                    MaCTPT = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaPhieuTra = table.Column<int>(type: "int", nullable: false),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    SoLuongTra = table.Column<int>(type: "int", nullable: false),
                    DonGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ThanhTien = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CT_PHIEUTRAHANG_NCC", x => x.MaCTPT);
                    table.ForeignKey(
                        name: "FK_CT_PHIEUTRAHANG_NCC_PHIEUTRAHANG_NCC_MaPhieuTra",
                        column: x => x.MaPhieuTra,
                        principalTable: "PHIEUTRAHANG_NCC",
                        principalColumn: "MaPhieuTra",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CT_PHIEUTRAHANG_NCC_SANPHAM_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SANPHAM",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BAOCAO_NguoiTao",
                table: "BAOCAO",
                column: "NguoiTao");

            migrationBuilder.CreateIndex(
                name: "IX_BAOGIA_KhachHangMaKhachHang",
                table: "BAOGIA",
                column: "KhachHangMaKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_BAOGIA_MaKhachHang",
                table: "BAOGIA",
                column: "MaKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_CHITETTRANO_MaCongNo",
                table: "CHITETTRANO",
                column: "MaCongNo");

            migrationBuilder.CreateIndex(
                name: "IX_CHITETTRANO_MaHoaDon",
                table: "CHITETTRANO",
                column: "MaHoaDon");

            migrationBuilder.CreateIndex(
                name: "IX_CHITETTRANO_MaNhanVien",
                table: "CHITETTRANO",
                column: "MaNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_CHITETTRANO_MaPhieuNhap",
                table: "CHITETTRANO",
                column: "MaPhieuNhap");

            migrationBuilder.CreateIndex(
                name: "IX_CONGNO_MaHoaDon",
                table: "CONGNO",
                column: "MaHoaDon");

            migrationBuilder.CreateIndex(
                name: "IX_CONGNO_MaKhachHang",
                table: "CONGNO",
                column: "MaKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_CONGNO_MaNhaCungCap",
                table: "CONGNO",
                column: "MaNhaCungCap");

            migrationBuilder.CreateIndex(
                name: "IX_CONGNO_MaPhieuNhap",
                table: "CONGNO",
                column: "MaPhieuNhap");

            migrationBuilder.CreateIndex(
                name: "IX_CT_PHIEUTRAHANG_NCC_MaPhieuTra",
                table: "CT_PHIEUTRAHANG_NCC",
                column: "MaPhieuTra");

            migrationBuilder.CreateIndex(
                name: "IX_CT_PHIEUTRAHANG_NCC_MaSanPham",
                table: "CT_PHIEUTRAHANG_NCC",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_CTBAOGIA_MaBaoGia",
                table: "CTBAOGIA",
                column: "MaBaoGia");

            migrationBuilder.CreateIndex(
                name: "IX_CTBAOGIA_MaSanPham",
                table: "CTBAOGIA",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_CTFLASHSALE_MaFlashSale",
                table: "CTFLASHSALE",
                column: "MaFlashSale");

            migrationBuilder.CreateIndex(
                name: "IX_CTFLASHSALE_MaSanPham",
                table: "CTFLASHSALE",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_CTHD_MaHoaDon",
                table: "CTHD",
                column: "MaHoaDon");

            migrationBuilder.CreateIndex(
                name: "IX_CTHD_MaSanPham",
                table: "CTHD",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_CTKHOHANG_MaKhoHang",
                table: "CTKHOHANG",
                column: "MaKhoHang");

            migrationBuilder.CreateIndex(
                name: "IX_CTKHOHANG_MaSanPham",
                table: "CTKHOHANG",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_CTPHIEUDOITRA_MaPhieuDT",
                table: "CTPHIEUDOITRA",
                column: "MaPhieuDT");

            migrationBuilder.CreateIndex(
                name: "IX_CTPHIEUDOITRA_MaSanPham",
                table: "CTPHIEUDOITRA",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_CTPN_MaPhieuNhap",
                table: "CTPN",
                column: "MaPhieuNhap");

            migrationBuilder.CreateIndex(
                name: "IX_CTPN_MaSanPham",
                table: "CTPN",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_HOADON_MaCoupon",
                table: "HOADON",
                column: "MaCoupon");

            migrationBuilder.CreateIndex(
                name: "IX_HOADON_MaKhachHang",
                table: "HOADON",
                column: "MaKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_HOADON_MaNhanVien",
                table: "HOADON",
                column: "MaNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_KHACHHANG_MaTaiKhoan",
                table: "KHACHHANG",
                column: "MaTaiKhoan",
                unique: true,
                filter: "[MaTaiKhoan] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_KHUYENMAI_SANPHAM_MaKhuyenMai",
                table: "KHUYENMAI_SANPHAM",
                column: "MaKhuyenMai");

            migrationBuilder.CreateIndex(
                name: "IX_KHUYENMAI_SANPHAM_MaSanPham",
                table: "KHUYENMAI_SANPHAM",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_NHANVIEN_MaTaiKhoan",
                table: "NHANVIEN",
                column: "MaTaiKhoan",
                unique: true,
                filter: "[MaTaiKhoan] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_NHANVIEN_MODULE_QUYEN_MaNhanVien",
                table: "NHANVIEN_MODULE_QUYEN",
                column: "MaNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_NHATKY_MaTaiKhoan",
                table: "NHATKY",
                column: "MaTaiKhoan");

            migrationBuilder.CreateIndex(
                name: "IX_PHANQUYEN_MaQuyen",
                table: "PHANQUYEN",
                column: "MaQuyen");

            migrationBuilder.CreateIndex(
                name: "IX_PHANQUYEN_MaVaiTro",
                table: "PHANQUYEN",
                column: "MaVaiTro");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUDOITRA_MaHoaDon",
                table: "PHIEUDOITRA",
                column: "MaHoaDon");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUDOITRA_MaNhanVien",
                table: "PHIEUDOITRA",
                column: "MaNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUGIAOHANG_MaHoaDon",
                table: "PHIEUGIAOHANG",
                column: "MaHoaDon");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUGIAOHANG_MaNhanVien",
                table: "PHIEUGIAOHANG",
                column: "MaNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUNHAP_MaNhaCungCap",
                table: "PHIEUNHAP",
                column: "MaNhaCungCap");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUNHAP_MaNhanVien",
                table: "PHIEUNHAP",
                column: "MaNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUTRAHANG_NCC_MaNhanVien",
                table: "PHIEUTRAHANG_NCC",
                column: "MaNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_PHIEUTRAHANG_NCC_MaPhieuNhap",
                table: "PHIEUTRAHANG_NCC",
                column: "MaPhieuNhap");

            migrationBuilder.CreateIndex(
                name: "IX_SANPHAM_MaLoaiSP",
                table: "SANPHAM",
                column: "MaLoaiSP");

            migrationBuilder.CreateIndex(
                name: "IX_TAIKHOAN_MaVaiTro",
                table: "TAIKHOAN",
                column: "MaVaiTro");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BAOCAO");

            migrationBuilder.DropTable(
                name: "CHITETTRANO");

            migrationBuilder.DropTable(
                name: "CT_PHIEUTRAHANG_NCC");

            migrationBuilder.DropTable(
                name: "CTBAOGIA");

            migrationBuilder.DropTable(
                name: "CTFLASHSALE");

            migrationBuilder.DropTable(
                name: "CTHD");

            migrationBuilder.DropTable(
                name: "CTKHOHANG");

            migrationBuilder.DropTable(
                name: "CTPHIEUDOITRA");

            migrationBuilder.DropTable(
                name: "CTPN");

            migrationBuilder.DropTable(
                name: "KHUYENMAI_SANPHAM");

            migrationBuilder.DropTable(
                name: "NHANVIEN_MODULE_QUYEN");

            migrationBuilder.DropTable(
                name: "NHATKY");

            migrationBuilder.DropTable(
                name: "PHANQUYEN");

            migrationBuilder.DropTable(
                name: "PHIEUGIAOHANG");

            migrationBuilder.DropTable(
                name: "CONGNO");

            migrationBuilder.DropTable(
                name: "PHIEUTRAHANG_NCC");

            migrationBuilder.DropTable(
                name: "BAOGIA");

            migrationBuilder.DropTable(
                name: "FLASHSALE");

            migrationBuilder.DropTable(
                name: "KHOHANG");

            migrationBuilder.DropTable(
                name: "PHIEUDOITRA");

            migrationBuilder.DropTable(
                name: "KHUYENMAI");

            migrationBuilder.DropTable(
                name: "SANPHAM");

            migrationBuilder.DropTable(
                name: "QUYEN");

            migrationBuilder.DropTable(
                name: "PHIEUNHAP");

            migrationBuilder.DropTable(
                name: "HOADON");

            migrationBuilder.DropTable(
                name: "LOAISANPHAM");

            migrationBuilder.DropTable(
                name: "NHACUNGCAP");

            migrationBuilder.DropTable(
                name: "COUPON");

            migrationBuilder.DropTable(
                name: "KHACHHANG");

            migrationBuilder.DropTable(
                name: "NHANVIEN");

            migrationBuilder.DropTable(
                name: "TAIKHOAN");

            migrationBuilder.DropTable(
                name: "VAITRO");
        }
    }
}
