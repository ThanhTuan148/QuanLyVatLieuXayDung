# 📊 Mô Tả Cơ Sở Dữ Liệu (Schema)

## 🗄️ Tổng Quan Database

**Tên Database**: `BuildingMaterialDB`  
**DBMS**: SQL Server 2019+  
**Tổng số bảng**: 22  
**Tổng số liên kết**: 30+

---

## 📑 Danh Sách Các Bảng

### 1. **Roles** - Vai Trò Người Dùng
Quản lý các vai trò trong hệ thống

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| RoleId | INT | Khóa chính (PK) |
| RoleName | NVARCHAR(100) | Tên vai trò (UNIQUE) |
| Description | NVARCHAR(500) | Mô tả vai trò |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

**Dữ liệu mẫu**:
- Admin
- Manager
- Staff
- Customer

---

### 2. **Permissions** - Quyền Hạn
Quản lý các quyền hạn trong hệ thống

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| PermissionId | INT | Khóa chính (PK) |
| PermissionName | NVARCHAR(100) | Tên quyền (UNIQUE) |
| Description | NVARCHAR(500) | Mô tả quyền |
| CreatedAt | DATETIME2 | Ngày tạo |

**Ví dụ quyền**:
- USER_MANAGE (Quản lý người dùng)
- PRODUCT_MANAGE (Quản lý sản phẩm)
- ORDER_MANAGE (Quản lý đơn hàng)
- REPORT_VIEW (Xem báo cáo)

---

### 3. **RolePermissions** - Quyền của Vai Trò
Liên kết giữa Roles và Permissions (N-N)

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| RolePermissionId | INT | Khóa chính (PK) |
| RoleId | INT | Khóa ngoài → Roles |
| PermissionId | INT | Khóa ngoài → Permissions |

---

### 4. **Users** - Người Dùng Hệ Thống
Quản lý tất cả người dùng

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| UserId | INT | Khóa chính (PK) |
| Username | NVARCHAR(100) | Tên đăng nhập (UNIQUE) |
| Email | NVARCHAR(100) | Email (UNIQUE) |
| PasswordHash | NVARCHAR(MAX) | Mật khẩu hash |
| FullName | NVARCHAR(200) | Họ và tên |
| PhoneNumber | NVARCHAR(20) | Số điện thoại |
| Address | NVARCHAR(500) | Địa chỉ |
| RoleId | INT | Khóa ngoài → Roles |
| IsActive | BIT | Trạng thái (0/1) |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |
| LastLogin | DATETIME2 | Lần đăng nhập cuối |

**Người dùng mặc định**:
- Username: admin / Password: admin123 / Role: Admin

---

### 5. **Categories** - Danh Mục Sản Phẩm
Phân loại các sản phẩm

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| CategoryId | INT | Khóa chính (PK) |
| CategoryName | NVARCHAR(200) | Tên danh mục (UNIQUE) |
| Description | NVARCHAR(500) | Mô tả |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

**Ví dụ**:
- Vật liệu xây dựng
- Xi măng
- Cát đá
- Sắt thép
- Gạch ngói

---

### 6. **Products** - Sản Phẩm
Thông tin chi tiết sản phẩm

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| ProductId | INT | Khóa chính (PK) |
| ProductName | NVARCHAR(300) | Tên sản phẩm |
| SKU | NVARCHAR(50) | Mã sản phẩm (UNIQUE) |
| CategoryId | INT | Khóa ngoài → Categories |
| Description | NVARCHAR(1000) | Mô tả sản phẩm |
| Unit | NVARCHAR(50) | Đơn vị (cái, túi, bao...) |
| UnitPrice | DECIMAL(18,2) | Giá bán |
| CostPrice | DECIMAL(18,2) | Giá vốn |
| ReorderLevel | INT | Mức tồn kho tối thiểu |
| IsActive | BIT | Trạng thái (0/1) |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 7. **Inventory** - Tồn Kho
Theo dõi số lượng hàng tồn

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| InventoryId | INT | Khóa chính (PK) |
| ProductId | INT | Khóa ngoài → Products (UNIQUE) |
| QuantityInStock | INT | Số lượng tồn |
| QuantityReserved | INT | Số lượng đặt cọc |
| AvailableQuantity | INT | Số lượng có sẵn |
| WarehouseLocation | NVARCHAR(100) | Vị trí kho |
| LastRestockDate | DATETIME2 | Ngày nhập hàng cuối |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 8. **Suppliers** - Nhà Cung Cấp
Thông tin nhà cung cấp sản phẩm

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| SupplierId | INT | Khóa chính (PK) |
| SupplierName | NVARCHAR(200) | Tên nhà cung cấp |
| ContactPerson | NVARCHAR(200) | Người liên hệ |
| PhoneNumber | NVARCHAR(20) | Số điện thoại |
| Email | NVARCHAR(100) | Email |
| Address | NVARCHAR(500) | Địa chỉ |
| City | NVARCHAR(100) | Thành phố |
| TaxCode | NVARCHAR(50) | Mã số thuế |
| IsActive | BIT | Trạng thái (0/1) |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 9. **Customers** - Khách Hàng
Thông tin khách hàng

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| CustomerId | INT | Khóa chính (PK) |
| CustomerName | NVARCHAR(200) | Tên khách hàng |
| CustomerType | NVARCHAR(50) | Loại khách (Cá nhân/Công ty) |
| PhoneNumber | NVARCHAR(20) | Số điện thoại |
| Email | NVARCHAR(100) | Email |
| Address | NVARCHAR(500) | Địa chỉ |
| City | NVARCHAR(100) | Thành phố |
| TaxCode | NVARCHAR(50) | Mã số thuế |
| ContactPerson | NVARCHAR(200) | Người liên hệ |
| IsActive | BIT | Trạng thái (0/1) |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 10. **ImportOrders** - Đơn Nhập Hàng
Quản lý đơn nhập từ nhà cung cấp

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| ImportOrderId | INT | Khóa chính (PK) |
| ImportCode | NVARCHAR(50) | Mã đơn (UNIQUE) |
| SupplierId | INT | Khóa ngoài → Suppliers |
| ImportDate | DATETIME2 | Ngày nhập |
| DeliveryDate | DATETIME2 | Ngày giao hàng dự kiến |
| Status | NVARCHAR(50) | Trạng thái (PENDING, RECEIVED) |
| TotalAmount | DECIMAL(18,2) | Tổng tiền |
| Notes | NVARCHAR(1000) | Ghi chú |
| CreatedBy | INT | Khóa ngoài → Users |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 11. **ImportOrderDetails** - Chi Tiết Đơn Nhập
Chi tiết từng sản phẩm trong đơn nhập

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| ImportDetailId | INT | Khóa chính (PK) |
| ImportOrderId | INT | Khóa ngoài → ImportOrders |
| ProductId | INT | Khóa ngoài → Products |
| Quantity | INT | Số lượng |
| UnitPrice | DECIMAL(18,2) | Giá đơn vị |
| TotalPrice | DECIMAL(18,2) | Thành tiền |
| ReceivedQuantity | INT | Số lượng nhận được |
| CreatedAt | DATETIME2 | Ngày tạo |

---

### 12. **SalesOrders** - Đơn Hàng Bán
Quản lý đơn bán cho khách hàng

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| OrderId | INT | Khóa chính (PK) |
| OrderCode | NVARCHAR(50) | Mã đơn (UNIQUE) |
| CustomerId | INT | Khóa ngoài → Customers |
| OrderDate | DATETIME2 | Ngày đặt |
| DeliveryDate | DATETIME2 | Ngày giao dự kiến |
| Status | NVARCHAR(50) | Trạng thái (PENDING, COMPLETED) |
| TotalAmount | DECIMAL(18,2) | Tổng tiền |
| Discount | DECIMAL(18,2) | Chiết khấu |
| FinalAmount | DECIMAL(18,2) | Tổng sau chiết khấu |
| Notes | NVARCHAR(1000) | Ghi chú |
| CreatedBy | INT | Khóa ngoài → Users |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 13. **SalesOrderDetails** - Chi Tiết Đơn Hàng
Chi tiết từng sản phẩm trong đơn bán

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| OrderDetailId | INT | Khóa chính (PK) |
| OrderId | INT | Khóa ngoài → SalesOrders |
| ProductId | INT | Khóa ngoài → Products |
| Quantity | INT | Số lượng |
| UnitPrice | DECIMAL(18,2) | Giá đơn vị |
| TotalPrice | DECIMAL(18,2) | Thành tiền |
| Discount | DECIMAL(18,2) | Chiết khấu |
| CreatedAt | DATETIME2 | Ngày tạo |

---

### 14. **Returns** - Trả Hàng
Quản lý đơn trả hàng

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| ReturnId | INT | Khóa chính (PK) |
| ReturnCode | NVARCHAR(50) | Mã đơn trả (UNIQUE) |
| OrderId | INT | Khóa ngoài → SalesOrders |
| ReturnDate | DATETIME2 | Ngày trả |
| Status | NVARCHAR(50) | Trạng thái |
| TotalRefund | DECIMAL(18,2) | Tiền hoàn lại |
| Reason | NVARCHAR(500) | Lý do trả |
| Notes | NVARCHAR(1000) | Ghi chú |
| CreatedBy | INT | Khóa ngoài → Users |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 15. **ReturnDetails** - Chi Tiết Trả Hàng
Chi tiết từng sản phẩm trong đơn trả

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| ReturnDetailId | INT | Khóa chính (PK) |
| ReturnId | INT | Khóa ngoài → Returns |
| ProductId | INT | Khóa ngoài → Products |
| Quantity | INT | Số lượng trả |
| UnitPrice | DECIMAL(18,2) | Giá đơn vị |
| TotalPrice | DECIMAL(18,2) | Thành tiền |
| CreatedAt | DATETIME2 | Ngày tạo |

---

### 16. **Deliveries** - Giao Hàng
Quản lý thông tin giao hàng

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| DeliveryId | INT | Khóa chính (PK) |
| DeliveryCode | NVARCHAR(50) | Mã giao (UNIQUE) |
| OrderId | INT | Khóa ngoài → SalesOrders |
| DeliveryDate | DATETIME2 | Ngày giao dự kiến |
| ExpectedDeliveryDate | DATETIME2 | Ngày dự kiến |
| ActualDeliveryDate | DATETIME2 | Ngày giao thực tế |
| Status | NVARCHAR(50) | Trạng thái (PENDING, IN_TRANSIT, DELIVERED) |
| DeliveryAddress | NVARCHAR(500) | Địa chỉ giao |
| Driver | NVARCHAR(200) | Tên tài xế |
| Notes | NVARCHAR(1000) | Ghi chú |
| CreatedBy | INT | Khóa ngoài → Users |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 17. **Payments** - Thanh Toán
Quản lý thông tin thanh toán đơn hàng

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| PaymentId | INT | Khóa chính (PK) |
| OrderId | INT | Khóa ngoài → SalesOrders |
| PaymentDate | DATETIME2 | Ngày thanh toán |
| Amount | DECIMAL(18,2) | Số tiền |
| PaymentMethod | NVARCHAR(50) | Phương thức (Cash, Card, Bank) |
| TransactionNumber | NVARCHAR(100) | Số tham chiếu giao dịch |
| Status | NVARCHAR(50) | Trạng thái (PENDING, COMPLETED) |
| Notes | NVARCHAR(500) | Ghi chú |
| CreatedBy | INT | Khóa ngoài → Users |
| CreatedAt | DATETIME2 | Ngày tạo |

---

### 18. **Receivables** - Công Nợ Phải Thu
Theo dõi tiền phải thu từ khách hàng

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| ReceivableId | INT | Khóa chính (PK) |
| CustomerId | INT | Khóa ngoài → Customers |
| OrderId | INT | Khóa ngoài → SalesOrders (NULL) |
| Amount | DECIMAL(18,2) | Số tiền phải thu |
| AmountPaid | DECIMAL(18,2) | Số tiền đã trả |
| AmountDue | DECIMAL(18,2) | Số tiền còn nợ |
| DueDate | DATETIME2 | Ngày hạn thanh toán |
| Status | NVARCHAR(50) | Trạng thái (OUTSTANDING, PARTIAL, PAID) |
| Notes | NVARCHAR(500) | Ghi chú |
| CreatedAt | DATETIME2 | Ngày tạo |

---

### 19. **Payables** - Công Nợ Phải Trả
Theo dõi tiền phải trả cho nhà cung cấp

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| PayableId | INT | Khóa chính (PK) |
| SupplierId | INT | Khóa ngoài → Suppliers |
| ImportOrderId | INT | Khóa ngoài → ImportOrders (NULL) |
| Amount | DECIMAL(18,2) | Số tiền phải trả |
| AmountPaid | DECIMAL(18,2) | Số tiền đã trả |
| AmountDue | DECIMAL(18,2) | Số tiền còn nợ |
| DueDate | DATETIME2 | Ngày hạn thanh toán |
| Status | NVARCHAR(50) | Trạng thái (OUTSTANDING, PARTIAL, PAID) |
| Notes | NVARCHAR(500) | Ghi chú |
| CreatedAt | DATETIME2 | Ngày tạo |

---

### 20. **Promotions** - Khuyến Mại
Quản lý các chương trình khuyến mại

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| PromotionId | INT | Khóa chính (PK) |
| PromotionName | NVARCHAR(200) | Tên khuyến mại |
| Description | NVARCHAR(1000) | Mô tả |
| DiscountPercent | DECIMAL(5,2) | Chiết khấu % |
| DiscountAmount | DECIMAL(18,2) | Chiết khấu tiền |
| StartDate | DATETIME2 | Ngày bắt đầu |
| EndDate | DATETIME2 | Ngày kết thúc |
| MaxUsage | INT | Lần sử dụng tối đa |
| UsageCount | INT | Lần sử dụng |
| IsActive | BIT | Trạng thái |
| CreatedAt | DATETIME2 | Ngày tạo |
| UpdatedAt | DATETIME2 | Ngày cập nhật |

---

### 21. **PromotionProducts** - Sản Phẩm Khuyến Mại
Liên kết sản phẩm với khuyến mại (N-N)

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| PromotionProductId | INT | Khóa chính (PK) |
| PromotionId | INT | Khóa ngoài → Promotions |
| ProductId | INT | Khóa ngoài → Products |

---

### 22. **AuditLogs** - Nhật Ký Audit
Theo dõi các thay đổi trong hệ thống

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| AuditId | INT | Khóa chính (PK) |
| UserId | INT | Khóa ngoài → Users |
| Action | NVARCHAR(200) | Hành động (Create, Update, Delete) |
| TableName | NVARCHAR(100) | Tên bảng |
| RecordId | INT | ID bản ghi thay đổi |
| OldValues | NVARCHAR(MAX) | Giá trị cũ (JSON) |
| NewValues | NVARCHAR(MAX) | Giá trị mới (JSON) |
| Timestamp | DATETIME2 | Thời gian |

---

## 🔗 Sơ Đồ Quan Hệ

```
Users (1) ─── (N) SalesOrders
      ├─── (N) Returns
      ├─── (N) Deliveries
      └─── (N) Payments

Customers (1) ─── (N) SalesOrders
           └─── (N) Receivables

Products (1) ─── (1) Inventory
         ├─── (N) SalesOrderDetails
         ├─── (N) ImportOrderDetails
         ├─── (N) ReturnDetails
         └─── (N) PromotionProducts

Categories (1) ─── (N) Products

Suppliers (1) ─── (N) ImportOrders
          └─── (N) Payables

SalesOrders (1) ─── (N) SalesOrderDetails
            ├─── (N) Returns
            ├─── (N) Deliveries
            ├─── (N) Payments
            └─── (N) Receivables

ImportOrders (1) ─── (N) ImportOrderDetails
             └─── (N) Payables

Returns (1) ─── (N) ReturnDetails

Roles (1) ─── (N) Users
      └─── (N) RolePermissions

Permissions (1) ─── (N) RolePermissions

Promotions (1) ─── (N) PromotionProducts
```

---

## 📊 Số Liệu Thống Kê

| Thống Kê | Giá Trị |
|---------|--------|
| **Tổng bảng** | 22 |
| **Khóa chính (PK)** | 22 |
| **Khóa ngoài (FK)** | 30+ |
| **Chỉ mục (Indexes)** | 15+ |
| **Ràng buộc Unique** | 10+ |

---

## 🔒 Ràng Buộc Toàn Vẹn

### Quy Tắc Xóa (Delete Rules)
- **CASCADE**: ImportOrderDetails, ReturnDetails, PromotionProducts
- **RESTRICT**: Roles, Suppliers, Customers, Categories

### Ràng Buộc Dữ Liệu
- Giá > 0
- Số lượng ≥ 0
- Email format hợp lệ
- Username/SKU/OrderCode UNIQUE

---

## 📈 Hiệu Suất

### Chỉ Mục Quan Trọng
- `IX_Products_CategoryId`
- `IX_SalesOrders_CustomerId`
- `IX_SalesOrders_Status`
- `IX_Inventory_ProductId`
- `IX_Users_RoleId`
- `IX_Deliveries_Status`

---

## 🔐 Dữ Liệu Mẫu Ban Đầu

### Vai Trò (Roles)
- Admin
- Manager
- Staff
- Customer

### Danh Mục (Categories)
- Vật liệu xây dựng
- Xi măng
- Cát đá
- Sắt thép
- Gạch ngói
- Kính
- Phụ kiện

### Người Dùng Mặc Định
- Username: `admin`
- Password: `admin123` (hash)
- Role: Admin
- Status: Active

---

## 💡 Ghi Chú Phát Triển

1. **Timestamp**: Tất cả bảng có `CreatedAt` và `UpdatedAt` (ngoài audit logs)
2. **Soft Delete**: Có thể thêm cột `DeletedAt` cho soft delete
3. **Audit**: Bảng AuditLogs ghi lại mọi thay đổi
4. **DECIMAL(18,2)**: Sử dụng cho tiền tệ (VND)
5. **NVARCHAR**: Hỗ trợ Unicode (tiếng Việt)

---

**Cuối cùng cập nhật**: 2026-02-02  
**Phiên bản**: 1.0
