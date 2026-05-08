USE [QLCH_VLXD_2];
GO

-- 1. Cập nhật bảng Kho Hàng (Thêm Loại Kho)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[KHOHANG]') AND name = 'LoaiKho')
BEGIN
    ALTER TABLE [dbo].[KHOHANG] ADD [LoaiKho] NVARCHAR(100) NULL;
END
GO

-- 2. Cập nhật chi tiết phiếu nhập (Thêm liên kết Kho)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[CTPN]') AND name = 'MaKhoHang')
BEGIN
    ALTER TABLE [dbo].[CTPN] ADD [MaKhoHang] INT NULL;
    ALTER TABLE [dbo].[CTPN] ADD CONSTRAINT FK_CTPN_KHOHANG FOREIGN KEY (MaKhoHang) REFERENCES [dbo].[KHOHANG](MaKhoHang);
END
GO

-- 3. Tạo bảng trung gian Nhà Cung Cấp - Sản Phẩm (Mối quan hệ N-N)
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

-- 4. Khởi tạo dữ liệu Mapping mẫu (Liên kết tất cả SP cho tất cả NCC)
-- Việc này giúp hệ thống có dữ liệu để hiển thị trong bảng so sánh giá
DELETE FROM [dbo].[NHACUNGCAP_SANPHAM];
INSERT INTO [dbo].[NHACUNGCAP_SANPHAM] (MaNCC, MaSanPham, GiaCungCap, NgayCapNhat)
SELECT n.MaNhaCungCap, s.MaSanPham, COALESCE(s.GiaNhap, s.GiaBan * 0.8), GETDATE()
FROM [dbo].[NHACUNGCAP] n
CROSS JOIN [dbo].[SANPHAM] s;
GO
