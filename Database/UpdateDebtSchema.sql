-- Migration for Debt Management System
-- Run this script to update the database schema for UC17, UC07, UC08, UC09

-- 1. Update CONGNO table
ALTER TABLE CONGNO ADD MaPhieuNhap INT NULL;
-- Add FK for MaPhieuNhap in CONGNO (optional if using EF handle)
-- ALTER TABLE CONGNO ADD CONSTRAINT FK_CongNo_PhieuNhap FOREIGN KEY (MaPhieuNhap) REFERENCES PHIEUNHAP(MaPhieuNhap);

-- 2. Update PHIEUNHAP table
ALTER TABLE PHIEUNHAP ADD ThanhToan DECIMAL(18, 2) NULL;

-- 3. Update CHITETTRANO table
-- Note: Making MaHoaDon nullable and adding MaPhieuNhap, MaCongNo
ALTER TABLE CHITETTRANO ALTER COLUMN MaHoaDon INT NULL;
ALTER TABLE CHITETTRANO ADD MaPhieuNhap INT NULL;
ALTER TABLE CHITETTRANO ADD MaCongNo INT NOT NULL;

-- Add FK for MaCongNo in CHITETTRANO
-- ALTER TABLE CHITETTRANO ADD CONSTRAINT FK_ChiTietTraNo_CongNo FOREIGN KEY (MaCongNo) REFERENCES CONGNO(MaCongNo);
