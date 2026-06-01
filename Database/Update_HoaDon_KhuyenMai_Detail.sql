-- =========================================================================
-- SQL Update Script: Introduce Intermediate Promotions Detail Table (CHITIET_KHUYENMAI)
-- This script replaces the 1-to-many relationship with a details table.
-- It preserves existing data by migrating it before dropping the old column.
-- =========================================================================

-- 1. Create CHITIET_KHUYENMAI table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CHITIET_KHUYENMAI]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CHITIET_KHUYENMAI] (
        [MaCTKM] INT IDENTITY (1, 1) NOT NULL,
        [MaHoaDon] INT NOT NULL,
        [MaKhuyenMai] INT NOT NULL,
        [SoTienGiam] DECIMAL (18, 2) NOT NULL DEFAULT (0),
        [NgayTao] DATETIME NOT NULL DEFAULT (GETDATE()),
        CONSTRAINT [PK_CHITIET_KHUYENMAI] PRIMARY KEY CLUSTERED ([MaCTKM] ASC),
        CONSTRAINT [FK_CHITIET_KHUYENMAI_HOADON] FOREIGN KEY ([MaHoaDon]) REFERENCES [dbo].[HOADON] ([MaHoaDon]) ON DELETE CASCADE,
        CONSTRAINT [FK_CHITIET_KHUYENMAI_KHUYENMAI] FOREIGN KEY ([MaKhuyenMai]) REFERENCES [dbo].[KHUYENMAI] ([MaKhuyenMai]) ON DELETE CASCADE
    );
    PRINT 'Created intermediate table CHITIET_KHUYENMAI.';
END
ELSE
BEGIN
    PRINT 'Intermediate table CHITIET_KHUYENMAI already exists.';
END

-- 2. Migrate existing promotion associations from HOADON to CHITIET_KHUYENMAI
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HOADON]') AND name = 'MaKhuyenMai')
BEGIN
    -- Only insert if there are records in HOADON that have MaKhuyenMai and don't exist in CHITIET_KHUYENMAI yet
    INSERT INTO [dbo].[CHITIET_KHUYENMAI] ([MaHoaDon], [MaKhuyenMai], [SoTienGiam], [NgayTao])
    SELECT h.[MaHoaDon], h.[MaKhuyenMai], h.[GiamGia], ISNULL(h.[NgayGiao], h.[NgayLap])
    FROM [dbo].[HOADON] h
    WHERE h.[MaKhuyenMai] IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[CHITIET_KHUYENMAI] c 
          WHERE c.[MaHoaDon] = h.[MaHoaDon] AND c.[MaKhuyenMai] = h.[MaKhuyenMai]
      );
    PRINT 'Migrated existing promotion records from HOADON to CHITIET_KHUYENMAI.';

    -- 3. Drop physical foreign key constraint between HOADON and KHUYENMAI
    DECLARE @Sql NVARCHAR(MAX);
    SELECT @Sql = 'ALTER TABLE [dbo].[HOADON] DROP CONSTRAINT ' + name
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('[dbo].[HOADON]')
      AND referenced_object_id = OBJECT_ID('[dbo].[KHUYENMAI]');

    IF @Sql IS NOT NULL
    BEGIN
        EXEC sp_executesql @Sql;
        PRINT 'Dropped physical foreign key constraint between HOADON and KHUYENMAI.';
    END

    -- 4. Drop the MaKhuyenMai column from HOADON
    ALTER TABLE [dbo].[HOADON] DROP COLUMN [MaKhuyenMai];
    PRINT 'Dropped obsolete column MaKhuyenMai from HOADON table.';
END
ELSE
BEGIN
    PRINT 'Obsolete column MaKhuyenMai is already removed from HOADON.';
END
GO
