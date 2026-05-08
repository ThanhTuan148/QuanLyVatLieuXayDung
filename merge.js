const fs = require('fs');
const src = 'd:/thanhtuan/KLTN/QuanLyVatLieuXayDung/Database/QLCHVLXD_final.sql';
const dest = 'd:/thanhtuan/KLTN/QuanLyVatLieuXayDung/QuanLyVLXD_V7_FINAL.sql';

let content = fs.readFileSync(src, 'utf8');

// A. HOADON
content = content.replace(/CREATE TABLE \[dbo\]\.\[HOADON\] \([\s\S]*?FOREIGN KEY \(\[MaKhuyenMai\]\) REFERENCES \[dbo\]\.\[KHUYENMAI\]\(\[MaKhuyenMai\]\) ON DELETE SET NULL\r?\n\)\r?\nGO/, 
`CREATE TABLE [dbo].[HOADON] (
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
    [MaNhanVien]  INT NULL,
    [MaKhachHang] INT NOT NULL,
    [MaKhuyenMai] INT NULL, -- Liên kết với bảng KHUYENMAI gộp
    -- Delivery Info
    [TenNguoiNhan]  NVARCHAR(255) NULL, 
    [SdtNguoiNhan]  VARCHAR(20) NULL, 
    [EmailNguoiNhan] VARCHAR(255) NULL, 
    [DiaChiGiaoHang] NVARCHAR(1000) NULL, 
    -- VAT Info
    [YeuCauVat]     BIT NOT NULL DEFAULT 0, 
    [VatType]       VARCHAR(50) NULL, 
    [VatBuyerName]  NVARCHAR(255) NULL, 
    [VatEmail]      VARCHAR(255) NULL, 
    [VatAddress]    NVARCHAR(1000) NULL, 
    [VatIdCard]     VARCHAR(50) NULL, 
    [VatPassport]   VARCHAR(50) NULL, 
    [VatCompanyName] NVARCHAR(500) NULL, 
    [VatCompanyAddress] NVARCHAR(1000) NULL, 
    [VatTaxId]      VARCHAR(50) NULL, 
    [VatBudgetCode] VARCHAR(100) NULL,
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien]),
    FOREIGN KEY ([MaKhachHang]) REFERENCES [dbo].[KHACHHANG]([MaKhachHang]),
    FOREIGN KEY ([MaKhuyenMai]) REFERENCES [dbo].[KHUYENMAI]([MaKhuyenMai]) ON DELETE SET NULL
)
GO`);

// B. CONGNO
content = content.replace(/CREATE TABLE \[dbo\]\.\[CONGNO\] \([\s\S]*?FOREIGN KEY \(\[MaHoaDon\]\) REFERENCES \[dbo\]\.\[HOADON\]\(\[MaHoaDon\]\)\r?\n\)\r?\nGO/,
`CREATE TABLE [dbo].[CONGNO] (
    [MaCongNo]     INT PRIMARY KEY IDENTITY(1,1),
    [MaCN]         AS ('CN' + RIGHT('000' + CAST([MaCongNo] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [SoTienNo]     DECIMAL(18,2) NOT NULL CHECK ([SoTienNo] >= 0),
    [SoTienDaTra]  DECIMAL(18,2) DEFAULT 0 CHECK ([SoTienDaTra] >= 0),
    [SoTienConLai] DECIMAL(18,2) CHECK ([SoTienConLai] >= 0),
    [HanThanhToan] DATETIME2,
    [TrangThai]    NVARCHAR(50) DEFAULT N'Chưa thanh toán',
    [LoaiCongNo]   NVARCHAR(50) DEFAULT N'Phải thu',
    [MaKhachHang]  INT NULL,
    [MaNhaCungCap] INT NULL,
    [MaHoaDon]     INT NULL,
    [MaPhieuNhap]  INT NULL,
    [GhiChu]       NVARCHAR(500),
    [NgayTao]      DATETIME2 DEFAULT GETDATE(),
    [NgayCapNhat]  DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaKhachHang]) REFERENCES [dbo].[KHACHHANG]([MaKhachHang]),
    FOREIGN KEY ([MaNhaCungCap]) REFERENCES [dbo].[NHACUNGCAP]([MaNhaCungCap]),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon]),
    FOREIGN KEY ([MaPhieuNhap]) REFERENCES [dbo].[PHIEUNHAP]([MaPhieuNhap])
)
GO`);

// C. CHITETTRANO
content = content.replace(/CREATE TABLE \[dbo\]\.\[CHITETTRANO\] \([\s\S]*?FOREIGN KEY \(\[MaNhanVien\]\) REFERENCES \[dbo\]\.\[NHANVIEN\]\(\[MaNhanVien\]\)\r?\n\)\r?\nGO/,
`CREATE TABLE [dbo].[CHITETTRANO] (
    [MaChiTietTN] INT PRIMARY KEY IDENTITY(1,1),
    [MaTT]        AS ('TT' + RIGHT('000' + CAST([MaChiTietTN] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
    [NgayTT]      DATETIME2 DEFAULT GETDATE(),
    [SoTien]      DECIMAL(18,2) NOT NULL CHECK ([SoTien] > 0),
    [PTTT]        NVARCHAR(100),
    [SoGiaoDich]  NVARCHAR(100),
    [TrangThai]   NVARCHAR(50) DEFAULT N'Chờ xử lý',
    [MaHoaDon]    INT NULL,       
    [MaPhieuNhap] INT NULL,
    [MaCongNo]    INT NOT NULL,   
    [MaNhanVien]  INT NULL,
    [GhiChu]      NVARCHAR(500),
    [NgayTao]     DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON]([MaHoaDon]),
    FOREIGN KEY ([MaPhieuNhap]) REFERENCES [dbo].[PHIEUNHAP]([MaPhieuNhap]),
    FOREIGN KEY ([MaCongNo]) REFERENCES [dbo].[CONGNO]([MaCongNo]),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien])
)
GO`);

// D. KHOHANG
content = content.replace(/CREATE TABLE \[dbo\]\.\[KHOHANG\] \(\r?\n    \[MaKhoHang\]   INT PRIMARY KEY IDENTITY\(1,1\),\r?\n    \[MaKho\]       AS \('KHO' \+ RIGHT\('00' \+ CAST\(\[MaKhoHang\] AS VARCHAR\(10\)\), 2\)\) PERSISTED UNIQUE,\r?\n    \[TenKho\]      NVARCHAR\(200\) NOT NULL,\r?\n    \[DiaChi\]      NVARCHAR\(500\),\r?\n    \[GhiChu\]      NVARCHAR\(1000\),/,
`CREATE TABLE [dbo].[KHOHANG] (
    [MaKhoHang]   INT PRIMARY KEY IDENTITY(1,1),
    [MaKho]       AS ('KHO' + RIGHT('00' + CAST([MaKhoHang] AS VARCHAR(10)), 2)) PERSISTED UNIQUE,
    [TenKho]      NVARCHAR(200) NOT NULL,
    [DiaChi]      NVARCHAR(500),
    [LoaiKho]     NVARCHAR(100) NULL,
    [GhiChu]      NVARCHAR(1000),`);

// E. CTPN
content = content.replace(/CREATE TABLE \[dbo\]\.\[CTPN\] \([\s\S]*?FOREIGN KEY \(\[MaSanPham\]\) REFERENCES \[dbo\]\.\[SANPHAM\]\(\[MaSanPham\]\)\r?\n\)\r?\nGO/,
`CREATE TABLE [dbo].[CTPN] (
    [MaCTPN]        INT PRIMARY KEY IDENTITY(1,1),
    [MaPhieuNhap]   INT NOT NULL,
    [MaSanPham]     INT NOT NULL,
    [SoLuong]       INT NOT NULL CHECK ([SoLuong] > 0),
    [DonGia]        DECIMAL(18,2) NOT NULL CHECK ([DonGia] >= 0),
    [ThanhTien]     DECIMAL(18,2) CHECK ([ThanhTien] >= 0),
    [SoLuongDaNhan] INT DEFAULT 0 CHECK ([SoLuongDaNhan] >= 0),
    [MaKhoHang]     INT NULL,
    [TrangThai]     NVARCHAR(50) NULL,
    [NgayTao]       DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaPhieuNhap]) REFERENCES [dbo].[PHIEUNHAP]([MaPhieuNhap]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham]),
    FOREIGN KEY ([MaKhoHang]) REFERENCES [dbo].[KHOHANG]([MaKhoHang])
)
GO`);

// F. NEW TABLES
const newTables = `
-- =====================================================
-- BẢNG PHỤ TRỢ (Từ các migration khác)
-- =====================================================
CREATE TABLE [dbo].[NHACUNGCAP_SANPHAM] (
    [MaNCCSP]    INT PRIMARY KEY IDENTITY(1,1),
    [MaNCC]      INT NOT NULL,
    [MaSanPham]  INT NOT NULL,
    [GiaCungCap] DECIMAL(18,2) NOT NULL,
    [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([MaNCC]) REFERENCES [dbo].[NHACUNGCAP]([MaNhaCungCap]) ON DELETE CASCADE,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham]) ON DELETE CASCADE
)
GO

CREATE TABLE [dbo].[THONGBAO] (
    [MaThongBao] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TieuDe] NVARCHAR(255) NOT NULL,
    [NoiDung] NVARCHAR(MAX) NOT NULL,
    [NgayTao] DATETIME DEFAULT GETDATE(),
    [LoaiThongBao] NVARCHAR(50), 
    [MaNguoiNhan] NVARCHAR(50) NULL, 
    [DaDoc] BIT DEFAULT 0,
    [LienKet] NVARCHAR(255) NULL 
)
GO
CREATE INDEX [IX_THONGBAO_NguoiNhan] ON [dbo].[THONGBAO] ([MaNguoiNhan], [NgayTao] DESC);
GO

CREATE TABLE [dbo].[LICHSUGIA] (
    [MaLSG]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [MaSanPham]     INT NOT NULL,
    [GiaBanCu]      DECIMAL(18, 2) NULL,
    [GiaBanMoi]     DECIMAL(18, 2) NOT NULL,
    [GiaNhapCu]     DECIMAL(18, 2) NULL,
    [GiaNhapMoi]    DECIMAL(18, 2) NULL,
    [LyDo]          NVARCHAR(500) NULL,
    [NguonThayDoi]  NVARCHAR(100) NULL,
    [NgayThayDoi]   DATETIME NOT NULL DEFAULT GETDATE(),
    [MaNhanVien]    INT NULL,
    FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM] ([MaSanPham]),
    FOREIGN KEY ([MaNhanVien]) REFERENCES [dbo].[NHANVIEN] ([MaNhanVien])
)
GO

CREATE TABLE [dbo].[LICHSUPHIEUNHAP] (
    [MaLichSu] INT IDENTITY(1,1) PRIMARY KEY,
    [MaPhieuNhap] INT NOT NULL,
    [TrangThaiCu] NVARCHAR(100),
    [TrangThaiMoi] NVARCHAR(100),
    [NoiDungThayDoi] NVARCHAR(MAX),
    [NgayThayDoi] DATETIME DEFAULT GETDATE(),
    [MaNguoiThucHien] INT NULL,
    FOREIGN KEY ([MaPhieuNhap]) REFERENCES [dbo].[PHIEUNHAP]([MaPhieuNhap]) ON DELETE CASCADE,
    FOREIGN KEY ([MaNguoiThucHien]) REFERENCES [dbo].[NHANVIEN]([MaNhanVien]) ON DELETE SET NULL
)
GO

CREATE TABLE [dbo].[UUDAI] (
    [MaUUDAI] INT IDENTITY(1,1) PRIMARY KEY,
    [MaVCDD] AS ('VC' + RIGHT('000000' + CAST(MaUUDAI AS VARCHAR(6)), 6)) PERSISTED,
    [TenUuDai] NVARCHAR(255) NOT NULL,
    [Code] NVARCHAR(50) NOT NULL UNIQUE,
    [MoTa] NVARCHAR(MAX),
    [LoaiUuDai] NVARCHAR(20) NOT NULL,
    [GiaTriGiam] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [DonHangToiThieu] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [GiamToiDa] DECIMAL(18,2),
    [NgayBatDau] DATETIME NOT NULL,
    [NgayKetThuc] DATETIME NOT NULL,
    [SoLuongToiDa] INT,
    [SoLuongDaDung] INT DEFAULT 0,
    [TrangThai] BIT DEFAULT 1,
    [HinhAnh] NVARCHAR(500),
    [NgayTao] DATETIME DEFAULT GETDATE(),
    [NgayCapNhat] DATETIME DEFAULT GETDATE()
)
GO

-- =====================================================
-- INDEXES
-- =====================================================
`;
content = content.replace(/-- =====================================================\r?\n-- INDEXES\r?\n-- =====================================================/, newTables);

fs.writeFileSync(dest, content, 'utf8');
console.log('Merge complete!');
