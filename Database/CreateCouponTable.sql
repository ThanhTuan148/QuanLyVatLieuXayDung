USE [QuanLyVLXD]
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'COUPON')
BEGIN
    CREATE TABLE [dbo].[COUPON] (
        [MaCoupon]       INT PRIMARY KEY IDENTITY(1,1),
        [MaCP]           AS ('CP' + RIGHT('000' + CAST([MaCoupon] AS VARCHAR(10)), 3)) PERSISTED UNIQUE,
        [Code]           NVARCHAR(50) NOT NULL UNIQUE,
        [LoaiCoupon]     NVARCHAR(20) NOT NULL, -- 'PhanTram' or 'SoTien'
        [GiaTriGiam]     DECIMAL(18, 2) NOT NULL,
        [DonHangToiThieu] DECIMAL(18, 2) DEFAULT 0,
        [GiamToiDa]      DECIMAL(18, 2) NULL,
        [NgayBatDau]     DATETIME2 NOT NULL,
        [NgayKetThuc]    DATETIME2 NOT NULL,
        [SoLanDungToiDa] INT NULL,
        [SoLanDaDung]    INT DEFAULT 0,
        [TrangThai]      BIT DEFAULT 1,
        [NgayTao]        DATETIME2 DEFAULT GETDATE(),
        [NgayCapNhat]    DATETIME2 DEFAULT GETDATE()
    )
END
GO
