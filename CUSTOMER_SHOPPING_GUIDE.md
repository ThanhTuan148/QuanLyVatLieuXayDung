# 🛍️ Hướng Dẫn Truy Cập Giao Diện Người Mua Hàng

## Cách Truy Cập Giao Diện Mua Hàng

### 1️⃣ **URL Trực Tiếp**

Mở trình duyệt web và truy cập:

```
http://localhost:3001/shopping
```

**Đó là nó!** ✅ Bạn sẽ thấy giao diện cửa hàng vật liệu xây dựng.

---

### 2️⃣ **Đăng Nhập (Nếu Cần)**

Nếu hệ thống yêu cầu đăng nhập:
- **Email**: admin@example.com
- **Password**: password123

Sau khi đăng nhập, bạn có thể truy cập `/shopping`

---

## 🎯 Các Tính Năng Chính

### 🛒 **Trang Mua Hàng** (`/shopping`)
```
URL: http://localhost:3001/shopping

Các tính năng:
✅ Xem tất cả sản phẩm
✅ Tìm kiếm sản phẩm theo tên
✅ Sắp xếp: Tên A-Z, Giá Thấp, Giá Cao
✅ Xem chi tiết sản phẩm
✅ Đọc bình luận/đánh giá từ khách khác
✅ Viết bình luận và đánh giá ⭐ (1-5 sao)
✅ Xem flash sale (khuyến mãi thời gian hạn chế)
✅ Xem banner quảng cáo
✅ Thêm sản phẩm vào giỏ hàng
```

### 🛒 **Trang Giỏ Hàng** (`/shopping-cart`)
```
URL: http://localhost:3001/shopping-cart

Các tính năng:
✅ Xem danh sách sản phẩm trong giỏ
✅ Thay đổi số lượng
✅ Xóa sản phẩm khỏi giỏ
✅ Xóa toàn bộ giỏ hàng
✅ Tính tổng tiền
✅ Áp dụng mã giảm giá 🎟️
✅ Xem chi tiết thanh toán
✅ Thanh toán và hoàn tất đơn hàng
```

---

## 📱 **Quy Trình Mua Hàng Hoàn Chỉnh**

### Step 1: Vào Cửa Hàng
```
http://localhost:3001/shopping
```

### Step 2: Duyệt Sản Phẩm
- 👀 Xem banner quảng cáo
- ⚡ Xem các sản phẩm flash sale
- 🔍 Tìm kiếm sản phẩm cụ thể
- 📊 Sắp xếp theo giá hoặc tên

### Step 3: Xem Chi Tiết Sản Phẩm
```
Click nút "Chi Tiết" trên sản phẩm
- Xem mô tả đầy đủ
- Xem giá và tồn kho
- Đọc đánh giá từ khách hàng khác
- Viết đánh giá của bạn
```

### Step 4: Thêm Vào Giỏ Hàng
```
Trong dialog chi tiết sản phẩm:
1. Chọn số lượng
2. Click "Thêm Vào Giỏ"
3. Thông báo thành công sẽ hiện
```

### Step 5: Xem Giỏ Hàng
```
Cách 1: Click nút "Giỏ Hàng" trên trang shopping
Cách 2: Truy cập trực tiếp: http://localhost:3001/shopping-cart
```

### Step 6: Áp Dụng Mã Giảm Giá
```
Nếu có mã giảm giá:
1. Nhập mã vào ô "Mã Giảm Giá"
2. Click "Áp Dụng"
3. Hệ thống sẽ tính tiền giảm
```

### Step 7: Thanh Toán
```
1. Click "Thanh Toán"
2. Nhập thông tin giao hàng:
   - Tên khách hàng
   - Số điện thoại
   - Địa chỉ
   - Ghi chú (tùy chọn)
3. Click "Xác Nhận Thanh Toán"
4. Thông báo thành công ✅
```

---

## 🌟 **Các Tính Năng E-Commerce**

### 💬 **Hệ Thống Bình Luận & Đánh Giá**
```
- Khách hàng có thể viết bình luận 1-5 sao
- Admin sẽ phê duyệt trước khi hiển thị
- Mỗi sản phẩm hiển thị số bình luận trung bình
- Hiển thị tên, ngày gửi, nội dung bình luận
```

### ⚡ **Flash Sale (Khuyến Mãi Thời Gian Hạn Chế)**
```
- Hiển thị trên carousel trang chủ
- Hiển thị thời gian còn lại
- Tự động cập nhật khi hết hạn
- Giá sale rẻ hơn giá thường
```

### 🎟️ **Mã Giảm Giá (Coupon)**
```
- Nhập mã giảm giá khi thanh toán
- Hệ thống tự động tính tiền giảm
- Hỗ trợ % giảm và giảm tối đa
- Có điều kiện giá đơn hàng tối thiểu
- Có hạn sử dụng (ngày hết hạn)
```

### 🖼️ **Banner Quảng Cáo**
```
- Carousel tự động xoay hình ảnh
- Click các nút điều hướng
- Click "Learn More" để vào liên kết
- Hiển thị theo lịch (nếu cài đặt ngày)
```

### 🛒 **Giỏ Hàng Thông Minh**
```
- Thêm sản phẩm tự động gộp số lượng
- Thay đổi số lượng thực tế
- Tính tổng tiền tự động
- Lưu giỏ hàng trên server
- Xóa từng sản phẩm hoặc toàn bộ
```

---

## ⚙️ **Yêu Cầu Hệ Thống**

### Backend Phải Chạy
```bash
# Terminal 1 - Backend
cd Backend
dotnet run

# Sẽ chạy tại http://localhost:5000
```

### Frontend Phải Chạy
```bash
# Terminal 2 - Frontend
cd Frontend
npm start

# Sẽ chạy tại http://localhost:3001
```

### Database Phải Sẵn Sàng
```
SQL Server phải chạy
Database: QuanLyVatLieuXayDung
```

---

## 🔧 **Troubleshooting**

### ❌ Lỗi: "Cannot GET /shopping"
**Giải pháp:**
- Kiểm tra Frontend đã chạy: `npm start` từ thư mục Frontend
- Kiểm tra URL: Phải là `http://localhost:3001/shopping`

### ❌ Lỗi: "Cannot fetch products"
**Giải pháp:**
- Kiểm tra Backend đã chạy: `dotnet run` từ thư mục Backend
- Kiểm tra Port: Backend phải chạy ở port 5000
- Kiểm tra Database connection

### ❌ Lỗi: "Sản phẩm không tải được"
**Giải pháp:**
- Kiểm tra `/api/product` endpoint bằng Postman
- Kiểm tra có dữ liệu trong database không
- Xem console browser (F12) để xem chi tiết lỗi

### ❌ Lỗi: "Không thêm được vào giỏ hàng"
**Giải pháp:**
- Kiểm tra Cart table có trong database không
- Chạy migrations: `dotnet ef database update`
- Kiểm tra userId có hợp lệ không (thường là 1)

---

## 📊 **Cấu Trúc Database**

Các bảng cần có để chạy được giao diện:

```sql
✅ Products              - Danh sách sản phẩm
✅ Cart                  - Giỏ hàng
✅ Review                - Bình luận & đánh giá
✅ FlashSale             - Khuyến mãi thời gian hạn chế
✅ FlashSaleItem         - Sản phẩm trong flash sale
✅ Coupon                - Mã giảm giá
✅ Banner                - Hình ảnh quảng cáo
```

---

## 🎬 **Ví Dụ Thực Tế**

### Ví Dụ 1: Mua Sắm Bình Thường
```
1. Truy cập http://localhost:3001/shopping
2. Tìm kiếm "xi măng"
3. Click "Chi Tiết" sản phẩm
4. Chọn số lượng = 2
5. Click "Thêm Vào Giỏ"
6. Đọc một vài đánh giá
7. Viết đánh giá 5 sao
8. Click "Giỏ Hàng"
9. Nhập mã giảm giá (nếu có)
10. Click "Thanh Toán"
11. Nhập thông tin giao hàng
12. Xác nhận = Đặt hàng thành công! ✅
```

### Ví Dụ 2: Flash Sale
```
1. Vào http://localhost:3001/shopping
2. Xem carousel flash sale
3. Thấy sản phẩm bán rẻ với thời gian hạn chế
4. Click sản phẩm trong flash sale
5. Giá sẽ rẻ hơn giá thường
6. Thêm vào giỏ hàng
```

---

## 📞 **Hỗ Trợ**

Nếu có vấn đề, kiểm tra:
1. Terminal Backend có lỗi không?
2. Terminal Frontend có lỗi không?
3. Mở DevTools (F12) xem console errors
4. Kiểm tra Network tab xem API calls
5. Kiểm tra Database có dữ liệu không

---

**🎉 Vậy là xong! Bạn đã có giao diện mua hàng hoàn chỉnh như trang bán sách!**

**Truy cập ngay: `http://localhost:3001/shopping` 🚀**
