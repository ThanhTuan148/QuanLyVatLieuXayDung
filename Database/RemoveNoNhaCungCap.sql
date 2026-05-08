SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

BEGIN TRANSACTION;
GO

DELETE FROM [CONGNO] WHERE [LoaiCongNo] = N'Phải trả';
GO

ALTER TABLE [CHITETTRANO] DROP CONSTRAINT IF EXISTS [FK_CHITETTRANO_PHIEUNHAP_MaPhieuNhap];
ALTER TABLE [CONGNO] DROP CONSTRAINT IF EXISTS [FK_CONGNO_NHACUNGCAP_MaNhaCungCap];
ALTER TABLE [CONGNO] DROP CONSTRAINT IF EXISTS [FK__CONGNO__MaNhaCun__6CD828CA];
ALTER TABLE [CONGNO] DROP CONSTRAINT IF EXISTS [FK_CONGNO_PHIEUNHAP_MaPhieuNhap];
GO

DROP INDEX IF EXISTS [IX_CONGNO_MaNhaCungCap] ON [CONGNO];
DROP INDEX IF EXISTS [IX_CONGNO_NCC] ON [CONGNO];
DROP INDEX IF EXISTS [IX_CONGNO_MaPhieuNhap] ON [CONGNO];
DROP INDEX IF EXISTS [IX_CHITETTRANO_MaPhieuNhap] ON [CHITETTRANO];
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CONGNO]') AND [c].[name] = N'MaNhaCungCap');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [CONGNO] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [CONGNO] DROP COLUMN IF EXISTS [MaNhaCungCap];
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CONGNO]') AND [c].[name] = N'MaPhieuNhap');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [CONGNO] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [CONGNO] DROP COLUMN IF EXISTS [MaPhieuNhap];
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CHITETTRANO]') AND [c].[name] = N'MaPhieuNhap');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [CHITETTRANO] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [CHITETTRANO] DROP COLUMN IF EXISTS [MaPhieuNhap];
GO

COMMIT;
GO
