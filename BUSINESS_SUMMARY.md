# 📋 TÓM TẮT PHÂN TÍCH KINH DOANH - HỆ THỐNG QUẢN LÝ CỬA HÀNG VẬT LIỆU XÂY DỰNG

## 🎯 TỔNG QUAN NHANH

**Tên Dự Án:** Quản Lý Của Hàng Vật Liệu Xây Dựng (Building Material Store Management System)

**Mục Đích:** Xây dựng hệ thống quản lý toàn diện cho cửa hàng vật liệu xây dựng, tự động hóa quy trình kinh doanh từ nhập hàng → bán hàng → giao hàng → thanh toán.

**Lĩnh Vực:** Quản lý bán lẻ (Retail), Quản lý kho (Warehouse Management), Quản lý tài chính (Financial Management)

**Công Nghệ:** .NET 8 (Backend) + React 18 (Frontend) + Flutter (Mobile) + SQL Server (Database)

---

## 🏢 MÔ HÌNH KINH DOANH

### Các Bên Tham Gia
```
┌──────────────────────┐
│  NHÀ CUNG CẤP        │  Cung cấp vật liệu
│  (Supplier)          │
└──────────┬───────────┘
           │ Nhập Hàng
           ▼
┌──────────────────────┐
│  CỬA HÀNG VẬT LIỆU  │  Quản lý kho, bán hàng
│  (Store)             │
└──────────┬───────────┘
           │ Bán Hàng
           ▼
┌──────────────────────┐
│  KHÁCH HÀNG          │  Mua hàng, sử dụng
│  (Customer)          │
└──────────────────────┘
```

### Dòng Tiền
```
NHẬP HÀNG (Chi tiền cho Supplier)
    ↓
BÁN HÀNG (Nhận tiền từ Customer)
    ↓
GIAO HÀNG (Vận chuyển sản phẩm)
    ↓
THANH TOÁN (Quản lý công nợ phải thu/phải trả)
```

---

## 📊 CÁC KHO DỮ LIỆU CHÍNH

### 1. **Danh Mục Sản Phẩm (22 Bảng)**

**Bảng Cơ Bản:**
- **Users** - Người dùng hệ thống
- **Roles & Permissions** - Vai trò và quyền hạn
- **Categories** - Phân loại sản phẩm
- **Products** - Sản phẩm
- **Suppliers** - Nhà cung cấp
- **Customers** - Khách hàng

**Bảng Kho:**
- **Inventory** - Tồn kho hiện tại
- **ImportOrders** - Đơn nhập hàng
- **ImportOrderDetails** - Chi tiết đơn nhập

**Bảng Bán Hàng:**
- **SalesOrders** - Đơn bán hàng
- **SalesOrderDetails** - Chi tiết đơn bán
- **Returns** - Đơn trả hàng
- **ReturnDetails** - Chi tiết trả hàng

**Bảng Giao Hàng & Thanh Toán:**
- **Deliveries** - Giao hàng
- **Payments** - Thanh toán
- **Receivables** - Công nợ phải thu
- **Payables** - Công nợ phải trả
- **Promotions** - Chương trình khuyến mại

---

## 🔄 CÁC QUY TRÌNH CHÍNH

### Quy Trình 1: NHẬP HÀNG
```
1. Kiểm tra mức tồn kho
2. Tạo đơn nhập (ImportOrder)
3. Nhà cung cấp giao hàng
4. Kiểm nhận và cập nhật tồn kho
5. Tạo công nợ phải trả (Payable)
```

**Dữ Liệu Tham Gia:**
- Supplier (Nhà cung cấp)
- ImportOrder (Mã đơn, ngày, tổng tiền)
- ImportOrderDetail (Sản phẩm, số lượng, giá)
- Inventory (Cập nhật QuantityInStock)
- Payable (Ghi nợ cho nhà cung cấp)

---

### Quy Trình 2: BÁN HÀNG
```
1. Khách hàng xem danh sách sản phẩm
2. Chọn sản phẩm, số lượng
3. Tạo đơn bán (SalesOrder)
4. Kiểm tra tồn kho
5. Đặt cọc từ kho (Reserve Inventory)
6. Tính toán thanh toán/nợ
7. Tạo Receivable (nếu nợ)
```

**Dữ Liệu Tham Gia:**
- Customer (Khách hàng)
- SalesOrder (Mã đơn, ngày, tổng tiền, chiết khấu)
- SalesOrderDetail (Sản phẩm, số lượng, giá)
- Inventory (Cập nhật QuantityReserved)
- Receivable (Ghi nợ cho khách hàng - nếu nợ)

---

### Quy Trình 3: GIAO HÀNG
```
1. Tạo phiếu giao hàng (Delivery)
2. Chuẩn bị hàng hóa
3. Tài xế vận chuyển
4. Khách hàng nhận hàng
5. Xác nhận giao thành công
6. Cập nhật tồn kho cuối cùng
```

**Dữ Liệu Tham Gia:**
- Delivery (Mã phiếu, tài xế, địa chỉ, trạng thái)
- SalesOrder (Cập nhật Status: DELIVERED)
- Inventory (Giảm QuantityInStock, QuantityReserved)

---

### Quy Trình 4: THANH TOÁN
```
1. Khách hàng thanh toán
2. Ghi nhận Payment
3. Cập nhật Receivable
4. Nếu đã thanh toán hết → Status = PAID
5. Nếu thanh toán một phần → Status = PARTIAL
```

**Dữ Liệu Tham Gia:**
- Payment (Ngày thanh toán, số tiền, phương thức)
- Receivable (AmountPaid, AmountDue, Status)

---

### Quy Trình 5: TRẢ HÀNG
```
1. Khách hàng muốn trả hàng
2. Tạo đơn trả hàng (Return)
3. Kiểm nhận hàng trả
4. Cập nhật tồn kho (nhập lại)
5. Hoàn tiền hoặc ghi giảm nợ
```

**Dữ Liệu Tham Gia:**
- Return (Mã đơn trả, lý do, trạng thái)
- ReturnDetail (Sản phẩm, số lượng, giá)
- Inventory (Cập nhật: QuantityInStock += ReturnQty)
- Receivable (Giảm: AmountDue -= RefundAmount)
- Payment (Ghi âm hoặc hoàn tiền)

---

## �️ TÍNH NĂNG E-COMMERCE BỔ SUNG (B2C)

### Giỏ Hàng (Shopping Cart)
**Mục đích:** Cho phép khách hàng lưu sản phẩm trước khi thanh toán

**Quy trình:**
1. Khách hàng chọn sản phẩm → Thêm vào giỏ
2. Xem giỏ hàng (Danh sách sản phẩm + Giá + Số lượng)
3. Cập nhật số lượng hoặc xóa sản phẩm
4. Hệ thống tính tổng: Σ (Quantity × Price)
5. Khách xác nhận → Chuyển sang Checkout
6. Tạo SalesOrder từ Cart items

**Dữ liệu:**
- CartId, UserId, ProductId, Quantity, Price
- CreatedDate, UpdatedDate
- Method: GetTotal() = Quantity × Price

---

### Đánh Giá & Nhận Xét (Reviews)
**Mục đích:** Khách hàng đánh giá sản phẩm, giúp khách hàng khác quyết định mua

**Quy trình:**
1. Khách hàng (User) mua sản phẩm
2. Sau khi nhận hàng → Đánh giá sản phẩm (1-5 sao)
3. Viết bình luận (Comment)
4. Admin duyệt: IsApproved = false → true
5. Hiển thị đánh giá trên trang sản phẩm

**Dữ liệu:**
- ReviewId, UserId, ProductId, OrderId
- Rating (1-5), Comment (≤1000 ký tự)
- IsApproved (false mặc định, chỉ Admin phê duyệt)
- CreatedDate, UpdatedDate

---

### Banner & Quảng Cáo
**Mục đích:** Quảng bá sản phẩm, khuyến mại trên trang chủ

**Quy trình:**
1. Admin tạo Banner
2. Chỉ định: Hình ảnh, Tiêu đề, Mô tả, Link
3. Thời gian hiển thị: StartDate → EndDate
4. DisplayOrder (Vị trí ưu tiên)
5. Hệ thống tự động hiển thị theo thời gian
6. Method: ShouldDisplay() - Kiểm tra xem banner có hiển thị được không

**Dữ liệu:**
- BannerId, Title, ImageUrl, LinkUrl
- StartDate, EndDate
- DisplayOrder, IsActive
- CreatedDate, UpdatedDate

---

### Flash Sale (Bán Chớp)
**Mục đích:** Khuyến mại theo thời gian (Ví dụ: "Sáng Siêu Rẻ", "Hôm nay sale 50%")

**Quy trình:**
1. Admin tạo Flash Sale
   - Title: "Sáng Siêu Rẻ"
   - StartTime: 06:00 hôm nay
   - EndTime: 10:00 hôm nay
2. Chọn sản phẩm tham gia Flash Sale (FlashSaleItem)
   - ProductId, DiscountPercent hoặc FixedPrice
3. Hệ thống tự động:
   - Kích hoạt khi StartTime đến
   - Hiển thị giá sale trên web
   - Vô hiệu khi hết thời gian
4. Method: IsOngoing() - Kiểm tra đang trong thời gian sale không

**Dữ liệu:**
- FlashSaleId, Title, Description
- StartTime, EndTime (Datetime)
- IsActive
- FlashSaleItem: FlashSaleId, ProductId, DiscountPercent/FixedPrice

---

### Coupon & Mã Giảm Giá
**Mục đích:** Cho phép khách hàng nhập mã để giảm giá đơn hàng

**Quy trình:**
1. Admin tạo Coupon
   - Code: "SALE50" (3-50 ký tự)
   - Discount: 50% hoặc 100,000 VNĐ
   - MinOrderAmount: Mua tối thiểu 500,000 mới dùng được
   - Quantity: 100 mã (Giới hạn số lần dùng)
   - StartDate → EndDate
2. Khách hàng nhập mã khi checkout
3. Hệ thống kiểm tra:
   - Code có tồn tại?
   - Còn hạn sử dụng?
   - Còn số lượng?
   - Đơn hàng ≥ MinOrderAmount?
4. Nếu OK → Tính toán discount
5. Cập nhật UsedQuantity += 1

**Dữ liệu:**
- CouponId, Code, Description
- DiscountPercentage (0-100), MaxDiscountAmount
- MinOrderAmount, Quantity, UsedQuantity
- StartDate, EndDate, IsActive
- Method: IsValid() - Kiểm tra mã có hợp lệ không
- Method: CalculateDiscount(orderAmount) - Tính tiền giảm

---

### Tính Toán Chiết Khấu Tự Động
**Quy trình khi khách thanh toán:**

```
OrderAmount = Σ (Quantity × Price)

// Bước 1: Kiểm tra Flash Sale
Nếu sản phẩm trong Flash Sale:
  SalePrice = Price × (1 - FlashSaleDiscount%)

// Bước 2: Kiểm tra Promotion
Nếu sản phẩm trong Promotion:
  PromotionPrice = Price × (1 - PromotionDiscount%)

// Bước 3: Chọn giá thấp nhất
FinalPrice = MIN(Price, SalePrice, PromotionPrice)
OrderAmount = Σ (Quantity × FinalPrice)

// Bước 4: Coupon
Nếu khách nhập Coupon hợp lệ:
  CouponDiscount = OrderAmount × CouponPercent%
  OrderAmount = OrderAmount - CouponDiscount
  
// Bước 5: Tính tiền thanh toán
FinalAmount = OrderAmount
```

---

### Công Nợ Phải Trả (Payables)
```
Tạo từ: ImportOrder
├─ Khi: Nhập hàng thành công
├─ Giá trị: TotalAmount của ImportOrder
├─ Trạng thái: OUTSTANDING (chưa trả)
├─ Hạn thanh toán: Thường 30 ngày
└─ Cập nhật: Khi thanh toán
   ├─ AmountPaid += Payment
   ├─ AmountDue = Amount - AmountPaid
   └─ Nếu AmountDue = 0 → PAID
```

### Công Nợ Phải Thu (Receivables)
```
Tạo từ: SalesOrder (khi khách hàng nợ)
├─ Khi: Bán hàng + Khách hàng không thanh toán ngay
├─ Giá trị: FinalAmount của SalesOrder
├─ Trạng thái: OUTSTANDING (chưa trả)
├─ Hạn thanh toán: Thường 30 ngày
└─ Cập nhật: Khi khách thanh toán
   ├─ AmountPaid += Payment
   ├─ AmountDue = Amount - AmountPaid
   └─ Nếu AmountDue = 0 → PAID
   └─ Nếu AmountDue > 0 → PARTIAL
```

### Thanh Toán (Payments)
```
Phương thức:
├─ Tiền mặt (CASH)
├─ Thẻ tín dụng (CARD)
└─ Chuyển khoản (BANK_TRANSFER)

Ghi nhận:
├─ PaymentDate: Ngày thanh toán
├─ Amount: Số tiền
├─ PaymentMethod: Phương thức
└─ Status: COMPLETED
```

---

## 📈 QUẢN LÝ TỐN KHO

### Cấp Độ Tồn Kho
```
1. QuantityInStock (Số lượng tồn)
   └─ Cập nhật: Nhập (+), Bán (-), Trả (+)

2. QuantityReserved (Số lượng đặt cọc)
   └─ Cập nhật: Bán (+), Giao (-), Trả (-)

3. AvailableQuantity (Số lượng có sẵn)
   └─ = QuantityInStock - QuantityReserved
   └─ Số lượng có thể bán ngay
```

### Cảnh Báo Tồn Kho
```
1. ReorderLevel (Mức tối thiểu)
   ├─ Được thiết lập cho mỗi sản phẩm
   └─ Khi AvailableQuantity < ReorderLevel
      └─ Gửi cảnh báo cần nhập hàng

2. Out of Stock (Hết hàng)
   ├─ Khi QuantityInStock = 0
   └─ Không thể bán được

3. Low Stock (Hàng sắp hết)
   ├─ Khi AvailableQuantity < ReorderLevel
   └─ Cần nhập bổ sung
```

---

## 👥 VAI TRÒ VÀ QUYỀN HẠN

### Admin (Quản Lý Hệ Thống)
```
Quyền:
├─ Quản lý người dùng
├─ Quản lý sản phẩm, danh mục
├─ Quản lý nhà cung cấp, khách hàng
├─ Quản lý đơn hàng (nhập/bán)
├─ Quản lý giao hàng, thanh toán
├─ Xem toàn bộ báng cáo
└─ Cấu hình hệ thống
```

### Manager (Quản Lý Cửa Hàng)
```
Quyền:
├─ Quản lý sản phẩm
├─ Quản lý đơn hàng (nhập/bán)
├─ Quản lý giao hàng
├─ Quản lý thanh toán
├─ Xem báng cáo
└─ Duyệt các giao dịch lớn
```

### Staff (Nhân Viên)
```
Quyền:
├─ Tạo đơn hàng
├─ Xem danh sách sản phẩm, khách hàng
├─ Cập nhật tồn kho
├─ Ghi nhận giao hàng, thanh toán
└─ Xem thông tin cơ bản
```

### Customer (Khách Hàng)
```
Quyền:
├─ Xem danh sách sản phẩm
├─ Tạo đơn hàng
├─ Xem trạng thái đơn hàng
└─ Xem lịch sử mua hàng
```

---

## 📊 CÁC BÁNG CÁO CHÍNH

### 1. Báng Cáo Doanh Thu
```
├─ Tổng doanh thu theo ngày/tháng/năm
├─ Doanh thu từng khách hàng
├─ Doanh thu từng danh mục
└─ Biểu đồ xu hướng doanh thu
```

### 2. Báng Cáo Sản Phẩm Bán Chạy
```
├─ Top 10 sản phẩm bán nhiều nhất
├─ Top 10 sản phẩm có doanh thu cao nhất
├─ Tỷ lệ bán theo danh mục
└─ Xu hướng bán hàng
```

### 3. Báng Cáo Tồn Kho
```
├─ Tổng tồn kho hiện tại
├─ Giá trị tồn kho
├─ Danh sách hàng sắp hết
├─ Danh sách hàng hết
└─ Vị trí kho
```

### 4. Báng Cáo Công Nợ
```
├─ Công nợ phải thu từ khách hàng
├─ Công nợ quá hạn
├─ Công nợ phải trả cho nhà cung cấp
└─ Chi tiết công nợ từng đối tác
```

### 5. Báng Cáo Đơn Hàng
```
├─ Đơn hàng nhập (theo nhà cung cấp)
├─ Đơn hàng bán (theo khách hàng)
├─ Đơn hàng chậm nhất
├─ Tỷ lệ thành công giao hàng
└─ Thời gian giao hàng trung bình
```

---

## 🔢 VÍ DỤ GIAO DỊCH THỰC TẾ

### Ví Dụ Hoàn Chỉnh: Bán Xi Măng

**Ngày 04/02/2026**

**Step 1: Nhập Hàng**
- Supplier A cung cấp 100 bao xi măng
- Giá: 500,000 VNĐ/bao
- Tổng: 50,000,000 VNĐ
- ImportCode: IMP20260204001
- Status: RECEIVED ✓
- Tồng kho: 50 → 150 bao
- Nợ Supplier A: 50,000,000 VNĐ

**Step 2: Bán Hàng (Ngày 04/02)**
- Customer B đặt 50 bao
- Giá bán: 500,000 VNĐ/bao (không lãi)
- Chiết khấu: 5%
- Tổng: 50,000,000 × 0.95 = 47,500,000 VNĐ
- OrderCode: ORD20260204001
- Status: CONFIRMED ✓
- Tồng đặt cọc: 20 → 70 bao
- Khách nợ: 47,500,000 VNĐ

**Step 3: Giao Hàng (Ngày 06/02)**
- Giao 50 bao cho Customer B
- DeliveryCode: DEL20260204001
- Tài xế: Nguyễn Văn A
- Status: DELIVERED ✓
- Tồng kho: 150 → 100 bao
- Tồng đặt cọc: 70 → 20 bao

**Step 4: Thanh Toán Một Phần (Ngày 10/02)**
- Customer B thanh toán 25,000,000 VNĐ (50%)
- Phương thức: Chuyển khoản
- Receivable Status: OUTSTANDING → PARTIAL
- Công nợ còn: 22,500,000 VNĐ

**Step 5: Trả Hàng (Ngày 12/02)**
- Customer B trả lại 10 bao (bị nứt trong vận chuyển)
- Hoàn tiền: 5,000,000 VNĐ (10 × 500,000)
- ReturnCode: RET20260212001
- Tồng kho: 100 → 110 bao
- Công nợ còn: 22,500,000 - 5,000,000 = 17,500,000 VNĐ

**Tóm Tắt Tài Chính:**
```
Doanh Thu Bruto:        47,500,000 VNĐ
Đã Thanh Toán:          25,000,000 VNĐ (52.6%)
Trả Hàng:              -5,000,000 VNĐ
Doanh Thu Ròng:        42,500,000 VNĐ
Công Nợ Còn:           17,500,000 VNĐ (36.8%)
```

---

## 🎯 TÍNH NĂNG CHÍNH

### CORE FUNCTIONS - B2B (Quản Lý Cửa Hàng)
- [x] Đăng nhập & Xác thực (JWT)
- [x] Quản lý người dùng & quyền hạn (Admin, Manager, Staff, Driver, Customer)
- [x] Quản lý sản phẩm & danh mục (10+ danh mục)
- [x] Quản lý khách hàng & nhà cung cấp (8+ suppliers, 7+ customers demo)
- [x] Nhập hàng & Quản lý tồn kho (3 cấp độ: InStock, Reserved, Available)
- [x] Bán hàng & Đơn hàng (B2B)
- [x] Giao hàng & Tracking (Với tài xế, địa chỉ)
- [x] Trả hàng & Hoàn tiền (Với lý do trả)
- [x] Thanh toán & Quản lý công nợ (Phải thu/Phải trả)
- [x] Báng cáo & Thống kê

### E-COMMERCE FUNCTIONS - B2C (Bán Online) ⭐ NEW
- [x] Giỏ hàng (Shopping Cart) - User thêm/sửa/xóa sản phẩm
- [x] Đánh giá & nhận xét sản phẩm (Reviews) - 1-5 sao + bình luận
- [x] Banner & quảng cáo - Quản lý banner với thời gian hiển thị
- [x] Flash Sale (Bán chớp) - Giảm giá theo thời gian (StartTime - EndTime)
- [x] Coupon & mã giảm giá - Mã code, % giảm, giới hạn số lần dùng
- [x] Tính toán chiết khấu tự động - Flash Sale + Coupon + Promotion
- [x] Xử lý đơn hàng từ web - Giỏ → Checkout → SalesOrder

### EXTENDED FUNCTIONS (Tương Lai)
- [ ] Multi-warehouse (Đa kho)
- [ ] EDI Integration (Tích hợp nhà cung cấp)
- [ ] Invoice Generator (Tạo hóa đơn điện tử)
- [ ] Mobile App nâng cao
- [ ] AI Analytics & Prediction (Dự báo hàng sắp hết)
- [ ] Integration Payment Gateway (VNPay, Momo)
- [ ] Notification System (Email, SMS, Push)
- [ ] Loyalty Program (Chương trình thành viên)

---

## 📱 CÁC NỀN TẢNG

### Backend (.NET 8)
- ASP.NET Core API (RESTful)
- Entity Framework Core (ORM)
- JWT Authentication
- Dependency Injection
- Repository Pattern

### Frontend (React 18)
- Component-based UI
- Redux State Management
- Axios HTTP Client
- React Router
- Material-UI/Bootstrap

### Mobile (Flutter)
- Cross-platform (iOS/Android)
- Local Storage (SharedPreferences)
- API Integration (Dio)
- Real-time Notifications

### Database (SQL Server)
- 22 bảng
- Relationships & Constraints
- Indexing & Performance
- Backup & Recovery

---

## 💡 KIẾN THỨC KINH DOANH CẦN NHỚ

### 1. Tồn Kho là TRÁI TIM Của Kinh Doanh
```
- Tồng kho cao → Tốn chi phí lưu trữ
- Tồng kho thấp → Mất khách hàng
- Mục tiêu: Cân bằng giữa cung & cầu
```

### 2. Công Nợ Là Cơ Hội & Rủi Ro
```
- Cho phép nợ → Tăng doanh số
- Quản lý tốt → Tăng dòng tiền
- Không quản lý → Nợ xấu → Phá sản
```

### 3. Dòng Tiền > Lợi Nhuận
```
- Lợi nhuận cao nhưng công nợ lâu = Khó
- Lợi nhuận thấp nhưng tiền mặt sẵn = OK
```

### 4. Chiết Khấu & Giá Cả
```
- Chiết khấu cao → Tăng doanh số nhưng giảm lợi nhuận
- Giá cả phải cân bằng cung-cầu
```

---

## 📚 TÀI LIỆU LIÊN QUAN

1. **[BUSINESS_ANALYSIS.md](BUSINESS_ANALYSIS.md)** - Phân tích kinh doanh chi tiết
2. **[USE_CASES.md](USE_CASES.md)** - 30+ use cases chi tiết
3. **[TRANSACTION_FLOW.md](TRANSACTION_FLOW.md)** - 5 quy trình giao dịch chính
4. **[Schema.md](Schema.md)** - Mô tả 22 bảng database
5. **[README.md](README.md)** - Tổng quan dự án
6. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Hướng dẫn cài đặt
7. **[Docs/DEVELOPMENT_GUIDE.md](Docs/DEVELOPMENT_GUIDE.md)** - Hướng dẫn phát triển

---

## 🔗 LIÊN HỆ & HỖ TRỢ

**Dự Án:** Quản Lý Của Hàng Vật Liệu Xây Dựng  
**Phiên Bản:** 1.0  
**Trạng Thái:** Đang Phát Triển  
**Cập Nhật Lần Cuối:** 04/02/2026

**Tác Giả:** Thanh Tuấn (Dự Án KLTN)

---

## 📌 DANH SÁCH KIỂM TRA KIẾN THỨC

Bạn đã hiểu rõ về:

- [ ] Mô hình kinh doanh cửa hàng vật liệu xây dựng
- [ ] 5 quy trình chính: Nhập → Bán → Giao → Thanh Toán → Trả Hàng
- [ ] Quản lý tồn kho: QuantityInStock, QuantityReserved, AvailableQuantity
- [ ] Quản lý công nợ: Payables, Receivables, Payments
- [ ] 22 bảng database và mối quan hệ giữa chúng
- [ ] Vai trò & quyền hạn: Admin, Manager, Staff, Customer
- [ ] Các báng cáo chính: Doanh thu, Sản phẩm, Tồn kho, Công nợ
- [ ] Ví dụ giao dịch hoàn chỉnh từ nhập hàng đến thanh toán

---

**🎓 HOÀN TẤT PHÂN TÍCH KINH DOANH!**

Bây giờ bạn đã có hiểu biết sâu về hệ thống. Hãy bắt đầu phát triển!

```
Tiếp Theo:
1. ✓ Phân tích kinh doanh (hoàn tất)
2. → Thiết kế hệ thống chi tiết
3. → Triển khai Backend
4. → Phát triển Frontend
5. → Xây dựng Mobile App
6. → Testing & QA
7. → Deployment
```
