-- Script to add Avatar, Gender, and Identity Card fields to KHACHHANG table
-- Run this if the EF migrations fail or if you are seting up the DB manually

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KHACHHANG') AND name = 'AnhDaiDien')
BEGIN
    ALTER TABLE KHACHHANG ADD AnhDaiDien nvarchar(max) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KHACHHANG') AND name = 'GioiTinh')
BEGIN
    ALTER TABLE KHACHHANG ADD GioiTinh nvarchar(max) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('KHACHHANG') AND name = 'CCCD')
BEGIN
    ALTER TABLE KHACHHANG ADD CCCD nvarchar(max) NULL;
END
GO
