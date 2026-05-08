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
