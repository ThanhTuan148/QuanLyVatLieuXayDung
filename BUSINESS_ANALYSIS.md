# 📊 PHÂN TÍCH CHI TIẾT NGHIỆP VỤ - HỆ THỐNG QUẢN LÝ CỬA HÀNG VẬT LIỆU XÂY DỰNG

## 🎯 TỔNG QUAN DỰ ÁN

### Tên Dự Án
**Quản Lý Của Hàng Vật Liệu Xây Dựng** (Building Material Store Management System)

### Mục Tiêu Chính
- Xây dựng hệ thống quản lý toàn diện cho cửa hàng bán vật liệu xây dựng
- Tự động hóa quy trình nhập hàng, bán hàng, tồn kho, giao hàng
- Quản lý tài chính (thanh toán, công nợ phải thu/phải trả)
- Cung cấp báo cáo và thống kê để hỗ trợ quyết định kinh doanh
- Tối ưu hóa quy trình vận hành và giảm thời gian phục vụ khách hàng

---

## 📈 PHẠM VI HOẠT ĐỘNG KINH DOANH

### 1. **NHÂN TỐ TẠO NỀN**

#### Các Bên Liên Quan Chính
```
┌─────────────────────────────────────────────────────────────┐
│              NHÂN TỐ KINH DOANH CHÍNH                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. NHÂN VIÊN CỬA HÀNG                                      │
│     - Quản lý (Manager): Quản trị hoàn toàn hệ thống       │
│     - Nhân viên (Staff): Xử lý đơn hàng, giao hàng         │
│                                                              │
│  2. NHÀ CUNG CẤP (SUPPLIER)                                 │
│     - Cung cấp vật liệu xây dựng                            │
│     - Xử lý đơn nhập hàng                                   │
│     - Quản lý công nợ phải trả                              │
│                                                              │
│  3. KHÁCH HÀNG (CUSTOMER)                                   │
│     - Cá nhân: Mua vật liệu cho công trình nhỏ             │
│     - Công ty/Đơn vị: Mua sỉ cho dự án xây dựng           │
│     - Quản lý công nợ phải thu                              │
│                                                              │
│  4. TỒN KHO (INVENTORY)                                     │
│     - Quản lý số lượng hàng tồn                             │
│     - Cảnh báo hàng sắp hết                                 │
│     - Vị trí kho                                             │
│                                                              │
│  5. VẬT LIỆU (PRODUCT)                                      │
│     - Các loại vật liệu xây dựng                            │
│     - Giá bán và giá vốn                                     │
│     - Danh mục phân loại                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Các Loại Vật Liệu Quản Lý
- **Xi măng**: Bao, túi
- **Cát, đá xây dựng**: Khối lượng (tấn, m³)
- **Sắt thép**: Thanh, tấm (m, kg)
- **Gạch ngói**: Viên, hộp
- **Vôi, bột tẩy trắng**
- **Vật liệu kết dính**: Keo, mastic
- **Sơn, vecni**
- **Các loại khác**: Ống nước, điện...

---

## 🔄 Qkissuy TRÌNH KINH DOANH CHÍNH

### A. QUY TRÌNH NHẬP HÀNG TỪ NHÀ CUNG CẤP

```
NHÂN VIÊN              NHÀ CUNG CẤP              HỆ THỐNG              KHO
   │                       │                        │                │
   │──(1) Kiểm tra tồn)─────────────────────────────▶                 │
   │         kho, mức reorder                       │                │
   │                                                │                │
   │──(2) Tạo đơn nhập)──────────────────────────▶ SaveDB            │
   │      ImportOrder                               │                │
   │      ImportOrderDetail                         │                │
   │                                                │                │
   │──────────────────────────────▶(3) Lấy hàng    │                │
   │                               │                │                │
   │                          (4) Giao hàng        │                │
   │                               │                │                │
   │◀──────────────────────────────             │                │
   │                                                │                │
   │──(5) Kiểm nhận)───────────────────────────────▶                 │
   │      ReceivedQuantity                         │                │
   │      Status = RECEIVED                        │                │
   │                                                │                │
   │──(6) Cập nhật tồn kho)─────────────────────────────────────────▶
   │      QuantityInStock += ReceivedQuantity      │           UpdateDB
   │      LastRestockDate                          │                │
   │                                                │                │
   │──(7) Tạo Payable)─────────────────────────────▶                 │
   │      Công nợ phải trả cho nhà cung cấp       │                │
   │                                                │                │
```

**Các Trạng Thái Đơn Nhập:**
- `PENDING`: Chờ nhập
- `RECEIVED`: Đã nhập hoàn tất
- `CANCELLED`: Hủy đơn

**Dữ Liệu Xử Lý:**
- Mã đơn nhập duy nhất
- Ngày nhập, ngày giao dự kiến
- Chi tiết sản phẩm: Số lượng, giá đơn vị, thành tiền
- Tổng tiền nhập

---

### B. QUY TRÌNH BÁN HÀNG CHO KHÁCH HÀNG

```
NHÂN VIÊN            KHÁCH HÀNG              HỆ THỐNG             KHO
   │                    │                       │                 │
   │◀───(1) Yêu cầu────                         │                 │
   │    danh sách hàng   │                       │                 │
   │                     │                       │                 │
   │──(2) Lấy danh sách)──────────────────────▶ Query DB           │
   │      sản phẩm có tồn │                     │                 │
   │                     │                       │                 │
   │──(3) Hiển thị)◀─────────────────────────────                  │
   │      danh sách sản  │                       │                 │
   │      phẩm, giá      │                       │                 │
   │                     │                       │                 │
   │                  (4) Chọn hàng │            │                 │
   │◀───────────────────                         │                 │
   │                     │                       │                 │
   │──(5) Tạo đơn)───────────────────────────▶ SaveDB              │
   │      SalesOrder     │                      │                 │
   │      SalesOrderDetail                      │                 │
   │      Status = PENDING                      │                 │
   │                     │                       │                 │
   │      (6) Kiểm tra│   │                       │                 │
   │      khả dụng───────────────────────────────────────────────▶ │
   │                     │                       │                 │
   │                     │                      │ AvailableQty =   │
   │                     │                      │ QuantityInStock  │
   │                     │                      │ - QuantityReserved
   │                     │                       │ - OrderQty       │
   │                     │                       │                 │
   │◀──(7) Thông báo────────────────────────────                  │
   │      có sẵn/hết hàng│                       │                 │
   │                     │                       │                 │
   │──(8) Xác nhận)──────────────────────────▶ UpdateDB            │
   │      QuantityReserved += OrderQty           │                 │
   │      Status = CONFIRMED                    │                 │
   │                     │                       │                 │
   │──(9) Thanh toán)────────────────────────▶ CreatePayment       │
   │      Tiền mặt/thẻ/  │                     │ CreateReceivable   │
   │      Nợ             │                       │                 │
   │                     │                       │                 │
   │──(10) Tạo Phiếu)────────────────────────────────────────────▶ │
   │       giao hàng     │                       │            UpdateDB
   │       Status = IN_TRANSIT                  │                 │
   │                     │                       │                 │
```

**Các Trạng Thái Đơn Bán:**
- `PENDING`: Chờ xác nhận
- `CONFIRMED`: Xác nhận, chờ giao
- `IN_TRANSIT`: Đang giao hàng
- `DELIVERED`: Giao thành công
- `CANCELLED`: Hủy đơn

**Các Trạng Thái Thanh Toán:**
- `PENDING`: Chờ thanh toán
- `COMPLETED`: Đã thanh toán
- `PARTIAL`: Thanh toán một phần

**Công Nợ Phải Thu:**
- Nếu khách hàng nợ: Tạo `Receivable`
- Trạng thái: `OUTSTANDING` (nợ), `PARTIAL` (nợ một phần), `PAID` (đã trả)

---

### C. QUY TRÌNH GIAO HÀNG

```
NHÂN VIÊN         TÀI XẾ           KHÁCH HÀNG         HỆ THỐNG
   │                │                  │                 │
   │──(1) Tạo)───────────────────────────────────────▶   │
   │    phiếu giao   │                  │            SaveDB
   │                 │                  │                 │
   │    Status = PENDING              │                 │
   │                 │                  │                 │
   │    (2) Chuẩn bị │                  │                 │
   │    hàng hóa──────────▶            │                 │
   │                 │                  │                 │
   │                 │──(3) Giao hàng──▶│                 │
   │                 │                  │                 │
   │                 │      Status = IN_TRANSIT          │
   │                 │                  │                 │
   │                 │              (4) Kiểm │           │
   │                 │              nhận hàng│           │
   │                 │                  │                 │
   │                 │◀──────────────────│                │
   │                 │  Ký xác nhận      │                │
   │                 │                  │                 │
   │◀────────────────(5) Báo cáo)────────────────────────│
   │    hoàn thành   │                  │            UpdateDB
   │    giao hàng    │                  │            Status =
   │                 │                  │            DELIVERED
   │                 │                  │                 │
```

**Thông Tin Giao Hàng:**
- Mã giao hàng duy nhất
- Liên kết đến đơn hàng
- Tài xế, điện thoại tài xế
- Địa chỉ giao hàng
- Ngày giao dự kiến, ngày giao thực tế
- Ghi chú

---

### D. QUY TRÌNH TRẢ HÀNG

```
KHÁCH HÀNG      NHÂN VIÊN          HỆ THỐNG         TỒN KHO
   │               │                   │              │
   │──(1) Yêu)─────▶                    │              │
   │    cầu trả     │                   │              │
   │    hàng        │                   │              │
   │                │                   │              │
   │                │──(2) Kiểm)────────────────────▶  │
   │                │    tra lý do     │              │
   │                │                   │              │
   │                │──(3) Tạo đơn)────────────▶      │
   │                │    trả hàng      │           SaveDB
   │                │    Return        │              │
   │                │    ReturnDetail   │              │
   │                │                   │              │
   │                │ (4) Xác nhận)────────────────────────
   │                │    nhận lại       │              UpdateDB
   │                │    hàng trả       │              QuantityInStock
   │                │                   │              += ReturnQty
   │                │──(5) Thanh)──────────────────┐   │
   │                │    toán hoàn      │      │   │   │
   │                │    lại hoặc ghi   │      │   │   │
   │                │    sổ công nợ     │      │   │   │
   │                │                   │      │   │   │
   │◀───────────────(6) Hoàn tiền─────────────┘   │   │
   │                │    / Ghi nợ       │          │   │
   │                │                   │          │   │
```

**Lý Do Trả Hàng:**
- Hàng lỗi/hư hỏng
- Giao nhầm sản phẩm
- Khách hàng đổi ý
- Khác...

**Xử Lý Hoàn Tiền:**
- Hoàn tiền mặt (nếu đã thanh toán)
- Ghi giảm công nợ phải thu (nếu nợ)

---

## 💰 QUY TRÌNH QUẢN LÝ TÀI CHÍNH

### A. THANH TOÁN TỪ KHÁCH HÀNG

```
Đơn Hàng → Tính Tổng Tiền → Cộng Chiết Khấu
   │
   ├─ (1) Nếu thanh toán ngay:
   │      Payment (COMPLETED)
   │      Receivable: PAID
   │
   └─ (2) Nếu nợ:
          Receivable (OUTSTANDING)
          Amount = FinalAmount
          AmountDue = FinalAmount
          DueDate = Hạn thanh toán
          
          (Sau khi thanh toán một phần)
          Receivable: PARTIAL
          AmountPaid += PaymentAmount
          AmountDue = Amount - AmountPaid
```

### B. CÔNG NỢ PHẢI THU

**Công Nợ Phải Thu (Receivables):**
- Lập từ mỗi đơn hàng có nợ
- Theo dõi hạn thanh toán
- Ghi nợ khi khách hàng nợ
- Thanh toán khi khách hàng trả tiền
- Báo cáo công nợ còn lại

**Trạng Thái:**
- `OUTSTANDING`: Chưa thanh toán
- `PARTIAL`: Thanh toán một phần
- `PAID`: Đã thanh toán hết

### C. CÔNG NỢ PHẢI TRẢ

**Công Nợ Phải Trả (Payables):**
- Lập từ mỗi đơn nhập hàng
- Theo dõi hạn thanh toán cho nhà cung cấp
- Thanh toán khi có đủ tiền mặt
- Báo cáo công nợ phải trả

**Trạng Thái:**
- `OUTSTANDING`: Chưa thanh toán
- `PARTIAL`: Thanh toán một phần
- `PAID`: Đã thanh toán hết

---

## 📊 QUY TRÌNH QUẢN LÝ TỒN KHO

### A. CẬP NHẬT TỒN KHO TỰ ĐỘNG

```
BIẾN ĐỘNG TỒN KHO:

(1) Nhập hàng:
    QuantityInStock += ReceivedQuantity
    LastRestockDate = Ngày nhận hàng

(2) Bán hàng:
    QuantityReserved += OrderQty          (khi tạo đơn)
    QuantityInStock -= OrderQty           (khi giao hàng)
    AvailableQuantity = QuantityInStock - QuantityReserved

(3) Trả hàng:
    QuantityInStock += ReturnQty
    QuantityReserved -= ReturnQty (nếu còn đặt cọc)

(4) AvailableQuantity (Số lượng có sẵn):
    = QuantityInStock - QuantityReserved
    = Số lượng có thể bán ngay
```

### B. CẢNH BÁO TỒN KHO

```
ReorderLevel (Mức tồn kho tối thiểu):
- Được thiết lập cho mỗi sản phẩm
- Khi AvailableQuantity <= ReorderLevel
  → Gửi cảnh báo cần nhập hàng
  → Báo cáo sản phẩm sắp hết
  
Vị Trí Kho (WarehouseLocation):
- Theo dõi vị trí lưu kho
- Dễ dàng tìm kiếm hàng
```

---

## 👥 QUY TRÌNH QUẢN LÝ NGƯỜI DÙNG & QUYỀN HẠN

### Cấu Trúc Vai Trò & Quyền

```
ADMIN (Quản Lý)
├─ USER_MANAGE: Quản lý người dùng
├─ PRODUCT_MANAGE: Quản lý sản phẩm, danh mục
├─ SUPPLIER_MANAGE: Quản lý nhà cung cấp
├─ CUSTOMER_MANAGE: Quản lý khách hàng
├─ ORDER_MANAGE: Quản lý đơn hàng
├─ INVENTORY_MANAGE: Quản lý tồn kho
├─ DELIVERY_MANAGE: Quản lý giao hàng
├─ PAYMENT_MANAGE: Quản lý thanh toán
├─ REPORT_VIEW: Xem báo cáo
└─ SETTINGS: Cấu hình hệ thống

MANAGER (Quản Lý Bộ Phận)
├─ PRODUCT_MANAGE: Quản lý sản phẩm
├─ ORDER_MANAGE: Quản lý đơn hàng
├─ INVENTORY_MANAGE: Quản lý tồn kho
├─ DELIVERY_MANAGE: Quản lý giao hàng
├─ PAYMENT_MANAGE: Quản lý thanh toán
└─ REPORT_VIEW: Xem báo cáo

STAFF (Nhân Viên)
├─ PRODUCT_VIEW: Xem danh sách sản phẩm
├─ ORDER_CREATE: Tạo đơn hàng
├─ ORDER_VIEW: Xem đơn hàng
├─ DELIVERY_VIEW: Theo dõi giao hàng
└─ PAYMENT_VIEW: Xem thông tin thanh toán

CUSTOMER (Khách Hàng)
├─ PRODUCT_VIEW: Xem danh sách sản phẩm
└─ ORDER_CREATE: Tạo đơn hàng
```

---

## 📈 BÁNG CÁO & THỐNG KÊ

### A. BÁO CÁO DOANH THU

```
1. DOANH THU TỔNG HỢP
   - Tổng doanh thu theo ngày/tháng/năm
   - Doanh thu từ từng khách hàng
   - Doanh thu theo danh mục sản phẩm
   - Doanh thu sau chiết khấu

2. SẢN PHẨM BÁN CHẠY
   - Top 10 sản phẩm bán nhiều nhất
   - Top 10 sản phẩm có doanh thu cao nhất
   - Tỷ lệ bán theo danh mục
```

### B. BÁO CÁO TỒN KHO

```
1. TỒNG KHO HIỆN TẠI
   - Số lượng tồn kho
   - Giá trị tồn kho
   - Vị trí kho
   - Tồn kho theo danh mục

2. CẢNH BÁO HÀNG SẮP HẾT
   - Sản phẩm QuantityInStock < ReorderLevel
   - Sản phẩm không tồn kho (QuantityInStock = 0)
   - Dự báo hàng sắp hết
```

### C. BÁO CÁO CÔNG NỢ

```
1. CÔNG NỢ PHẢI THU
   - Tổng công nợ từ khách hàng
   - Công nợ còn lại
   - Công nợ quá hạn
   - Chi tiết công nợ từng khách hàng

2. CÔNG NỢ PHẢI TRẢ
   - Tổng công nợ cho nhà cung cấp
   - Công nợ còn lại
   - Công nợ quá hạn
   - Chi tiết công nợ từng nhà cung cấp
```

### D. BÁO CÁO ĐƠN HÀNG

```
1. NHẬP HÀNG
   - Tổng đơn nhập theo tháng
   - Giá trị nhập hàng
   - Nhà cung cấp cung cấp nhiều nhất
   - Tình trạng đơn nhập

2. BÁN HÀNG
   - Tổng đơn bán theo tháng
   - Giá trị bán hàng
   - Khách hàng mua nhiều nhất
   - Tình trạng đơn bán

3. GIAO HÀNG
   - Số lượng đơn giao thành công
   - Số lượng đơn giao trễ
   - Thời gian giao hàng trung bình
```

---

## 🔐 CHÍNH SÁCH KINH DOANH

### A. CHIẾT KHẤU (PROMOTION)

```
Promotion:
- Tên chương trình khuyến mại
- Phần trăm chiết khấu (%)
- Ngày bắt đầu / kết thúc
- Điều kiện áp dụng (tối thiểu mua bao nhiêu)
- Sản phẩm áp dụng

PromotionProduct:
- Liên kết sản phẩm với chương trình khuyến mại
- Tính chiết khấu từng sản phẩm
```

### B. MỨC GIÁ

```
Product:
- UnitPrice: Giá bán cho khách hàng
- CostPrice: Giá vốn từ nhà cung cấp
- Lợi nhuận = UnitPrice - CostPrice

ImportOrderDetail:
- Giá đơn vị từ nhà cung cấp
- Có thể khác nhau tùy theo số lượng mua

SalesOrderDetail:
- Giá bán cho khách hàng
- Có thể có chiết khấu riêng cho đơn
```

---

## 🗄️ CẤU TRÚC DỮ LIỆU CHÍNH

### Bảng Gốc (Master Tables)

| Bảng | Mục Đích | Khóa Chính | Quan Hệ |
|------|---------|-----------|--------|
| **Users** | Quản lý người dùng | UserId | Role (N-1) |
| **Roles** | Vai trò hệ thống | RoleId | Permissions (N-N) |
| **Permissions** | Quyền hạn | PermissionId | Roles (N-N) |
| **Categories** | Phân loại sản phẩm | CategoryId | Products (1-N) |
| **Products** | Sản phẩm | ProductId | Category (N-1), Inventory (1-1) |
| **Suppliers** | Nhà cung cấp | SupplierId | ImportOrders (1-N), Payables (1-N) |
| **Customers** | Khách hàng | CustomerId | SalesOrders (1-N), Receivables (1-N) |

### Bảng Giao Dịch (Transaction Tables)

| Bảng | Mục Đích | Khóa Chính | Quan Hệ |
|------|---------|-----------|--------|
| **ImportOrders** | Đơn nhập hàng | ImportOrderId | ImportOrderDetails (1-N), Payables (1-N) |
| **ImportOrderDetails** | Chi tiết đơn nhập | ImportDetailId | ImportOrders (N-1), Products (N-1) |
| **SalesOrders** | Đơn bán hàng | OrderId | SalesOrderDetails (1-N), Deliveries (1-N), Returns (1-N) |
| **SalesOrderDetails** | Chi tiết đơn bán | OrderDetailId | SalesOrders (N-1), Products (N-1) |
| **Inventory** | Tồn kho | InventoryId | Products (1-1) |
| **Returns** | Đơn trả hàng | ReturnId | ReturnDetails (1-N), SalesOrders (N-1) |
| **ReturnDetails** | Chi tiết trả hàng | ReturnDetailId | Returns (N-1), Products (N-1) |
| **Deliveries** | Giao hàng | DeliveryId | SalesOrders (N-1) |

### Bảng Tài Chính (Financial Tables)

| Bảng | Mục Đích | Khóa Chính | Quan Hệ |
|------|---------|-----------|--------|
| **Payments** | Thanh toán | PaymentId | SalesOrders (N-1), Users (N-1) |
| **Receivables** | Công nợ phải thu | ReceivableId | Customers (N-1), SalesOrders (N-1) |
| **Payables** | Công nợ phải trả | PayableId | Suppliers (N-1), ImportOrders (N-1) |

### Bảng Khác

| Bảng | Mục Đích | Khóa Chính | Quan Hệ |
|------|---------|-----------|--------|
| **Promotion** | Chương trình khuyến mại | PromotionId | PromotionProduct (1-N) |
| **PromotionProduct** | Sản phẩm trong CTKM | PromotionProductId | Promotion (N-1), Products (N-1) |

---

## 🔄 LUỒNG DỮ LIỆU HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT WEB FRONTEND                            │
│              (http://localhost:3000)                             │
└─────────────────────────────────────────────────────────────────┘
              │                                    │
              │  HTTP/JSON  (Axios)               │
              │                                    │
         ┌────▼────────────────────────────────────▼─────┐
         │  ASP.NET CORE API (RESTful)                    │
         │  (https://localhost:5001)                      │
         │                                                │
         │  Controllers:                                 │
         │  ├─ AuthController      (Đăng nhập)          │
         │  ├─ ProductController   (Sản phẩm)          │
         │  ├─ OrderController     (Đơn hàng)          │
         │  ├─ InventoryController (Tồn kho)          │
         │  ├─ HealthController    (Sức khỏe API)      │
         │  └─ ...                                       │
         │                                                │
         │  Services:                                    │
         │  ├─ IProductService    → Repository           │
         │  ├─ IOrderService      → Repository           │
         │  ├─ IInventoryService  → Repository           │
         │  ├─ IUserService       → Repository           │
         │  └─ ...                                        │
         │                                                │
         │  Repositories:                                │
         │  ├─ Repository<T> (Generic)                  │
         │  └─ Database Context (EF Core)               │
         └────┬───────────────────────────────────────────┘
              │
              │  SQL Queries (Entity Framework)
              │
         ┌────▼───────────────────────────┐
         │  SQL SERVER 2019+               │
         │  Database: BuildingMaterialDB   │
         │  ├─ Users                       │
         │  ├─ Products                    │
         │  ├─ Suppliers                   │
         │  ├─ Customers                   │
         │  ├─ ImportOrders                │
         │  ├─ SalesOrders                 │
         │  ├─ Inventory                   │
         │  ├─ Payments                    │
         │  ├─ Deliveries                  │
         │  └─ ...                         │
         └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               FLUTTER MOBILE APP (OPTIONAL)                      │
│           (Kết nối cùng API qua HTTP)                           │
│  Tính năng: Theo dõi tồn kho, cảnh báo, giao hàng              │
└─────────────────────────────────────────────────────────────────┘
              │
              │  HTTP/JSON (Dio)
              │
        (Kết nối tới ASP.NET CORE API)
```

---

## 🎯 CÁC CHỨC NĂNG CHÍNH CỦA HỆ THỐNG

### 1. **QUẢN LÝ SẢN PHẨM**
- ✅ CRUD sản phẩm
- ✅ Phân loại danh mục
- ✅ Quản lý giá (bán, vốn)
- ✅ Tìm kiếm, lọc sản phẩm
- ✅ Mức tồn kho tối thiểu

### 2. **QUẢN LÝ KHÁCH HÀNG**
- ✅ CRUD khách hàng
- ✅ Lưu thông tin liên hệ
- ✅ Phân loại khách (cá nhân/công ty)
- ✅ Lịch sử giao dịch

### 3. **QUẢN LÝ NHÀ CUNG CẤP**
- ✅ CRUD nhà cung cấp
- ✅ Thông tin liên hệ, người đại diện
- ✅ Điều kiện thanh toán

### 4. **QUẢN LÝ NHẬP HÀNG**
- ✅ Tạo đơn nhập từ nhà cung cấp
- ✅ Chi tiết đơn nhập (sản phẩm, số lượng, giá)
- ✅ Cập nhật trạng thái đơn
- ✅ Kiểm nhận hàng nhập

### 5. **QUẢN LÝ BÁN HÀNG**
- ✅ Tạo đơn bán cho khách hàng
- ✅ Chọn sản phẩm, số lượng, giá
- ✅ Áp dụng chiết khấu
- ✅ Theo dõi trạng thái đơn

### 6. **QUẢN LÝ TỒN KHO**
- ✅ Xem tồn kho hiện tại
- ✅ Cảnh báo hàng sắp hết
- ✅ Vị trí lưu trữ kho
- ✅ Lịch sử thay đổi tồn kho

### 7. **QUẢN LÝ GIAO HÀNG**
- ✅ Tạo phiếu giao hàng
- ✅ Phân công tài xế
- ✅ Theo dõi tiến độ giao
- ✅ Xác nhận giao thành công

### 8. **QUẢN LÝ THANH TOÁN**
- ✅ Ghi nhận thanh toán
- ✅ Các phương thức: Tiền mặt, thẻ, ngân hàng
- ✅ Thanh toán một phần
- ✅ Cập nhật công nợ

### 9. **QUẢN LÝ CÔNG NỢ**
- ✅ Theo dõi công nợ phải thu
- ✅ Theo dõi công nợ phải trả
- ✅ Cảnh báo công nợ quá hạn
- ✅ Báo cáo công nợ

### 10. **QUẢN LÝ TRẢ HÀNG**
- ✅ Tạo đơn trả hàng
- ✅ Xác nhận lý do trả
- ✅ Hoàn tiền / Ghi nợ
- ✅ Cập nhật tồn kho

### 11. **QUẢN LÝ NGƯỜI DÙNG**
- ✅ CRUD người dùng
- ✅ Phân quyền vai trò
- ✅ Quản lý quyền hạn
- ✅ Lịch sử đăng nhập

### 12. **BÁNG CÁO & THỐNG KÊ**
- ✅ Doanh thu theo kỳ
- ✅ Sản phẩm bán chạy
- ✅ Tồn kho hiện tại
- ✅ Công nợ còn lại
- ✅ Báo cáo tổng hợp

---

## 📱 NGƯỜI DÙNG HỆ THỐNG

### 1. **Admin (Quản Lý Hệ Thống)**
- Quản lý toàn bộ hệ thống
- Tạo tài khoản người dùng
- Phân quyền
- Cấu hình cài đặt
- Xem toàn bộ báo cáo

### 2. **Manager (Quản Lý Cửa Hàng)**
- Quản lý sản phẩm, khách hàng, nhà cung cấp
- Quản lý đơn hàng (nhập/bán)
- Quản lý giao hàng
- Xem báo cáo và thống kê
- Phê duyệt các giao dịch lớn

### 3. **Staff (Nhân Viên)**
- Tạo và xử lý đơn hàng
- Cập nhật tồn kho
- Ghi nhận giao hàng
- Xem danh sách sản phẩm
- Xem thông tin khách hàng

### 4. **Customer (Khách Hàng)**
- Xem danh sách sản phẩm
- Tạo đơn hàng
- Xem trạng thái đơn hàng
- Xem lịch sử mua hàng

---

## 💡 GIẢI PHÁP CỐCÓ NHI KINH DOANH

### Vấn Đề Giải Quyết
1. **Quản lý tồn kho hiệu quả** → Không bán quá hàng, tránh thất thoát
2. **Tự động hóa quy trình** → Giảm thời gian xử lý, tăng tốc độ phục vụ
3. **Theo dõi công nợ** → Giảm nợ xấu, quản lý dòng tiền tốt hơn
4. **Báng cáo dữ liệu** → Hỗ trợ quyết định kinh doanh chính xác
5. **Quản lý nhiều địa điểm** → (Tương lai) Mở rộng sang nhiều chi nhánh

---

## 🚀 HƯỚNG PHÁT TRIỂN TƯƠNG LAI

1. **Tích hợp Thanh Toán Trực Tuyến**
   - Cổng thanh toán (VNPay, Momo, ZaloPay)
   - Hóa đơn điện tử

2. **Quản Lý Đa Chi Nhánh**
   - Kho nhiều địa điểm
   - Chuyển hàng giữa các kho
   - Báng cáo tổng hợp

3. **Tích Hợp IoT**
   - Cảm biến tồn kho tự động
   - Theo dõi vị trí hàng hóa
   - Cảnh báo nhiệt độ, độ ẩm

4. **Phân Tích Dự Báo**
   - Dự báo nhu cầu sản phẩm
   - Tối ưu hóa giá bán
   - Phân tích khách hàng

5. **Tích Hợp EDI**
   - Trao đổi dữ liệu điện tử với nhà cung cấp
   - Tự động hóa đơn nhập

6. **Mobile App Nâng Cấp**
   - Quản lý kho bằng mobile
   - Xử lý đơn hàng offline
   - Báng cáo real-time

---

## 📋 BẢNG TÓMOỂM TÀI LIỆU THAM KHẢO

| Tài Liệu | Nội Dung |
|---------|---------|
| [README.md](README.md) | Tổng quan dự án |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Hướng dẫn cài đặt |
| [Schema.md](Schema.md) | Mô tả database chi tiết |
| [START_HERE.md](START_HERE.md) | Bắt đầu nhanh |
| [INDEX.md](INDEX.md) | Cấu trúc thư mục dự án |
| [Docs/DEVELOPMENT_GUIDE.md](Docs/DEVELOPMENT_GUIDE.md) | Hướng dẫn phát triển |

---

**Cập nhật: 04/02/2026**  
**Phiên bản: 1.0**  
**Trạng thái: Hoàn chỉnh**
