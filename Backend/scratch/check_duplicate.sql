
-- Kiểm tra chi tiết hóa đơn
SELECT MaSanPham, SoLuong, DonGia 
FROM CTHD 
WHERE MaHoaDon = 51;

-- Kiểm tra chi tiết phiếu xuất kho
SELECT MaSanPham, SoLuong, MaKho 
FROM CTPhieuXuatKho 
WHERE MaPhieuXK = (SELECT MaPhieuXK FROM PhieuXuatKho WHERE MaHoaDon = 51);
