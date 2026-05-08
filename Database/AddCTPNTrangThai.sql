-- Migration: Thêm cột TrangThai vào bảng CTPN
-- Dùng để theo dõi trạng thái duyệt của từng dòng sản phẩm trong phiếu đề xuất
-- NULL = chưa xử lý | 'Đã Duyệt' | 'Không Duyệt'
-- Date: 2026-04-12

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'CTPN' AND COLUMN_NAME = 'TrangThai'
)
BEGIN
    ALTER TABLE CTPN
    ADD TrangThai NVARCHAR(50) NULL;

    PRINT 'Đã thêm cột TrangThai vào bảng CTPN';
END
ELSE
BEGIN
    PRINT 'Cột TrangThai đã tồn tại trong bảng CTPN';
END
