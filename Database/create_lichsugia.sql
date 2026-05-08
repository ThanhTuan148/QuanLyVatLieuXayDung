-- ============================================================
-- FILE SQL: TẠO BẢNG LICHSUGIA (Lịch sử biến động giá SP)
-- Database: QLCH_VLXD_2
-- Tác giả: Hệ thống Quản Lý Vật Liệu Xây Dựng
-- Ngày tạo: 2026-04-27
-- ============================================================

USE [QLCH_VLXD_2];
GO

-- ============================================================
-- 1. TẠO BẢNG LICHSUGIA
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'LICHSUGIA'
)
BEGIN
    CREATE TABLE [dbo].[LICHSUGIA] (
        [MaLSG]         INT             IDENTITY(1,1)   NOT NULL,
        [MaSanPham]     INT                             NOT NULL,
        [GiaBanCu]      DECIMAL(18, 2)                  NULL,
        [GiaBanMoi]     DECIMAL(18, 2)                  NOT NULL,
        [GiaNhapCu]     DECIMAL(18, 2)                  NULL,
        [GiaNhapMoi]    DECIMAL(18, 2)                  NULL,
        [LyDo]          NVARCHAR(500)                   NULL,
        [NguonThayDoi]  NVARCHAR(100)                   NULL,   -- "Cập nhật sản phẩm", "Nhập hàng", "Thủ công"...
        [NgayThayDoi]   DATETIME        NOT NULL        DEFAULT GETDATE(),
        [MaNhanVien]    INT                             NULL,

        -- Khoá chính
        CONSTRAINT [PK_LICHSUGIA] PRIMARY KEY CLUSTERED ([MaLSG] ASC),

        -- Khoá ngoại → SANPHAM
        CONSTRAINT [FK_LICHSUGIA_SANPHAM]
            FOREIGN KEY ([MaSanPham])
            REFERENCES [dbo].[SANPHAM] ([MaSanPham]),

        -- Khoá ngoại → NHANVIEN (cho phép NULL = do hệ thống tự ghi)
        CONSTRAINT [FK_LICHSUGIA_NHANVIEN]
            FOREIGN KEY ([MaNhanVien])
            REFERENCES [dbo].[NHANVIEN] ([MaNhanVien])
    );

    PRINT '>>> Đã tạo bảng LICHSUGIA thành công.';
END
ELSE
BEGIN
    PRINT '>>> Bảng LICHSUGIA đã tồn tại, bỏ qua bước tạo.';
END
GO

-- ============================================================
-- 2. TẠO INDEX ĐỂ TĂNG TỐC TRUY VẤN THEO SẢN PHẨM VÀ NGÀY
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.LICHSUGIA') AND name = 'IX_LICHSUGIA_MaSanPham_NGay'
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_LICHSUGIA_MaSanPham_NGay]
    ON [dbo].[LICHSUGIA] ([MaSanPham] ASC, [NgayThayDoi] DESC);

    PRINT '>>> Đã tạo index IX_LICHSUGIA_MaSanPham_NGay.';
END
GO

-- ============================================================
-- 3. DỮ LIỆU MẪU (tuỳ chọn — xoá nếu đã có dữ liệu thật)
-- ============================================================
-- Bỏ comment (<-- xoá dấu /* và */) để chèn dữ liệu mẫu

/*
-- Kiểm tra có sản phẩm ID = 1 không trước khi chèn
IF EXISTS (SELECT 1 FROM SANPHAM WHERE MaSanPham = 1)
BEGIN
    INSERT INTO [dbo].[LICHSUGIA]
        (MaSanPham, GiaBanCu, GiaBanMoi, GiaNhapCu, GiaNhapMoi, LyDo, NguonThayDoi, NgayThayDoi)
    VALUES
        (1, 85000, 90000, 70000, 75000, N'Điều chỉnh giá theo thị trường', N'Cập nhật sản phẩm', DATEADD(DAY, -60, GETDATE())),
        (1, 90000, 88000, 75000, 73000, N'Khuyến mãi cuối tháng',          N'Khuyến mãi',        DATEADD(DAY, -30, GETDATE())),
        (1, 88000, 95000, 73000, 79000, N'Giá nguyên liệu đầu vào tăng',   N'Cập nhật sản phẩm', DATEADD(DAY, -10, GETDATE()));

    PRINT '>>> Đã chèn 3 bản ghi mẫu cho sản phẩm ID=1.';
END
ELSE
    PRINT '>>> Không tìm thấy sản phẩm ID=1, bỏ qua chèn dữ liệu mẫu.';
*/
GO

-- ============================================================
-- 4. VIEW TIỆN ÍCH: XEM BIẾN ĐỘNG GIÁ KÈM TÊN SẢN PHẨM
-- ============================================================
IF OBJECT_ID('dbo.vw_LichSuGia', 'V') IS NOT NULL
    DROP VIEW [dbo].[vw_LichSuGia];
GO

CREATE VIEW [dbo].[vw_LichSuGia] AS
SELECT
    lsg.MaLSG,
    lsg.MaSanPham,
    sp.MaSP,
    sp.TenSP,
    lsg.GiaBanCu,
    lsg.GiaBanMoi,
    CASE
        WHEN lsg.GiaBanCu IS NULL OR lsg.GiaBanCu = 0 THEN NULL
        ELSE ROUND((lsg.GiaBanMoi - lsg.GiaBanCu) / lsg.GiaBanCu * 100, 2)
    END                                         AS PhanTramThayDoi,
    CASE
        WHEN lsg.GiaBanMoi > ISNULL(lsg.GiaBanCu, 0) THEN N'Tăng'
        WHEN lsg.GiaBanMoi < ISNULL(lsg.GiaBanCu, 0) THEN N'Giảm'
        ELSE N'Không đổi'
    END                                         AS XuHuong,
    lsg.GiaNhapCu,
    lsg.GiaNhapMoi,
    lsg.LyDo,
    lsg.NguonThayDoi,
    lsg.NgayThayDoi,
    nv.TenNV                                    AS TenNhanVien
FROM [dbo].[LICHSUGIA]   lsg
JOIN [dbo].[SANPHAM]     sp  ON sp.MaSanPham = lsg.MaSanPham
LEFT JOIN [dbo].[NHANVIEN] nv ON nv.MaNhanVien = lsg.MaNhanVien;
GO

PRINT '>>> Đã tạo view vw_LichSuGia thành công.';
GO

-- ============================================================
-- 5. STORED PROCEDURE: LẤY LỊCH SỬ GIÁ CỦA 1 SẢN PHẨM
-- ============================================================
IF OBJECT_ID('dbo.sp_GetLichSuGia', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[sp_GetLichSuGia];
GO

CREATE PROCEDURE [dbo].[sp_GetLichSuGia]
    @MaSanPham  INT,
    @SoNgay     INT = 90        -- Mặc định lấy 90 ngày gần nhất
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1000
        MaLSG, MaSP, TenSP,
        GiaBanCu, GiaBanMoi, PhanTramThayDoi, XuHuong,
        GiaNhapCu, GiaNhapMoi,
        LyDo, NguonThayDoi, NgayThayDoi, TenNhanVien
    FROM [dbo].[vw_LichSuGia]
    WHERE MaSanPham = @MaSanPham
      AND NgayThayDoi >= DATEADD(DAY, -@SoNgay, GETDATE())
    ORDER BY NgayThayDoi DESC;
END;
GO

PRINT '>>> Đã tạo stored procedure sp_GetLichSuGia thành công.';
GO

-- ============================================================
-- KIỂM TRA NHANH
-- ============================================================
-- EXEC dbo.sp_GetLichSuGia @MaSanPham = 1, @SoNgay = 180;
-- SELECT * FROM vw_LichSuGia ORDER BY NgayThayDoi DESC;

PRINT '============================================================';
PRINT '  Thiết lập bảng LICHSUGIA hoàn tất!';
PRINT '============================================================';
