-- UPDATE SCRIPT FOR VERSION 8
-- Run this if you are upgrading from Version 7

-- 1. Update HOADON table with Delivery and VAT information
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'TenNguoiNhan')
    ALTER TABLE [dbo].[HOADON] ADD [TenNguoiNhan] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'SdtNguoiNhan')
    ALTER TABLE [dbo].[HOADON] ADD [SdtNguoiNhan] VARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'EmailNguoiNhan')
    ALTER TABLE [dbo].[HOADON] ADD [EmailNguoiNhan] VARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'DiaChiGiaoHang')
    ALTER TABLE [dbo].[HOADON] ADD [DiaChiGiaoHang] NVARCHAR(1000) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'PhiVanChuyen')
    ALTER TABLE [dbo].[HOADON] ADD [PhiVanChuyen] DECIMAL(18,2) NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'AnhBangChung')
    ALTER TABLE [dbo].[HOADON] ADD [AnhBangChung] NVARCHAR(MAX) NULL;

-- VAT Columns for HOADON
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'YeuCauVat')
    ALTER TABLE [dbo].[HOADON] ADD [YeuCauVat] BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatType')
    ALTER TABLE [dbo].[HOADON] ADD [VatType] VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatBuyerName')
    ALTER TABLE [dbo].[HOADON] ADD [VatBuyerName] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatEmail')
    ALTER TABLE [dbo].[HOADON] ADD [VatEmail] VARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatAddress')
    ALTER TABLE [dbo].[HOADON] ADD [VatAddress] NVARCHAR(1000) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatIdCard')
    ALTER TABLE [dbo].[HOADON] ADD [VatIdCard] VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatPassport')
    ALTER TABLE [dbo].[HOADON] ADD [VatPassport] VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatCompanyName')
    ALTER TABLE [dbo].[HOADON] ADD [VatCompanyName] NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatCompanyAddress')
    ALTER TABLE [dbo].[HOADON] ADD [VatCompanyAddress] NVARCHAR(1000) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatTaxId')
    ALTER TABLE [dbo].[HOADON] ADD [VatTaxId] VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOADON]') AND name = 'VatBudgetCode')
    ALTER TABLE [dbo].[HOADON] ADD [VatBudgetCode] VARCHAR(100) NULL;

-- 2. Update CTHD table with per-item delivery info
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTHD]') AND name = 'DiaChiGiaoHang')
    ALTER TABLE [dbo].[CTHD] ADD [DiaChiGiaoHang] NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTHD]') AND name = 'TenNguoiNhan')
    ALTER TABLE [dbo].[CTHD] ADD [TenNguoiNhan] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTHD]') AND name = 'SdtNguoiNhan')
    ALTER TABLE [dbo].[CTHD] ADD [SdtNguoiNhan] NVARCHAR(20) NULL;

-- 3. Create LICHSUHOADON table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LICHSUHOADON]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[LICHSUHOADON](
        [MaLichSu] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [MaHoaDon] [int] NOT NULL,
        [TrangThaiCu] [nvarchar](100) NULL,
        [TrangThaiMoi] [nvarchar](100) NULL,
        [NoiDungThayDoi] [nvarchar](max) NULL,
        [MaNguoiThucHien] [int] NULL,
        [NgayTao] [datetime2](7) NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY([MaHoaDon]) REFERENCES [dbo].[HOADON] ([MaHoaDon]) ON DELETE CASCADE
    );
END

-- 4. Update SANPHAM table with Weight and Dimension
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'TrongLuong')
    ALTER TABLE [dbo].[SANPHAM] ADD [TrongLuong] DECIMAL(18,2) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'DonViTrongLuong')
    ALTER TABLE [dbo].[SANPHAM] ADD [DonViTrongLuong] NVARCHAR(50) NULL DEFAULT 'kg';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'KichThuoc')
    ALTER TABLE [dbo].[SANPHAM] ADD [KichThuoc] NVARCHAR(MAX) NULL;

-- 5. Update NHANVIEN for Driver capacity
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[NHANVIEN]') AND name = 'SucChuaToiDa')
    ALTER TABLE [dbo].[NHANVIEN] ADD [SucChuaToiDa] NVARCHAR(MAX) NULL;

-- 6. Update CTPHIEUGIAOHANG to track per-address line (MaCTHD)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CTPHIEUGIAOHANG]') AND name = 'MaCTHD')
BEGIN
    ALTER TABLE [dbo].[CTPHIEUGIAOHANG] ADD [MaCTHD] INT NULL;
    
    -- Add foreign key and index
    CREATE INDEX [IX_CTPHIEUGIAOHANG_MaCTHD] ON [dbo].[CTPHIEUGIAOHANG] ([MaCTHD]);
    ALTER TABLE [dbo].[CTPHIEUGIAOHANG] ADD CONSTRAINT [FK_CTPHIEUGIAOHANG_CTHD_MaCTHD] 
        FOREIGN KEY ([MaCTHD]) REFERENCES [dbo].[CTHD] ([MaCTHD]);
END

