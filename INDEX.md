# 📦 Project Index - Quản Lý Của Hàng Vật Liệu Xây Dựng

## 📂 Cấu Trúc Dự Án

```
QuanLyVatLieuXayDung/
│
├── README.md                          # Tổng quan dự án
├── SETUP_GUIDE.md                     # Hướng dẫn cài đặt nhanh
│
├── Backend/                           # API Backend (.NET)
│   ├── Models/                        # Entity models
│   ├── DTOs/                          # Data transfer objects
│   ├── Controllers/                   # API endpoints
│   ├── Services/                      # Business logic
│   ├── Repositories/                  # Data access
│   ├── Data/                          # Database context
│   ├── Program.cs                     # Entry point
│   ├── appsettings.json              # Configuration
│   └── BuildingMaterialAPI.csproj    # Project file
│
├── Frontend/                          # Web Frontend (React)
│   ├── src/
│   │   ├── components/                # React components
│   │   ├── pages/                     # Page components
│   │   ├── services/                  # API services
│   │   ├── redux/
│   │   │   ├── store.js              # Redux store
│   │   │   └── slices/               # Redux slices
│   │   ├── styles/                    # CSS files
│   │   ├── App.js                     # Main app component
│   │   └── index.js                   # Entry point
│   ├── public/                        # Static files
│   └── package.json                   # Dependencies
│
├── Mobile/                            # Mobile App (Flutter)
│   ├── lib/
│   │   ├── models/                    # Data models
│   │   ├── screens/                   # Screen widgets
│   │   ├── services/                  # API services
│   │   ├── widgets/                   # Reusable widgets
│   │   └── main.dart                  # Entry point
│   ├── test/                          # Test files
│   └── pubspec.yaml                   # Dependencies
│
├── Database/                          # Database scripts
│   └── Schema.sql                     # Database schema & seed data
│
└── Docs/                              # Documentation
    └── DEVELOPMENT_GUIDE.md           # Detailed development guide
```

## 🎯 Key Files & Their Purposes

### Backend (.NET)

| File | Purpose |
|------|---------|
| Program.cs | Application entry point, dependency injection, middleware configuration |
| appsettings.json | Configuration settings (connection string, JWT, CORS) |
| Models/*.cs | Entity models (User, Product, Order, etc.) |
| DTOs/*.cs | Data transfer objects for API requests/responses |
| Data/ApplicationDbContext.cs | Entity Framework DbContext |
| Services/IUserService.cs | User service interface |
| Repositories/Repository.cs | Generic repository pattern implementation |

### Frontend (React)

| File | Purpose |
|------|---------|
| App.js | Main app component, routing logic |
| index.js | React app entry point |
| services/api.js | Axios configuration with interceptors |
| services/authService.js | Authentication logic |
| redux/store.js | Redux store configuration |
| redux/slices/*.js | Redux state management slices |
| pages/*.js | Page-level components |
| components/Layout.js | Navigation and layout component |

### Mobile (Flutter)

| File | Purpose |
|------|---------|
| main.dart | Application entry point |
| lib/screens/login_screen.dart | Login screen UI |
| lib/screens/home_screen.dart | Home/dashboard screen |
| lib/services/api_service.dart | API communication with Dio |
| lib/services/shared_preferences_service.dart | Local storage |
| lib/models/*.dart | Data models |

### Database

| File | Purpose |
|------|---------|
| Database/Schema.sql | Complete database schema, tables, indexes, and seed data |

---

## 🔄 Technology Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **ORM**: Entity Framework Core
- **Database**: SQL Server 2019+
- **Authentication**: JWT Tokens
- **API**: RESTful

### Frontend
- **Framework**: React 18
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6

### Mobile
- **Framework**: Flutter
- **Language**: Dart
- **HTTP Client**: Dio
- **Local Storage**: Shared Preferences
- **Platforms**: iOS & Android

---

## 📖 How to Use This Project

### 1️⃣ First Time Setup
1. Read [README.md](README.md)
2. Follow [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. Read [DEVELOPMENT_GUIDE.md](Docs/DEVELOPMENT_GUIDE.md)

### 2️⃣ Understanding the Architecture
```
User (Mobile/Web)
    ↓
API Calls (HTTP/HTTPS)
    ↓
Backend (.NET Core)
    ├─ Authentication
    ├─ Business Logic
    └─ Data Access
    ↓
Database (SQL Server)
```

### 3️⃣ Development Workflow

#### Backend Development
```bash
cd Backend
dotnet run  # Start API server
# API runs at: https://localhost:5001
```

#### Frontend Development
```bash
cd Frontend
npm start   # Start React dev server
# Web runs at: http://localhost:3000
# Access with credentials: admin/admin123
```

#### Mobile Development
```bash
cd Mobile
flutter run  # Run on emulator/device
```

---

## 📋 Main Features Implemented

### ✅ Completed
- Project structure setup
- Database schema design
- Backend models & DTOs
- Frontend components structure
- Mobile app skeleton
- Authentication flow
- Redux store setup
- Navigation system

### 🔄 In Progress / To Do
- Implement backend services
- Create API controllers
- Complete frontend pages
- Add mobile screens
- Implement business logic
- Add error handling
- Create unit tests
- Setup deployment

---

## 🔑 Important Credentials

**Default Admin User:**
- **Username**: admin
- **Password**: admin123
- **Role**: Admin

---

## 📞 Getting Help

### For Backend Issues
- Check `Backend/appsettings.json` connection string
- Run `dotnet ef database update` for migrations
- Review `DEVELOPMENT_GUIDE.md` - Backend section

### For Frontend Issues
- Ensure backend is running on https://localhost:5001
- Check browser console for error messages
- Review `DEVELOPMENT_GUIDE.md` - Frontend section

### For Mobile Issues
- Run `flutter doctor` to check setup
- Use `10.0.2.2:5001` for Android emulator
- Review `DEVELOPMENT_GUIDE.md` - Mobile section

---

## 📚 Documentation Hierarchy

1. **README.md** ← Start here! (Project overview)
2. **SETUP_GUIDE.md** ← Quick start guide
3. **This file (INDEX.md)** ← Project structure & navigation
4. **DEVELOPMENT_GUIDE.md** ← Detailed development documentation
5. **Individual code files** ← Specific implementations

---

## 🚀 Next Steps

1. [ ] Setup development environment (see SETUP_GUIDE.md)
2. [ ] Create database (run Database/Schema.sql)
3. [ ] Start backend (cd Backend && dotnet run)
4. [ ] Start frontend (cd Frontend && npm start)
5. [ ] Login with admin credentials
6. [ ] Begin implementing features

---

## 📅 Project Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Requirement Analysis | 2 weeks | ✅ Complete |
| System Design | 2 weeks | ✅ Complete |
| Database Design | 1 week | ✅ Complete |
| Project Setup | 1 week | ✅ Complete |
| Backend Development | 4 weeks | 🔄 In Progress |
| Frontend Development | 4 weeks | 🔄 In Progress |
| Mobile Development | 4 weeks | 🔄 In Progress |
| Testing | 2 weeks | ⏳ Not Started |
| Deployment | 1 week | ⏳ Not Started |

---

**Created**: 2026-02-02  
**Last Updated**: 2026-02-02 