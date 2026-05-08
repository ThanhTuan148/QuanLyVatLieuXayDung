-- Migration: Add FlashSales and FlashSaleItems tables and sample seed data
-- Run this script in the BuildingMaterialDB database (SSMS or sqlcmd)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FlashSales')
BEGIN
    CREATE TABLE [dbo].[FlashSales] (
        [FlashSaleId] INT PRIMARY KEY IDENTITY(1,1),
        [Title] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(500),
        [StartTime] DATETIME2 NOT NULL,
        [EndTime] DATETIME2 NOT NULL,
        [IsActive] BIT DEFAULT 1,
        [CreatedDate] DATETIME2 DEFAULT GETUTCDATE(),
        [UpdatedDate] DATETIME2 NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FlashSaleItems')
BEGIN
    CREATE TABLE [dbo].[FlashSaleItems] (
        [FlashSaleItemId] INT PRIMARY KEY IDENTITY(1,1),
        [FlashSaleId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [SalePrice] DECIMAL(10,2) NOT NULL,
        [DiscountPercentage] DECIMAL(5,2) NOT NULL,
        [Quantity] INT NOT NULL,
        [SoldQuantity] INT DEFAULT 0,
        [CreatedDate] DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY ([FlashSaleId]) REFERENCES [dbo].[FlashSales]([FlashSaleId]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId]) ON DELETE CASCADE
    );
END

-- Seed sample promotion and flash sale if not present
IF NOT EXISTS (SELECT 1 FROM [dbo].[Promotions])
BEGIN
    INSERT INTO [dbo].[Promotions] ([PromotionName], [Description], [DiscountPercent], [StartDate], [EndDate], [IsActive])
    VALUES (N'Sample New Year Promo', N'Sample promotion inserted by migration', 10.00, DATEADD(day, -7, GETUTCDATE()), DATEADD(day, 30, GETUTCDATE()), 1);

    DECLARE @promoId INT = SCOPE_IDENTITY();

    -- link to first product if available
    DECLARE @firstProductId INT = (SELECT TOP 1 [ProductId] FROM [dbo].[Products]);
    IF @firstProductId IS NOT NULL
    BEGIN
        INSERT INTO [dbo].[PromotionProducts] ([PromotionId], [ProductId]) VALUES (@promoId, @firstProductId);
    END
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[FlashSales])
BEGIN
    INSERT INTO [dbo].[FlashSales] ([Title], [Description], [StartTime], [EndTime], [IsActive])
    VALUES (N'Sample Flash Sale', N'Sample flash sale from migration', DATEADD(hour, -1, GETUTCDATE()), DATEADD(day, 2, GETUTCDATE()), 1);

    DECLARE @flashId INT = SCOPE_IDENTITY();
    DECLARE @firstProductId2 INT = (SELECT TOP 1 [ProductId] FROM [dbo].[Products]);
    IF @firstProductId2 IS NOT NULL
    BEGIN
        INSERT INTO [dbo].[FlashSaleItems] ([FlashSaleId], [ProductId], [SalePrice], [DiscountPercentage], [Quantity])
        VALUES (@flashId, @firstProductId2, (SELECT TOP 1 UnitPrice * 0.8 FROM [dbo].[Products] WHERE ProductId = @firstProductId2), 20.0, 50);
    END
END

PRINT 'Migration add_flashsale_and_seed.sql completed.';
