# 🛍️ HƯỚNG DẪN CHI TIẾT - TÍNH NĂNG E-COMMERCE (B2C)

## 📌 TỔNG QUAN

Hệ thống **Quản Lý Cửa Hàng Vật Liệu Xây Dựng** không chỉ là một hệ thống B2B (bán cho công ty) mà còn có tính năng **E-Commerce B2C** (bán cho khách hàng cá nhân qua web).

### Các Tính Năng E-Commerce
- ✅ **Giỏ Hàng** (Shopping Cart)
- ✅ **Flash Sale** (Bán Chớp - Giảm giá theo thời gian)
- ✅ **Coupon** (Mã giảm giá)
- ✅ **Banner & Quảng Cáo**
- ✅ **Đánh Giá & Nhận Xét** (Product Reviews)
- ✅ **Tính Toán Chiết Khấu Tự Động**

---

## 🛒 GIỎ HÀNG (SHOPPING CART)

### Mô Tả
Khách hàng thêm sản phẩm vào giỏ, cập nhật số lượng, sau đó thanh toán để tạo đơn hàng.

### Các Bảng Liên Quan
```
Cart
├─ CartId (PK)
├─ UserId (FK → Users)
├─ ProductId (FK → Products)
├─ Quantity (Số lượng)
├─ Price (Giá tại thời điểm thêm vào)
├─ CreatedDate
└─ UpdatedDate
```

### Quy Trình Hoạt Động

**Step 1: Khách Hàng Thêm Vào Giỏ**
```
User: Xem sản phẩm → "Thêm Vào Giỏ"
Nhập Quantity: 50 cái
System:
  1. Kiểm tra AvailableQuantity ≥ 50?
  2. Nếu sản phẩm chưa trong giỏ → Insert Cart
  3. Nếu sản phẩm đã trong giỏ → Update Quantity += 50
  4. Hiển thị: "Thêm vào giỏ thành công"
```

**Step 2: Xem Giỏ Hàng**
```
User: Nhấn "Xem Giỏ Hàng"
System:
  1. SELECT * FROM Cart WHERE UserId = 5
  2. Hiển thị bảng:
     - Product Name | Price | Quantity | Total
  3. Tính Subtotal = Σ(Qty × Price)
  4. Nút: "Tiếp Tục Mua" / "Thanh Toán"
```

**Step 3: Cập Nhật Giỏ Hàng**
```
User: Thay đổi số lượng hoặc xóa sản phẩm
System:
  1. UPDATE Cart SET Quantity = 30 WHERE CartId = 1
  2. Hoặc DELETE FROM Cart WHERE CartId = 1
  3. Tính lại Subtotal
```

**Step 4: Thanh Toán (Checkout)**
```
User: Nhấn "Thanh Toán"
System:
  1. Lấy tất cả Cart items của user
  2. Chuyển sang trang Checkout:
     - Hiển thị tóm tắt đơn
     - Nhập địa chỉ giao
     - Chọn phương thức thanh toán
     - Nhập coupon (tùy chọn)
  3. Nhấn "Xác Nhận"
  4. Tạo SalesOrder từ Cart items
  5. XÓA Cart items đã thanh toán
  6. Tạo Delivery + Receivable (nếu nợ)
```

### SQL Queries
```sql
-- Thêm vào giỏ
INSERT INTO Cart (UserId, ProductId, Quantity, Price, CreatedDate)
VALUES (5, 1, 50, 95000, GETDATE());

-- Xem giỏ hàng của user
SELECT 
  c.CartId,
  p.ProductName,
  c.Quantity,
  c.Price,
  (c.Quantity * c.Price) AS Total
FROM Cart c
INNER JOIN Products p ON c.ProductId = p.ProductId
WHERE c.UserId = 5
ORDER BY c.CreatedDate DESC;

-- Xóa giỏ hàng sau khi thanh toán
DELETE FROM Cart WHERE UserId = 5 AND CartId = 1;
```

---

## ⏰ FLASH SALE (BÁN CHỚP)

### Mô Tả
Chương trình khuyến mại có thời gian giới hạn. Ví dụ: "Sáng Siêu Rẻ 06:00-10:00", "Hôm Nay Giảm 50%".

### Các Bảng Liên Quan
```
FlashSale
├─ FlashSaleId (PK)
├─ Title (Tên chương trình)
├─ Description
├─ StartTime (Bắt đầu)
├─ EndTime (Kết thúc)
├─ IsActive
└─ CreatedDate

FlashSaleItem
├─ FlashSaleItemId (PK)
├─ FlashSaleId (FK)
├─ ProductId (FK)
├─ DiscountPercent (Giảm X%)
├─ FixedPrice (Hoặc giá cố định)
└─ MaxQuantity (Giới hạn số lượng - tùy chọn)
```

### Quy Trình Hoạt Động

**Admin Tạo Flash Sale:**
```
Admin → "Quản Lý Flash Sale" → "Tạo Mới"
├─ Title: "Sáng Siêu Rẻ"
├─ StartTime: 2026-02-15 06:00:00
├─ EndTime: 2026-02-15 10:00:00
├─ Thêm sản phẩm:
│  ├─ Xi Măng Hà Tiên: Giảm 20% (95,000 → 76,000)
│  ├─ Cát Vàng: Giảm 15% (450,000 → 382,500)
│  └─ Sắt Thép: Giá cố định 18,000/kg
└─ Lưu → IsActive = true
```

**Khách Hàng Thấy Flash Sale:**
```
Trước 06:00: Không thấy sale (Chờ kích hoạt)
Lúc 06:00: Hệ thống kiểm tra NOW() ≥ StartTime
  → Hiển thị sản phẩm với giá sale
  → Badges: "⚡ FLASH SALE"
  → Giá gốc: 95,000 → Giá sale: 76,000 ✓
Lúc 10:00: Hệ thống kiểm tra NOW() > EndTime
  → Ẩn sale, hiển thị giá gốc lại
  → Hoặc tự động vô hiệu
```

**Tính Toán Giá:**
```
FlashSale Price = UnitPrice × (1 - DiscountPercent/100)
               = 95,000 × (1 - 20/100)
               = 95,000 × 0.8
               = 76,000 VNĐ
```

### SQL Queries
```sql
-- Tạo Flash Sale
INSERT INTO FlashSale (Title, Description, StartTime, EndTime, IsActive)
VALUES ('Sáng Siêu Rẻ', 'Giảm giá sáng 06:00-10:00', '2026-02-15 06:00:00', '2026-02-15 10:00:00', 1);

-- Thêm sản phẩm vào Flash Sale
INSERT INTO FlashSaleItem (FlashSaleId, ProductId, DiscountPercent)
VALUES (1, 1, 20);  -- Xi Măng giảm 20%

-- Lấy danh sách Flash Sale đang diễn ra
SELECT 
  fs.FlashSaleId,
  fs.Title,
  fs.StartTime,
  fs.EndTime,
  COUNT(fsi.FlashSaleItemId) AS ProductCount
FROM FlashSale fs
LEFT JOIN FlashSaleItem fsi ON fs.FlashSaleId = fsi.FlashSaleId
WHERE fs.IsActive = 1
  AND GETDATE() BETWEEN fs.StartTime AND fs.EndTime
GROUP BY fs.FlashSaleId, fs.Title, fs.StartTime, fs.EndTime;

-- Lấy sản phẩm có Flash Sale + giá sale
SELECT 
  p.ProductId,
  p.ProductName,
  p.UnitPrice,
  fsi.DiscountPercent,
  CAST(p.UnitPrice * (1 - fsi.DiscountPercent / 100.0) AS INT) AS SalePrice
FROM Products p
INNER JOIN FlashSaleItem fsi ON p.ProductId = fsi.ProductId
INNER JOIN FlashSale fs ON fsi.FlashSaleId = fs.FlashSaleId
WHERE fs.IsActive = 1
  AND GETDATE() BETWEEN fs.StartTime AND fs.EndTime;
```

---

## 🎟️ COUPON (MÃ GIẢM GIÁ)

### Mô Tả
Mã code mà khách hàng nhập khi thanh toán để giảm giá đơn hàng.

### Các Bảng Liên Quan
```
Coupon
├─ CouponId (PK)
├─ Code (Mã - UNIQUE, 3-50 ký tự)
├─ Description
├─ DiscountPercentage (Giảm X% - 0-100)
├─ MaxDiscountAmount (Giảm tối đa bao nhiêu)
├─ MinOrderAmount (Mua tối thiểu bao nhiêu)
├─ Quantity (Có bao nhiêu mã)
├─ UsedQuantity (Đã dùng bao nhiêu)
├─ StartDate
├─ EndDate
├─ IsActive
├─ CreatedDate
└─ UpdatedDate
```

### Quy Trình Hoạt Động

**Admin Tạo Coupon:**
```
Admin → "Quản Lý Coupon" → "Tạo Mới"
├─ Code: "SALE50"
├─ DiscountPercentage: 50%
├─ MaxDiscountAmount: 500,000 (Không được giảm quá 500k)
├─ MinOrderAmount: 1,000,000 (Phải mua tối thiểu 1 triệu)
├─ Quantity: 100 (Có 100 mã)
├─ StartDate: 2026-02-01
├─ EndDate: 2026-02-28
└─ Lưu → IsActive = true
```

**Khách Hàng Sử Dụng Coupon:**
```
User: Ở trang Checkout, nhập: "SALE50"
Nhấn: "Áp Dụng Coupon"

System kiểm tra:
  1. Coupon "SALE50" tồn tại?
  2. IsActive = true?
  3. NOW() ≥ StartDate AND NOW() ≤ EndDate?
  4. UsedQuantity < Quantity? (Chưa dùng hết)
  5. OrderAmount ≥ MinOrderAmount? (1,000,000 ≤ 5,000,000? ✓)

Nếu OK:
  DiscountAmount = OrderAmount × 50% = 5,000,000 × 0.5 = 2,500,000
  Nhưng MaxDiscount = 500,000
  → DiscountAmount = MIN(2,500,000, 500,000) = 500,000
  
  FinalAmount = 5,000,000 - 500,000 = 4,500,000
  UsedQuantity += 1 (Tăng lên 1)
  
  Hiển thị: "✓ Coupon hợp lệ! Tiết kiệm 500,000 VNĐ"

Nếu không hợp lệ:
  → Báo lỗi: "Mã không tồn tại" / "Chưa đến hạn dùng" / etc.
```

### SQL Queries
```sql
-- Tạo Coupon
INSERT INTO Coupon (Code, Description, DiscountPercentage, MaxDiscountAmount, MinOrderAmount, Quantity, IsActive, StartDate, EndDate)
VALUES ('SALE50', 'Giảm 50% tối đa 500k', 50, 500000, 1000000, 100, 1, '2026-02-01', '2026-02-28');

-- Kiểm tra Coupon hợp lệ
SELECT *
FROM Coupon
WHERE Code = 'SALE50'
  AND IsActive = 1
  AND GETDATE() BETWEEN StartDate AND EndDate
  AND UsedQuantity < Quantity;

-- Tính tiền giảm
DECLARE @OrderAmount INT = 5000000;
DECLARE @DiscountPercent INT = 50;
DECLARE @MaxDiscount INT = 500000;

DECLARE @DiscountAmount INT = CAST(@OrderAmount * @DiscountPercent / 100.0 AS INT);
IF @DiscountAmount > @MaxDiscount
  SET @DiscountAmount = @MaxDiscount;

SELECT 
  @OrderAmount AS TotalAmount,
  @DiscountAmount AS DiscountAmount,
  (@OrderAmount - @DiscountAmount) AS FinalAmount;

-- Tăng UsedQuantity khi sử dụng
UPDATE Coupon SET UsedQuantity = UsedQuantity + 1 WHERE CouponId = 1;
```

---

## 🎨 BANNER & QUẢNG CÁO

### Mô Tả
Hình ảnh quảng bá sản phẩm / khuyến mại hiển thị trên trang chủ.

### Các Bảng Liên Quan
```
Banner
├─ BannerId (PK)
├─ Title (Tiêu đề)
├─ Description (Mô tả)
├─ ImageUrl (Đường dẫn ảnh)
├─ LinkUrl (Link khi bấm)
├─ DisplayOrder (Vị trí: 1, 2, 3...)
├─ StartDate (Bắt đầu hiển thị)
├─ EndDate (Kết thúc hiển thị)
├─ IsActive
├─ CreatedDate
└─ UpdatedDate
```

### Quy Trình Hoạt Động

**Admin Tạo Banner:**
```
Admin → "Quản Lý Banner" → "Tạo Mới"
├─ Title: "Xi Măng Hà Tiên - Giảm 20%"
├─ ImageUrl: /images/ximang-banner.jpg (Upload ảnh)
├─ LinkUrl: /product/xi-mang-ha-tien
├─ DisplayOrder: 1 (Vị trí đầu tiên)
├─ StartDate: 2026-02-01 00:00:00
├─ EndDate: 2026-02-28 23:59:59
└─ IsActive: Yes → Lưu
```

**Khách Hàng Thấy Banner:**
```
Web trang chủ:
├─ Hệ thống tìm tất cả Banner có:
│  ├─ IsActive = true
│  ├─ NOW() ≥ StartDate
│  ├─ NOW() ≤ EndDate
├─ Sắp xếp theo DisplayOrder (1 trước)
├─ Hiển thị ảnh Banner + Link
└─ Khi click: Chuyển hướng tới /product/xi-mang-ha-tien
```

### SQL Queries
```sql
-- Tạo Banner
INSERT INTO Banner (Title, Description, ImageUrl, LinkUrl, DisplayOrder, StartDate, EndDate, IsActive)
VALUES ('Xi Măng Hà Tiên', 'Giảm 20% các sản phẩm', '/images/ximang.jpg', '/product/1', 1, '2026-02-01', '2026-02-28', 1);

-- Lấy danh sách Banner đang hiển thị (sắp xếp theo vị trí)
SELECT 
  BannerId,
  Title,
  ImageUrl,
  LinkUrl,
  DisplayOrder
FROM Banner
WHERE IsActive = 1
  AND GETDATE() BETWEEN StartDate AND EndDate
ORDER BY DisplayOrder ASC;

-- Cập nhật vị trí hiển thị
UPDATE Banner SET DisplayOrder = 2 WHERE BannerId = 1;
```

---

## ⭐ ĐÁNH GIÁ & NHẬN XÉT (REVIEWS)

### Mô Tả
Khách hàng đánh giá sản phẩm sau khi mua hàng, giúp khách hàng khác quyết định mua.

### Các Bảng Liên Quan
```
Review
├─ ReviewId (PK)
├─ UserId (FK → Users)
├─ ProductId (FK → Products)
├─ OrderId (FK → SalesOrders)
├─ Rating (1-5 sao)
├─ Comment (≤1000 ký tự)
├─ IsApproved (false - chờ duyệt, true - hiển thị)
├─ CreatedDate
└─ UpdatedDate
```

### Quy Trình Hoạt Động

**Khách Hàng Gửi Đánh Giá:**
```
User: Vào "Đơn Mua Của Tôi"
  → Chọn đơn đã giao
  → Nhấn "Đánh Giá Sản Phẩm"
  → Chọn sao: ⭐⭐⭐⭐⭐ (5 sao)
  → Viết bình luận: "Sản phẩm tốt lắm!"
  → Nhấn "Gửi"

System:
  1. INSERT Review:
     - UserId = 5
     - ProductId = 1
     - OrderId = 1
     - Rating = 5
     - Comment = "Sản phẩm tốt lắm!"
     - IsApproved = false (Chưa duyệt)
  2. Hiển thị: "Cảm ơn bạn! Review sẽ được hiển thị sau khi admin duyệt"
```

**Admin Duyệt Review:**
```
Admin → "Quản Lý Review"
├─ Danh sách review chờ duyệt (IsApproved = false)
├─ Xem chi tiết:
│  ├─ Sản phẩm: Xi Măng Hà Tiên
│  ├─ Người dùng: Nguyễn Văn A
│  ├─ Đánh giá: ⭐⭐⭐⭐⭐ (5 sao)
│  ├─ Bình luận: "Sản phẩm tốt lắm!"
├─ Nút: "Chấp Nhận" / "Từ Chối"
└─ Nếu "Chấp Nhận": IsApproved = true → Hiển thị trên sản phẩm
```

**Khách Hàng Xem Review:**
```
Web: Trang chi tiết sản phẩm
├─ Hiển thị:
│  ├─ Điểm trung bình: 4.5/5 ⭐
│  ├─ Số lượng đánh giá: 24 đánh giá
│  ├─ Danh sách review (IsApproved = true):
│  │  ├─ ⭐⭐⭐⭐⭐ - Nguyễn Văn A - 2026-02-12
│  │  │  "Sản phẩm tốt lắm!"
│  │  ├─ ⭐⭐⭐⭐ - Trần Thị B - 2026-02-10
│  │  │  "Tốt, nhưng giá hơi cao"
│  │  └─ ...
│  └─ "Xem tất cả đánh giá" (Phân trang)
```

### SQL Queries
```sql
-- Gửi đánh giá
INSERT INTO Review (UserId, ProductId, OrderId, Rating, Comment, IsApproved)
VALUES (5, 1, 1, 5, 'Sản phẩm tốt lắm!', 0);

-- Lấy review chờ duyệt
SELECT 
  r.ReviewId,
  u.UserName,
  p.ProductName,
  r.Rating,
  r.Comment,
  r.CreatedDate
FROM Review r
INNER JOIN Users u ON r.UserId = u.UserId
INNER JOIN Products p ON r.ProductId = p.ProductId
WHERE r.IsApproved = 0
ORDER BY r.CreatedDate DESC;

-- Duyệt review
UPDATE Review SET IsApproved = 1 WHERE ReviewId = 1;

-- Hiển thị review đã duyệt + tính rating trung bình
SELECT 
  AVG(CAST(r.Rating AS FLOAT)) AS AvgRating,
  COUNT(*) AS TotalReviews,
  SUM(CASE WHEN r.Rating = 5 THEN 1 ELSE 0 END) AS Stars5Count,
  SUM(CASE WHEN r.Rating = 4 THEN 1 ELSE 0 END) AS Stars4Count,
  SUM(CASE WHEN r.Rating = 3 THEN 1 ELSE 0 END) AS Stars3Count,
  SUM(CASE WHEN r.Rating = 2 THEN 1 ELSE 0 END) AS Stars2Count,
  SUM(CASE WHEN r.Rating = 1 THEN 1 ELSE 0 END) AS Stars1Count
FROM Review
WHERE ProductId = 1 AND IsApproved = 1;

-- Hiển thị review danh sách
SELECT 
  r.ReviewId,
  u.UserName,
  r.Rating,
  r.Comment,
  r.CreatedDate
FROM Review r
INNER JOIN Users u ON r.UserId = u.UserId
WHERE r.ProductId = 1 AND r.IsApproved = 1
ORDER BY r.CreatedDate DESC;
```

---

## 🧮 TÍNH TOÁN CHIẾT KHẤU TỰ ĐỘNG

### Quy Trình
Khi khách hàng thanh toán, hệ thống tự động áp dụng tất cả chiết khấu có sẵn.

### Các Loại Chiết Khấu
1. **Flash Sale** - Giảm % theo sản phẩm
2. **Promotion** - Giảm % theo sản phẩm
3. **Coupon** - Giảm % cho cả đơn hàng
4. **Order Discount** - Chiết khấu chung của đơn

### Công Thức Tính Toán

```
Step 1: Tính giá mỗi sản phẩm
────────────────────────────
ItemPrice = UnitPrice

// Kiểm tra Flash Sale
Nếu ProductId trong FlashSale đang diễn ra:
  ItemPrice = UnitPrice × (1 - FlashSaleDiscount%)

// Kiểm tra Promotion
Nếu ProductId trong Promotion đang chạy:
  PromoPrice = UnitPrice × (1 - PromotionDiscount%)
  ItemPrice = MIN(ItemPrice, PromoPrice)

ItemTotal = Quantity × ItemPrice


Step 2: Tính tổng đơn hàng
──────────────────────────
SubTotal = Σ ItemTotal


Step 3: Áp dụng Coupon
──────────────────────
Nếu Coupon hợp lệ:
  CouponDiscount = SubTotal × CouponPercent / 100
  
  Nếu CouponDiscount > MaxDiscountAmount:
    CouponDiscount = MaxDiscountAmount
  
  SubTotal = SubTotal - CouponDiscount


Step 4: Áp dụng Order Discount
───────────────────────────────
Nếu có Order Discount:
  OrderDiscount = SubTotal × OrderDiscountPercent / 100
  SubTotal = SubTotal - OrderDiscount


Step 5: Tính Final Amount
───────────────────────
FinalAmount = SubTotal
```

### Ví Dụ Cụ Thể
```
Đơn hàng gồm:
├─ 50 cái Xi Măng Hà Tiên: 95,000/cái
├─ 10 khối Cát Vàng: 450,000/khối
└─ 100 kg Sắt Thép: 18,500/kg

Step 1: Tính giá từng sản phẩm
────────────────────────────
Xi Măng:
  - Giá gốc: 95,000
  - Flash Sale 20%: 95,000 × 0.8 = 76,000 ✓
  - Thành tiền: 50 × 76,000 = 3,800,000

Cát Vàng:
  - Giá gốc: 450,000
  - Không có Flash Sale
  - Thành tiền: 10 × 450,000 = 4,500,000

Sắt Thép:
  - Giá gốc: 18,500
  - Không có Flash Sale
  - Thành tiền: 100 × 18,500 = 1,850,000

Step 2: Tổng cộng
────────────────
SubTotal = 3,800,000 + 4,500,000 + 1,850,000 = 10,150,000

Step 3: Coupon
──────────────
Coupon "SALE50": Giảm 50%, tối đa 500,000
  - 10,150,000 × 50% = 5,075,000
  - Nhưng tối đa 500,000 → Giảm 500,000
  
SubTotal = 10,150,000 - 500,000 = 9,650,000

Step 4: Order Discount
──────────────────────
Không có (0%)

Step 5: Final Amount
────────────────────
FinalAmount = 9,650,000 VNĐ

Chi tiết tiết kiệm:
  - Flash Sale: 950,000 VNĐ (20% xi măng)
  - Coupon: 500,000 VNĐ (50% tối đa)
  - Tổng tiết kiệm: 1,450,000 VNĐ (12.5%)
```

### SQL Query Tính Toán Đầy Đủ

```sql
-- Tính toán chiết khấu hoàn chỉnh cho một đơn hàng
DECLARE @OrderId INT = 1;
DECLARE @CouponCode NVARCHAR(50) = 'SALE50';

-- Lấy thông tin đơn hàng
SELECT 
  @OrderId AS OrderId,
  (SELECT SUM(Quantity * Price) 
   FROM SalesOrderDetails WHERE OrderId = @OrderId) AS SubTotal;

-- Tính Flash Sale
DECLARE @FlashSaleDiscount INT = 0;
SELECT TOP 1 @FlashSaleDiscount = fsi.DiscountPercent
FROM SalesOrderDetails sod
INNER JOIN Products p ON sod.ProductId = p.ProductId
INNER JOIN FlashSaleItem fsi ON p.ProductId = fsi.ProductId
INNER JOIN FlashSale fs ON fsi.FlashSaleId = fs.FlashSaleId
WHERE sod.OrderId = @OrderId
  AND fs.IsActive = 1
  AND GETDATE() BETWEEN fs.StartTime AND fs.EndTime;

-- Tính Coupon
DECLARE @CouponDiscount INT = 0;
DECLARE @MaxCouponDiscount INT = 0;
DECLARE @OrderAmount INT = (SELECT SUM(Quantity * Price) FROM SalesOrderDetails WHERE OrderId = @OrderId);

SELECT TOP 1 
  @CouponDiscount = DiscountPercentage,
  @MaxCouponDiscount = MaxDiscountAmount
FROM Coupon
WHERE Code = @CouponCode
  AND IsActive = 1
  AND GETDATE() BETWEEN StartDate AND EndDate
  AND UsedQuantity < Quantity;

-- Tính final amount
DECLARE @TotalDiscount INT = CAST(@OrderAmount * @CouponDiscount / 100.0 AS INT);
IF @TotalDiscount > @MaxCouponDiscount
  SET @TotalDiscount = @MaxCouponDiscount;

SELECT 
  @OrderAmount AS OriginalAmount,
  @TotalDiscount AS DiscountAmount,
  (@OrderAmount - @TotalDiscount) AS FinalAmount;
```

---

## 📊 TÓMOỂM TABLES E-COMMERCE

| Bảng | Mục Đích | Cột Chính | Liên Quan |
|------|---------|----------|----------|
| **Cart** | Giỏ hàng tạm | CartId, UserId, ProductId, Quantity | Users, Products |
| **Review** | Đánh giá sản phẩm | ReviewId, UserId, ProductId, Rating, Comment, IsApproved | Users, Products, SalesOrders |
| **Banner** | Quảng cáo trang chủ | BannerId, Title, ImageUrl, LinkUrl, DisplayOrder, StartDate, EndDate | Không có FK |
| **FlashSale** | Bán chớp theo thời gian | FlashSaleId, Title, StartTime, EndTime | FlashSaleItem |
| **FlashSaleItem** | Sản phẩm trong Flash Sale | FlashSaleItemId, FlashSaleId, ProductId, DiscountPercent | FlashSale, Products |
| **Coupon** | Mã giảm giá | CouponId, Code, DiscountPercentage, MaxDiscountAmount, Quantity, UsedQuantity | Không có FK (dùng khi thanh toán) |

---

## 🔗 LIÊN HỆ VỚI B2B

### Khác Biệt B2B vs B2C
| Tính Năng | B2B | B2C |
|-----------|-----|-----|
| **Khách** | Công ty, nhà thầu | Cá nhân, khách lẻ |
| **Bán** | Direct (Nhân viên tạo đơn) | Web (Khách tự tạo giỏ) |
| **Giỏ** | Không có | Có (Shopping Cart) |
| **Flash Sale** | Không dùng | Có (Khuyến mại theo giờ) |
| **Coupon** | Ít | Nhiều (Marketing tool) |
| **Đánh giá** | Không có | Có (Xây dựng uy tín) |
| **Chiết khấu** | Tùy từng khách | Tùy coupon/flash sale |
| **Thanh toán** | Nợ hoặc tiền mặt | Ngoài web + Nợ sau |
| **Phí vận chuyển** | Thương lượng | Cố định |

### Cơ Hội Hybrid
```
B2B (Công ty)              B2C (Cá nhân)
    ↓                           ↓
Nhân viên tạo đơn ←→ Web Bán Chớp
    ↓                           ↓
   Nợ                       Thanh Toán Ngay
    ↓                           ↓
Giao tại công trình    Giao tại nhà khách hàng
    ↓                           ↓
Báng cáo B2B             Báng cáo B2C
    ↓                           ↓
   Doanh Thu Hybrid
```

---

## 🛡️ QUY TẮC VALIDATE

### Khi Thêm Vào Giỏ
1. ✅ UserId phải tồn tại
2. ✅ ProductId phải tồn tại
3. ✅ Quantity > 0
4. ✅ AvailableQuantity ≥ Quantity
5. ✅ Price > 0

### Khi Tạo Flash Sale
1. ✅ StartTime < EndTime
2. ✅ DiscountPercent ≥ 0 và ≤ 100
3. ✅ Phải có ít nhất 1 sản phẩm
4. ✅ Title không để trống

### Khi Tạo Coupon
1. ✅ Code UNIQUE (không trùng)
2. ✅ Code có độ dài 3-50
3. ✅ DiscountPercentage ≥ 0 và ≤ 100
4. ✅ MaxDiscountAmount > 0
5. ✅ MinOrderAmount ≥ 0
6. ✅ Quantity > 0
7. ✅ StartDate < EndDate

### Khi Sử Dụng Coupon
1. ✅ Coupon phải hợp lệ (IsActive = true)
2. ✅ Trong khoảng thời gian (StartDate ≤ NOW() ≤ EndDate)
3. ✅ Chưa dùng hết (UsedQuantity < Quantity)
4. ✅ Đơn hàng ≥ MinOrderAmount

### Khi Gửi Review
1. ✅ Rating ≥ 1 và ≤ 5
2. ✅ Comment ≤ 1000 ký tự
3. ✅ ProductId phải tồn tại
4. ✅ UserId phải tồn tại
5. ✅ OrderId phải tồn tại

---

**Bản cập nhật: 15/02/2026**  
**Trạng thái: Hoàn chỉnh**  
**Người tạo: AI Assistant**
