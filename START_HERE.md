# 🚀 Quản Lý Của Hàng Vật Liệu Xây Dựng - BẮT ĐẦU TẠI ĐÂY

## ✅ CÁC BƯỚC CÀI ĐẶT NHANH

### 1️⃣ **CẢI ĐẶT CƠ SỞ DỮ LIỆU (5 phút)**

```bash
# Mở SQL Server Management Studio
# Hoặc dùng SQL Server Express/LocalDB
# Thực thi file: Database/Schema.sql

# Hoặc chạy lệnh PowerShell
sqlcmd -S . -d master -i "Database\Schema.sql"
```

✅ Sẽ tạo:
- Database: `BuildingMaterialDB`
- 22 bảng
- Dữ liệu mẫu (Admin user, Categories, Roles)

---

### 2️⃣ **KHỞI ĐỘNG BACKEND API (5 phút)**

```bash
cd Backend

# Cài đặt dependencies
dotnet restore

# Tạo database từ migrations
dotnet ef database update

# Chạy server
dotnet run
```

✅ API chạy tại: **https://localhost:5001**

**Swagger UI**: https://localhost:5001/swagger/index.html

---

### 3️⃣ **KHỞI ĐỘNG FRONTEND WEB (5 phút)**

```bash
cd Frontend

# Cài đặt npm packages
npm install

# Chạy development server
npm start
```

✅ Web chạy tại: **http://localhost:3000**

📝 **Đăng nhập với**:
- Username: `admin`
- Password: `admin123`

---

### 4️⃣ **KHỞI ĐỘNG MOBILE APP (5 phút) - Tùy chọn**

```bash
cd Mobile

# Cài đặt dependencies
flutter pub get

# Chạy trên emulator/device
flutter run
```

---

## 🔐 THÔNG TIN ĐĂNG NHẬP MẶC ĐỊNH

| Trường | Giá trị |
|-------|--------|
| **Username** | admin |
| **Password** | admin123 |
| **Role** | Admin (Toàn quyền) |

---

## 📚 TÀI LIỆU CHỉ DẪN

| File | Nội dung |
|------|---------|
| **README.md** | Tổng quan dự án, các tính năng |
| **SETUP_GUIDE.md** | Hướng dẫn cài đặt chi tiết |
| **INDEX.md** | Cấu trúc thư mục dự án |
| **Schema.md** | Mô tả chi tiết cơ sở dữ liệu |
| **Docs/DEVELOPMENT_GUIDE.md** | Hướng dẫn phát triển chi tiết |

**👉 Bắt đầu với: README.md**

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

```
Backend:    .NET 8.0 + Entity Framework Core + SQL Server
Frontend:   React 18 + Redux + Material-UI
Mobile:     Flutter + Dart
Database:   SQL Server 2019+
API:        RESTful với JWT Authentication
```

---

## 📋 DANH SÁCH KIỂM TRA CÀI ĐẶT

### Backend
- [ ] SQL Server đang chạy
- [ ] Database `BuildingMaterialDB` được tạo
- [ ] .NET 8.0 SDK cài đặt
- [ ] `dotnet ef database update` hoàn thành
- [ ] `dotnet run` không lỗi

### Frontend
- [ ] Node.js 18+ cài đặt
- [ ] `npm install` hoàn thành
- [ ] `npm start` không lỗi
- [ ] Trình duyệt mở localhost:3000
- [ ] Đăng nhập thành công

### Mobile (tùy chọn)
- [ ] Flutter 3.0+ cài đặt
- [ ] Emulator hoặc device chuẩn bị
- [ ] `flutter pub get` hoàn thành
- [ ] `flutter run` không lỗi

---

## ⚠️ KHẮC PHỤC SỰ CỐ

### Backend không chạy
```bash
# Kiểm tra port 5001
netstat -ano | findstr :5001

# Xóa migrations cũ nếu cần
dotnet ef database drop
dotnet ef database update
```

### Frontend không kết nối được Backend
- ✅ Kiểm tra Backend đang chạy
- ✅ Kiểm tra URL: https://localhost:5001
- ✅ Kiểm tra CORS trong Backend

### Database connection failed
```
Server=.;Database=BuildingMaterialDB;Trusted_Connection=true;
```

---

## 📂 CẤU TRÚC THỨ MỤC

```
QuanLyVatLieuXayDung/
├── Backend/              ← .NET API
├── Frontend/             ← React Web
├── Mobile/               ← Flutter App
├── Database/
│   └── Schema.sql        ← Database script
├── README.md
├── SETUP_GUIDE.md
├── INDEX.md
├── Schema.md
└── START_HERE.md         ← Bạn đang xem tại đây
```

---

## 🎯 CÁC TÍNH NĂNG CHÍNH

✅ **Quản lý người dùng & quyền hạn**
✅ **Quản lý sản phẩm & danh mục**
✅ **Quản lý kho hàng (Inventory)**
✅ **Quản lý đơn hàng (Orders)**
✅ **Quản lý khách hàng**
✅ **Quản lý nhà cung cấp**
✅ **Quản lý giao hàng (Deliveries)**
✅ **Quản lý thanh toán & công nợ**
✅ **Báo cáo & thống kê**
✅ **Theo dõi hàng hóa trên Mobile**

---

## 🚀 BƯỚC TIẾP THEO

1. ✅ Cài đặt theo hướng dẫn bên trên
2. 📖 Đọc **README.md** để hiểu dự án
3. 🔍 Xem **Schema.md** để hiểu database
4. 💻 Xem **DEVELOPMENT_GUIDE.md** để phát triển thêm

---

## 📞 HỖ TRỢ

- **Vấn đề cơ sở dữ liệu**: Xem **SETUP_GUIDE.md**
- **Vấn đề Backend**: Kiểm tra logs trong console
- **Vấn đề Frontend**: Mở DevTools (F12) kiểm tra console
- **Vấn đề chung**: Xem **DEVELOPMENT_GUIDE.md**

---

## ✨ HOÀN THÀNH!

Dự án của bạn đã sẵn sàng. Hãy bắt đầu bằng cách:

1. Cài đặt Database (Schema.sql)
2. Chạy Backend
3. Chạy Frontend
4. Đăng nhập với admin/admin123
5. Bắt đầu phát triển! 🎉

---

**Phiên bản**: 1.0.0-alpha  
**Ngày tạo**: 2026-02-02  
**Trạng thái**: Đang phát triển
