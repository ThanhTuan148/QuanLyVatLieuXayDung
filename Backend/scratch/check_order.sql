
SELECT 
    MaHD, 
    TongTien, 
    GiamGia, 
    ThanhToan, 
    PhiVanChuyen, 
    YeuCauVat,
    (SELECT SUM(ThanhTien) FROM CTHD WHERE MaHoaDon = h.MaHoaDon) as SumCTHD
FROM HOADON h
WHERE MaHD = 'HD030';

SELECT * FROM CTHD WHERE MaHoaDon = (SELECT MaHoaDon FROM HOADON WHERE MaHD = 'HD030');
