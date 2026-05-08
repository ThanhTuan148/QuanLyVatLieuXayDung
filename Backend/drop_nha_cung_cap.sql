BEGIN TRANSACTION;
GO

ALTER TABLE [CHITETTRANO] DROP CONSTRAINT [FK_CHITETTRANO_PHIEUNHAP_MaPhieuNhap];
GO

ALTER TABLE [CONGNO] DROP CONSTRAINT [FK_CONGNO_NHACUNGCAP_MaNhaCungCap];
GO

ALTER TABLE [CONGNO] DROP CONSTRAINT [FK_CONGNO_PHIEUNHAP_MaPhieuNhap];
GO

DROP INDEX [IX_CONGNO_MaNhaCungCap] ON [CONGNO];
GO

DROP INDEX [IX_CONGNO_MaPhieuNhap] ON [CONGNO];
GO

DROP INDEX [IX_CHITETTRANO_MaPhieuNhap] ON [CHITETTRANO];
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CONGNO]') AND [c].[name] = N'MaNhaCungCap');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [CONGNO] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [CONGNO] DROP COLUMN [MaNhaCungCap];
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CONGNO]') AND [c].[name] = N'MaPhieuNhap');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [CONGNO] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [CONGNO] DROP COLUMN [MaPhieuNhap];
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CHITETTRANO]') AND [c].[name] = N'MaPhieuNhap');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [CHITETTRANO] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [CHITETTRANO] DROP COLUMN [MaPhieuNhap];
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260412092250_RemoveNoNhaCungCap', N'8.0.0');
GO

COMMIT;
GO

