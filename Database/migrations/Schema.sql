-- =====================================================
-- Building Material Store Management System
-- Database Schema - SQL Server
-- Created: 2026-02-02
-- =====================================================

-- Create Database
CREATE DATABASE [BuildingMaterialDB]
GO

USE [BuildingMaterialDB]
GO

-- =====================================================
-- 1. ROLES AND PERMISSIONS
-- =====================================================

CREATE TABLE [dbo].[Roles] (
    [RoleId] INT PRIMARY KEY IDENTITY(1,1),
    [RoleName] NVARCHAR(100) NOT NULL UNIQUE,
    [Description] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE()
)
GO

CREATE TABLE [dbo].[Permissions] (
    [PermissionId] INT PRIMARY KEY IDENTITY(1,1),
    [PermissionName] NVARCHAR(100) NOT NULL UNIQUE,
    [Description] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE()
)
GO

CREATE TABLE [dbo].[RolePermissions] (
    [RolePermissionId] INT PRIMARY KEY IDENTITY(1,1),
    [RoleId] INT NOT NULL,
    [PermissionId] INT NOT NULL,
    FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles]([RoleId]) ON DELETE CASCADE,
    FOREIGN KEY ([PermissionId]) REFERENCES [dbo].[Permissions]([PermissionId]) ON DELETE CASCADE,
    UNIQUE([RoleId], [PermissionId])
)
GO

-- =====================================================
-- 2. USERS
-- =====================================================

CREATE TABLE [dbo].[Users] (
    [UserId] INT PRIMARY KEY IDENTITY(1,1),
    [Username] NVARCHAR(100) NOT NULL UNIQUE,
    [Email] NVARCHAR(100) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [FullName] NVARCHAR(200) NOT NULL,
    [PhoneNumber] NVARCHAR(20),
    [Address] NVARCHAR(500),
    [RoleId] INT NOT NULL,
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [LastLogin] DATETIME2,
    FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles]([RoleId])
)
GO

-- =====================================================
-- 3. CATEGORIES
-- =====================================================

CREATE TABLE [dbo].[Categories] (
    [CategoryId] INT PRIMARY KEY IDENTITY(1,1),
    [CategoryName] NVARCHAR(200) NOT NULL UNIQUE,
    [Description] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE()
)
GO

-- =====================================================
-- 4. SUPPLIERS
-- =====================================================

CREATE TABLE [dbo].[Suppliers] (
    [SupplierId] INT PRIMARY KEY IDENTITY(1,1),
    [SupplierName] NVARCHAR(200) NOT NULL,
    [ContactPerson] NVARCHAR(200),
    [PhoneNumber] NVARCHAR(20),
    [Email] NVARCHAR(100),
    [Address] NVARCHAR(500),
    [City] NVARCHAR(100),
    [TaxCode] NVARCHAR(50),
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE()
)
GO

-- =====================================================
-- 5. PRODUCTS
-- =====================================================

CREATE TABLE [dbo].[Products] (
    [ProductId] INT PRIMARY KEY IDENTITY(1,1),
    [ProductName] NVARCHAR(300) NOT NULL,
    [SKU] NVARCHAR(50) NOT NULL UNIQUE,
    [CategoryId] INT NOT NULL,
    [Description] NVARCHAR(1000),
    [Unit] NVARCHAR(50),
    [UnitPrice] DECIMAL(18,2) NOT NULL,
    [CostPrice] DECIMAL(18,2),
    [ReorderLevel] INT DEFAULT 10,
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories]([CategoryId])
)
GO

-- =====================================================
-- 6. INVENTORY (STOCK)
-- =====================================================

CREATE TABLE [dbo].[Inventory] (
    [InventoryId] INT PRIMARY KEY IDENTITY(1,1),
    [ProductId] INT NOT NULL,
    [QuantityInStock] INT DEFAULT 0,
    [QuantityReserved] INT DEFAULT 0,
    [AvailableQuantity] INT DEFAULT 0,
    [WarehouseLocation] NVARCHAR(100),
    [LastRestockDate] DATETIME2,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId]),
    UNIQUE([ProductId])
)
GO

-- =====================================================
-- 7. IMPORT ORDERS (NHẬP HÀNG)
-- =====================================================

CREATE TABLE [dbo].[ImportOrders] (
    [ImportOrderId] INT PRIMARY KEY IDENTITY(1,1),
    [ImportCode] NVARCHAR(50) NOT NULL UNIQUE,
    [SupplierId] INT NOT NULL,
    [ImportDate] DATETIME2 DEFAULT GETUTCDATE(),
    [DeliveryDate] DATETIME2,
    [Status] NVARCHAR(50) DEFAULT 'PENDING',
    [TotalAmount] DECIMAL(18,2),
    [Notes] NVARCHAR(1000),
    [CreatedBy] INT NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([SupplierId]) REFERENCES [dbo].[Suppliers]([SupplierId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId])
)
GO

CREATE TABLE [dbo].[ImportOrderDetails] (
    [ImportDetailId] INT PRIMARY KEY IDENTITY(1,1),
    [ImportOrderId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Quantity] INT NOT NULL,
    [UnitPrice] DECIMAL(18,2) NOT NULL,
    [TotalPrice] DECIMAL(18,2),
    [ReceivedQuantity] INT DEFAULT 0,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([ImportOrderId]) REFERENCES [dbo].[ImportOrders]([ImportOrderId]) ON DELETE CASCADE,
    FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId])
)
GO

-- =====================================================
-- 8. CUSTOMERS
-- =====================================================

CREATE TABLE [dbo].[Customers] (
    [CustomerId] INT PRIMARY KEY IDENTITY(1,1),
    [CustomerName] NVARCHAR(200) NOT NULL,
    [CustomerType] NVARCHAR(50),
    [PhoneNumber] NVARCHAR(20),
    [Email] NVARCHAR(100),
    [Address] NVARCHAR(500),
    [City] NVARCHAR(100),
    [TaxCode] NVARCHAR(50),
    [ContactPerson] NVARCHAR(200),
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE()
)
GO

-- =====================================================
-- 9. SALES ORDERS (ĐƠN HÀNG BÁN)
-- =====================================================

CREATE TABLE [dbo].[SalesOrders] (
    [OrderId] INT PRIMARY KEY IDENTITY(1,1),
    [OrderCode] NVARCHAR(50) NOT NULL UNIQUE,
    [CustomerId] INT NOT NULL,
    [OrderDate] DATETIME2 DEFAULT GETUTCDATE(),
    [DeliveryDate] DATETIME2,
    [Status] NVARCHAR(50) DEFAULT 'PENDING',
    [TotalAmount] DECIMAL(18,2),
    [Discount] DECIMAL(18,2) DEFAULT 0,
    [FinalAmount] DECIMAL(18,2),
    [Notes] NVARCHAR(1000),
    [CreatedBy] INT NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customers]([CustomerId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId])
)
GO

CREATE TABLE [dbo].[SalesOrderDetails] (
    [OrderDetailId] INT PRIMARY KEY IDENTITY(1,1),
    [OrderId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Quantity] INT NOT NULL,
    [UnitPrice] DECIMAL(18,2) NOT NULL,
    [TotalPrice] DECIMAL(18,2),
    [Discount] DECIMAL(18,2) DEFAULT 0,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([OrderId]) REFERENCES [dbo].[SalesOrders]([OrderId]) ON DELETE CASCADE,
    FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId])
)
GO

-- =====================================================
-- 10. RETURNS (TRẢ HÀNG)
-- =====================================================

CREATE TABLE [dbo].[Returns] (
    [ReturnId] INT PRIMARY KEY IDENTITY(1,1),
    [ReturnCode] NVARCHAR(50) NOT NULL UNIQUE,
    [OrderId] INT NOT NULL,
    [ReturnDate] DATETIME2 DEFAULT GETUTCDATE(),
    [Status] NVARCHAR(50) DEFAULT 'PENDING',
    [TotalRefund] DECIMAL(18,2),
    [Reason] NVARCHAR(500),
    [Notes] NVARCHAR(1000),
    [CreatedBy] INT NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([OrderId]) REFERENCES [dbo].[SalesOrders]([OrderId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId])
)
GO

CREATE TABLE [dbo].[ReturnDetails] (
    [ReturnDetailId] INT PRIMARY KEY IDENTITY(1,1),
    [ReturnId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Quantity] INT NOT NULL,
    [UnitPrice] DECIMAL(18,2) NOT NULL,
    [TotalPrice] DECIMAL(18,2),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([ReturnId]) REFERENCES [dbo].[Returns]([ReturnId]) ON DELETE CASCADE,
    FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId])
)
GO

-- =====================================================
-- 11. DELIVERIES (GIAO HÀNG)
-- =====================================================

CREATE TABLE [dbo].[Deliveries] (
    [DeliveryId] INT PRIMARY KEY IDENTITY(1,1),
    [DeliveryCode] NVARCHAR(50) NOT NULL UNIQUE,
    [OrderId] INT NOT NULL,
    [DeliveryDate] DATETIME2 DEFAULT GETUTCDATE(),
    [ExpectedDeliveryDate] DATETIME2,
    [ActualDeliveryDate] DATETIME2,
    [Status] NVARCHAR(50) DEFAULT 'PENDING',
    [DeliveryAddress] NVARCHAR(500),
    [Driver] NVARCHAR(200),
    [Notes] NVARCHAR(1000),
    [CreatedBy] INT NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([OrderId]) REFERENCES [dbo].[SalesOrders]([OrderId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId])
)
GO

-- =====================================================
-- 12. PAYMENTS (THANH TOÁN)
-- =====================================================

CREATE TABLE [dbo].[Payments] (
    [PaymentId] INT PRIMARY KEY IDENTITY(1,1),
    [OrderId] INT NOT NULL,
    [PaymentDate] DATETIME2 DEFAULT GETUTCDATE(),
    [Amount] DECIMAL(18,2) NOT NULL,
    [PaymentMethod] NVARCHAR(50),
    [TransactionNumber] NVARCHAR(100),
    [Status] NVARCHAR(50) DEFAULT 'PENDING',
    [Notes] NVARCHAR(500),
    [CreatedBy] INT NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([OrderId]) REFERENCES [dbo].[SalesOrders]([OrderId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId])
)
GO

-- =====================================================
-- 13. PROMOTIONS (KHUYẾN MẠI)
-- =====================================================

CREATE TABLE [dbo].[Promotions] (
    [PromotionId] INT PRIMARY KEY IDENTITY(1,1),
    [PromotionName] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(1000),
    [DiscountPercent] DECIMAL(5,2),
    [DiscountAmount] DECIMAL(18,2),
    [StartDate] DATETIME2,
    [EndDate] DATETIME2,
    [MaxUsage] INT,
    [UsageCount] INT DEFAULT 0,
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE()
)
GO

CREATE TABLE [dbo].[PromotionProducts] (
    [PromotionProductId] INT PRIMARY KEY IDENTITY(1,1),
    [PromotionId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    FOREIGN KEY ([PromotionId]) REFERENCES [dbo].[Promotions]([PromotionId]) ON DELETE CASCADE,
    FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([ProductId]) ON DELETE CASCADE,
    UNIQUE([PromotionId], [ProductId])
)
GO

-- =====================================================
-- 14. RECEIVABLES & PAYABLES (CÔNG NỢ)
-- =====================================================

CREATE TABLE [dbo].[Receivables] (
    [ReceivableId] INT PRIMARY KEY IDENTITY(1,1),
    [CustomerId] INT NOT NULL,
    [OrderId] INT,
    [Amount] DECIMAL(18,2) NOT NULL,
    [AmountPaid] DECIMAL(18,2) DEFAULT 0,
    [AmountDue] DECIMAL(18,2),
    [DueDate] DATETIME2,
    [Status] NVARCHAR(50) DEFAULT 'OUTSTANDING',
    [Notes] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customers]([CustomerId]),
    FOREIGN KEY ([OrderId]) REFERENCES [dbo].[SalesOrders]([OrderId])
)
GO

CREATE TABLE [dbo].[Payables] (
    [PayableId] INT PRIMARY KEY IDENTITY(1,1),
    [SupplierId] INT NOT NULL,
    [ImportOrderId] INT,
    [Amount] DECIMAL(18,2) NOT NULL,
    [AmountPaid] DECIMAL(18,2) DEFAULT 0,
    [AmountDue] DECIMAL(18,2),
    [DueDate] DATETIME2,
    [Status] NVARCHAR(50) DEFAULT 'OUTSTANDING',
    [Notes] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([SupplierId]) REFERENCES [dbo].[Suppliers]([SupplierId]),
    FOREIGN KEY ([ImportOrderId]) REFERENCES [dbo].[ImportOrders]([ImportOrderId])
)
GO

-- =====================================================
-- 15. REPORTS (BÁO CÁO)
-- =====================================================

CREATE TABLE [dbo].[Reports] (
    [ReportId] INT PRIMARY KEY IDENTITY(1,1),
    [ReportType] NVARCHAR(100) NOT NULL,
    [ReportName] NVARCHAR(300) NOT NULL,
    [ReportDate] DATETIME2 DEFAULT GETUTCDATE(),
    [GeneratedBy] INT NOT NULL,
    [Content] NVARCHAR(MAX),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([GeneratedBy]) REFERENCES [dbo].[Users]([UserId])
)
GO

-- =====================================================
-- 16. AUDIT LOG
-- =====================================================

CREATE TABLE [dbo].[AuditLogs] (
    [AuditId] INT PRIMARY KEY IDENTITY(1,1),
    [UserId] INT NOT NULL,
    [Action] NVARCHAR(200) NOT NULL,
    [TableName] NVARCHAR(100),
    [RecordId] INT,
    [OldValues] NVARCHAR(MAX),
    [NewValues] NVARCHAR(MAX),
    [Timestamp] DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([UserId])
)
GO

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX [IX_Users_RoleId] ON [dbo].[Users]([RoleId])
GO

CREATE INDEX [IX_Products_CategoryId] ON [dbo].[Products]([CategoryId])
GO

CREATE INDEX [IX_Inventory_ProductId] ON [dbo].[Inventory]([ProductId])
GO

CREATE INDEX [IX_ImportOrders_SupplierId] ON [dbo].[ImportOrders]([SupplierId])
GO

CREATE INDEX [IX_ImportOrders_Status] ON [dbo].[ImportOrders]([Status])
GO

CREATE INDEX [IX_SalesOrders_CustomerId] ON [dbo].[SalesOrders]([CustomerId])
GO

CREATE INDEX [IX_SalesOrders_Status] ON [dbo].[SalesOrders]([Status])
GO

CREATE INDEX [IX_Returns_OrderId] ON [dbo].[Returns]([OrderId])
GO

CREATE INDEX [IX_Deliveries_OrderId] ON [dbo].[Deliveries]([OrderId])
GO

CREATE INDEX [IX_Deliveries_Status] ON [dbo].[Deliveries]([Status])
GO

CREATE INDEX [IX_Payments_OrderId] ON [dbo].[Payments]([OrderId])
GO

CREATE INDEX [IX_Receivables_CustomerId] ON [dbo].[Receivables]([CustomerId])
GO

CREATE INDEX [IX_AuditLogs_UserId] ON [dbo].[AuditLogs]([UserId])
GO

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert Roles
INSERT INTO [dbo].[Roles] ([RoleName], [Description]) VALUES 
    (N'Admin', N'Administrator - Full system access'),
    (N'Manager', N'Manager - Warehouse and sales management'),
    (N'Staff', N'Staff - Warehouse and sales employee'),
    (N'Customer', N'Customer - Customer account')
GO

-- Insert Permissions
INSERT INTO [dbo].[Permissions] ([PermissionName], [Description]) VALUES 
    ('USER_MANAGE', 'Manage users'),
    ('PRODUCT_MANAGE', 'Manage products'),
    ('ORDER_MANAGE', 'Manage orders'),
    ('INVENTORY_MANAGE', 'Manage inventory'),
    ('DELIVERY_MANAGE', 'Manage deliveries'),
    ('PAYMENT_MANAGE', 'Manage payments'),
    ('REPORT_VIEW', 'View reports'),
    ('REPORT_GENERATE', 'Generate reports'),
    ('SETTINGS', 'System settings')
GO

-- Insert Categories
INSERT INTO [dbo].[Categories] ([CategoryName], [Description]) VALUES 
    (N'Vật liệu xây dựng', N'Nguyên liệu xây dựng chính'),
    (N'Xi măng', N'Xi măng các loại'),
    (N'Cát đá', N'Cát, đá xây dựng'),
    (N'Sắt thép', N'Sắt thép xây dựng'),
    (N'Gạch ngói', N'Gạch, ngói các loại'),
    (N'Kính', N'Kính xây dựng'),
    (N'Phụ kiện', N'Phụ kiện xây dựng khác')
GO

-- Insert default Admin user (password: admin123)
INSERT INTO [dbo].[Users] ([Username], [Email], [PasswordHash], [FullName], [PhoneNumber], [RoleId]) VALUES 
    (N'admin', N'admin@buildsystem.com', 
    N'$2a$11$K2n9Q9RKbgT6L7Z2q4Y8wuK9z8X7W6V5U4T3S2R1Q0P9O8N7M6L5',
    N'Administrator', N'0123456789', 1)
GO

PRINT 'Database schema created successfully!'
