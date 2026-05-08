# Hướng Dẫn Phát Triển - Quản Lý Của Hàng Vật Liệu Xây Dựng

## 📋 Mục Lục
1. [Cài Đặt Môi Trường](#cài-đặt-môi-trường)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Backend (.NET)](#backend-net)
4. [Frontend (React)](#frontend-react)
5. [Mobile (Flutter)](#mobile-flutter)
6. [Database](#database)
7. [Testing](#testing)
8. [Deployment](#deployment)

## 🔧 Cài Đặt Môi Trường

### Yêu Cầu Hệ Thống
- **OS**: Windows 10/11
- **.NET SDK**: 7.0 hoặc 8.0
- **Node.js**: v18.0 hoặc cao hơn
- **Flutter SDK**: 3.0+
- **SQL Server**: 2019 hoặc Express Edition
- **Visual Studio Code** hoặc **Visual Studio 2022**

### 1. Cài Đặt .NET
```bash
# Download từ: https://dotnet.microsoft.com/download
# Kiểm tra version
dotnet --version
```

### 2. Cài Đặt Node.js
```bash
# Download từ: https://nodejs.org
# Kiểm tra version
node --version
npm --version
```

### 3. Cài Đặt SQL Server
```bash
# Download SQL Server Express: https://www.microsoft.com/sql-server/sql-server-downloads
# Hoặc sử dụng LocalDB trong Visual Studio
```

### 4. Cài Đặt Flutter
```bash
# Clone Flutter repository
git clone https://github.com/flutter/flutter.git -b stable

# Thêm vào PATH (Windows)
# Chạy flutter doctor để kiểm tra setup
flutter doctor
```

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐
│   Mobile App    │
│  (Flutter)      │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
┌────────▼──────┐  ┌───▼──────────────┐
│ React Web App │  │  RESTful API     │
│  (Frontend)   │  │  (.NET Core)     │
└────────┬──────┘  └───┬──────────────┘
         │              │
         └──────┬───────┘
                │
         ┌──────▼────────┐
         │ SQL Server DB  │
         │  (Database)    │
         └────────────────┘
```

## Backend (.NET)

### Thiết Lập Ban Đầu

```bash
cd Backend

# Khôi phục dependencies
dotnet restore

# Tạo database
dotnet ef database update

# Chạy server
dotnet run
```

**URL**: `https://localhost:5001`

### Cấu Trúc Thư Mục

```
Backend/
├── Models/              # Entity Models (User, Product, Order, etc.)
├── DTOs/                # Data Transfer Objects
├── Controllers/         # API Endpoints
├── Services/            # Business Logic
├── Repositories/        # Data Access Layer
├── Data/                # DbContext
├── Middleware/          # Custom Middleware
├── Migrations/          # EF Core Migrations
├── Program.cs           # Entry Point
└── appsettings.json     # Configuration
```

### Tạo Migration

```bash
# Tạo migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Revert migration
dotnet ef migrations remove
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất

#### Products
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/{id}` - Chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm

#### Orders
- `GET /api/orders` - Danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng
- `PUT /api/orders/{id}` - Cập nhật đơn hàng
- `PATCH /api/orders/{id}/status` - Cập nhật trạng thái

### Thêm Service Mới

```csharp
// 1. Tạo interface
public interface IMyService
{
    Task<T> GetDataAsync();
}

// 2. Implement service
public class MyService : IMyService
{
    public async Task<T> GetDataAsync()
    {
        // Implementation
    }
}

// 3. Register trong Program.cs
builder.Services.AddScoped<IMyService, MyService>();
```

## Frontend (React)

### Thiết Lập Ban Đầu

```bash
cd Frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm start

# Build production
npm run build
```

**URL**: `http://localhost:3000`

### Cấu Trúc Thư Mục

```
Frontend/
├── src/
│   ├── components/      # React Components
│   ├── pages/          # Page Components
│   ├── services/       # API Services
│   ├── redux/          # Redux Store & Slices
│   ├── styles/         # CSS/Styling
│   ├── App.js
│   └── index.js
├── public/
└── package.json
```

### Tạo Component Mới

```javascript
// src/components/MyComponent.js
import React from 'react';

function MyComponent() {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}

export default MyComponent;
```

### Redux Setup

```javascript
// 1. Tạo slice
// src/redux/slices/mySlice.js
import { createSlice } from '@reduxjs/toolkit';

const mySlice = createSlice({
  name: 'my',
  initialState: [],
  reducers: {
    setData: (state, action) => {
      return action.payload;
    },
  },
});

export const { setData } = mySlice.actions;
export default mySlice.reducer;

// 2. Thêm vào store
// src/redux/store.js
import myReducer from './slices/mySlice';

export const store = configureStore({
  reducer: {
    my: myReducer,
  },
});

// 3. Sử dụng trong component
import { useDispatch, useSelector } from 'react-redux';
import { setData } from '../redux/slices/mySlice';

function MyComponent() {
  const dispatch = useDispatch();
  const data = useSelector(state => state.my);

  const handleData = (newData) => {
    dispatch(setData(newData));
  };

  return (/* JSX */);
}
```

### API Calls

```javascript
// src/services/myService.js
import api from './api';

const myService = {
  getAll: () => api.get('/endpoint'),
  getById: (id) => api.get(`/endpoint/${id}`),
  create: (data) => api.post('/endpoint', data),
  update: (id, data) => api.put(`/endpoint/${id}`, data),
  delete: (id) => api.delete(`/endpoint/${id}`),
};

export default myService;
```

## Mobile (Flutter)

### Thiết Lập Ban Đầu

```bash
cd Mobile

# Tạo project Flutter
flutter create building_material_app

# Lấy dependencies
flutter pub get

# Chạy trên emulator
flutter run

# Build APK
flutter build apk

# Build iOS
flutter build ios
```

### Cấu Trúc Thư Mục

```
Mobile/
├── lib/
│   ├── models/         # Data Models
│   ├── screens/        # Screen Widgets
│   ├── services/       # API Services
│   ├── widgets/        # Reusable Widgets
│   └── main.dart       # Entry Point
├── test/
└── pubspec.yaml        # Dependencies
```

### Tạo Model

```dart
// lib/models/my_model.dart
class MyModel {
  final int id;
  final String name;

  MyModel({
    required this.id,
    required this.name,
  });

  factory MyModel.fromJson(Map<String, dynamic> json) {
    return MyModel(
      id: json['id'],
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}
```

### Tạo Screen

```dart
// lib/screens/my_screen.dart
import 'package:flutter/material.dart';

class MyScreen extends StatefulWidget {
  const MyScreen({Key? key}) : super(key: key);

  @override
  State<MyScreen> createState() => _MyScreenState();
}

class _MyScreenState extends State<MyScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Screen')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Text('Hello Flutter!'),
          ],
        ),
      ),
    );
  }
}
```

## Database

### Tạo Database

```sql
-- Mở SQL Server Management Studio
-- Chạy script từ Database/Schema.sql
```

### Seed Data

```sql
-- Thêm dữ liệu test
INSERT INTO [dbo].[Categories] ([CategoryName], [Description]) VALUES 
    (N'Xi măng', N'Xi măng các loại'),
    (N'Cát đá', N'Cát, đá xây dựng');
```

### Backup Database

```sql
-- Backup
BACKUP DATABASE [BuildingMaterialDB] 
TO DISK = 'C:\Backup\BuildingMaterialDB.bak';

-- Restore
RESTORE DATABASE [BuildingMaterialDB] 
FROM DISK = 'C:\Backup\BuildingMaterialDB.bak';
```

## Testing

### Backend Testing

```bash
cd Backend

# Chạy unit tests
dotnet test
```

### Frontend Testing

```bash
cd Frontend

# Chạy tests
npm test

# Coverage report
npm test -- --coverage
```

### Mobile Testing

```bash
cd Mobile

# Chạy tests
flutter test
```

## Deployment

### Azure Deployment (.NET Backend)

```bash
# Publish untuk production
dotnet publish -c Release -o ./publish

# Deploy to Azure
az webapp up --name myapp
```

### Vercel/Netlify Deployment (React Frontend)

```bash
cd Frontend

# Build
npm run build

# Deploy to Vercel
vercel deploy --prod

# Deploy to Netlify
netlify deploy --prod
```

### Google Play/App Store Deployment (Flutter Mobile)

```bash
# Android APK
flutter build apk --release

# iOS App
flutter build ios --release
```

## 📚 Tài Liệu Thêm

- [.NET Documentation](https://learn.microsoft.com/en-us/dotnet)
- [React Documentation](https://react.dev)
- [Flutter Documentation](https://flutter.dev/docs)
- [SQL Server Documentation](https://learn.microsoft.com/en-us/sql/sql-server)

## 👨‍💻 Đóng Góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License - xem LICENSE file cho chi tiết
