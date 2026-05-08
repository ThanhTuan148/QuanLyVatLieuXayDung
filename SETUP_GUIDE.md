# SETUP GUIDE - Quản Lý Của Hàng Vật Liệu Xây Dựng

## 🚀 Quick Start (5 phút)

### 1. Database Setup
```bash
# Mở SQL Server Management Studio
# Run script: Database/Schema.sql
# Hoặc sử dụng SQL Server Express/LocalDB
```

### 2. Backend Setup
```bash
cd Backend
dotnet restore
dotnet ef database update
dotnet run
# Server chạy tại: https://localhost:5001
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm start
# Web chạy tại: http://localhost:3000
# Đăng nhập: admin / admin123
```

### 4. Mobile Setup (Optional)
```bash
cd Mobile
flutter pub get
flutter run
```

---

## 📋 Checklists

### Backend Tasks
- [ ] Implement UserService
- [ ] Implement ProductService
- [ ] Implement OrderService
- [ ] Implement InventoryService
- [ ] Implement DeliveryService
- [ ] Add JWT Authentication
- [ ] Create API Controllers
- [ ] Add Error Handling Middleware
- [ ] Add Logging
- [ ] Create Unit Tests

### Frontend Tasks
- [ ] Implement ProductList component
- [ ] Implement OrderList component
- [ ] Implement CustomerManagement
- [ ] Implement InventoryPage
- [ ] Add Form validation
- [ ] Add Loading states
- [ ] Add Error handling
- [ ] Implement Search functionality
- [ ] Add Pagination
- [ ] Create responsive design

### Mobile Tasks
- [ ] Implement Product screen
- [ ] Implement Inventory tracking
- [ ] Implement Delivery tracking
- [ ] Add notifications
- [ ] Offline support
- [ ] Push notifications
- [ ] Camera integration
- [ ] Barcode scanner

### Database Tasks
- [ ] Verify all tables created
- [ ] Add indexes
- [ ] Create stored procedures (optional)
- [ ] Create views for reports
- [ ] Backup/Restore procedures

---

## 🔐 Credentials

**Default Admin Account:**
- Username: `admin`
- Password: `admin123`
- Role: Admin

---

## 🐛 Troubleshooting

### Backend Issues
- **Port already in use**: `netstat -ano | findstr :5001`
- **Database connection failed**: Check SQL Server is running and connection string
- **CORS issues**: Check CORS policy in Program.cs

### Frontend Issues
- **npm install errors**: Delete node_modules and package-lock.json, then reinstall
- **API connection refused**: Check backend is running on https://localhost:5001
- **Port 3000 in use**: `lsof -i :3000` (Mac/Linux) or use different port

### Mobile Issues
- **Flutter doctor errors**: Run `flutter pub get` and `flutter clean`
- **Emulator connection**: Use `10.0.2.2:5001` for Android emulator
- **iOS issues**: Run `flutter clean` and `pod install`

---

## 📞 Support

Liên hệ giáo viên hướng dẫn hoặc tham khảo documentation trong Docs folder.
