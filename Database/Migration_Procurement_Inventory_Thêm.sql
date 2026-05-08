USE [QLCH_VLXD_2];
GO

-- 1. Thêm cột LoaiKho vào KHOHANG
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[KHOHANG]') AND name = 'LoaiKho')
BEGIN
    ALTER TABLE [dbo].[KHOHANG] ADD [LoaiKho] NVARCHAR(100) NULL;
END
GO

-- 2. Thêm cột MaKhoHang vào CTPN
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[CTPN]') AND name = 'MaKhoHang')
BEGIN
    ALTER TABLE [dbo].[CTPN] ADD [MaKhoHang] INT NULL;
    ALTER TABLE [dbo].[CTPN] ADD CONSTRAINT FK_CTPN_KHOHANG FOREIGN KEY (MaKhoHang) REFERENCES [dbo].[KHOHANG](MaKhoHang);
END
GO

-- 3. Tạo bảng NHACUNGCAP_SANPHAM
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('[dbo].[NHACUNGCAP_SANPHAM]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[NHACUNGCAP_SANPHAM] (
        [MaNCCSP]    INT PRIMARY KEY IDENTITY(1,1),
        [MaNCC]      INT NOT NULL,
        [MaSanPham]  INT NOT NULL,
        [GiaCungCap] DECIMAL(18,2) NOT NULL,
        [NgayCapNhat] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([MaNCC]) REFERENCES [dbo].[NHACUNGCAP]([MaNhaCungCap]) ON DELETE CASCADE,
        FOREIGN KEY ([MaSanPham]) REFERENCES [dbo].[SANPHAM]([MaSanPham]) ON DELETE CASCADE
    );
END
GO
