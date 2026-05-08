-- Cập nhật cấu trúc bảng HOADON
-- Bổ sung các trường lưu thông tin Giao Hàng và Xuất Hóa Đơn (VAT) 
-- Phục vụ cho chức năng Đặt Hàng (Checkout) của khách hàng

SET QUOTED_IDENTIFIER ON; 
SET ANSI_NULLS ON; 

-- Cho phép MaNhanVien mang giá trị NULL (vì đơn hàng khách tự đặt lúc đầu chưa có nhân viên xử lý)
ALTER TABLE HOADON ALTER COLUMN MaNhanVien INT NULL;

-- Thêm các cột thông tin mới
ALTER TABLE HOADON ADD 
    -- Delivery Info (Thông tin giao hàng)
    TenNguoiNhan NVARCHAR(255) NULL, 
    SdtNguoiNhan VARCHAR(20) NULL, 
    EmailNguoiNhan VARCHAR(255) NULL, 
    DiaChiGiaoHang NVARCHAR(1000) NULL, 
    
    -- VAT Info (Thông tin xuất hóa đơn đỏ)
    YeuCauVat BIT NOT NULL DEFAULT 0, 
    VatType VARCHAR(50) NULL, 
    VatBuyerName NVARCHAR(255) NULL, 
    VatEmail VARCHAR(255) NULL, 
    VatAddress NVARCHAR(1000) NULL, 
    VatIdCard VARCHAR(50) NULL, 
    VatPassport VARCHAR(50) NULL, 
    VatCompanyName NVARCHAR(500) NULL, 
    VatCompanyAddress NVARCHAR(1000) NULL, 
    VatTaxId VARCHAR(50) NULL, 
    VatBudgetCode VARCHAR(100) NULL;
GO
