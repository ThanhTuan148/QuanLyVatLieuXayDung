
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Optimize SANPHAM table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SANPHAM_TrangThai_IsGift' AND object_id = OBJECT_ID('SANPHAM'))
    CREATE INDEX IX_SANPHAM_TrangThai_IsGift ON SANPHAM (TrangThai, IsGift);

-- Optimize KHUYENMAI table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KHUYENMAI_TrangThai_Dates' AND object_id = OBJECT_ID('KHUYENMAI'))
    CREATE INDEX IX_KHUYENMAI_TrangThai_Dates ON KHUYENMAI (TrangThai, ThoiGianBatDau, ThoiGianKetThuc);

-- Optimize CTKHOHANG table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CTKHOHANG_MaSanPham_MaKhoHang' AND object_id = OBJECT_ID('CTKHOHANG'))
    CREATE INDEX IX_CTKHOHANG_MaSanPham_MaKhoHang ON CTKHOHANG (MaSanPham, MaKhoHang);

-- Optimize HOADON table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HOADON_TrangThai' AND object_id = OBJECT_ID('HOADON'))
    CREATE INDEX IX_HOADON_TrangThai ON HOADON (TrangThai);

-- Optimize PHIEUNHAP table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PHIEUNHAP_TrangThai' AND object_id = OBJECT_ID('PHIEUNHAP'))
    CREATE INDEX IX_PHIEUNHAP_TrangThai ON PHIEUNHAP (TrangThai);
