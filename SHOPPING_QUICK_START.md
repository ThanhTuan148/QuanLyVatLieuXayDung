# 🎯 Quick Start - Giao Diện Người Mua Hàng

## ⚡ Truy Cập Ngay

```
http://localhost:3001/shopping
```

---

## 🚀 Bắt Đầu Nhanh

### 1. Khởi động Backend
```bash
cd Backend
dotnet run
```
✅ Backend chạy tại: `http://localhost:5000`

### 2. Khởi động Frontend
```bash
cd Frontend
npm start
```
✅ Frontend chạy tại: `http://localhost:3001`

### 3. Truy Cập Giao Diện Mua Hàng
```
http://localhost:3001/shopping
```

---

## 📱 Hai Trang Chính

| Trang | URL | Mô Tả |
|-------|-----|--------|
| 🛍️ Cửa Hàng | `http://localhost:3001/shopping` | Duyệt & mua sản phẩm |
| 🛒 Giỏ Hàng | `http://localhost:3001/shopping-cart` | Quản lý & thanh toán |

---

## ✨ 5 Tính Năng Chính

### 1. 🔍 Tìm Kiếm & Sắp Xếp
- Tìm kiếm sản phẩm theo tên
- Sắp xếp: Tên, Giá Thấp, Giá Cao

### 2. ⭐ Bình Luận & Đánh Giá
- Xem đánh giá 1-5 sao từ khách khác
- Viết bình luận riêng của bạn

### 3. ⚡ Flash Sale
- Sản phẩm bán rẻ thời gian hạn chế
- Xem thời gian còn lại trên carousel

### 4. 🎟️ Mã Giảm Giá
- Nhập mã giảm giá khi thanh toán
- Tính tiền giảm tự động

### 5. 🖼️ Banner Quảng Cáo
- Carousel hình ảnh tự động
- Click "Learn More" để xem chi tiết

---

## 🛒 Quy Trình Mua Hàng

```
1️⃣ Vào /shopping
   ↓
2️⃣ Duyệt sản phẩm & tìm kiếm
   ↓
3️⃣ Click "Chi Tiết" → Xem đánh giá → Thêm vào giỏ
   ↓
4️⃣ Vào /shopping-cart
   ↓
5️⃣ Áp dụng mã giảm giá (nếu có)
   ↓
6️⃣ Click "Thanh Toán" → Nhập thông tin
   ↓
7️⃣ Xác nhận → Đặt hàng thành công! ✅
```

---

## 📝 Danh Sách Công Việc Hoàn Thành

✅ **Trang Mua Hàng** - `CustomerShoppingPage.js`
- Hiển thị danh sách sản phẩm
- Tìm kiếm & sắp xếp
- Xem banner quảng cáo
- Xem flash sale
- Chi tiết sản phẩm trong dialog
- Đánh giá & bình luận
- Thêm vào giỏ hàng

✅ **Trang Giỏ Hàng** - `ShoppingCartPage.js`
- Danh sách sản phẩm trong giỏ
- Thay đổi số lượng
- Xóa sản phẩm
- Áp dụng mã giảm giá
- Thanh toán & hoàn tất đơn

✅ **Routing** - `App.js`
- Route `/shopping` → CustomerShoppingPage
- Route `/shopping-cart` → ShoppingCartPage
- Không cần đăng nhập (công khai)

✅ **Services** (Đã tạo)
- cartService.js
- reviewService.js
- flashSaleService.js
- couponService.js
- bannerService.js

✅ **Components** (Đã tạo)
- BannerCarousel.js
- FlashSaleCarousel.js
- ProductReviews.js
- CouponInput.js
- ShoppingCart.js

---

## 🎨 Giao Diện & UX

### 🎨 Màu Sắc & Icons
- 💰 Giá bán: Màu đỏ (#d32f2f)
- 🟦 Tổng tiền: Màu xanh (#1976d2)
- ⚡ Flash Sale: Yellow background
- 📦 Icons emoji cho trực quan

### 📐 Layout Responsive
- **Desktop**: 4 cột sản phẩm
- **Tablet**: 3 cột
- **Mobile**: 1-2 cột

### ⌨️ Tương Tác
- Hover: Sản phẩm nâng lên (transform: translateY)
- Dialog: Chi tiết sản phẩm mở trong popup
- Alert: Thông báo thành công/lỗi

---

## 🔗 File Được Tạo

### Backend
```
✅ Backend/Controllers/CartController.cs
✅ Backend/Controllers/ReviewController.cs
✅ Backend/Controllers/FlashSaleController.cs
✅ Backend/Controllers/CouponController.cs
✅ Backend/Controllers/BannerController.cs
✅ Backend/Models/Cart.cs
✅ Backend/Models/Review.cs
✅ Backend/Models/FlashSale.cs
✅ Backend/Models/FlashSaleItem.cs
✅ Backend/Models/Coupon.cs
✅ Backend/Models/Banner.cs
```

### Frontend
```
✅ Frontend/src/pages/CustomerShoppingPage.js
✅ Frontend/src/pages/ShoppingCartPage.js
✅ Frontend/src/services/cartService.js
✅ Frontend/src/services/reviewService.js
✅ Frontend/src/services/flashSaleService.js
✅ Frontend/src/services/couponService.js
✅ Frontend/src/services/bannerService.js
✅ Frontend/src/components/BannerCarousel.js
✅ Frontend/src/components/FlashSaleCarousel.js
✅ Frontend/src/components/ProductReviews.js
✅ Frontend/src/components/CouponInput.js
✅ Frontend/src/components/ShoppingCart.js
```

### Updated
```
✅ Frontend/src/App.js (Added routes + imports)
```

---

## 🧪 Test Kịch Bản

### Test 1: Duyệt Sản Phẩm
```
1. Vào http://localhost:3001/shopping
2. Thấy danh sách sản phẩm
3. Xem banner carousel
4. Xem flash sale carousel
```

### Test 2: Tìm Kiếm
```
1. Nhập "xi" vào tìm kiếm
2. Danh sách lọc chỉ hiển thị sản phẩm có "xi"
3. Xóa text → hiển thị lại toàn bộ
```

### Test 3: Sắp Xếp
```
1. Chọn "Giá Thấp"
2. Sản phẩm xếp từ giá nhỏ → lớn
3. Chọn "Giá Cao"
4. Sản phẩm xếp từ giá lớn → nhỏ
```

### Test 4: Xem Chi Tiết & Thêm Giỏ
```
1. Click "Chi Tiết" trên sản phẩm
2. Xem mô tả, giá, tồn kho
3. Nhập số lượng = 2
4. Click "Thêm Vào Giỏ"
5. Thông báo thành công
6. Click "Giỏ Hàng"
7. Thấy sản phẩm vừa thêm
```

### Test 5: Bình Luận
```
1. Trong dialog sản phẩm, xem "Đánh Giá"
2. Click "✍️ Viết Đánh Giá"
3. Chọn sao = 5
4. Nhập bình luận
5. Click "Gửi Đánh Giá"
6. Thông báo sẽ phê duyệt
```

### Test 6: Thanh Toán
```
1. Vào giỏ hàng (/shopping-cart)
2. Nhập mã giảm giá (nếu có)
3. Xem tổng tiền giảm
4. Click "Thanh Toán"
5. Nhập tên, SĐT, địa chỉ
6. Click "Xác Nhận Thanh Toán"
7. Thông báo thành công
```

---

## 📞 Hỗ Trợ

**Vấn đề**: Không thấy sản phẩm
→ Kiểm tra: Database có dữ liệu Product không?

**Vấn đề**: Lỗi thêm vào giỏ hàng
→ Kiểm tra: Backend POST /api/cart có hoạt động không?

**Vấn đề**: Mã giảm giá không hoạt động
→ Kiểm tra: Database có Coupon hợp lệ không?

---

## 🎉 Hoàn Thành!

Bạn đã có giao diện mua hàng hoàn chỉnh! 🚀

**Bước tiếp theo**: 
1. Chạy database migrations nếu cần
2. Thêm dữ liệu mẫu vào database
3. Test toàn bộ quy trình
4. Tùy chỉnh theo yêu cầu

**Truy cập**: `http://localhost:3001/shopping` ✅
