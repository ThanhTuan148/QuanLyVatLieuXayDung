USE [QLCH_VLXD_2]
GO

CREATE TABLE [dbo].[THONGBAO] (
    [MaThongBao] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TieuDe] NVARCHAR(255) NOT NULL,
    [NoiDung] NVARCHAR(MAX) NOT NULL,
    [NgayTao] DATETIME DEFAULT GETDATE(),
    [LoaiThongBao] NVARCHAR(50), -- 'HeThong', 'DonHang', 'KhuyenMai'
    [MaNguoiNhan] NVARCHAR(50) NULL, -- NULL nghĩa là thông báo chung cho tất cả
    [DaDoc] BIT DEFAULT 0,
    [LienKet] NVARCHAR(255) NULL -- Đường dẫn để nhấn vào chuyển trang (ví dụ: /orders/1)
);

CREATE INDEX [IX_THONGBAO_NguoiNhan] ON [dbo].[THONGBAO] ([MaNguoiNhan], [NgayTao] DESC);
GO
