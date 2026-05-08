-- Khai báo kho (CTKHOHANG) cho tất cả các sản phẩm đang bị thiếu trong bảng quản lý kho
-- Mặc định số lượng = 0, vị trí = 'Chưa xếp kệ'
-- Sử dụng kho số 1 làm mặc định

INSERT INTO CTKHOHANG (MaKhoHang, MaSanPham, SoLuong, SoLuongNhap, SoLuongTon, ViTri, NgayCapNhat)
SELECT 1, MaSanPham, 0, 0, 0, N'Chưa xếp kệ', GETDATE()
FROM SANPHAM
WHERE MaSanPham NOT IN (SELECT MaSanPham FROM CTKHOHANG);

-- Kiểm tra lại kết quả
SELECT s.MaSanPham, s.TenSP, k.SoLuongTon
FROM SANPHAM s
LEFT JOIN CTKHOHANG k ON s.MaSanPham = k.MaSanPham;
