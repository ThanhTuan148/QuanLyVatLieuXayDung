# 🎨 Hướng Dẫn Trực Quan - Giao Diện Mua Hàng

## 📍 Bản Đồ Điều Hướng

```
┌─────────────────────────────────────────────────────────┐
│ Trình Duyệt                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  http://localhost:3001/shopping                          │
│  │                                                       │
│  ├─→ 🛍️ TRANG CỬA HÀNG (CustomerShoppingPage)          │
│  │   ├─ 🎨 Banner Carousel (quảng cáo)                 │
│  │   ├─ ⚡ Flash Sale Carousel (khuyến mãi)            │
│  │   ├─ 🔍 Tìm kiếm & sắp xếp                         │
│  │   ├─ 📦 Danh sách sản phẩm (Grid 4 cột)            │
│  │   └─ 🛒 Nút "Giỏ Hàng"                             │
│  │       └─ Khi click → /shopping-cart               │
│  │                                                     │
│  └─→ 🛒 TRANG GIỎ HÀNG (ShoppingCartPage)              │
│      ├─ 📋 Bảng sản phẩm                              │
│      ├─ 🎟️ Mã giảm giá                               │
│      ├─ 💰 Tóm tắt đơn hàng                          │
│      ├─ 💳 Nút thanh toán                            │
│      └─ 🔙 Nút quay lại cửa hàng                     │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🖼️ Giao Diện Trang Cửa Hàng (`/shopping`)

```
┌─────────────────────────────────────────────────────────┐
│ 🛍️ Cửa Hàng Vật Liệu Xây Dựng                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [========== BANNER CAROUSEL ==========]          │   │
│ │ ← [  Hình ảnh quảng cáo xoay tự động  ] →       │   │
│ │ ○ ○ ◑ (điểm điều hướng)                         │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [====== FLASH SALE CAROUSEL ======]              │   │
│ │ ← [⚡ Sản phẩm giảm giá | ⏱️ 2:30:45] →         │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🔍 [Tìm kiếm sản phẩm...] [Sắp xếp ▼] [🛒 Giỏ]  │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────┬────────────┬────────────┬────────────┐  │
│ │ 📦 Sản 1   │ 📦 Sản 2   │ 📦 Sản 3   │ 📦 Sản 4   │  │
│ │ Xi Măng    │ Cắt khung   │ Sơn tường │ Gạch        │  │
│ │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐    │  │
│ │ ₫200,000   │ ₫350,000   │ ₫450,000  │ ₫100,000   │  │
│ │ [Chi Tiết] │ [Chi Tiết] │ [Chi Tiết]│ [Chi Tiết] │  │
│ └────────────┴────────────┴────────────┴────────────┘  │
│                                                          │
│ ┌────────────┬────────────┬────────────┬────────────┐  │
│ │ 📦 Sản 5   │ 📦 Sản 6   │ 📦 Sản 7   │ 📦 Sản 8   │  │
│ │ Chì chống  │ Keo silicone│ Sợi dây   │ Ổ cắm      │  │
│ │ ⭐⭐⭐    │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐  │  │
│ │ ₫150,000   │ ₫280,000   │ ₫320,000  │ ₫180,000   │  │
│ │ [Chi Tiết] │ [Chi Tiết] │ [Chi Tiết]│ [Chi Tiết] │  │
│ └────────────┴────────────┴────────────┴────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Dialog Chi Tiết Sản Phẩm

```
┌──────────────────────────────────────────────────────────┐
│ Xi Măng Lafarge 50kg                                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ┌──────────────────────┐  ┌──────────────────────────┐  │
│ │ 📝 Mô tả:            │  │ 🛒 THÊM VÀO GIỎ         │  │
│ │ Xi măng chất lượng cao│  │                         │  │
│ │ màu xám, độ mịn      │  │ Số lượng: [2        ]   │  │
│ │                      │  │                         │  │
│ │ 💰 Giá:              │  │ [Thêm Vào Giỏ]         │  │
│ │ ₫200,000/bao         │  │                         │  │
│ │                      │  │                         │  │
│ │ 📦 Tồn kho:          │  │                         │  │
│ │ 1,250 sản phẩm       │  │                         │  │
│ │                      │  │                         │  │
│ └──────────────────────┘  └──────────────────────────┘  │
│                                                           │
│ ─────────────────────────────────────────────────────    │
│                                                           │
│ ⭐ ĐÁN GIÁ (15 bình luận)                               │
│ ⭐⭐⭐⭐ 4.5/5 sao                                      │
│                                                           │
│ ┌──────────────────────────────────────────────────┐    │
│ │ ⭐⭐⭐⭐⭐ Khách hàng A - 2024-01-15             │    │
│ │ Sản phẩm tốt, giao hàng nhanh                    │    │
│ │                                                  │    │
│ │ ⭐⭐⭐⭐ Khách hàng B - 2024-01-14              │    │
│ │ Giá hợp lý, chất lượng OK                       │    │
│ │                                                  │    │
│ │ ⭐⭐⭐⭐⭐ Khách hàng C - 2024-01-13             │    │
│ │ Rất hài lòng, sẽ mua lại                        │    │
│ └──────────────────────────────────────────────────┘    │
│                                                           │
│ [✍️ Viết Đánh Giá]                                      │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ [        ĐÓNG        ]                                   │
└──────────────────────────────────────────────────────────┘
```

---

## 🛒 Giao Diện Trang Giỏ Hàng (`/shopping-cart`)

```
┌──────────────────────────────────────────────────────────┐
│ 🛒 Giỏ Hàng Của Bạn        [Tiếp Tục Mua Sắm]            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ┌───────────────────────────────────────────────────┐    │
│ │ Sản Phẩm | Giá | Số Lượng | Thành Tiền | Hành Động│    │
│ ├───────────────────────────────────────────────────┤    │
│ │ 📦 #1   │200k│ [2 📝]  │ 400k ₫    │ [🗑️ Xóa] │    │
│ ├───────────────────────────────────────────────────┤    │
│ │ 📦 #3   │450k│ [1 📝]  │ 450k ₫    │ [🗑️ Xóa] │    │
│ ├───────────────────────────────────────────────────┤    │
│ │ 📦 #7   │320k│ [3 📝]  │ 960k ₫    │ [🗑️ Xóa] │    │
│ └───────────────────────────────────────────────────┘    │
│                                                           │
│ [🗑️ Xóa Toàn Bộ Giỏ Hàng]                              │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                         │                                │
│ THÔNG TIN GIỎ HÀNG       │                                │
│ ─────────────────────    │                                │
│ Tạm tính: 1.810.000 ₫   │                                │
│ Giảm giá: -   181.000 ₫  │                                │
│ ──────────────────────   │                                │
│ Tổng: 1.629.000 ₫        │                                │
│                         │                                │
│ 🎟️ MÃ GIẢM GIÁ          │                                │
│ [SUMMER2024] [Áp Dụng]   │                                │
│ ✅ Giảm ₫181,000         │                                │
│                         │                                │
│ [✅ THANH TOÁN]          │                                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 💬 Dialog Viết Đánh Giá

```
┌──────────────────────────────┐
│ Viết Đánh Giá                │
├──────────────────────────────┤
│                              │
│ Đánh giá: ⭐⭐⭐⭐⭐         │
│          (click để thay đổi) │
│                              │
│ Bình luận:                   │
│ ┌──────────────────────────┐ │
│ │ Nhập bình luận của bạn... │ │
│ │ (tối đa 500 ký tự)       │ │
│ │                          │ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
├──────────────────────────────┤
│ [Hủy]  [Gửi Đánh Giá]       │
└──────────────────────────────┘
```

---

## 💳 Dialog Thanh Toán

```
┌──────────────────────────────────────┐
│ ✅ Xác Nhận Đơn Hàng                 │
├──────────────────────────────────────┤
│                                      │
│ ℹ️ Vui lòng điền thông tin giao hàng │
│                                      │
│ Tên khách hàng:                      │
│ [Nguyễn Văn A                      ] │
│                                      │
│ Số điện thoại:                       │
│ [0901234567                        ] │
│                                      │
│ Địa chỉ giao hàng:                  │
│ ┌──────────────────────────────────┐ │
│ │ 123 Đường Lê Lợi, Q1, TP HCM     │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Ghi chú:                             │
│ ┌──────────────────────────────────┐ │
│ │ Giao trong giờ hành chính         │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 📦 TÓM TẮT:                         │
│ ├─ Tạm tính: 1.810.000 ₫            │
│ ├─ Giảm giá: -181.000 ₫             │
│ └─ Tổng: 1.629.000 ₫                │
│                                      │
├──────────────────────────────────────┤
│ [Hủy]  [Xác Nhận Thanh Toán]         │
└──────────────────────────────────────┘
```

---

## 🔄 Luồng Dữ Liệu

```
Frontend (React)                Backend (ASP.NET)            Database
─────────────────               ──────────────               ────────
                                
CustomerShoppingPage            GET /api/product
     │                           │                          Products
     └──────────────────────────>│                          
                                 │────────────────────────>
                                 │                          Products
                                 │<────────────────────────│
     │<──────────────────────────│
     │ (Hiển thị danh sách)      │
     │                           │
     │ (User thêm vào giỏ)       │
     │                           │
cartService.addToCart()          POST /api/cart
     │                           │                          Cart
     └──────────────────────────>│                          
                                 │────────────────────────>
                                 │                          Cart
                                 │<────────────────────────│
     │<──────────────────────────│
     │ (Thông báo thành công)    │
     │                           │
reviewService.getProductReviews()GET /api/review/product/{id}
     │                           │                          Review
     └──────────────────────────>│                          
                                 │────────────────────────>
                                 │                          Review
                                 │<────────────────────────│
     │<──────────────────────────│
     │ (Hiển thị bình luận)      │
     │                           │
couponService.validateCoupon()   POST /api/coupon/validate
     │                           │                          Coupon
     └──────────────────────────>│                          
                                 │────────────────────────>
                                 │                          Coupon
                                 │<────────────────────────│
     │<──────────────────────────│ { valid, discount, ... }
     │ (Hiển thị tiền giảm)      │
     │                           │
```

---

## 📱 Responsive Design

```
🖥️ DESKTOP (≥1200px)          📱 MOBILE (<600px)
┌─────────────────────────┐   ┌──────────┐
│ [S1] [S2] [S3] [S4]     │   │ [S1]     │
│ [S5] [S6] [S7] [S8]     │   ├──────────┤
│ [S9] [S10][S11][S12]    │   │ [S2]     │
└─────────────────────────┘   ├──────────┤
                              │ [S3]     │
💻 TABLET (768-1199px)        └──────────┘
┌──────────────────────┐
│ [S1] [S2] [S3]       │
│ [S4] [S5] [S6]       │
│ [S7] [S8] [S9]       │
└──────────────────────┘
```

---

## 🎯 Sơ đồ Component

```
App.js
│
├─ Route: /shopping
│  └─ CustomerShoppingPage
│     ├─ BannerCarousel
│     ├─ FlashSaleCarousel
│     └─ Product Cards (Grid)
│        └─ Dialog
│           ├─ ProductReviews
│           └─ ReviewForm
│
└─ Route: /shopping-cart
   └─ ShoppingCartPage
      ├─ Cart Table
      ├─ CouponInput
      └─ Checkout Dialog
```

---

## 🔌 API Endpoints

```
PRODUCTS
GET  /api/product              → Danh sách sản phẩm

CART
GET  /api/cart/user/{userId}   → Lấy giỏ hàng
POST /api/cart                 → Thêm vào giỏ
PUT  /api/cart/{id}            → Cập nhật số lượng
DEL  /api/cart/{id}            → Xóa từng sản phẩm
DEL  /api/cart/user/{userId}   → Xóa toàn bộ

REVIEWS
GET  /api/review/product/{id}  → Bình luận sản phẩm
POST /api/review               → Viết bình luận
PUT  /api/review/{id}/approve  → Phê duyệt (admin)

COUPONS
POST /api/coupon/validate      → Kiểm tra mã giảm giá

FLASH SALES
GET  /api/flashsale/active     → Khuyến mãi đang chạy

BANNERS
GET  /api/banner/active        → Banner đang hiển thị
```

---

## ✨ Tính Năng & Màu Sắc

```
🎨 SCHEMA MÀU

Chính: #1976d2 (Xanh dương)
   - Header, button primary, tổng tiền

Phụ: #d32f2f (Đỏ)
   - Giá bán, giảm giá, lỗi

Thành công: #2e7d32 (Xanh lá)
   - Nút thanh toán, thông báo thành công

Cảnh báo: #f57c00 (Cam)
   - Flash sale, khuyến mãi

Neutral: #9e9e9e (Xám)
   - Text secondary, border

Nền: #ffffff / #f5f5f5
   - Card, container
```

---

## 📊 Dữ Liệu Mẫu

```
SẢN PHẨM
┌─ ProductId: 1
├─ Name: "Xi Măng Lafarge 50kg"
├─ Description: "Xi măng chất lượng cao"
├─ Price: 200000
└─ Quantity: 1250

GIỎ HÀNG
┌─ CartId: 1
├─ UserId: 1
├─ ProductId: 1
├─ Quantity: 2
└─ Price: 200000

BÌNH LUẬN
┌─ ReviewId: 1
├─ UserId: 2
├─ ProductId: 1
├─ Rating: 5
├─ Comment: "Sản phẩm tốt"
└─ IsApproved: true

MÃ GIẢM GIÁ
┌─ CouponId: 1
├─ Code: "SUMMER2024"
├─ DiscountPercentage: 10
├─ MinOrderAmount: 1000000
└─ IsValid(): true
```

---

**✅ Đây là giao diện hoàn chỉnh cho người mua hàng! Truy cập: `http://localhost:3001/shopping` 🚀**
