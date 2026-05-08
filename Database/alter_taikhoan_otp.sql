-- Alter table TAIKHOAN to add ResetOTP and OTPExpiry columns
IF COL_LENGTH('TAIKHOAN', 'ResetOTP') IS NULL
BEGIN
    ALTER TABLE TAIKHOAN
    ADD ResetOTP NVARCHAR(10) NULL,
        OTPExpiry DATETIME NULL;
    PRINT 'Đã thêm thành công ResetOTP và OTPExpiry vào bảng TAIKHOAN.';
END
ELSE
BEGIN
    PRINT 'Bảng TAIKHOAN đã có sẵn cột ResetOTP.';
END
