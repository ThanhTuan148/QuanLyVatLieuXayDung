-- Xem số lượng sản phẩm
SELECT COUNT(*) as TotalProducts FROM SANPHAM;

-- Xem số lượng bản ghi kho
SELECT COUNT(*) as TotalInventoryRecords FROM CTKHOHANG;

-- Danh sách sản phẩm chưa có trong bản ghi kho
SELECT MaSanPham, TenSP 
FROM SANPHAM 
WHERE MaSanPham NOT IN (SELECT MaSanPham FROM CTKHOHANG);
