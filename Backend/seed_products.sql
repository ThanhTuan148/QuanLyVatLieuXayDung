SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @NextID INT;
SELECT @NextID = ISNULL(MAX(MaSanPham), 0) FROM SANPHAM;

INSERT INTO SANPHAM (TenSP, MoTa, HinhAnh, DonViTinh, GiaBan, GiaNhap, MucTonToiThieu, ThuongHieu, XuatXu, AnhPhu, MaLoaiSP, TrangThai, NgayTao, NgayCapNhat, KichThuoc, IsGift)
VALUES 
-- Gạch ốp lát
(N'Gạch men giả gỗ Prime 15x60', N'Gạch ốp lát cao cấp, bề mặt nhám chống trơn trượt', 
N'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&q=80', N'Hộp', 185000, 150000, 50, N'Prime', N'Việt Nam', 
N'["https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=400&q=80","https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80"]', 2, 1, GETDATE(), GETDATE(), N'15x60 cm', 0),

(N'Gạch bóng kiếng Viglacera 80x80', N'Gạch vân đá tự nhiên sang trọng', 
N'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80', N'Hộp', 350000, 280000, 30, N'Viglacera', N'Việt Nam', 
N'["https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&q=80","https://images.unsplash.com/photo-1600607687931-cebf667114b8?w=400&q=80"]', 2, 1, GETDATE(), GETDATE(), N'80x80 cm', 0),

-- Sơn & Bột trét
(N'Sơn lót chống kiềm Dulux Weathershield', N'Bảo vệ bề mặt tường, chống nấm mốc hiệu quả', 
N'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80', N'Thùng', 1250000, 950000, 20, N'Dulux', N'Hà Lan', 
N'["https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80"]', 3, 1, GETDATE(), GETDATE(), N'18L', 0),

(N'Bột trét tường nội thất Jotun', N'Tạo bề mặt nhẵn mịn, bám dính tốt', 
N'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80', N'Bao', 280000, 210000, 40, N'Jotun', N'Na Uy', 
N'[]', 3, 1, GETDATE(), GETDATE(), N'40kg', 0),

-- Thiết bị vệ sinh
(N'Bồn cầu 1 khối TOTO Washlet', N'Thiết kế liền khối, nắp rửa điện tử tự động thông minh', 
N'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80', N'Bộ', 8500000, 7200000, 10, N'TOTO', N'Nhật Bản', 
N'["https://images.unsplash.com/photo-1552322689-11c7fa156bc8?w=400&q=80","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&q=80"]', 4, 1, GETDATE(), GETDATE(), N'Chuẩn', 0),

(N'Vòi sen tắm đứng INAX', N'Chất liệu Inox 304 không gỉ, bát sen lớn', 
N'https://images.unsplash.com/photo-1552322689-c454e99553b4?w=400&q=80', N'Bộ', 2100000, 1750000, 15, N'INAX', N'Nhật Bản', 
N'["https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&q=80"]', 4, 1, GETDATE(), GETDATE(), N'Cố định', 0),

-- Điện nước
(N'Ống nhựa PVC Bình Minh Phi 90', N'Dùng cho hệ thống thoát nước sinh hoạt', 
N'https://images.unsplash.com/photo-1574359411659-15573a27fd0c?w=400&q=80', N'Cây', 145000, 110000, 100, N'Bình Minh', N'Việt Nam', 
N'[]', 5, 1, GETDATE(), GETDATE(), N'4m', 0),

(N'Cuộn dây điện Cadivi CV 2.5', N'Lõi đồng nguyên chất, dùng cho ổ cắm tải cao', 
N'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=400&q=80', N'Cuộn', 650000, 550000, 50, N'Cadivi', N'Việt Nam', 
N'["https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400&q=80"]', 5, 1, GETDATE(), GETDATE(), N'100m', 0),

-- Dụng cụ
(N'Máy khoan búa Bosch GBH 2-26 DRE', N'Công suất 800W, đa năng khoan bê tông, gỗ, sắt', 
N'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80', N'Cái', 3200000, 2750000, 10, N'Bosch', N'Đức', 
N'["https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&q=80"]', 6, 1, GETDATE(), GETDATE(), N'Tiêu chuẩn', 0),

(N'Giày bảo hộ chống đinh Jogger', N'Mũi lót thép chống dập ngón, đế chống đâm xuyên', 
N'https://images.unsplash.com/photo-1536768130541-118bd4b0d063?w=400&q=80', N'Đôi', 450000, 360000, 30, N'Safety Jogger', N'Bỉ', 
N'["https://images.unsplash.com/photo-1585644766874-9842a233b664?w=400&q=80","https://images.unsplash.com/photo-1520699049698-acd2fce187f5?w=400&q=80"]', 6, 1, GETDATE(), GETDATE(), N'Size 39-43', 0);
