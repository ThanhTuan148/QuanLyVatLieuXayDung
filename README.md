# Quản Lý Của Hàng Vật Liệu Xây Dựng
## Building Material Store Management System

### 📋 Mô Tả Dự Án
Ứng dụng quản lý của hàng vật liệu xây dựng - một hệ thống toàn diện cho phép:
- Khảo sát, phân tích, thiết kế hệ thống quản lý
- Quản lý người dùng, danh mục sản phẩm, đơn hàng
- Quản lý nhân viên, kho hàng, giao hàng
- Theo dõi, báo cáo và thống kê

### 🏗️ Kiến Trúc Hệ Thống

```
QuanLyVatLieuXayDung/
├── Backend/              # .NET Core API
├── Frontend/             # React Web Application
├── Mobile/               # Flutter Mobile App
├── Database/             # SQL Server Scripts
└── Docs/                 # Documentation
```

### 🛠️ Công Nghệ Sử Dụng

| Layer | Technology |
|-------|-----------|
| Backend | .NET 7/8, ASP.NET Core, Entity Framework Core |
| Frontend | React 18, Redux, Material-UI, Axios |
| Mobile | Flutter, Dart |
| Database | SQL Server 2019+ |
| API | RESTful API |

### ✨ Các Chức Năng Chính

#### 📱 Web Platform
- **Quản lý người dùng**: Đăng nhập, đăng xuất, quản lý quyền
- **Quản lý danh mục**: Nhà cung cấp, khách hàng, nhân viên, hàng hóa
- **Quản lý nhập hàng**: Tồn kho, nhập kho, xuất kho
- **Quản lý đơi - trả hàng**: Đơn hàng, trả hàng
- **Quản lý khách hàng**: Đặt hàng
- **Quản lý bán hàng**: Hóa đơn
- **Quản lý giao hàng**: Theo dõi
- **Quản lý kho**: Nhập, tồn kho, xuất kho
- **Quản lý thanh toán, công nợ, đặt cọc**
- **Quản lý khuyến mại**: Tìm kiếm hàng hóa, thông tin khuyến mại
- **Báo cáo & Thống kê**: Tồn kho, doanh thu, sản phẩm bán chạy

#### 📱 Mobile Platform
- Theo dõi tồn kho, nhắc lịch nhập hàng và đơn đơn hàng
- Theo dõi tiến độ giao hàng
- Cảnh báo hàng hóa sắp hết, đơn hàng trễ

### 📊 Cơ Sở Dữ Liệu

#### Các bảng chính:
- **Users**: Người dùng, vai trò, quyền
- **Products**: Sản phẩm, thông tin chi tiết, giá
- **Categories**: Danh mục sản phẩm
- **Suppliers**: Nhà cung cấp
- **Customers**: Khách hàng
- **Inventory**: Tồn kho
- **Orders**: Đơn hàng
- **OrderDetails**: Chi tiết đơn hàng
- **Returns**: Trả hàng
- **Deliveries**: Giao hàng
- **Payments**: Thanh toán
- **Reports**: Báo cáo

### 🚀 Hướng Dẫn Cài Đặt

#### Backend (.NET)
```bash
cd Backend
dotnet new webapi -n BuildingMaterialAPI
cd BuildingMaterialAPI
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet restore
dotnet run
```

#### Frontend (React)
```bash
cd Frontend
npx create-react-app building-material-web
cd building-material-web
npm install axios react-router-dom redux react-redux
npm start
```

#### Mobile (Flutter)
```bash
cd Mobile
flutter create building_material_app
cd building_material_app
flutter pub get
flutter run
```

### 📚 Cấu Trúc Folder Backend

```
Backend/
├── Models/              # Entity Models
├── DTOs/                # Data Transfer Objects
├── Controllers/         # API Controllers
├── Services/            # Business Logic
├── Repositories/        # Data Access
├── Data/                # DbContext
├── Migrations/          # Database Migrations
├── Middleware/          # Custom Middleware
└── appsettings.json     # Configuration
```

### 📚 Cấu Trúc Folder Frontend

```
Frontend/
├── src/
│   ├── components/      # React Components
│   ├── pages/          # Page Components
│   ├── services/       # API Services
│   ├── redux/          # Redux Store
│   ├── styles/         # CSS Styles
│   └── App.js
├── public/
└── package.json
```

### 👥 Các Vai Trò (Roles)

- **Admin**: Quản lý hệ thống toàn bộ
- **Manager**: Quản lý kho và bán hàng
- **Staff**: Nhân viên bán hàng, kho
- **Customer**: Khách hàng

### 📝 Ghi Chú

- Hệ thống sử dụng JWT cho authentication
- API sử dụng pattern RESTful
- Database sử dụng SQL Server với Entity Framework Core
- Mobile app hỗ trợ iOS và Android

### 📧 Liên Hệ

Dự án thiết kế và phát triển bởi: Trương Thanh Tuấn
Giáo viên hướng dẫn: Đinh Thị Mận - HUIT

---
**Năm Học**: 02/02/2025-24/05/2026
