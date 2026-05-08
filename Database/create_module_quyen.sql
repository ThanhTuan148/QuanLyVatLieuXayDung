-- Chạy script này trong SQL Server Management Studio
-- để tạo bảng phân quyền danh mục cho nhân viên

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NHANVIEN_MODULE_QUYEN')
BEGIN
    CREATE TABLE NHANVIEN_MODULE_QUYEN (
        Id            INT IDENTITY(1,1) PRIMARY KEY,
        MaNhanVien    INT NOT NULL,
        Module        NVARCHAR(50) NOT NULL,
        TenModule     NVARCHAR(100) NOT NULL,
        CoTheXem      BIT NOT NULL DEFAULT 0,
        CoTheTao      BIT NOT NULL DEFAULT 0,
        CoTheSua      BIT NOT NULL DEFAULT 0,
        CoTheXoa      BIT NOT NULL DEFAULT 0,
        NgayCapNhat   DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_NHANVIEN_MODULE_QUYEN_NV
            FOREIGN KEY (MaNhanVien) REFERENCES NHANVIEN(MaNhanVien)
            ON DELETE CASCADE
    );
    PRINT 'Tạo bảng NHANVIEN_MODULE_QUYEN thành công!';
END
ELSE
BEGIN
    PRINT 'Bảng NHANVIEN_MODULE_QUYEN đã tồn tại.';
END
