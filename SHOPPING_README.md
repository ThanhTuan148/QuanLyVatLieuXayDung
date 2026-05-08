# 🛍️ Giao Diện Mua Hàng Người Dùng

## 🎯 Câu Trả Lời Nhanh

### Để Vào Giao Diện Mua Hàng:

```
🌐 http://localhost:3001/shopping
```

---

## ⚡ 3 Bước Nhanh

### 1. Khởi động Backend
```bash
cd Backend
dotnet run
```

### 2. Khởi động Frontend  
```bash
cd Frontend
npm start
```

### 3. Truy cập
```
http://localhost:3001/shopping
```

---

## 📱 Giao Diện

### Trang Mua Hàng: `/shopping`
```
┌─ Banner Carousel (quảng cáo)
├─ Flash Sale Carousel (khuyến mãi)
├─ Tìm kiếm & Sắp xếp
├─ Danh sách sản phẩm (4 cột)
│  └─ Nút "Chi Tiết"
└─ Nút "Giỏ Hàng"
```

### Trang Giỏ Hàng: `/shopping-cart`
```
┌─ Bảng sản phẩm
├─ Mã giảm giá
├─ Tóm tắt tiền
└─ Nút "Thanh Toán"
```

---

## ✨ Các Tính Năng

| Tính Năng | Nơi | Chi Tiết |
|-----------|-----|---------|
| 🔍 Tìm kiếm | `/shopping` | Tìm sản phẩm theo tên |
| 📊 Sắp xếp | `/shopping` | Giá cao/thấp, Tên A-Z |
| 🖼️ Banner | `/shopping` | Carousel quảng cáo tự động |
| ⚡ Flash Sale | `/shopping` | Khuyến mãi với thời gian hạn |
| ⭐ Đánh giá | `/shopping` | Bình luận 1-5 sao |
| 💬 Viết review | `/shopping` | Gửi bình luận riêng |
| 🛒 Giỏ hàng | `/shopping-cart` | Quản lý sản phẩm |
| 🎟️ Mã giảm | `/shopping-cart` | Nhập coupon giảm giá |
| 💳 Thanh toán | `/shopping-cart` | Hoàn tất đơn hàng |

---

## 🔗 2 URL Chính

| URL | Tác Dụng |
|-----|----------|
| `http://localhost:3001/shopping` | Xem & mua sản phẩm |
| `http://localhost:3001/shopping-cart` | Xem giỏ & thanh toán |

---

## 📚 Tài Liệu Chi Tiết

Xem thêm:
- [CUSTOMER_SHOPPING_GUIDE.md](CUSTOMER_SHOPPING_GUIDE.md) - Hướng dẫn đầy đủ
- [SHOPPING_QUICK_START.md](SHOPPING_QUICK_START.md) - Bắt đầu nhanh
- [SHOPPING_UI_GUIDE.md](SHOPPING_UI_GUIDE.md) - Mô tả giao diện
- [CUSTOMER_SHOPPING_COMPLETE.md](CUSTOMER_SHOPPING_COMPLETE.md) - Tóm tắt hoàn chỉnh

---

## ✅ Kiểm Tra

```
✅ Backend chạy: http://localhost:5000 (health check)
✅ Frontend chạy: http://localhost:3001
✅ Giao diện mua hàng: http://localhost:3001/shopping
```

---

**Vào ngay: `http://localhost:3001/shopping` 🚀**
