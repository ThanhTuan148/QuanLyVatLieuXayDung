-- 1. Tạo bảng chính: PHIEUTRAHANG_NCC
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PHIEUTRAHANG_NCC' and xtype='U')
BEGIN
    CREATE TABLE PHIEUTRAHANG_NCC (
        MaPhieuTra INT IDENTITY(1,1) PRIMARY KEY, -- Khóa chính tự tăng
        MaPT VARCHAR(50) NOT NULL,                -- Mã hiển thị (VD: PT20240404...)
        MaPhieuNhap INT NOT NULL,                 -- Liên kết tới Phiếu Nhập bị lỗi/thiếu
        MaNhanVien INT NOT NULL,                  -- Nhân viên thực hiện trả hàng
        NgayTra DATETIME DEFAULT GETDATE(),       -- Ngày lập phiếu
        TongTienHoan DECIMAL(18,0) DEFAULT 0,     -- Tổng số tiền NCC phải bù/hoàn
        LyDo NVARCHAR(MAX),                       -- Lý do trả hàng (VD: Hàng vỡ, giao thiếu...)
        GhiChu NVARCHAR(MAX),                     -- Ghi chú thêm
        TrangThai NVARCHAR(100),                  -- Trạng thái: Chờ Duyệt Trả, Đã Xong
        NgayTao DATETIME DEFAULT GETDATE(),
        NgayCapNhat DATETIME DEFAULT GETDATE()
    );
END
GO
-- 2. Tạo bảng chi tiết: CT_PHIEUTRAHANG_NCC
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CT_PHIEUTRAHANG_NCC' and xtype='U')
BEGIN
    CREATE TABLE CT_PHIEUTRAHANG_NCC (
        MaCTPT INT IDENTITY(1,1) PRIMARY KEY,
        MaPhieuTra INT NOT NULL,                  -- Liên kết tới Phiếu trả gốc
        MaSanPham INT NOT NULL,                   -- Sản phẩm trả lại
        SoLuongTra INT NOT NULL,                  -- Số lượng thực tế trả
        DonGia DECIMAL(18,0) NOT NULL,            -- Giá nhập tại thời điểm trả
        ThanhTien DECIMAL(18,0)                   -- Thành tiền của món hàng trả
    );
END
GO
-- 3. Thiết lập Ràng buộc Khóa ngoại (Dây nối sơ đồ)
-- Nối Phiếu trả sang Phiếu nhập gốc
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PhieuTraNCC_PhieuNhap')
    ALTER TABLE PHIEUTRAHANG_NCC ADD CONSTRAINT FK_PhieuTraNCC_PhieuNhap 
    FOREIGN KEY (MaPhieuNhap) REFERENCES PHIEUNHAP(MaPhieuNhap);
-- Nối Phiếu trả sang Nhân viên thực hiện
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PhieuTraNCC_NhanVien')
    ALTER TABLE PHIEUTRAHANG_NCC ADD CONSTRAINT FK_PhieuTraNCC_NhanVien 
    FOREIGN KEY (MaNhanVien) REFERENCES NHANVIEN(MaNhanVien);
-- Nối Chi tiết sang Phiếu trả đầu mục
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CTPhieuTraNCC_PhieuTra')
    ALTER TABLE CT_PHIEUTRAHANG_NCC ADD CONSTRAINT FK_CTPhieuTraNCC_PhieuTra 
    FOREIGN KEY (MaPhieuTra) REFERENCES PHIEUTRAHANG_NCC(MaPhieuTra);
-- Nối Chi tiết sang danh mục Sản Phẩm
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CTPhieuTraNCC_SanPham')
    ALTER TABLE CT_PHIEUTRAHANG_NCC ADD CONSTRAINT FK_CTPhieuTraNCC_SanPham 
    FOREIGN KEY (MaSanPham) REFERENCES SANPHAM(MaSanPham);
GO
PRINT 'Successfully created return tables and relationships!';