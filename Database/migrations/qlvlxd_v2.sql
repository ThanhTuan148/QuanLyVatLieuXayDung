-- =====================================================
-- HỆ THỐNG QUẢN LÝ VẬT LIỆU XÂY DỰNG
-- File SQL hoàn chỉnh - Chạy 1 lần duy nhất
-- Theo Sơ đồ lớp mức thiết kế (Sơ đồ 37)
-- Ngày tạo: 2026-04-03
-- =====================================================

USE [master]
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QuanLyVLXD')
    DROP DATABASE [QuanLyVLXD]
GO

CREATE DATABASE [QuanLyVLXD]
GO

USE [QuanLyVLXD]
GO

-- =====================================================
-- 1. BẢNG QUYỀN
-- =====================================================
CREATE TABLE [dbo].[QUYEN] (
    [MaQuyen]   INT PRIMARY KEY IDENTITY(1,1),
    [MaQ]       NVARCHAR(20) NOT NULL UNIQUE,
    [TenQ]      NVARCHAR(100) NOT NULL,
    [MoTa]      NVARCHAR(500),
    [NgayTao]   DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 2. BẢNG VAI TRÒ
-- =====================================================
CREATE TABLE [dbo].[VAITRO] (
    [MaVaiTro]  INT PRIMARY KEY IDENTITY(1,1),
    [MaVT]      NVARCHAR(20) NOT NULL UNIQUE,
    [TenVT]     NVARCHAR(100) NOT NULL,
    [MaQuyen]   INT NOT NULL,
    [NgayTao]   DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaQuyen]) REFERENCES [dbo].[QUYEN]([MaQuyen])
)
GO

-- =====================================================
-- 3. BẢNG TÀI KHOẢN
-- =====================================================
CREATE TABLE [dbo].[TAIKHOAN] (
    [MaTaiKhoan] INT PRIMARY KEY IDENTITY(1,1),
    [MaTK]       NVARCHAR(20) NOT NULL UNIQUE,
    [TenTK]      NVARCHAR(100) NOT NULL UNIQUE,
    [MatKhau]    NVARCHAR(MAX) NOT NULL,
    [Email]      NVARCHAR(100) NOT NULL UNIQUE,
    [MaVaiTro]   INT NOT NULL,
    [TrangThai]  BIT DEFAULT 1,
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    [DangNhapCuoi] DATETIME2,
    FOREIGN KEY ([MaVaiTro]) REFERENCES [dbo].[VAITRO]([MaVaiTro])
)
GO

-- =====================================================
-- 4. BẢNG NHÂN VIÊN
-- =====================================================
CREATE TABLE [dbo].[NHANVIEN] (
    [MaNhanVien] INT PRIMARY KEY IDENTITY(1,1),
    [MaNV]       NVARCHAR(20) NOT NULL UNIQUE,
    [TenNV]      NVARCHAR(200) NOT NULL,
    [Sdt]        NVARCHAR(20),
    [Email]      NVARCHAR(100),
    [DiaChi]     NVARCHAR(500),
    [MaTaiKhoan] INT,
    [TrangThai]  BIT DEFAULT 1,
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaTaiKhoan]) REFERENCES [dbo].[TAIKHOAN]([MaTaiKhoan])
)
GO

-- =====================================================
-- 5. BẢNG KHÁCH HÀNG
-- =====================================================
CREATE TABLE [dbo].[KHACHHANG] (
    [MaKhachHang] INT PRIMARY KEY IDENTITY(1,1),
    [MaKH]        NVARCHAR(20) NOT NULL UNIQUE,
    [TenKH]       NVARCHAR(200) NOT NULL,
    [Sdt]         NVARCHAR(20),
    [Email]       NVARCHAR(100),
    [DiaChi]      NVARCHAR(500),
    [LoaiKH]      NVARCHAR(50),
    [MaSoThue]    NVARCHAR(50),
    [MaTaiKhoan]  INT,
    [TrangThai]   BIT DEFAULT 1,
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaTaiKhoan]) REFERENCES [dbo].[TAIKHOAN]([MaTaiKhoan])
)
GO

-- =====================================================
-- 6. BẢNG LOẠI SẢN PHẨM
-- =====================================================
CREATE TABLE [dbo].[LOAISANPHAM] (
    [MaLoaiSP]  INT PRIMARY KEY IDENTITY(1,1),
    [MaLoai]    NVARCHAR(20) NOT NULL UNIQUE,
    [TenLoai]   NVARCHAR(200) NOT NULL,
    [MoTa]      NVARCHAR(500),
    [NgayTao]   DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 7. BẢNG NHÀ CUNG CẤP
-- =====================================================
CREATE TABLE [dbo].[NHACUNGCAP] (
    [MaNhaCungCap] INT PRIMARY KEY IDENTITY(1,1),
    [MaNCC]        NVARCHAR(20) NOT NULL UNIQUE,
    [TenNCC]       NVARCHAR(200) NOT NULL,
    [Sdt]          NVARCHAR(20),
    [Email]        NVARCHAR(100),
    [DiaChi]       NVARCHAR(500),
    [MaSoThue]     NVARCHAR(50),
    [TrangThai]    BIT DEFAULT 1,
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]  DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 8. BẢNG SẢN PHẨM
-- =====================================================
CREATE TABLE [dbo].[SANPHAM] (
    [MaSanPham]  INT PRIMARY KEY IDENTITY(1,1),
    [MaSP]       NVARCHAR(50) NOT NULL UNIQUE,
    [TenSP]      NVARCHAR(300) NOT NULL,
    [MoTa]       NVARCHAR(1000),
    [HinhAnh]    NVARCHAR(500),
    [DonViTinh]  NVARCHAR(50),
    [GiaBan]     DECIMAL(18,2) NOT NULL,
    [GiaNhap]    DECIMAL(18,2),
    [GhiChu]     NVARCHAR(500),
    [MaLoaiSP]   INT NOT NULL,
    [TrangThai]  BIT DEFAULT 1,
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaLoaiSP]) REFERENCES [dbo].[LOAISANPHAM]([MaLoaiSP])
)
GO

-- =====================================================
-- 9. BẢNG KHO HÀNG
-- =====================================================
CREATE TABLE [dbo].[KHOHANG] (
    [MaKhoHang]  INT PRIMARY KEY IDENTITY(1,1),
    [MaKho]      NVARCHAR(20) NOT NULL UNIQUE,
    [TenKho]     NVARCHAR(200) NOT NULL,
    [DiaChi]     NVARCHAR(500),
    [GhiChu]     NVARCHAR(1000),
    [TrangThai]  BIT DEFAULT 1,
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE()
)
GO

-- =====================================================
-- 10. BẢNG BÁO GIÁ
-- =====================================================
CREATE TABLE [dbo].[BAOGIA] (
    [MaBaoGia]   INT PRIMARY KEY IDENTITY(1,1),
    [MaBG]       NVARCHAR(50) NOT NULL UNIQUE,
    [NgayLap]    DATETIME2 DEFAULT GETDATE(),
    [GiaBan]     DECIMAL(18,2),
    [TongTien]   DECIMAL(18,2),
    [TrangThai]  NVARCHAR(50) DEFAULT N'Chờ duyệt',
    [MaKhachHang] INT NOT NULL,
    [MaSanPham]  INT NOT NULL,
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaKhachHang]) REFERENCES [dbo].[KHACHHANG]([MaKhachHang]),
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham])
)
GO

-- =====================================================
-- 11. BẢNG PHIẾU NHẬP
-- =====================================================
CREATE TABLE [dbo].[PHIEUNHAP] (
    [MaPhieuNhap] INT PRIMARY KEY IDENTITY(1,1),
    [MaPN]        NVARCHAR(50) NOT NULL UNIQUE,
    [NgayNhap]    DATETIME2 DEFAULT GETDATE(),
    [TongTien]    DECIMAL(18,2),
    [TrangThai]   NVARCHAR(50) DEFAULT N'Chờ xử lý',
    [GhiChu]      NVARCHAR(1000),
    [MaNhaCungCap] INT NOT NULL,
    [MaNhanVien]  INT NOT NULL,
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaNhaCungCap]) REFERENCES [dbo].[NHACUNGCAP]([MaNhaCungCap]),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien])
)
GO

-- =====================================================
-- 12. BẢNG CHI TIẾT PHIẾU NHẬP (CTPN)
-- =====================================================
CREATE TABLE [dbo].[CTPN] (
    [MaCTPN]       INT PRIMARY KEY IDENTITY(1,1),
    [MaPhieuNhap]  INT NOT NULL,
    [MaSanPham]    INT NOT NULL,
    [SoLuong]      INT NOT NULL,
    [DonGia]       DECIMAL(18,2) NOT NULL,
    [ThanhTien]    DECIMAL(18,2),
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaPhieuNhap]) REFERENCES [dbo].[PHIEUNHAP]([MaPhieuNhap]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham])
)
GO

-- =====================================================
-- 13. BẢNG CHI TIẾT KHO HÀNG (CTKHOHANG)
-- =====================================================
CREATE TABLE [dbo].[CTKHOHANG] (
    [MaCTKho]       INT PRIMARY KEY IDENTITY(1,1),
    [MaKhoHang]     INT NOT NULL,
    [MaSanPham]     INT NOT NULL,
    [SoLuong]       INT DEFAULT 0,
    [SoLuongNhap]   INT DEFAULT 0,
    [SoLuongTon]    INT DEFAULT 0,
    [ViTri]         NVARCHAR(100),
    [NgayCapNhat]   DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaKhoHang]) REFERENCES [dbo].[KHOHANG]([MaKhoHang]),
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham]),
    UNIQUE([MaKhoHang], [MaSanPham])
)
GO

-- =====================================================
-- 14. BẢNG HÓA ĐƠN
-- =====================================================
CREATE TABLE [dbo].[HOADON] (
    [MaHoaDon]   INT PRIMARY KEY IDENTITY(1,1),
    [MaHD]       NVARCHAR(50) NOT NULL UNIQUE,
    [NgayLap]    DATETIME2 DEFAULT GETDATE(),
    [TongTien]   DECIMAL(18,2),
    [GiamGia]    DECIMAL(18,2) DEFAULT 0,
    [TrangThai]  NVARCHAR(50) DEFAULT N'Chờ xử lý',
    [PTTT]       NVARCHAR(50),
    [GhiChu]     NVARCHAR(1000),
    [MaNhanVien] INT NOT NULL,
    [MaKhachHang] INT NOT NULL,
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien]),
    FOREIGN KEY ([MaKhachHang]) REFERENCES [dbo].[KHACHHANG]([MaKhachHang])
)
GO

-- =====================================================
-- 15. BẢNG CHI TIẾT HÓA ĐƠN (CTHD)
-- =====================================================
CREATE TABLE [dbo].[CTHD] (
    [MaCTHD]      INT PRIMARY KEY IDENTITY(1,1),
    [MaHoaDon]    INT NOT NULL,
    [MaSanPham]   INT NOT NULL,
    [SoLuong]     INT NOT NULL,
    [DonGia]      DECIMAL(18,2) NOT NULL,
    [ThanhTien]   DECIMAL(18,2),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham])
)
GO

-- =====================================================
-- 16. BẢNG PHIẾU ĐỔI TRẢ
-- =====================================================
CREATE TABLE [dbo].[PHIEUDOITRA] (
    [MaPhieuDT]  INT PRIMARY KEY IDENTITY(1,1),
    [MaDT]       NVARCHAR(50) NOT NULL UNIQUE,
    [NgayDT]     DATETIME2 DEFAULT GETDATE(),
    [LyDo]       NVARCHAR(500),
    [TrangThai]  NVARCHAR(50) DEFAULT N'Chờ duyệt',
    [MaHoaDon]   INT NOT NULL,
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon])
)
GO

-- =====================================================
-- 17. BẢNG CT PHIẾU ĐỔI TRẢ (CTPHIEUDOITRA)
-- =====================================================
CREATE TABLE [dbo].[CTPHIEUDOITRA] (
    [MaCTDT]       INT PRIMARY KEY IDENTITY(1,1),
    [MaPhieuDT]    INT NOT NULL,
    [MaSanPham]    INT NOT NULL,
    [SoLuong]      INT NOT NULL,
    [DonGia]       DECIMAL(18,2) NOT NULL,
    [MaHoaDon]     INT NOT NULL,
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaPhieuDT]) REFERENCES [dbo].[PHIEUDOITRA]([MaPhieuDT]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham]),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon])
)
GO

-- =====================================================
-- 18. BẢNG PHIẾU GIAO HÀNG
-- =====================================================
CREATE TABLE [dbo].[PHIEUGIAOHANG] (
    [MaPhieuGH]  INT PRIMARY KEY IDENTITY(1,1),
    [MaGH]       NVARCHAR(50) NOT NULL UNIQUE,
    [NguoiGiao]  NVARCHAR(200),
    [NgayGiao]   DATETIME2 DEFAULT GETDATE(),
    [DiaChi]     NVARCHAR(500),
    [TrangThai]  NVARCHAR(50) DEFAULT N'Chờ giao',
    [GhiChu]     NVARCHAR(1000),
    [MaHoaDon]   INT NOT NULL,
    [NgayTao]    DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon])
)
GO

-- =====================================================
-- 19. BẢNG CÔNG NỢ
-- =====================================================
CREATE TABLE [dbo].[CONGNO] (
    [MaCongNo]    INT PRIMARY KEY IDENTITY(1,1),
    [MaCN]        NVARCHAR(50) NOT NULL UNIQUE,
    [SoTienNo]    DECIMAL(18,2) NOT NULL,
    [HanThanhToan] DATETIME2,
    [TrangThai]   NVARCHAR(50) DEFAULT N'Chưa thanh toán',
    [LoaiCongNo]  NVARCHAR(50),  -- 'Phải thu' hoặc 'Phải trả'
    [MaKhachHang] INT,
    [MaNhaCungCap] INT,
    [MaHoaDon]    INT,
    [GhiChu]      NVARCHAR(500),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaKhachHang]) REFERENCES [dbo].[KHACHHANG]([MaKhachHang]),
    FOREIGN KEY ([MaNhaCungCap]) REFERENCES [dbo].[NHACUNGCAP]([MaNhaCungCap]),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon])
)
GO

-- =====================================================
-- 20. BẢNG CHI TIẾT TRẢ NỢ
-- =====================================================
CREATE TABLE [dbo].[CHITETTRANO] (
    [MaChiTietTN] INT PRIMARY KEY IDENTITY(1,1),
    [MaTT]        NVARCHAR(50) NOT NULL UNIQUE,
    [NgayTT]      DATETIME2 DEFAULT GETDATE(),
    [SoTien]      DECIMAL(18,2) NOT NULL,
    [PTTT]        NVARCHAR(100),
    [TrangThai]   NVARCHAR(50) DEFAULT N'Chờ xử lý',
    [MaHoaDon]    INT NOT NULL,
    [GhiChu]      NVARCHAR(500),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon])
)
GO

-- =====================================================
-- 21. BẢNG KHUYẾN MẠI
-- =====================================================
CREATE TABLE [dbo].[KHUYENMAI] (
    [MaKhuyenMai] INT PRIMARY KEY IDENTITY(1,1),
    [MaKM]        NVARCHAR(50) NOT NULL UNIQUE,
    [TenKM]       NVARCHAR(200) NOT NULL,
    [ThietGiam]   DECIMAL(5,2),
    [ThoiGianApDung] DATETIME2,
    [ThoiGianKetThuc] DATETIME2,
    [TrangThai]   BIT DEFAULT 1,
    [MaHoaDon]    INT,
    [GhiChu]      NVARCHAR(500),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon])
)
GO

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX [IX_TAIKHOAN_MaVaiTro] ON [dbo].[TAIKHOAN]([MaVaiTro])
CREATE INDEX [IX_SANPHAM_MaLoaiSP] ON [dbo].[SANPHAM]([MaLoaiSP])
CREATE INDEX [IX_HOADON_MaNhanVien] ON [dbo].[HOADON]([MaNhanVien])
CREATE INDEX [IX_HOADON_MaKhachHang] ON [dbo].[HOADON]([MaKhachHang])
CREATE INDEX [IX_HOADON_TrangThai] ON [dbo].[HOADON]([TrangThai])
CREATE INDEX [IX_PHIEUNHAP_MaNCC] ON [dbo].[PHIEUNHAP]([MaNhaCungCap])
CREATE INDEX [IX_PHIEUNHAP_TrangThai] ON [dbo].[PHIEUNHAP]([TrangThai])
CREATE INDEX [IX_CONGNO_MaKH] ON [dbo].[CONGNO]([MaKhachHang])
CREATE INDEX [IX_PHIEUGIAOHANG_TrangThai] ON [dbo].[PHIEUGIAOHANG]([TrangThai])
GO

-- =====================================================
-- DỮ LIỆU MẪU
-- =====================================================
PRINT N'BẮT ĐẦU THÊM DỮ LIỆU MẪU...'

-- 1. QUYỀN
INSERT INTO [dbo].[QUYEN] ([MaQ], [TenQ], [MoTa]) VALUES
(N'Q01', N'Quản lý người dùng',     N'Thêm, sửa, xóa tài khoản'),
(N'Q02', N'Quản lý sản phẩm',       N'Thêm, sửa, xóa sản phẩm'),
(N'Q03', N'Quản lý đơn hàng',       N'Tạo và xử lý đơn hàng'),
(N'Q04', N'Quản lý kho',            N'Nhập hàng, kiểm kho'),
(N'Q05', N'Quản lý giao hàng',      N'Điều phối giao hàng'),
(N'Q06', N'Quản lý thanh toán',     N'Xử lý thanh toán, công nợ'),
(N'Q07', N'Xem báo cáo',            N'Xem báo cáo thống kê'),
(N'Q08', N'Cài đặt hệ thống',       N'Cấu hình hệ thống'),
(N'Q09', N'Xem sản phẩm',           N'Quyền xem, tìm kiếm sản phẩm'),
(N'Q10', N'Đặt hàng',               N'Quyền đặt hàng cho khách')
GO

-- 2. VAI TRÒ
INSERT INTO [dbo].[VAITRO] ([MaVT], [TenVT], [MaQuyen]) VALUES
(N'VT01', N'Quản trị viên',    1),
(N'VT02', N'Quản lý',          3),
(N'VT03', N'Nhân viên bán hàng', 3),
(N'VT04', N'Nhân viên kho',    4),
(N'VT05', N'Tài xế',           5),
(N'VT06', N'Khách hàng',       9)
GO

-- 3. TÀI KHOẢN (Mật khẩu: admin123 - SHA256 hash)
INSERT INTO [dbo].[TAIKHOAN] ([MaTK], [TenTK], [MatKhau], [Email], [MaVaiTro]) VALUES
(N'TK01', N'admin',       N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'admin@vlxd.com',      1),
(N'TK02', N'quanly01',    N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'quanly@vlxd.com',     2),
(N'TK03', N'nvbanhang01', N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'banhang@vlxd.com',    3),
(N'TK04', N'nvkho01',     N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'kho@vlxd.com',        4),
(N'TK05', N'taixe01',     N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'taixe@vlxd.com',      5),
(N'TK06', N'khachhang01', N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'kh01@gmail.com',      6),
(N'TK07', N'khachhang02', N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIkK=', N'kh02@gmail.com',      6)
GO

-- 4. NHÂN VIÊN
INSERT INTO [dbo].[NHANVIEN] ([MaNV], [TenNV], [Sdt], [Email], [DiaChi], [MaTaiKhoan]) VALUES
(N'NV01', N'Trương Thanh Tuấn',  N'0909123456', N'tuan.truong@vlxd.com',  N'Q1, TP.HCM',  1),
(N'NV02', N'Lê Trần Ngọc Yến',  N'0909123457', N'yen.le@vlxd.com',       N'Q3, TP.HCM',  2),
(N'NV03', N'Phạm Hồ Thúy Vy',   N'0909123458', N'vy.pham@vlxd.com',      N'Q4, TP.HCM',  3),
(N'NV04', N'Nguyễn Minh Đức',    N'0909123459', N'duc.nguyen@vlxd.com',   N'Q7, TP.HCM',  4),
(N'NV05', N'Phạm Văn Tài',       N'0909123460', N'tai.pham@vlxd.com',     N'Q7, TP.HCM',  5)
GO

-- 5. KHÁCH HÀNG
INSERT INTO [dbo].[KHACHHANG] ([MaKH], [TenKH], [Sdt], [Email], [DiaChi], [LoaiKH], [MaSoThue], [MaTaiKhoan]) VALUES
(N'KH01', N'Nguyễn Văn An',                N'0987654321', N'an.nguyen@gmail.com',       N'123 Lê Lợi, Q1, TP.HCM',       N'Cá nhân',  NULL, 6),
(N'KH02', N'Công ty Xây Dựng Bình Minh',   N'02839998888', N'info@binhminhcons.com',    N'456 Nguyễn Văn Linh, Q7',       N'Công ty',  N'0301234567', 7),
(N'KH03', N'Trần Thị Hoa',                 N'0912333444', N'hoa.tran@yahoo.com',        N'789 CMT8, Q3, TP.HCM',          N'Cá nhân',  NULL, NULL),
(N'KH04', N'Công Ty Nội Thất Xanh',        N'02831110000', N'design@greeninterior.com', N'Khu Sala, Q2, TP.HCM',          N'Công ty',  N'0321112223', NULL),
(N'KH05', N'Nhà Thầu Phụ An Khang',        N'0912999000', N'ankhang@thauphu.vn',        N'Thủ Đức, TP.HCM',              N'Công ty',  N'0334445556', NULL),
(N'KH06', N'Phạm Văn Mách',                N'0909333444', N'mach.pham@gmail.com',       N'Q7, TP.HCM',                    N'Cá nhân',  NULL, NULL),
(N'KH07', N'Khách Sạn Mường Thanh',        N'02839999999', N'purchase@muongthanh.vn',   N'Phú Nhuận, TP.HCM',            N'Công ty',  N'0345556667', NULL)
GO

-- 6. LOẠI SẢN PHẨM
INSERT INTO [dbo].[LOAISANPHAM] ([MaLoai], [TenLoai], [MoTa]) VALUES
(N'LSP01', N'Xi măng',            N'Xi măng các loại'),
(N'LSP02', N'Cát đá',             N'Cát, đá xây dựng'),
(N'LSP03', N'Sắt thép',           N'Sắt thép xây dựng'),
(N'LSP04', N'Gạch ngói',          N'Gạch, ngói các loại'),
(N'LSP05', N'Sơn & Phụ kiện',     N'Sơn nước, sơn dầu'),
(N'LSP06', N'Thiết bị điện',      N'Dây điện, công tắc, đèn'),
(N'LSP07', N'Thiết bị nước',      N'Ống nước, van, vòi'),
(N'LSP08', N'Dụng cụ thi công',   N'Máy khoan, máy cắt, bay')
GO

-- 7. NHÀ CUNG CẤP
INSERT INTO [dbo].[NHACUNGCAP] ([MaNCC], [TenNCC], [Sdt], [Email], [DiaChi], [MaSoThue]) VALUES
(N'NCC01', N'Công ty Xi Măng Hà Tiên',   N'02838111111', N'sales@hatien.com',               N'Kiên Lương, Kiên Giang',        N'3700123456'),
(N'NCC02', N'Thép Hòa Phát Miền Nam',    N'02838222222', N'daily@hoaphat.com',              N'KCN Sóng Thần, Bình Dương',     N'3700654321'),
(N'NCC03', N'Gạch Đồng Tâm',             N'02838333333', N'contact@dongtam.com',            N'Bến Lức, Long An',              N'3700987654'),
(N'NCC04', N'Cửa hàng Cát Đá Sài Gòn',   N'0912345678', N'catdasaigon@gmail.com',           N'Bình Chánh, TP.HCM',            N'0312345678'),
(N'NCC05', N'Sơn Dulux Việt Nam',         N'19001234',    N'hotro@dulux.vn',                 N'Q1, TP.HCM',                    N'0398765432'),
(N'NCC06', N'Cáp điện CADIVI',            N'02838112233', N'kd@cadivi.vn',                   N'70-72 Nam Kỳ Khởi Nghĩa, Q1',  N'0300123987'),
(N'NCC07', N'Nhựa Bình Minh',             N'02839690973', N'sales@binhminhplastic.com',      N'240 Hậu Giang, Q6',             N'0301456789'),
(N'NCC08', N'Dụng cụ Bosch VN',           N'02862583690', N'contact@bosch.com',              N'Ngôi Nhà Đức, Q1',              N'0311223344')
GO

-- 8. SẢN PHẨM
INSERT INTO [dbo].[SANPHAM] ([MaSP], [TenSP], [MoTa], [DonViTinh], [GiaBan], [GiaNhap], [MaLoaiSP]) VALUES
(N'SP01', N'Xi măng Hà Tiên PCB40',         N'Xi măng đa dụng bao 50kg',        N'Bao',   95000,   88000,  1),
(N'SP02', N'Xi măng Insee',                  N'Xi măng xây tô bao 50kg',         N'Bao',   92000,   85000,  1),
(N'SP03', N'Cát vàng xây dựng',             N'Cát hạt lớn đổ bê tông',          N'Khối',  450000,  380000, 2),
(N'SP04', N'Đá 1x2 xanh',                   N'Đá đổ bê tông Đồng Nai',          N'Khối',  380000,  320000, 2),
(N'SP05', N'Thép cuộn Hòa Phát Phi 6',      N'Thép cuộn trơn phi 6',            N'Kg',    18500,   16000,  3),
(N'SP06', N'Thép cây Hòa Phát Phi 10',      N'Thép gân phi 10 cây 11.7m',       N'Cây',   115000,  102000, 3),
(N'SP07', N'Gạch ống 4 lỗ Tuynel',          N'Gạch xây tường 8x8x18',           N'Viên',  1200,    950,    4),
(N'SP08', N'Gạch men lát nền 60x60',        N'Gạch men trắng vân mây',          N'Thùng', 180000,  145000, 4),
(N'SP09', N'Sơn Dulux Inspire Nội thất',    N'Sơn nội thất thùng 18L',          N'Thùng', 1200000, 950000, 5),
(N'SP10', N'Sơn chống thấm KOVA CT-11A',    N'Thùng 20kg',                      N'Thùng', 2100000, 1800000,5),
(N'SP11', N'Dây điện đơn CV 1.5 CADIVI',    N'Dây đơn mềm ruột đồng',           N'Cuộn',  450000,  390000, 6),
(N'SP12', N'Công tắc Panasonic Wide',       N'Công tắc hạt lớn',                N'Cái',   45000,   32000,  6),
(N'SP13', N'Bóng đèn LED Rạng Đông 9W',    N'Đèn búp trụ nhôm nhựa',           N'Cái',   45000,   35000,  6),
(N'SP14', N'Ống nhựa PVC Bình Minh D21',    N'Ống thoát nước cây 4m',            N'Cây',   35000,   28000,  7),
(N'SP15', N'Ống nhựa PVC Bình Minh D90',    N'Ống thoát nước lớn',               N'Cây',   250000,  210000, 7),
(N'SP16', N'Máy khoan cầm tay Bosch',       N'Máy khoan động lực 550W',          N'Cái',   1200000, 950000, 8),
(N'SP17', N'Máy cắt sắt Makita',            N'Máy cắt bàn 355mm',               N'Cái',   3500000, 2900000,8)
GO

-- 9. KHO HÀNG
INSERT INTO [dbo].[KHOHANG] ([MaKho], [TenKho], [DiaChi], [GhiChu]) VALUES
(N'KHO01', N'Kho chính',    N'123 Quốc lộ 1A, Bình Chánh, TP.HCM', N'Kho hàng chính của cửa hàng'),
(N'KHO02', N'Kho phụ Q7',   N'456 Nguyễn Thị Thập, Q7, TP.HCM',    N'Kho hàng phụ khu vực Q7')
GO

-- 10. CHI TIẾT KHO HÀNG
INSERT INTO [dbo].[CTKHOHANG] ([MaKhoHang], [MaSanPham], [SoLuong], [SoLuongNhap], [SoLuongTon], [ViTri]) VALUES
(1, 1,  500,  500,  420,  N'Kệ A1'), (1, 2,  300,  300,  250,  N'Kệ A2'),
(1, 3,  50,   50,   35,   N'Kệ B1'), (1, 4,  40,   40,   30,   N'Kệ B2'),
(1, 5,  200,  200,  150,  N'Kệ C1'), (1, 6,  150,  150,  120,  N'Kệ C2'),
(1, 7,  5000, 5000, 3500, N'Kệ D1'), (1, 8,  100,  100,  80,   N'Kệ D2'),
(1, 9,  30,   30,   25,   N'Kệ E1'), (1, 10, 20,   20,   18,   N'Kệ E2'),
(1, 11, 50,   50,   40,   N'Kệ F1'), (1, 12, 100,  100,  85,   N'Kệ F2'),
(1, 13, 200,  200,  180,  N'Kệ F3'), (1, 14, 150,  150,  120,  N'Kệ G1'),
(1, 15, 80,   80,   65,   N'Kệ G2'), (1, 16, 10,   10,   8,    N'Kệ H1'),
(1, 17, 5,    5,    4,    N'Kệ H2')
GO

-- 11. PHIẾU NHẬP
INSERT INTO [dbo].[PHIEUNHAP] ([MaPN], [NgayNhap], [TongTien], [TrangThai], [MaNhaCungCap], [MaNhanVien]) VALUES
(N'PN001', DATEADD(day,-10,GETDATE()), 88000000,  N'Đã nhận hàng', 1, 2),
(N'PN002', DATEADD(day,-7,GETDATE()),  30600000,  N'Đã nhận hàng', 2, 2),
(N'PN003', DATEADD(day,-3,GETDATE()),  14500000,  N'Đang xử lý',  3, 4)
GO

-- 12. CHI TIẾT PHIẾU NHẬP
INSERT INTO [dbo].[CTPN] ([MaPhieuNhap], [MaSanPham], [SoLuong], [DonGia], [ThanhTien]) VALUES
(1, 1, 1000, 88000,  88000000),
(2, 5, 200,  16000,  3200000),
(2, 6, 200,  102000, 20400000),
(2, 5, 500,  14000,  7000000),
(3, 7, 5000, 950,    4750000),
(3, 8, 50,   145000, 7250000),
(3, 12,50,   32000,  1600000)
GO

-- 13. HÓA ĐƠN
INSERT INTO [dbo].[HOADON] ([MaHD], [NgayLap], [TongTien], [GiamGia], [TrangThai], [PTTT], [MaNhanVien], [MaKhachHang]) VALUES
(N'HD001', DATEADD(month,-1,GETDATE()), 15000000,  0,       N'Hoàn thành',    N'Chuyển khoản', 3, 2),
(N'HD002', DATEADD(day,-5,GETDATE()),   50000000,  2500000, N'Đang giao',     N'Tiền mặt',     3, 5),
(N'HD003', DATEADD(day,-2,GETDATE()),   5400000,   0,       N'Chờ xử lý',     N'Tiền mặt',     3, 1),
(N'HD004', GETDATE(),                   12000000,  600000,  N'Chờ xử lý',     N'Chuyển khoản', 3, 4)
GO

-- 14. CHI TIẾT HÓA ĐƠN
INSERT INTO [dbo].[CTHD] ([MaHoaDon], [MaSanPham], [SoLuong], [DonGia], [ThanhTien]) VALUES
(1, 1,  100,   95000,   9500000),
(1, 3,  10,    450000,  4500000),
(1, 13, 20,    45000,   900000),
(2, 6,  200,   115000,  23000000),
(2, 16, 5,     1200000, 6000000),
(2, 7,  10000, 1200,    12000000),
(2, 9,  5,     1200000, 6000000),
(2, 11, 5,     450000,  2250000),
(3, 1,  50,    95000,   4750000),
(3, 12, 10,    45000,   450000),
(3, 14, 5,     35000,   175000),
(4, 8,  50,    180000,  9000000),
(4, 9,  2,     1200000, 2400000),
(4, 13, 10,    45000,   450000)
GO

-- 15. PHIẾU GIAO HÀNG
INSERT INTO [dbo].[PHIEUGIAOHANG] ([MaGH], [NguoiGiao], [NgayGiao], [DiaChi], [TrangThai], [MaHoaDon]) VALUES
(N'GH001', N'Phạm Văn Tài',  DATEADD(month,-1,GETDATE()), N'456 Nguyễn Văn Linh, Q7', N'Đã giao', 1),
(N'GH002', N'Phạm Văn Tài',  DATEADD(day,-4,GETDATE()),   N'Thủ Đức, TP.HCM',        N'Đang giao', 2)
GO

-- 16. CÔNG NỢ
INSERT INTO [dbo].[CONGNO] ([MaCN], [SoTienNo], [HanThanhToan], [TrangThai], [LoaiCongNo], [MaKhachHang], [MaHoaDon]) VALUES
(N'CN001', 47500000, DATEADD(day,30,GETDATE()), N'Chưa thanh toán', N'Phải thu', 5, 2),
(N'CN002', 12000000, DATEADD(day,15,GETDATE()), N'Chưa thanh toán', N'Phải thu', 4, 4)
GO

-- 17. CHI TIẾT TRẢ NỢ  
INSERT INTO [dbo].[CHITETTRANO] ([MaTT], [NgayTT], [SoTien], [PTTT], [TrangThai], [MaHoaDon]) VALUES
(N'TT001', DATEADD(month,-1,GETDATE()), 15000000, N'Chuyển khoản', N'Hoàn thành', 1),
(N'TT002', DATEADD(day,-2,GETDATE()),   5400000,  N'Tiền mặt',     N'Hoàn thành', 3)
GO

-- 18. KHUYẾN MẠI
INSERT INTO [dbo].[KHUYENMAI] ([MaKM], [TenKM], [ThietGiam], [ThoiGianApDung], [ThoiGianKetThuc], [TrangThai]) VALUES
(N'KM001', N'Mùa Xây Dựng 2026',     5.0,  DATEADD(day,-5,GETDATE()), DATEADD(day,25,GETDATE()), 1),
(N'KM002', N'Giảm giá sơn tháng 4',  10.0, GETDATE(),                 DATEADD(day,30,GETDATE()), 1)
GO

-- 19. BÁO GIÁ
INSERT INTO [dbo].[BAOGIA] ([MaBG], [NgayLap], [GiaBan], [TongTien], [TrangThai], [MaKhachHang], [MaSanPham]) VALUES
(N'BG001', DATEADD(day,-3,GETDATE()), 90000,  90000000, N'Đã duyệt',  2, 1),
(N'BG002', GETDATE(),                 110000, 22000000, N'Chờ duyệt',  5, 6)
GO

PRINT N'TẠO DATABASE HOÀN TẤT!'
GO
