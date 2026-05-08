DECLARE @ConstraintName nvarchar(200);

-- Find and drop Default Constraint on MaSanPham if exists
SELECT @ConstraintName = Name FROM sys.default_constraints
WHERE parent_object_id = OBJECT_ID('BAOGIA') 
AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('BAOGIA') AND name = 'MaSanPham');

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE BAOGIA DROP CONSTRAINT ' + @ConstraintName);

-- Find and drop Foreign Key Constraint on MaSanPham
SELECT @ConstraintName = f.name 
FROM sys.foreign_keys f
INNER JOIN sys.foreign_key_columns fc ON f.object_id = fc.constraint_object_id
WHERE f.parent_object_id = OBJECT_ID('BAOGIA') 
AND fc.parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('BAOGIA') AND name = 'MaSanPham');

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE BAOGIA DROP CONSTRAINT ' + @ConstraintName);

-- Find and drop Default Constraint on GiaBan
SELECT @ConstraintName = Name FROM sys.default_constraints
WHERE parent_object_id = OBJECT_ID('BAOGIA') 
AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('BAOGIA') AND name = 'GiaBan');

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE BAOGIA DROP CONSTRAINT ' + @ConstraintName);

-- Find and drop Check Constraint on GiaBan
SELECT @ConstraintName = chk.name 
FROM sys.check_constraints chk
WHERE chk.parent_object_id = OBJECT_ID('BAOGIA') 
AND chk.parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('BAOGIA') AND name = 'GiaBan');

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE BAOGIA DROP CONSTRAINT ' + @ConstraintName);

-- Now drop columns
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('BAOGIA') AND name = 'MaSanPham')
    ALTER TABLE BAOGIA DROP COLUMN MaSanPham;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('BAOGIA') AND name = 'GiaBan')
    ALTER TABLE BAOGIA DROP COLUMN GiaBan;

-- Ensure CTBAOGIA table exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CTBAOGIA]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CTBAOGIA] (
        [MaCTBG] INT IDENTITY(1,1) PRIMARY KEY,
        [MaBaoGia] INT NOT NULL,
        [MaSanPham] INT NOT NULL,
        [SoLuong] INT NOT NULL,
        [DonGia] DECIMAL(18,2) NOT NULL,
        [ThanhTien] DECIMAL(18,2) NULL,
        [GhiChu] NVARCHAR(500) NULL,
        [NgayTao] DATETIME NOT NULL DEFAULT GETDATE()
    );

    ALTER TABLE [dbo].[CTBAOGIA] ADD CONSTRAINT [FK_CTBAOGIA_BAOGIA] FOREIGN KEY([MaBaoGia]) REFERENCES [dbo].[BAOGIA] ([MaBaoGia]) ON DELETE CASCADE;
    ALTER TABLE [dbo].[CTBAOGIA] ADD CONSTRAINT [FK_CTBAOGIA_SANPHAM] FOREIGN KEY([MaSanPham]) REFERENCES [dbo].[SANPHAM] ([MaSP]);
END
