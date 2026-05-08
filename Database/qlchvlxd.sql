-- =====================================================
-- HỆ THỐNG QUẢN LÝ CỬA HÀNG VẬT LIỆU XÂY DỰNG
-- Database hoàn chỉnh - Tự động sinh MÃ, Ràng buộc dữ liệu & Tích hợp Coupon
-- Chạy 1 lần duy nhất
-- =====================================================
USE [master]
GO
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QLCHVLXD')
    DROP DATABASE [QLCHVLXD]
GO
CREATE DATABASE [QLCHVLXD]
GO
USE [QLCHVLXD]
GO

-- =====================================================
-- 1. QUYỀN
-- =====================================================
CREATE TABLE [dbo].[QUYEN] (
    [MaQuyen]   INT PRIMARY KEY IDENTITY(1,1),
    [MaQ]       AS ('Q' + RIGHT('00' + CAST([MaQuyen] AS VARCHAR(10)), 2)) PERSISTED UNIQUE,
    [TenQ]      NVARCHAR(100) NOT NULL UNIQUE,
    [MoTa]      NVARCHAR(500),
    [NgayTao]   DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 2. VAI TRÒ
-- =====================================================
CREATE TABLE [dbo].[VAITRO] (
    [MaVaiTro]    INT PRIMARY KEY IDENTITY(1,1),
    [MaVT]        AS ('VT' + RIGHT('00' + CAST([MaVaiTro] AS VARCHAR(10)), 2)) PERSISTED UNIQUE,
    [TenVT]       NVARCHAR(100) NOT NULL UNIQUE,
    [MoTa]        NVARCHAR(500),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 3. PHANQUYEN (Vai trò - Quyền, quan hệ N-N)
-- =====================================================
CREATE TABLE [dbo].[PHANQUYEN] (
    [MaPhanQuyen] INT PRIMARY KEY IDENTITY(1,1),
    [MaVaiTro]    INT NOT NULL,
    [MaQuyen]     INT NOT NULL,
    FOREIGN KEY ([MaVaiTro]) REFERENCES [dbo].[VAITRO]([MaVaiTro]) ON DELETE CASCADE,
    FOREIGN KEY ([MaQuyen])  REFERENCES [dbo].[QUYEN]([MaQuyen]) ON DELETE CASCADE,
    UNIQUE([MaVaiTro], [MaQuyen])
)
GO

-- =====================================================
-- 4. TÀI KHOẢN
-- =====================================================
CREATE TABLE [dbo].[TAIKHOAN] (
    [MaTaiKhoan]   INT PRIMARY KEY IDENTITY(1,1),
    [MaTK]         AS ('TK' + RIGHT('000' + CAST([MaTaiKhoan] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [TenTK]        NVARCHAR(100) NOT NULL UNIQUE,
    [MatKhau]      NVARCHAR(MAX) NOT NULL,
    [Email]        NVARCHAR(100) NOT NULL UNIQUE CHECK ([Email] LIKE '%_@__%.__%'),
    [MaVaiTro]     INT NOT NULL,
    [TrangThai]    BIT DEFAULT 1,
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]  DATETIME2 DEFAULT GETDATE(),
    [DangNhapCuoi] DATETIME2,
    [ResetOTP]     NVARCHAR(10) NULL,
    [OTPExpiry]    DATETIME NULL,
    FOREIGN KEY ([MaVaiTro]) REFERENCES [dbo].[VAITRO]([MaVaiTro])
)
GO

-- =====================================================
-- 5. NHÂN VIÊN
-- =====================================================
CREATE TABLE [dbo].[NHANVIEN] (
    [MaNhanVien]  INT PRIMARY KEY IDENTITY(1,1),
    [MaNV]        AS ('NV' + RIGHT('000' + CAST([MaNhanVien] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [TenNV]       NVARCHAR(200) NOT NULL,
    [Sdt]         NVARCHAR(20) CHECK ([Sdt] NOT LIKE '%[^0-9]%' AND LEN([Sdt]) >= 10),
    [Email]       NVARCHAR(100) CHECK ([Email] LIKE '%_@__%.__%'),
    [DiaChi]      NVARCHAR(500),
    [MaTaiKhoan]  INT,
    [TrangThai]   BIT DEFAULT 1,
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaTaiKhoan]) REFERENCES [dbo].[TAIKHOAN]([MaTaiKhoan])
)
GO

-- =====================================================
-- 6. KHÁCH HÀNG
-- =====================================================
CREATE TABLE [dbo].[KHACHHANG] (
    [MaKhachHang] INT PRIMARY KEY IDENTITY(1,1),
    [MaKH]        AS ('KH' + RIGHT('000' + CAST([MaKhachHang] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [TenKH]       NVARCHAR(200) NOT NULL,
    [Sdt]         NVARCHAR(20) CHECK ([Sdt] NOT LIKE '%[^0-9]%'),
    [Email]       NVARCHAR(100) CHECK ([Email] LIKE '%_@__%.__%'),
    [DiaChi]      NVARCHAR(500),
    [LoaiKH]      NVARCHAR(50),
    [MaSoThue]    NVARCHAR(50),
    [NguoiLienHe] NVARCHAR(200),
    [MaTaiKhoan]  INT,
    [TrangThai]   BIT DEFAULT 1,
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaTaiKhoan]) REFERENCES [dbo].[TAIKHOAN]([MaTaiKhoan])
)
GO

-- =====================================================
-- 7. LOẠI SẢN PHẨM
-- =====================================================
CREATE TABLE [dbo].[LOAISANPHAM] (
    [MaLoaiSP]    INT PRIMARY KEY IDENTITY(1,1),
    [MaLoai]      AS ('LSP' + RIGHT('00' + CAST([MaLoaiSP] AS VARCHAR(10)), 2)) PERSISTED UNIQUE,
    [TenLoai]     NVARCHAR(200) NOT NULL,
    [MoTa]        NVARCHAR(500),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 8. NHÀ CUNG CẤP
-- =====================================================
CREATE TABLE [dbo].[NHACUNGCAP] (
    [MaNhaCungCap] INT PRIMARY KEY IDENTITY(1,1),
    [MaNCC]        AS ('NCC' + RIGHT('000' + CAST([MaNhaCungCap] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [TenNCC]       NVARCHAR(200) NOT NULL,
    [NguoiLienHe]  NVARCHAR(200),
    [Sdt]          NVARCHAR(20),
    [Email]        NVARCHAR(100) CHECK ([Email] LIKE '%_@__%.__%'),
    [DiaChi]       NVARCHAR(500),
    [ThanhPho]     NVARCHAR(100),
    [MaSoThue]     NVARCHAR(50),
    [TrangThai]    BIT DEFAULT 1,
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]  DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 9. SẢN PHẨM
-- =====================================================
CREATE TABLE [dbo].[SANPHAM] (
    [MaSanPham]   INT PRIMARY KEY IDENTITY(1,1),
    [MaSP]        AS ('SP' + RIGHT('000' + CAST([MaSanPham] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [TenSP]       NVARCHAR(300) NOT NULL,
    [MoTa]        NVARCHAR(1000),
    [HinhAnh]     NVARCHAR(500),
    [DonViTinh]   NVARCHAR(50),
    [GiaBan]      DECIMAL(18,2) NOT NULL CHECK ([GiaBan] >= 0),
    [GiaNhap]     DECIMAL(18,2) CHECK ([GiaNhap] >= 0),
    [MucTonToiThieu] INT DEFAULT 10 CHECK ([MucTonToiThieu] >= 0),
    [GhiChu]      NVARCHAR(500),
    [MaLoaiSP]    INT NOT NULL,
    [TrangThai]   BIT DEFAULT 1,
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaLoaiSP]) REFERENCES [dbo].[LOAISANPHAM]([MaLoaiSP])
)
GO

-- =====================================================
-- 10. KHO HÀNG
-- =====================================================
CREATE TABLE [dbo].[KHOHANG] (
    [MaKhoHang]   INT PRIMARY KEY IDENTITY(1,1),
    [MaKho]       AS ('KHO' + RIGHT('00' + CAST([MaKhoHang] AS VARCHAR(10)), 2)) PERSISTED UNIQUE,
    [TenKho]      NVARCHAR(200) NOT NULL,
    [DiaChi]      NVARCHAR(500),
    [GhiChu]      NVARCHAR(1000),
    [TrangThai]   BIT DEFAULT 1,
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 11. CHI TIẾT KHO HÀNG
-- =====================================================
CREATE TABLE [dbo].[CTKHOHANG] (
    [MaCTKho]      INT PRIMARY KEY IDENTITY(1,1),
    [MaKhoHang]    INT NOT NULL,
    [MaSanPham]    INT NOT NULL,
    [SoLuong]      INT DEFAULT 0 CHECK ([SoLuong] >= 0),
    [SoLuongNhap]  INT DEFAULT 0 CHECK ([SoLuongNhap] >= 0),
    [SoLuongTon]   INT DEFAULT 0 CHECK ([SoLuongTon] >= 0),
    [ViTri]        NVARCHAR(100),
    [NgayNhapCuoi] DATETIME2,
    [NgayCapNhat]  DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaKhoHang]) REFERENCES [dbo].[KHOHANG]([MaKhoHang]),
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham]),
    UNIQUE([MaKhoHang], [MaSanPham])
)
GO

-- =====================================================
-- 12. BÁO GIÁ
-- =====================================================
CREATE TABLE [dbo].[BAOGIA] (
    [MaBaoGia]    INT PRIMARY KEY IDENTITY(1,1),
    [MaBG]        AS ('BG' + RIGHT('000' + CAST([MaBaoGia] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [NgayLap]     DATETIME2 DEFAULT GETDATE(),
    [GiaBan]      DECIMAL(18,2) CHECK ([GiaBan] >= 0),
    [TongTien]    DECIMAL(18,2) CHECK ([TongTien] >= 0),
    [TrangThai]   NVARCHAR(50) DEFAULT N'Chờ duyệt',
    [MaKhachHang] INT NOT NULL,
    [MaSanPham]   INT NOT NULL,
    [GhiChu]      NVARCHAR(1000),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaKhachHang]) REFERENCES [dbo].[KHACHHANG]([MaKhachHang]),
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham])
)
GO

-- =====================================================
-- 13. PHIẾU NHẬP
-- =====================================================
CREATE TABLE [dbo].[PHIEUNHAP] (
    [MaPhieuNhap]  INT PRIMARY KEY IDENTITY(1,1),
    [MaPN]         AS ('PN' + RIGHT('000' + CAST([MaPhieuNhap] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [NgayNhap]     DATETIME2 DEFAULT GETDATE(),
    [NgayGiaoHang] DATETIME2,
    [TongTien]     DECIMAL(18,2) CHECK ([TongTien] >= 0),
    [TrangThai]    NVARCHAR(50) DEFAULT N'Chờ xử lý',
    [GhiChu]       NVARCHAR(1000),
    [MaNhaCungCap] INT NOT NULL,
    [MaNhanVien]   INT NOT NULL,
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]  DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaNhaCungCap]) REFERENCES [dbo].[NHACUNGCAP]([MaNhaCungCap]),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien])
)
GO

-- =====================================================
-- 14. CHI TIẾT PHIẾU NHẬP
-- =====================================================
CREATE TABLE [dbo].[CTPN] (
    [MaCTPN]        INT PRIMARY KEY IDENTITY(1,1),
    [MaPhieuNhap]   INT NOT NULL,
    [MaSanPham]     INT NOT NULL,
    [SoLuong]       INT NOT NULL CHECK ([SoLuong] > 0),
    [DonGia]        DECIMAL(18,2) NOT NULL CHECK ([DonGia] >= 0),
    [ThanhTien]     DECIMAL(18,2) CHECK ([ThanhTien] >= 0),
    [SoLuongDaNhan] INT DEFAULT 0 CHECK ([SoLuongDaNhan] >= 0),
    [NgayTao]       DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaPhieuNhap]) REFERENCES [dbo].[PHIEUNHAP]([MaPhieuNhap]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham])
)
GO

-- =====================================================
-- 15. COUPON (Mã giảm giá)
-- =====================================================
CREATE TABLE [dbo].[COUPON] (
    [MaCoupon]       INT PRIMARY KEY IDENTITY(1,1),
    [MaCP]           AS ('CP' + RIGHT('000' + CAST([MaCoupon] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [Code]           NVARCHAR(50) NOT NULL UNIQUE,
    [LoaiCoupon]     NVARCHAR(20) NOT NULL, -- 'PhanTram' or 'SoTien'
    [GiaTriGiam]     DECIMAL(18, 2) NOT NULL CHECK ([GiaTriGiam] >= 0),
    [DonHangToiThieu] DECIMAL(18, 2) DEFAULT 0 CHECK ([DonHangToiThieu] >= 0),
    [GiamToiDa]      DECIMAL(18, 2) NULL CHECK ([GiamToiDa] >= 0),
    [NgayBatDau]     DATETIME2 NOT NULL,
    [NgayKetThuc]    DATETIME2 NOT NULL,
    [SoLanDungToiDa] INT NULL CHECK ([SoLanDungToiDa] > 0),
    [SoLanDaDung]    INT DEFAULT 0 CHECK ([SoLanDaDung] >= 0),
    [TrangThai]      BIT DEFAULT 1,
    [NgayTao]        DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]    DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 16. HÓA ĐƠN (Đã liên kết với COUPON)
-- =====================================================
CREATE TABLE [dbo].[HOADON] (
    [MaHoaDon]    INT PRIMARY KEY IDENTITY(1,1),
    [MaHD]        AS ('HD' + RIGHT('000' + CAST([MaHoaDon] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [NgayLap]     DATETIME2 DEFAULT GETDATE(),
    [NgayGiao]    DATETIME2,
    [TongTien]    DECIMAL(18,2) CHECK ([TongTien] >= 0),
    [GiamGia]     DECIMAL(18,2) DEFAULT 0 CHECK ([GiamGia] >= 0),
    [ThanhToan]   DECIMAL(18,2) CHECK ([ThanhToan] >= 0),
    [TrangThai]   NVARCHAR(50) DEFAULT N'Chờ xử lý',
    [PTTT]        NVARCHAR(50),
    [GhiChu]      NVARCHAR(1000),
    [MaNhanVien]  INT NOT NULL,
    [MaKhachHang] INT NOT NULL,
    [MaCoupon]    INT NULL, -- Cột liên kết Coupon mới
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien]),
    FOREIGN KEY ([MaKhachHang]) REFERENCES [dbo].[KHACHHANG]([MaKhachHang]),
    FOREIGN KEY ([MaCoupon]) REFERENCES [dbo].[COUPON]([MaCoupon]) ON DELETE SET NULL
)
GO

-- =====================================================
-- 17. CHI TIẾT HÓA ĐƠN
-- =====================================================
CREATE TABLE [dbo].[CTHD] (
    [MaCTHD]     INT PRIMARY KEY IDENTITY(1,1),
    [MaHoaDon]   INT NOT NULL,
    [MaSanPham]  INT NOT NULL,
    [SoLuong]    INT NOT NULL CHECK ([SoLuong] > 0),
    [DonGia]     DECIMAL(18,2) NOT NULL CHECK ([DonGia] >= 0),
    [GiamGia]    DECIMAL(18,2) DEFAULT 0 CHECK ([GiamGia] >= 0),
    [ThanhTien]  DECIMAL(18,2) CHECK ([ThanhTien] >= 0),
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham])
)
GO

-- =====================================================
-- 18. PHIẾU ĐỔI TRẢ
-- =====================================================
CREATE TABLE [dbo].[PHIEUDOITRA] (
    [MaPhieuDT]   INT PRIMARY KEY IDENTITY(1,1),
    [MaDT]        AS ('DT' + RIGHT('000' + CAST([MaPhieuDT] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [NgayDT]      DATETIME2 DEFAULT GETDATE(),
    [TongTienHoan] DECIMAL(18,2) CHECK ([TongTienHoan] >= 0),
    [LyDo]        NVARCHAR(500),
    [GhiChu]      NVARCHAR(1000),
    [TrangThai]   NVARCHAR(50) DEFAULT N'Chờ duyệt',
    [MaHoaDon]    INT NOT NULL,
    [MaNhanVien]  INT NOT NULL,
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon]),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien])
)
GO

-- =====================================================
-- 19. CT PHIẾU ĐỔI TRẢ
-- =====================================================
CREATE TABLE [dbo].[CTPHIEUDOITRA] (
    [MaCTDT]      INT PRIMARY KEY IDENTITY(1,1),
    [MaPhieuDT]   INT NOT NULL,
    [MaSanPham]   INT NOT NULL,
    [SoLuong]     INT NOT NULL CHECK ([SoLuong] > 0),
    [DonGia]      DECIMAL(18,2) NOT NULL CHECK ([DonGia] >= 0),
    [ThanhTien]   DECIMAL(18,2) CHECK ([ThanhTien] >= 0),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaPhieuDT]) REFERENCES [dbo].[PHIEUDOITRA]([MaPhieuDT]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham])
)
GO

-- =====================================================
-- 20. PHIẾU GIAO HÀNG
-- =====================================================
CREATE TABLE [dbo].[PHIEUGIAOHANG] (
    [MaPhieuGH]       INT PRIMARY KEY IDENTITY(1,1),
    [MaGH]            AS ('GH' + RIGHT('000' + CAST([MaPhieuGH] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [NguoiGiao]       NVARCHAR(200),
    [NgayGiao]        DATETIME2 DEFAULT GETDATE(),
    [NgayGiaoDuKien]  DATETIME2,
    [NgayGiaoThucTe]  DATETIME2,
    [DiaChi]          NVARCHAR(500),
    [TrangThai]       NVARCHAR(50) DEFAULT N'Chờ giao',
    [GhiChu]          NVARCHAR(1000),
    [MaHoaDon]        INT NOT NULL,
    [MaNhanVien]      INT NOT NULL,
    [NgayTao]         DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]     DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon]),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien])
)
GO

-- =====================================================
-- 21. CÔNG NỢ
-- =====================================================
CREATE TABLE [dbo].[CONGNO] (
    [MaCongNo]     INT PRIMARY KEY IDENTITY(1,1),
    [MaCN]         AS ('CN' + RIGHT('000' + CAST([MaCongNo] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [SoTienNo]     DECIMAL(18,2) NOT NULL CHECK ([SoTienNo] >= 0),
    [SoTienDaTra]  DECIMAL(18,2) DEFAULT 0 CHECK ([SoTienDaTra] >= 0),
    [SoTienConLai] DECIMAL(18,2) CHECK ([SoTienConLai] >= 0),
    [HanThanhToan] DATETIME2,
    [TrangThai]    NVARCHAR(50) DEFAULT N'Chưa thanh toán',
    [LoaiCongNo]   NVARCHAR(50),
    [MaKhachHang]  INT,
    [MaNhaCungCap] INT,
    [MaHoaDon]     INT,
    [GhiChu]       NVARCHAR(500),
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]  DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaKhachHang]) REFERENCES [dbo].[KHACHHANG]([MaKhachHang]),
    FOREIGN KEY ([MaNhaCungCap]) REFERENCES [dbo].[NHACUNGCAP]([MaNhaCungCap]),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon])
)
GO

-- =====================================================
-- 22. CHI TIẾT TRẢ NỢ
-- =====================================================
CREATE TABLE [dbo].[CHITETTRANO] (
    [MaChiTietTN] INT PRIMARY KEY IDENTITY(1,1),
    [MaTT]        AS ('TT' + RIGHT('000' + CAST([MaChiTietTN] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [NgayTT]      DATETIME2 DEFAULT GETDATE(),
    [SoTien]      DECIMAL(18,2) NOT NULL CHECK ([SoTien] > 0),
    [PTTT]        NVARCHAR(100),
    [SoGiaoDich]  NVARCHAR(100),
    [TrangThai]   NVARCHAR(50) DEFAULT N'Chờ xử lý',
    [MaHoaDon]    INT NOT NULL,
    [MaNhanVien]  INT,
    [GhiChu]      NVARCHAR(500),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon]),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien])
)
GO

-- =====================================================
-- 23. KHUYẾN MẠI
-- =====================================================
CREATE TABLE [dbo].[KHUYENMAI] (
    [MaKhuyenMai]     INT PRIMARY KEY IDENTITY(1,1),
    [MaKM]            AS ('KM' + RIGHT('000' + CAST([MaKhuyenMai] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [TenKM]           NVARCHAR(200) NOT NULL,
    [MoTa]            NVARCHAR(1000),
    [PhanTramGiam]    DECIMAL(5,2) CHECK ([PhanTramGiam] >= 0 AND [PhanTramGiam] <= 100),
    [SoTienGiam]      DECIMAL(18,2) CHECK ([SoTienGiam] >= 0),
    [ThoiGianBatDau]  DATETIME2,
    [ThoiGianKetThuc] DATETIME2,
    [SoLanToiDa]      INT CHECK ([SoLanToiDa] >= 0),
    [SoLanDaDung]     INT DEFAULT 0 CHECK ([SoLanDaDung] >= 0),
    [TrangThai]       BIT DEFAULT 1,
    [NgayTao]         DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]     DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 24. KHUYẾN MẠI - SẢN PHẨM (N-N)
-- =====================================================
CREATE TABLE [dbo].[KHUYENMAI_SANPHAM] (
    [MaKMSP]       INT PRIMARY KEY IDENTITY(1,1),
    [MaKhuyenMai]  INT NOT NULL,
    [MaSanPham]    INT NOT NULL,
    FOREIGN KEY ([MaKhuyenMai]) REFERENCES [dbo].[KHUYENMAI]([MaKhuyenMai]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham]) ON DELETE CASCADE,
    UNIQUE([MaKhuyenMai], [MaSanPham])
)
GO

-- =====================================================
-- 25. FLASH SALE
-- =====================================================
CREATE TABLE [dbo].[FLASHSALE] (
    [MaFlashSale]  INT PRIMARY KEY IDENTITY(1,1),
    [TieuDe]       NVARCHAR(200) NOT NULL,
    [MoTa]         NVARCHAR(500),
    [ThoiGianBatDau]  DATETIME2 NOT NULL,
    [ThoiGianKetThuc] DATETIME2 NOT NULL,
    [TrangThai]    BIT DEFAULT 1,
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]  DATETIME2
)
GO

-- =====================================================
-- 26. CT FLASH SALE
-- =====================================================
CREATE TABLE [dbo].[CTFLASHSALE] (
    [MaCTFlashSale] INT PRIMARY KEY IDENTITY(1,1),
    [MaFlashSale]   INT NOT NULL,
    [MaSanPham]     INT NOT NULL,
    [GiaKhuyenMai]  DECIMAL(18,2) NOT NULL CHECK ([GiaKhuyenMai] >= 0),
    [PhanTramGiam]  DECIMAL(5,2) NOT NULL CHECK ([PhanTramGiam] >= 0 AND [PhanTramGiam] <= 100),
    [SoLuong]       INT NOT NULL CHECK ([SoLuong] > 0),
    [DaBan]         INT DEFAULT 0 CHECK ([DaBan] >= 0),
    [NgayTao]       DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaFlashSale]) REFERENCES [dbo].[FLASHSALE]([MaFlashSale]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham]) ON DELETE CASCADE
)
GO

-- =====================================================
-- 27. BÁO CÁO
-- =====================================================
CREATE TABLE [dbo].[BAOCAO] (
    [MaBaoCao]    INT PRIMARY KEY IDENTITY(1,1),
    [LoaiBaoCao]  NVARCHAR(100) NOT NULL,
    [TenBaoCao]   NVARCHAR(300) NOT NULL,
    [NgayBaoCao]  DATETIME2 DEFAULT GETDATE(),
    [NguoiTao]    INT NOT NULL,
    [NoiDung]     NVARCHAR(MAX),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([NguoiTao]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien])
)
GO

-- =====================================================
-- 28. NHẬT KÝ HỆ THỐNG
-- =====================================================
CREATE TABLE [dbo].[NHATKY] (
    [MaNhatKy]    INT PRIMARY KEY IDENTITY(1,1),
    [MaTaiKhoan]  INT NOT NULL,
    [HanhDong]    NVARCHAR(200) NOT NULL,
    [TenBang]     NVARCHAR(100),
    [MaBanGhi]    INT,
    [GiaTriCu]    NVARCHAR(MAX),
    [GiaTriMoi]   NVARCHAR(MAX),
    [ThoiGian]    DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaTaiKhoan]) REFERENCES [dbo].[TAIKHOAN]([MaTaiKhoan])
)
GO

-- =====================================================
-- 29. PHÂN QUYỀN MODULE NHÂN VIÊN
-- =====================================================
CREATE TABLE [dbo].[NHANVIEN_MODULE_QUYEN] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [MaNhanVien]    INT NOT NULL,
    [Module]        NVARCHAR(50) NOT NULL,
    [TenModule]     NVARCHAR(100) NOT NULL,
    [CoTheXem]      BIT NOT NULL DEFAULT 0,
    [CoTheTao]      BIT NOT NULL DEFAULT 0,
    [CoTheSua]      BIT NOT NULL DEFAULT 0,
    [CoTheXoa]      BIT NOT NULL DEFAULT 0,
    [NgayCapNhat]   DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien]) ON DELETE CASCADE
)
GO

-- =====================================================
-- 30. PHIẾU TRẢ HÀNG NHÀ CUNG CẤP
-- =====================================================
CREATE TABLE [dbo].[PHIEUTRAHANG_NCC] (
    [MaPhieuTra]   INT IDENTITY(1,1) PRIMARY KEY,
    [MaPT]         AS ('PT' + RIGHT('000' + CAST([MaPhieuTra] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [MaPhieuNhap]  INT NOT NULL,         
    [MaNhanVien]   INT NOT NULL,         
    [NgayTra]      DATETIME DEFAULT GETDATE(), 
    [TongTienHoan] DECIMAL(18,2) DEFAULT 0 CHECK ([TongTienHoan] >= 0),    
    [LyDo]         NVARCHAR(MAX),        
    [GhiChu]       NVARCHAR(MAX),        
    [TrangThai]    NVARCHAR(100),        
    [NgayTao]      DATETIME DEFAULT GETDATE(),
    [NgayCapNhat]  DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([MaPhieuNhap]) REFERENCES [dbo].[PHIEUNHAP]([MaPhieuNhap]),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien])
)
GO

-- =====================================================
-- 31. CHI TIẾT PHIẾU TRẢ HÀNG NCC
-- =====================================================
CREATE TABLE [dbo].[CT_PHIEUTRAHANG_NCC] (
    [MaCTPT]     INT IDENTITY(1,1) PRIMARY KEY,
    [MaPhieuTra] INT NOT NULL,                  
    [MaSanPham]  INT NOT NULL,                  
    [SoLuongTra] INT NOT NULL CHECK ([SoLuongTra] > 0),                  
    [DonGia]     DECIMAL(18,2) NOT NULL CHECK ([DonGia] >= 0),        
    [ThanhTien]  DECIMAL(18,2) CHECK ([ThanhTien] >= 0),                 
    FOREIGN KEY ([MaPhieuTra]) REFERENCES [dbo].[PHIEUTRAHANG_NCC]([MaPhieuTra]),
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham])
)
GO

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX [IX_TAIKHOAN_VaiTro] ON [dbo].[TAIKHOAN]([MaVaiTro])
CREATE INDEX [IX_SANPHAM_LoaiSP] ON [dbo].[SANPHAM]([MaLoaiSP])
CREATE INDEX [IX_CTKHOHANG_Kho] ON [dbo].[CTKHOHANG]([MaKhoHang])
CREATE INDEX [IX_CTKHOHANG_SP] ON [dbo].[CTKHOHANG]([MaSanPham])
CREATE INDEX [IX_HOADON_NV] ON [dbo].[HOADON]([MaNhanVien])
CREATE INDEX [IX_HOADON_KH] ON [dbo].[HOADON]([MaKhachHang])
CREATE INDEX [IX_HOADON_TT] ON [dbo].[HOADON]([TrangThai])
CREATE INDEX [IX_PHIEUNHAP_NCC] ON [dbo].[PHIEUNHAP]([MaNhaCungCap])
CREATE INDEX [IX_PHIEUNHAP_TT] ON [dbo].[PHIEUNHAP]([TrangThai])
CREATE INDEX [IX_CONGNO_KH] ON [dbo].[CONGNO]([MaKhachHang])
CREATE INDEX [IX_CONGNO_NCC] ON [dbo].[CONGNO]([MaNhaCungCap])
CREATE INDEX [IX_PHIEUGH_TT] ON [dbo].[PHIEUGIAOHANG]([TrangThai])
CREATE INDEX [IX_NHATKY_TK] ON [dbo].[NHATKY]([MaTaiKhoan])
GO

-- =====================================================
-- DỮ LIỆU MẪU
-- =====================================================
PRINT N'BẮT ĐẦU THÊM DỮ LIỆU MẪU...'

-- 1. QUYỀN
INSERT INTO [dbo].[QUYEN] ([TenQ], [MoTa]) VALUES
(N'Quản lý người dùng',   N'Thêm, sửa, xóa tài khoản'),
(N'Quản lý sản phẩm',     N'Thêm, sửa, xóa sản phẩm'),
(N'Quản lý đơn hàng',     N'Tạo và xử lý đơn hàng'),
(N'Quản lý kho',          N'Nhập hàng, kiểm kho'),
(N'Quản lý giao hàng',    N'Điều phối giao hàng'),
(N'Quản lý thanh toán',   N'Xử lý thanh toán, công nợ'),
(N'Xem báo cáo',          N'Xem báo cáo thống kê'),
(N'Tạo báo cáo',          N'Tạo và xuất báo cáo'),
(N'Cài đặt hệ thống',     N'Cấu hình hệ thống'),
(N'Xem sản phẩm',         N'Quyền xem, tìm kiếm sản phẩm'),
(N'Đặt hàng',             N'Quyền đặt hàng cho khách')
GO

-- 2. VAI TRÒ
INSERT INTO [dbo].[VAITRO] ([TenVT], [MoTa]) VALUES
(N'Quản trị viên',       N'Quản trị viên hệ thống - Toàn quyền'),
(N'Quản lý',             N'Quản lý cửa hàng'),
(N'Nhân viên bán hàng',  N'Nhân viên bán hàng'),
(N'Nhân viên kho',       N'Nhân viên quản lý kho'),
(N'Tài xế',              N'Tài xế giao hàng'),
(N'Khách hàng',          N'Tài khoản khách hàng')
GO

-- 3. PHÂN QUYỀN
INSERT INTO [dbo].[PHANQUYEN] ([MaVaiTro], [MaQuyen]) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),
(2,2),(2,3),(2,4),(2,6),(2,7),(2,8),
(3,3),(3,10),
(4,4),(4,10),
(5,5),
(6,10),(6,11)
GO

-- 4. TÀI KHOẢN
INSERT INTO [dbo].[TAIKHOAN] ([TenTK], [MatKhau], [Email], [MaVaiTro]) VALUES
(N'admin',       N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'admin@vlxd.com',   1),
(N'quanly01',    N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'quanly@vlxd.com',  2),
(N'nvbanhang01', N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'banhang@vlxd.com', 3),
(N'nvkho01',     N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'kho@vlxd.com',     4),
(N'taixe01',     N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'taixe@vlxd.com',   5),
(N'khachhang01', N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'kh01@gmail.com',   6),
(N'khachhang02', N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'kh02@gmail.com',   6)
GO

-- 5. NHÂN VIÊN
INSERT INTO [dbo].[NHANVIEN] ([TenNV], [Sdt], [Email], [DiaChi], [MaTaiKhoan]) VALUES
(N'Trương Thanh Tuấn',  N'0909123456', N'tuan.truong@vlxd.com', N'Q1, TP.HCM',  1),
(N'Lê Trần Ngọc Yến',  N'0909123457', N'yen.le@vlxd.com',      N'Q3, TP.HCM',  2),
(N'Phạm Hồ Thúy Vy',   N'0909123458', N'vy.pham@vlxd.com',     N'Q4, TP.HCM',  3),
(N'Nguyễn Minh Đức',    N'0909123459', N'duc.nguyen@vlxd.com',  N'Q7, TP.HCM',  4),
(N'Phạm Văn Tài',       N'0909123460', N'tai.pham@vlxd.com',    N'Q7, TP.HCM',  5)
GO

-- 6. KHÁCH HÀNG
INSERT INTO [dbo].[KHACHHANG] ([TenKH],[Sdt],[Email],[DiaChi],[LoaiKH],[MaSoThue],[NguoiLienHe],[MaTaiKhoan]) VALUES
(N'Nguyễn Văn An',              N'0987654321',  N'an.nguyen@gmail.com',     N'123 Lê Lợi, Q1, TP.HCM',     N'Cá nhân', NULL,          N'Anh An',   6),
(N'Công ty XD Bình Minh',       N'0283999888',  N'info@binhminhcons.com',   N'456 Nguyễn Văn Linh, Q7',     N'Công ty', N'0301234567', N'KS Hùng',  7),
(N'Trần Thị Hoa',               N'0912333444',  N'hoa.tran@yahoo.com',      N'789 CMT8, Q3, TP.HCM',        N'Cá nhân', NULL,          N'Chị Hoa',  NULL),
(N'Công Ty Nội Thất Xanh',      N'0283111000',  N'design@greeninterior.com',N'Khu Sala, Q2, TP.HCM',        N'Công ty', N'0321112223', N'KTS Minh', NULL),
(N'Nhà Thầu Phụ An Khang',      N'0912999000',  N'ankhang@thauphu.vn',      N'Thủ Đức, TP.HCM',             N'Công ty', N'0334445556', N'Anh Tùng', NULL),
(N'Phạm Văn Mách',              N'0909333444',  N'mach.pham@gmail.com',     N'Q7, TP.HCM',                   N'Cá nhân', NULL,          NULL,        NULL),
(N'Khách Sạn Mường Thanh',      N'0283999999',  N'purchase@muongthanh.vn',  N'Phú Nhuận, TP.HCM',           N'Công ty', N'0345556667', N'TP Mua',   NULL)
GO

-- 7. LOẠI SẢN PHẨM
INSERT INTO [dbo].[LOAISANPHAM] ([TenLoai], [MoTa]) VALUES
(N'Xi măng',          N'Xi măng các loại'),
(N'Cát đá',           N'Cát, đá xây dựng'),
(N'Sắt thép',         N'Sắt thép xây dựng'),
(N'Gạch ngói',        N'Gạch, ngói các loại'),
(N'Kính',             N'Kính xây dựng'),
(N'Sơn & Phụ kiện',   N'Sơn nước, sơn dầu, dụng cụ sơn'),
(N'Thiết bị điện',    N'Dây điện, công tắc, ổ cắm, đèn'),
(N'Thiết bị nước',    N'Ống nước, van, vòi'),
(N'Dụng cụ thi công', N'Máy khoan, máy cắt, bay, thước')
GO

-- 8. NHÀ CUNG CẤP
INSERT INTO [dbo].[NHACUNGCAP] ([TenNCC],[NguoiLienHe],[Sdt],[Email],[DiaChi],[ThanhPho],[MaSoThue]) VALUES
(N'CT Xi Măng Hà Tiên',    N'Nguyễn Văn A',     N'02838111111', N'sales@hatien.com',          N'Kiên Lương, Kiên Giang',       N'Kiên Giang',  N'3700123456'),
(N'Thép Hòa Phát MN',      N'Trần Thị B',       N'02838222222', N'daily@hoaphat.com',         N'KCN Sóng Thần, Bình Dương',    N'Bình Dương',  N'3700654321'),
(N'Gạch Đồng Tâm',         N'Lê Văn C',         N'02838333333', N'contact@dongtam.com',       N'Bến Lức, Long An',              N'Long An',     N'3700987654'),
(N'CH Cát Đá Sài Gòn',     N'Phạm Văn D',       N'0912345678',  N'catdasaigon@gmail.com',     N'Bình Chánh, TP.HCM',            N'TP.HCM',      N'0312345678'),
(N'Sơn Dulux Việt Nam',     N'Hoàng Thị E',      N'19001234',    N'hotro@dulux.vn',            N'Q1, TP.HCM',                    N'TP.HCM',      N'0398765432'),
(N'Cáp điện CADIVI',        N'Nguyễn Kỹ Thuật',  N'02838112233', N'kd@cadivi.vn',              N'70-72 Nam Kỳ KN, Q1',           N'TP.HCM',      N'0300123987'),
(N'Nhựa Bình Minh',         N'Lê Văn Ống',       N'02839690973', N'sales@binhminhplastic.com', N'240 Hậu Giang, Q6',             N'TP.HCM',      N'0301456789'),
(N'Dụng cụ Bosch VN',       N'Hoàng Cơ Khí',     N'02862583690', N'contact@bosch.com',         N'Ngôi Nhà Đức, Q1',              N'TP.HCM',      N'0311223344')
GO

-- 9. SẢN PHẨM
INSERT INTO [dbo].[SANPHAM] ([TenSP],[MoTa],[DonViTinh],[GiaBan],[GiaNhap],[MucTonToiThieu],[MaLoaiSP]) VALUES
(N'Xi măng Hà Tiên PCB40',       N'Xi măng đa dụng bao 50kg',     N'Bao',   95000,   88000,  50,  1),
(N'Xi măng Insee',                N'Xi măng xây tô bao 50kg',      N'Bao',   92000,   85000,  50,  1),
(N'Cát vàng xây dựng',           N'Cát hạt lớn đổ bê tông',       N'Khối',  450000,  380000, 10,  2),
(N'Đá 1x2 xanh',                 N'Đá đổ bê tông Đồng Nai',       N'Khối',  380000,  320000, 15,  2),
(N'Thép cuộn Hòa Phát Phi 6',    N'Thép cuộn trơn phi 6',         N'Kg',    18500,   16000,  100, 3),
(N'Thép cây Hòa Phát Phi 10',    N'Thép gân phi 10 cây 11.7m',    N'Cây',   115000,  102000, 100, 3),
(N'Gạch ống 4 lỗ Tuynel',        N'Gạch xây tường 8x8x18',        N'Viên',  1200,    950,    5000,4),
(N'Gạch men lát nền 60x60',      N'Gạch men trắng vân mây',       N'Thùng', 180000,  145000, 20,  4),
(N'Sơn Dulux Inspire Nội thất',  N'Sơn nội thất thùng 18L',       N'Thùng', 1200000, 950000, 5,   6),
(N'Sơn chống thấm KOVA CT-11A',  N'Thùng 20kg',                   N'Thùng', 2100000, 1800000,10,  6),
(N'Dây điện CV 1.5 CADIVI',      N'Dây đơn mềm ruột đồng',        N'Cuộn',  450000,  390000, 20,  7),
(N'Công tắc Panasonic Wide',     N'Công tắc hạt lớn',             N'Cái',   45000,   32000,  50,  7),
(N'Bóng đèn LED Rạng Đông 9W',  N'Đèn búp trụ nhôm nhựa',        N'Cái',   45000,   35000,  100, 7),
(N'Ống PVC Bình Minh D21',       N'Ống thoát nước cây 4m',         N'Cây',   35000,   28000,  100, 8),
(N'Ống PVC Bình Minh D90',       N'Ống thoát nước lớn',            N'Cây',   250000,  210000, 50,  8),
(N'Máy khoan cầm tay Bosch',     N'Máy khoan động lực 550W',       N'Cái',   1200000, 950000, 5,   9),
(N'Máy cắt sắt Makita',          N'Máy cắt bàn 355mm',            N'Cái',   3500000, 2900000,3,   9)
GO

-- 10. KHO HÀNG
INSERT INTO [dbo].[KHOHANG] ([TenKho], [DiaChi], [GhiChu]) VALUES
(N'Kho chính',  N'123 Quốc lộ 1A, Bình Chánh, TP.HCM', N'Kho hàng chính'),
(N'Kho phụ Q7', N'456 Nguyễn Thị Thập, Q7, TP.HCM',    N'Kho hàng phụ Q7')
GO

-- 11. CHI TIẾT KHO HÀNG
INSERT INTO [dbo].[CTKHOHANG] ([MaKhoHang],[MaSanPham],[SoLuong],[SoLuongNhap],[SoLuongTon],[ViTri]) VALUES
(1,1,500,500,420,N'Kệ A1'),(1,2,300,300,250,N'Kệ A2'),(1,3,50,50,35,N'Kệ B1'),
(1,4,40,40,30,N'Kệ B2'),(1,5,200,200,150,N'Kệ C1'),(1,6,150,150,120,N'Kệ C2'),
(1,7,5000,5000,3500,N'Kệ D1'),(1,8,100,100,80,N'Kệ D2'),(1,9,30,30,25,N'Kệ E1'),
(1,10,20,20,18,N'Kệ E2'),(1,11,50,50,40,N'Kệ F1'),(1,12,100,100,85,N'Kệ F2'),
(1,13,200,200,180,N'Kệ F3'),(1,14,150,150,120,N'Kệ G1'),(1,15,80,80,65,N'Kệ G2'),
(1,16,10,10,8,N'Kệ H1'),(1,17,5,5,4,N'Kệ H2')
GO

-- 12. PHIẾU NHẬP
INSERT INTO [dbo].[PHIEUNHAP] ([NgayNhap],[TongTien],[TrangThai],[MaNhaCungCap],[MaNhanVien]) VALUES
(DATEADD(day,-10,GETDATE()), 88000000,  N'Đã nhận hàng', 1, 2),
(DATEADD(day,-7,GETDATE()),  30600000,  N'Đã nhận hàng', 2, 2),
(DATEADD(day,-3,GETDATE()),  14500000,  N'Đang xử lý',  3, 4)
GO

-- 13. CT PHIẾU NHẬP
INSERT INTO [dbo].[CTPN] ([MaPhieuNhap],[MaSanPham],[SoLuong],[DonGia],[ThanhTien],[SoLuongDaNhan]) VALUES
(1,1,1000,88000,88000000,1000),(2,5,200,16000,3200000,200),
(2,6,200,102000,20400000,200),(2,5,500,14000,7000000,500),
(3,7,5000,950,4750000,0),(3,8,50,145000,7250000,0),(3,12,50,32000,1600000,0)
GO

-- 14. COUPON (Mã giảm giá)
INSERT INTO [dbo].[COUPON] ([Code], [LoaiCoupon], [GiaTriGiam], [DonHangToiThieu], [NgayBatDau], [NgayKetThuc], [SoLanDungToiDa], [SoLanDaDung]) VALUES
(N'GIAM50K', N'SoTien', 50000, 500000, DATEADD(day,-1,GETDATE()), DATEADD(day,30,GETDATE()), 100, 1),
(N'SALE10PT', N'PhanTram', 10.0, 1000000, GETDATE(), DATEADD(day,15,GETDATE()), 50, 0)
GO

-- 15. HÓA ĐƠN
INSERT INTO [dbo].[HOADON] ([NgayLap],[TongTien],[GiamGia],[ThanhToan],[TrangThai],[PTTT],[MaNhanVien],[MaKhachHang],[MaCoupon]) VALUES
(DATEADD(month,-1,GETDATE()), 15000000, 0,       15000000, N'Hoàn thành', N'Chuyển khoản', 3, 2, NULL),
(DATEADD(day,-5,GETDATE()),   50000000, 2500000, 47500000, N'Đang giao',  N'Tiền mặt',     3, 5, NULL),
(DATEADD(day,-2,GETDATE()),   5400000,  50000,   5350000,  N'Chờ xử lý',  N'Tiền mặt',     3, 1, 1),
(GETDATE(),                   12000000, 600000,  11400000, N'Chờ xử lý',  N'Chuyển khoản', 3, 4, NULL)
GO

-- 16. CT HÓA ĐƠN
INSERT INTO [dbo].[CTHD] ([MaHoaDon],[MaSanPham],[SoLuong],[DonGia],[ThanhTien]) VALUES
(1,1,100,95000,9500000),(1,3,10,450000,4500000),(1,13,20,45000,900000),
(2,6,200,115000,23000000),(2,16,5,1200000,6000000),(2,7,10000,1200,12000000),
(2,9,5,1200000,6000000),(2,11,5,450000,2250000),
(3,1,50,95000,4750000),(3,12,10,45000,450000),(3,14,5,35000,175000),
(4,8,50,180000,9000000),(4,9,2,1200000,2400000),(4,13,10,45000,450000)
GO

-- 17. PHIẾU GIAO HÀNG
INSERT INTO [dbo].[PHIEUGIAOHANG] ([NguoiGiao],[NgayGiao],[DiaChi],[TrangThai],[MaHoaDon],[MaNhanVien]) VALUES
(N'Phạm Văn Tài', DATEADD(month,-1,GETDATE()), N'456 Nguyễn Văn Linh, Q7', N'Đã giao',   1, 5),
(N'Phạm Văn Tài', DATEADD(day,-4,GETDATE()),   N'Thủ Đức, TP.HCM',        N'Đang giao', 2, 5)
GO

-- 18. CÔNG NỢ
INSERT INTO [dbo].[CONGNO] ([SoTienNo],[SoTienDaTra],[SoTienConLai],[HanThanhToan],[TrangThai],[LoaiCongNo],[MaKhachHang],[MaHoaDon]) VALUES
(47500000, 0,        47500000, DATEADD(day,30,GETDATE()), N'Chưa thanh toán', N'Phải thu', 5, 2),
(11400000, 0,        11400000, DATEADD(day,15,GETDATE()), N'Chưa thanh toán', N'Phải thu', 4, 4)
GO

-- 19. CHI TIẾT TRẢ NỢ
INSERT INTO [dbo].[CHITETTRANO] ([NgayTT],[SoTien],[PTTT],[TrangThai],[MaHoaDon],[MaNhanVien]) VALUES
(DATEADD(month,-1,GETDATE()), 15000000, N'Chuyển khoản', N'Hoàn thành', 1, 3),
(DATEADD(day,-2,GETDATE()),   5400000,  N'Tiền mặt',     N'Hoàn thành', 3, 3)
GO

-- 20. KHUYẾN MẠI
INSERT INTO [dbo].[KHUYENMAI] ([TenKM],[MoTa],[PhanTramGiam],[ThoiGianBatDau],[ThoiGianKetThuc]) VALUES
(N'Mùa Xây Dựng 2026',    N'Giảm giá toàn bộ VLXD',  5.0,  DATEADD(day,-5,GETDATE()), DATEADD(day,25,GETDATE())),
(N'Giảm giá sơn tháng 4', N'Ưu đãi sơn các loại',    10.0, GETDATE(),                 DATEADD(day,30,GETDATE()))
GO

-- 21. KHUYẾN MẠI - SẢN PHẨM
INSERT INTO [dbo].[KHUYENMAI_SANPHAM] ([MaKhuyenMai],[MaSanPham]) VALUES
(1,1),(1,3),(1,5),(1,6),(1,7),(2,9),(2,10)
GO

-- 22. FLASH SALE
INSERT INTO [dbo].[FLASHSALE] ([TieuDe],[MoTa],[ThoiGianBatDau],[ThoiGianKetThuc]) VALUES
(N'Flash Sale Cuối Tuần', N'Giảm giá sốc cuối tuần', DATEADD(hour,-1,GETDATE()), DATEADD(day,2,GETDATE()))
GO
INSERT INTO [dbo].[CTFLASHSALE] ([MaFlashSale],[MaSanPham],[GiaKhuyenMai],[PhanTramGiam],[SoLuong],[DaBan]) VALUES
(1, 1, 76000, 20.0, 100, 15),(1, 9, 960000, 20.0, 10, 3)
GO

-- 23. BÁO GIÁ
INSERT INTO [dbo].[BAOGIA] ([NgayLap],[GiaBan],[TongTien],[TrangThai],[MaKhachHang],[MaSanPham]) VALUES
(DATEADD(day,-3,GETDATE()), 90000,  90000000, N'Đã duyệt',  2, 1),
(GETDATE(),                 110000, 22000000, N'Chờ duyệt', 5, 6)
GO

--tạo thêm
-- Thêm cột HangThanhVien và TongChiTieu vào bảng KHACHHANG
ALTER TABLE [dbo].[KHACHHANG]
ADD [HangThanhVien] NVARCHAR(20) NOT NULL DEFAULT N'Đồng',
    [TongChiTieu]   DECIMAL(18,2) NOT NULL DEFAULT 0;
GO

-- Cập nhật cột HangThanhVien cho dữ liệu cũ (mặc định Đồng)
UPDATE [dbo].[KHACHHANG] SET [HangThanhVien] = N'Đồng' WHERE [HangThanhVien] IS NULL;
GO

-- Thêm cột HangThanhVien cho bảng KHUYENMAI (NULL = áp dụng cho tất cả)
ALTER TABLE [dbo].[KHUYENMAI]
ADD [HangThanhVien] NVARCHAR(20) NULL;
GO

PRINT N'TẠO DATABASE HOÀN TẤT - TỔNG CỘNG 31 BẢNG (GỒM TẤT CẢ TÍNH NĂNG)!'
GO