-- Migration: Thêm cột AnhPhu vào bảng SANPHAM
-- AnhPhu lưu dạng JSON array string, ví dụ: '["url1","url2","url3"]'

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[SANPHAM]') AND name = 'AnhPhu'
)
BEGIN
    ALTER TABLE [dbo].[SANPHAM]
    ADD [AnhPhu] NVARCHAR(MAX) NULL;

    PRINT 'Da them cot AnhPhu vao bang SANPHAM.';
END
ELSE
BEGIN
    PRINT 'Cot AnhPhu da ton tai.';
END
GO

-- Cập nhật ảnh phụ mẫu cho một số sản phẩm đầu tiên (dùng URL Unsplash/Picsum để demo)
-- Bạn có thể thay bằng URL ảnh thật sau khi upload

UPDATE [dbo].[SANPHAM] SET [AnhPhu] = 
'["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80","https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80","https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=400&q=80"]'
WHERE MaSanPham = 1;

UPDATE [dbo].[SANPHAM] SET [AnhPhu] = 
'["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80","https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80"]'
WHERE MaSanPham = 2;

UPDATE [dbo].[SANPHAM] SET [AnhPhu] = 
'["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80","https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80","https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&q=80"]'
WHERE MaSanPham = 3;

UPDATE [dbo].[SANPHAM] SET [AnhPhu] = 
'["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80","https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80","https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80"]'
WHERE MaSanPham = 4;

UPDATE [dbo].[SANPHAM] SET [AnhPhu] = 
'["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80","https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80","https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=400&q=80"]'
WHERE MaSanPham = 5;

UPDATE [dbo].[SANPHAM] SET [AnhPhu] = 
'["https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80","https://images.unsplash.com/photo-1587736765690-c9b99c50a4d3?w=400&q=80","https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80"]'
WHERE MaSanPham = 6;

UPDATE [dbo].[SANPHAM] SET [AnhPhu] = 
'["https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&q=80","https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80","https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80"]'
WHERE MaSanPham = 7;

UPDATE [dbo].[SANPHAM] SET [AnhPhu] = 
'["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80","https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80"]'
WHERE MaSanPham = 8;

PRINT 'Cap nhat du lieu AnhPhu mau hoan tat.';
GO
