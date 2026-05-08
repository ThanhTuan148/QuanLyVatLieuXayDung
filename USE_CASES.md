# 🎯 CÁC USE CASE CHI TIẾT - HỆ THỐNG QUẢN LÝ CỬA HÀNG VẬT LIỆU XÂY DỰNG

## 📌 DANH SÁCH CÁC USE CASE

```
QUẢN LÝ CỬA HÀNG VẬT LIỆU XÂY DỰNG
├── QUẢN LÝ NGƯỜI DÙNG & XÁC THỰC
│   ├── UC001: Đăng Nhập
│   ├── UC002: Đăng Xuất
│   ├── UC003: Quên Mật Khẩu
│   └── UC004: Quản Lý Tài Khoản Người Dùng
│
├── QUẢN LÝ SẢN PHẨM
│   ├── UC101: Xem Danh Sách Sản Phẩm
│   ├── UC102: Tạo Sản Phẩm Mới
│   ├── UC103: Cập Nhật Thông Tin Sản Phẩm
│   ├── UC104: Xóa Sản Phẩm
│   ├── UC105: Tìm Kiếm Sản Phẩm
│   └── UC106: Quản Lý Danh Mục
│
├── QUẢN LÝ KHÁCH HÀNG
│   ├── UC201: Xem Danh Sách Khách Hàng
│   ├── UC202: Tạo Khách Hàng Mới
│   ├── UC203: Cập Nhật Thông Tin Khách Hàng
│   ├── UC204: Xóa Khách Hàng
│   └── UC205: Xem Lịch Sử Giao Dịch
│
├── QUẢN LÝ NHÀ CUNG CẤP
│   ├── UC301: Xem Danh Sách Nhà Cung Cấp
│   ├── UC302: Tạo Nhà Cung Cấp Mới
│   ├── UC303: Cập Nhật Thông Tin Nhà Cung Cấp
│   └── UC304: Xóa Nhà Cung Cấp
│
├── QUẢN LÝ NHẬP HÀNG
│   ├── UC401: Xem Danh Sách Đơn Nhập
│   ├── UC402: Tạo Đơn Nhập Mới
│   ├── UC403: Cập Nhật Đơn Nhập
│   ├── UC404: Xóa Đơn Nhập
│   ├── UC405: Kiểm Nhận Hàng Nhập
│   └── UC406: In Phiếu Nhập Hàng
│
├── QUẢN LÝ BÁN HÀNG
│   ├── UC501: Xem Danh Sách Đơn Hàng
│   ├── UC502: Tạo Đơn Hàng Mới
│   ├── UC503: Cập Nhật Đơn Hàng
│   ├── UC504: Hủy Đơn Hàng
│   ├── UC505: Xác Nhận Đơn Hàng
│   └── UC506: In Hóa Đơn
│
├── QUẢN LÝ TỒN KHO
│   ├── UC601: Xem Tồn Kho Hiện Tại
│   ├── UC602: Cảnh Báo Hàng Sắp Hết
│   ├── UC603: Kiểm Kho (Inventory Check)
│   └── UC604: Báng Cáo Tồn Kho
│
├── QUẢN LÝ GIAO HÀNG
│   ├── UC701: Xem Danh Sách Giao Hàng
│   ├── UC702: Tạo Phiếu Giao Hàng
│   ├── UC703: Phân Công Tài Xế
│   ├── UC704: Cập Nhật Trạng Thái Giao Hàng
│   └── UC705: Xác Nhận Giao Hàng
│
├── QUẢN LÝ THANH TOÁN
│   ├── UC801: Ghi Nhận Thanh Toán
│   ├── UC802: Cập Nhật Thanh Toán
│   └── UC803: In Phiếu Thanh Toán
│
├── QUẢN LÝ TRẢ HÀNG
│   ├── UC901: Tạo Đơn Trả Hàng
│   ├── UC902: Xác Nhận Trả Hàng
│   └── UC903: Hoàn Tiền / Ghi Nợ
│
├── QUẢN LÝ CÔNG NỢ
│   ├── UC1001: Xem Công Nợ Phải Thu
│   ├── UC1002: Xem Công Nợ Phải Trả
│   ├── UC1003: Cảnh Báo Công Nợ Quá Hạn
│   └── UC1004: Báng Cáo Công Nợ
│
└── BÁNG CÁO & THỐNG KÊ
│   ├── UC1101: Báng Cáo Doanh Thu
│   ├── UC1102: Báng Cáo Sản Phẩm Bán Chạy
│   ├── UC1103: Báng Cáo Tồn Kho
│   ├── UC1104: Báng Cáo Công Nợ
│   └── UC1105: Báng Cáo Tổng Hợp
│
└── E-COMMERCE (B2C)
    ├── UC1201: Xem Danh Sách Sản Phẩm (Với Filter, Search)
    ├── UC1202: Xem Chi Tiết Sản Phẩm (Giá, Tồn kho, Đánh giá)
    ├── UC1203: Thêm Sản Phẩm Vào Giỏ Hàng
    ├── UC1204: Xem Giỏ Hàng
    ├── UC1205: Cập Nhật Giỏ Hàng (Số lượng, Xóa)
    ├── UC1206: Thanh Toán Từ Giỏ Hàng
    ├── UC1207: Nhập Mã Coupon
    ├── UC1208: Đánh Giá Sản Phẩm
    ├── UC1209: Xem Đánh Giá Sản Phẩm
    ├── UC1210: Quản Lý Flash Sale
    ├── UC1211: Quản Lý Coupon
    └── UC1212: Quản Lý Banner
```

---

## 🔐 UC001: ĐĂNG NHẬP

### Mô Tả
Người dùng đăng nhập vào hệ thống bằng tên đăng nhập và mật khẩu.

### Đối Tượng Tham Gia
- **Actor Chính**: Người Dùng (User)
- **Hệ Thống**: AuthService, DatabaseService
- **Actor Phụ**: LDAP (nếu có)

### Điều Kiện Tiên Quyết
- Người dùng có tài khoản đã đăng ký
- Hệ thống đang hoạt động bình thường

### Luồng Chính
1. Người dùng truy cập trang đăng nhập
2. Nhập **Username** và **Password**
3. Nhấn **Submit**
4. Hệ thống xác thực:
   - Kiểm tra User tồn tại
   - Kiểm tra Password đúng
   - Kiểm tra User IsActive = true
5. Nếu xác thực thành công:
   - Cập nhật **LastLogin** = Ngày hiện tại
   - Tạo **JWT Token**
   - Trả về token và thông tin user
   - Chuyển hướng tới Dashboard
6. Nếu xác thực thất bại:
   - Hiển thị lỗi: "Tên đăng nhập hoặc mật khẩu không đúng"
   - Yêu cầu đăng nhập lại

### Luồng Ngoại Lệ
- **E1**: Tài khoản không tồn tại → Hiển thị lỗi
- **E2**: Mật khẩu sai → Hiển thị lỗi
- **E3**: Tài khoản bị khóa (IsActive = false) → Hiển thị lỗi
- **E4**: Hệ thống lỗi → Hiển thị lỗi 500

### Kết Quả
- **Thành công**: Người dùng đăng nhập vào hệ thống, có quyền truy cập các chức năng theo vai trò
- **Thất bại**: Người dùng không thể truy cập hệ thống

### Dữ Liệu Liên Quan
```csharp
// AuthService.Login()
public async Task<LoginResponse> Login(LoginRequest request)
{
    // 1. Kiểm tra User tồn tại
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
    if (user == null) throw new Exception("User không tồn tại");

    // 2. Kiểm tra Password
    if (!VerifyPassword(request.Password, user.PasswordHash)) 
        throw new Exception("Mật khẩu sai");

    // 3. Kiểm tra IsActive
    if (!user.IsActive) throw new Exception("Tài khoản bị khóa");

    // 4. Cập nhật LastLogin
    user.LastLogin = DateTime.UtcNow;
    await _context.SaveChangesAsync();

    // 5. Tạo JWT Token
    var token = GenerateJwtToken(user);

    // 6. Trả về response
    return new LoginResponse 
    { 
        Token = token,
        User = new UserDto { /* ... */ }
    };
}
```

---

## 📦 UC401: TẠO ĐƠN NHẬP HÀNG MỚI

### Mô Tả
Nhân viên tạo một đơn nhập hàng từ nhà cung cấp để bổ sung hàng hóa cho kho.

### Đối Tượng Tham Gia
- **Actor Chính**: Nhân Viên / Quản Lý (Staff / Manager)
- **Hệ Thống**: OrderService, InventoryService, DatabaseService
- **Actor Phụ**: Nhà Cung Cấp

### Điều Kiện Tiên Quyết
- Người dùng đã đăng nhập
- Có quyền `ORDER_MANAGE`
- Nhà cung cấp tồn tại trong hệ thống
- Sản phẩm tồn tại trong hệ thống

### Luồng Chính
1. Người dùng chuyển đến trang **Quản Lý Nhập Hàng**
2. Nhấn **Tạo Đơn Nhập Mới**
3. Chọn **Nhà Cung Cấp** từ danh sách
4. Nhập **Ngày Nhập** và **Ngày Giao Dự Kiến**
5. Thêm **Chi Tiết Sản Phẩm**:
   - Chọn **Sản Phẩm**
   - Nhập **Số Lượng**
   - Nhập **Giá Đơn Vị**
   - Hệ thống tự tính **Thành Tiền** = Số Lượng × Giá Đơn Vị
   - Có thể thêm nhiều sản phẩm
6. Nhập **Ghi Chú** (nếu có)
7. Nhấn **Tạo Đơn**
8. Hệ thống xác thực:
   - Kiểm tra tất cả bắt buộc đã nhập
   - Tính **Tổng Tiền** = Σ Thành Tiền
   - Tạo **ImportOrder** mới với Status = `PENDING`
   - Tạo các **ImportOrderDetail**
9. Lưu vào database
10. Hiển thị thành công: "Tạo đơn nhập thành công"
11. Trả về trang danh sách đơn nhập

### Luồng Ngoại Lệ
- **E1**: Nhà cung cấp không tồn tại → Báo lỗi
- **E2**: Sản phẩm không tồn tại → Báo lỗi
- **E3**: Số lượng ≤ 0 → Báo lỗi
- **E4**: Giá đơn vị ≤ 0 → Báo lỗi
- **E5**: Không có chi tiết sản phẩm → Báo lỗi
- **E6**: Lỗi lưu vào database → Hiển thị lỗi

### Kết Quả
- **Thành công**: Đơn nhập hàng được tạo, Status = PENDING, Hiển thị mã đơn
- **Thất bại**: Không tạo được đơn, hiển thị lỗi

### Dữ Liệu Liên Quan
```csharp
// OrderService.CreateImportOrder()
public async Task<ImportOrderDto> CreateImportOrder(CreateImportOrderRequest request)
{
    // 1. Validate
    if (request.SupplierId <= 0) throw new Exception("Nhà cung cấp không hợp lệ");
    if (request.ImportDetails?.Count == 0) throw new Exception("Phải có ít nhất 1 sản phẩm");

    // 2. Kiểm tra Supplier tồn tại
    var supplier = await _context.Suppliers.FindAsync(request.SupplierId);
    if (supplier == null) throw new Exception("Nhà cung cấp không tồn tại");

    // 3. Tạo ImportOrder
    var importOrder = new ImportOrder
    {
        ImportCode = GenerateImportCode(), // E.g., "IMP20260204001"
        SupplierId = request.SupplierId,
        ImportDate = request.ImportDate ?? DateTime.UtcNow,
        DeliveryDate = request.DeliveryDate,
        Status = "PENDING",
        CreatedBy = CurrentUserId,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        Notes = request.Notes
    };

    // 4. Thêm chi tiết
    decimal totalAmount = 0;
    foreach (var detail in request.ImportDetails)
    {
        // Kiểm tra sản phẩm
        var product = await _context.Products.FindAsync(detail.ProductId);
        if (product == null) throw new Exception($"Sản phẩm {detail.ProductId} không tồn tại");

        var totalPrice = detail.Quantity * detail.UnitPrice;
        totalAmount += totalPrice;

        importOrder.ImportDetails.Add(new ImportOrderDetail
        {
            ProductId = detail.ProductId,
            Quantity = detail.Quantity,
            UnitPrice = detail.UnitPrice,
            TotalPrice = totalPrice,
            ReceivedQuantity = 0,
            CreatedAt = DateTime.UtcNow
        });
    }

    importOrder.TotalAmount = totalAmount;

    // 5. Lưu
    _context.ImportOrders.Add(importOrder);
    await _context.SaveChangesAsync();

    return MapToDto(importOrder);
}
```

---

## 🛒 UC502: TẠO ĐƠN HÀNG BÁN HÀNG MỚI

### Mô Tả
Nhân viên tạo một đơn bán hàng cho khách hàng.

### Đối Tượng Tham Gia
- **Actor Chính**: Nhân Viên / Quản Lý (Staff / Manager) hoặc Khách Hàng (Customer)
- **Hệ Thống**: OrderService, InventoryService, DatabaseService
- **Actor Phụ**: Khách Hàng, Sản Phẩm

### Điều Kiện Tiên Quyết
- Người dùng đã đăng nhập
- Có quyền `ORDER_MANAGE` (nếu là staff) hoặc `ORDER_CREATE` (nếu là khách hàng)
- Khách hàng tồn tại trong hệ thống
- Sản phẩm tồn tại và có tồn kho

### Luồng Chính
1. Người dùng chuyển đến trang **Quản Lý Đơn Hàng Bán**
2. Nhấn **Tạo Đơn Hàng Mới**
3. Chọn **Khách Hàng** từ danh sách (hoặc lấy khách hàng hiện tại nếu là customer)
4. Nhập **Ngày Đặt** và **Ngày Giao Dự Kiến**
5. Thêm **Chi Tiết Sản Phẩm**:
   - Chọn **Sản Phẩm**
   - Hệ thống hiển thị **Giá Bán**, **Tồn Kho Có Sẵn** (AvailableQuantity)
   - Nhập **Số Lượng** (≤ AvailableQuantity)
   - Có thể nhập **Chiết Khấu** riêng (%)
   - Hệ thống tự tính **Thành Tiền** = Số Lượng × Giá × (1 - Chiết Khấu)
   - Có thể thêm nhiều sản phẩm
6. Nhập **Chiết Khấu Chung** cho đơn (%)
7. Nhập **Ghi Chú** (nếu có)
8. Nhấn **Tạo Đơn Hàng**
9. Hệ thống xác thực:
   - Kiểm tra tất cả bắt buộc
   - Kiểm tra tồn kho đủ cho mỗi sản phẩm
   - Tính **Tổng Tiền** = Σ Thành Tiền
   - Tính **Tổng Sau Chiết Khấu** = Tổng Tiền × (1 - Chiết Khấu Chung)
   - Tạo **SalesOrder** mới với Status = `PENDING`
   - Tạo các **SalesOrderDetail**
   - **Cập nhật QuantityReserved**:
     - Inventory.QuantityReserved += OrderQuantity
     - Inventory.AvailableQuantity = QuantityInStock - QuantityReserved
10. Lưu vào database
11. Hiển thị thành công: "Tạo đơn hàng thành công"

### Luồng Ngoại Lệ
- **E1**: Khách hàng không tồn tại → Báo lỗi
- **E2**: Sản phẩm không tồn tại → Báo lỗi
- **E3**: Tồn kho không đủ → Báo lỗi "Chỉ còn X sản phẩm"
- **E4**: Số lượng ≤ 0 → Báo lỗi
- **E5**: Không có chi tiết sản phẩm → Báo lỗi
- **E6**: Chiết khấu > 100% hoặc < 0 → Báo lỗi

### Kết Quả
- **Thành công**: Đơn hàng được tạo, Status = PENDING, Hiển thị mã đơn
- **Thất bại**: Không tạo được đơn, hiển thị lỗi

### Dữ Liệu Liên Quan

```csharp
// OrderService.CreateSalesOrder()
public async Task<SalesOrderDto> CreateSalesOrder(CreateSalesOrderRequest request)
{
    // 1. Validate Khách Hàng
    var customer = await _context.Customers.FindAsync(request.CustomerId);
    if (customer == null) throw new Exception("Khách hàng không tồn tại");

    // 2. Tạo SalesOrder
    var salesOrder = new SalesOrder
    {
        OrderCode = GenerateOrderCode(), // E.g., "ORD20260204001"
        CustomerId = request.CustomerId,
        OrderDate = request.OrderDate ?? DateTime.UtcNow,
        DeliveryDate = request.DeliveryDate,
        Status = "PENDING",
        Discount = request.DiscountPercent ?? 0,
        CreatedBy = CurrentUserId,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        Notes = request.Notes
    };

    // 3. Xử lý chi tiết và kiểm tra tồn kho
    decimal totalAmount = 0;
    foreach (var detail in request.OrderDetails)
    {
        // Kiểm tra sản phẩm
        var product = await _context.Products.FindAsync(detail.ProductId);
        if (product == null) throw new Exception($"Sản phẩm không tồn tại");

        // Kiểm tra tồn kho
        var inventory = await _context.Inventory.FirstOrDefaultAsync(i => i.ProductId == detail.ProductId);
        if (inventory == null) throw new Exception($"Sản phẩm {product.ProductName} hết hàng");

        var availableQty = inventory.QuantityInStock - inventory.QuantityReserved;
        if (detail.Quantity > availableQty)
            throw new Exception($"Sản phẩm {product.ProductName} chỉ còn {availableQty} cái");

        // Tính tiền chi tiết
        var itemDiscount = detail.DiscountPercent ?? 0;
        var itemTotal = detail.Quantity * product.UnitPrice;
        var itemTotalAfterDiscount = itemTotal * (1 - itemDiscount / 100);

        totalAmount += itemTotalAfterDiscount;

        salesOrder.OrderDetails.Add(new SalesOrderDetail
        {
            ProductId = detail.ProductId,
            Quantity = detail.Quantity,
            UnitPrice = product.UnitPrice,
            TotalPrice = itemTotal,
            Discount = itemDiscount,
            CreatedAt = DateTime.UtcNow
        });

        // Update QuantityReserved
        inventory.QuantityReserved += detail.Quantity;
    }

    // 4. Tính tổng tiền
    salesOrder.TotalAmount = totalAmount;
    var finalAmount = totalAmount * (1 - salesOrder.Discount / 100);
    salesOrder.FinalAmount = finalAmount;

    // 5. Lưu
    _context.SalesOrders.Add(salesOrder);
    await _context.SaveChangesAsync();

    return MapToDto(salesOrder);
}
```

---

## 📍 UC702: TẠO PHIẾU GIAO HÀNG

### Mô Tả
Nhân viên tạo phiếu giao hàng để giao sản phẩm cho khách hàng.

### Đối Tượng Tham Gia
- **Actor Chính**: Nhân Viên / Quản Lý (Staff / Manager)
- **Hệ Thống**: DeliveryService, OrderService, DatabaseService
- **Actor Phụ**: Tài Xế, Khách Hàng

### Điều Kiện Tiên Quyết
- Đơn hàng có Status = `PENDING` hoặc `CONFIRMED`
- Hệ thống có sẵn tài xế hoặc tự chỉ định
- Địa chỉ giao hàng hợp lệ

### Luồng Chính
1. Người dùng chuyển đến trang **Quản Lý Giao Hàng**
2. Nhấn **Tạo Phiếu Giao Hàng** hoặc chọn từ danh sách đơn hàng chưa giao
3. Hệ thống tự động:
   - Lấy **OrderId** từ đơn hàng
   - Lấy **Địa Chỉ Khách Hàng** từ bảng Customers
   - Lấy **Chi Tiết Sản Phẩm** từ SalesOrderDetails
4. Nhân viên:
   - Chọn hoặc nhập **Tài Xế**
   - Chọn hoặc nhập **Số Điện Thoại Tài Xế**
   - Xác nhận hoặc cập nhật **Địa Chỉ Giao**
   - Nhập **Ngày Giao Dự Kiến**
   - Nhập **Ghi Chú** (nếu có)
5. Nhấn **Tạo Phiếu Giao Hàng**
6. Hệ thống:
   - Tạo **Delivery** mới với Status = `PENDING`
   - Liên kết với **SalesOrder**
   - Cập nhật **SalesOrder.Status** = `READY_FOR_DELIVERY`
7. Lưu vào database
8. Hiển thị thành công: "Tạo phiếu giao hàng thành công"
9. Tùy chọn: In phiếu giao hàng

### Luồng Ngoại Lệ
- **E1**: Đơn hàng không tồn tại → Báo lỗi
- **E2**: Đơn hàng đã giao → Báo lỗi
- **E3**: Không có địa chỉ giao → Báo lỗi
- **E4**: Lỗi lưu vào database → Hiển thị lỗi

### Kết Quả
- **Thành công**: Phiếu giao hàng được tạo, Status = PENDING
- **Thất bại**: Không tạo được, hiển thị lỗi

---

## 💳 UC801: GHI NHẬN THANH TOÁN

### Mô Tả
Nhân viên ghi nhận thanh toán từ khách hàng cho đơn hàng đã giao.

### Đối Tượng Tham Gia
- **Actor Chính**: Nhân Viên / Quản Lý (Staff / Manager)
- **Hệ Thống**: PaymentService, OrderService, DatabaseService
- **Actor Phụ**: Khách Hàng

### Điều Kiện Tiên Quyết
- Đơn hàng tồn tại
- Khách hàng có nợ (Receivable.AmountDue > 0)

### Luồng Chính
1. Người dùng chuyển đến trang **Quản Lý Thanh Toán**
2. Nhấn **Ghi Nhận Thanh Toán**
3. Chọn **Đơn Hàng** hoặc **Khách Hàng**
4. Hệ thống hiển thị:
   - **Tổng Tiền**: FinalAmount
   - **Đã Thanh Toán**: AmountPaid
   - **Còn Nợ**: AmountDue
5. Nhân viên nhập:
   - **Số Tiền Thanh Toán**
   - **Phương Thức**: Cash / Card / Bank Transfer
   - **Số Tham Chiếu** (Transaction Number) - nếu Bank Transfer
   - **Ghi Chú** (nếu có)
6. Nhấn **Ghi Nhận Thanh Toán**
7. Hệ thống xác thực:
   - Kiểm tra Số Tiền > 0
   - Kiểm tra Số Tiền ≤ AmountDue
8. Tạo **Payment**:
   - PaymentDate = Ngày hiện tại
   - Amount = Số tiền thanh toán
   - PaymentMethod = Phương thức
   - Status = `COMPLETED`
9. Cập nhật **Receivable**:
   - AmountPaid += Amount
   - AmountDue = Amount - AmountPaid
   - Nếu AmountDue = 0: Status = `PAID`
   - Nếu AmountDue > 0: Status = `PARTIAL`
10. Lưu vào database
11. Hiển thị thành công: "Ghi nhận thanh toán thành công"

### Luồng Ngoại Lệ
- **E1**: Đơn hàng không tồn tại → Báo lỗi
- **E2**: Số tiền ≤ 0 → Báo lỗi
- **E3**: Số tiền > AmountDue → Báo lỗi "Số tiền vượt quá công nợ"
- **E4**: Lỗi lưu vào database → Hiển thị lỗi

### Kết Quả
- **Thành công**: Thanh toán được ghi nhận, công nợ được cập nhật
- **Thất bại**: Không ghi được thanh toán, hiển thị lỗi

---

## 🔄 UC905: XÁC NHẬN TRẢ HÀNG

### Mô Tả
Nhân viên xác nhận nhận lại hàng từ khách hàng và cập nhật tồn kho, hoàn tiền hoặc ghi nợ.

### Đối Tượng Tham Gia
- **Actor Chính**: Nhân Viên / Quản Lý (Staff / Manager)
- **Hệ Thống**: ReturnService, InventoryService, PaymentService, DatabaseService
- **Actor Phụ**: Khách Hàng

### Điều Kiện Tiên Quyết
- Đơn hàng tồn tại và đã giao
- Có lý do trả hàng hợp lệ

### Luồng Chính
1. Khách hàng yêu cầu trả hàng
2. Nhân viên tạo **Đơn Trả Hàng**:
   - Chọn **Đơn Hàng**
   - Chọn **Sản Phẩm** cần trả
   - Nhập **Số Lượng Trả**
   - Chọn **Lý Do Trả** (Hàng Lỗi / Giao Nhầm / Khác...)
   - Nhập **Ghi Chú**
3. Nhấn **Tạo Đơn Trả**
4. Hệ thống tạo **Return**:
   - Status = `PENDING`
   - Tính **Tổng Hoàn Lại** từ giá các sản phẩm trả
5. Xác nhận trả hàng
6. Hệ thống:
   - Cập nhật **Inventory**:
     - QuantityInStock += ReturnQuantity
     - QuantityReserved -= ReturnQuantity
     - AvailableQuantity = QuantityInStock - QuantityReserved
   - Cập nhật **Receivable** (công nợ):
     - Nếu khách hàng đã thanh toán:
       - Tạo **Payment** hoặc hoàn tiền
       - AmountDue -= Tổng Hoàn Lại
     - Nếu khách hàng nợ:
       - Ghi giảm công nợ
       - AmountDue -= Tổng Hoàn Lại
   - Status = `COMPLETED`
7. Lưu vào database
8. Hiển thị thành công

### Luồng Ngoại Lệ
- **E1**: Đơn hàng không tồn tại → Báo lỗi
- **E2**: Số lượng trả > số lượng đã bán → Báo lỗi
- **E3**: Không có lý do trả → Báo lỗi

---

## 📊 UC1101: BÁO CÁO DOANH THU

### Mô Tả
Quản lý xem báng cáo doanh thu theo ngày, tháng, năm.

### Luồng Chính
1. Người dùng chuyển đến trang **Báng Cáo → Doanh Thu**
2. Chọn **Khoảng Thời Gian**:
   - Từ Ngày → Đến Ngày
   - Hoặc chọn: Hôm Nay, Tuần Này, Tháng Này, Năm Này
3. Tùy chọn chọn **Khách Hàng** hoặc **Danh Mục Sản Phẩm**
4. Nhấn **Xem Báng Cáo**
5. Hệ thống truy vấn:
   ```sql
   SELECT 
       SUM(o.FinalAmount) as TotalRevenue,
       COUNT(DISTINCT o.OrderId) as TotalOrders,
       AVG(o.FinalAmount) as AvgOrderValue
   FROM SalesOrders o
   WHERE o.OrderDate BETWEEN @FromDate AND @ToDate
       AND o.Status = 'DELIVERED'
       AND (o.CustomerId = @CustomerId OR @CustomerId IS NULL)
   ```
6. Hiển thị:
   - Tổng Doanh Thu
   - Số Lượng Đơn
   - Doanh Thu Bình Quân
   - Biểu Đồ Doanh Thu Theo Ngày/Tháng
7. Tùy chọn: Xuất Excel

---

## 🏆 UC1102: BÁO CÁO SẢN PHẨM BÁN CHẠY

### Mô Tả
Xem danh sách các sản phẩm bán chạy nhất.

### Luồng Chính
1. Người dùng chuyển đến trang **Báng Cáo → Sản Phẩm Bán Chạy**
2. Chọn **Khoảng Thời Gian**
3. Nhấn **Xem Báng Cáo**
4. Hệ thống truy vấn:
   ```sql
   SELECT TOP 10
       p.ProductName,
       p.SKU,
       SUM(od.Quantity) as TotalQuantity,
       SUM(od.TotalPrice) as TotalRevenue
   FROM SalesOrderDetails od
   JOIN Products p ON od.ProductId = p.ProductId
   JOIN SalesOrders o ON od.OrderId = o.OrderId
   WHERE o.OrderDate BETWEEN @FromDate AND @ToDate
   GROUP BY p.ProductId, p.ProductName, p.SKU
   ORDER BY TotalQuantity DESC
   ```
5. Hiển thị bảng Top 10 sản phẩm
6. Tùy chọn: Xuất Excel, In báng cáo

---

---

## 🛍️ UC1201: XEM DANH SÁCH SẢN PHẨM (E-COMMERCE)

### Mô Tả
Khách hàng xem danh sách sản phẩm với filter, tìm kiếm, và sắp xếp.

### Đối Tượng Tham Gia
- **Actor Chính**: Khách Hàng (Customer / Guest)
- **Hệ Thống**: ProductService, InventoryService
- **Filter**: Danh mục, Giá, Tồn kho

### Luồng Chính
1. Khách hàng truy cập trang Sản Phẩm
2. Hệ thống hiển thị:
   - Tất cả sản phẩm IsActive = true
   - Thông tin: Ảnh, Tên, Giá, Tồn kho có sẵn, Đánh giá
3. Khách hàng tìm kiếm / lọc:
   - Tìm theo: Tên sản phẩm, SKU
   - Lọc theo: Danh mục, Giá (Min-Max)
   - Sắp xếp: Giá tăng/giảm, Mới nhất, Bán chạy nhất
4. Hệ thống trả về danh sách phù hợp
5. Khách hàng chọn sản phẩm → Xem chi tiết (UC1202)

### Dữ Liệu Liên Quan
- ProductId, ProductName, SKU, CategoryId
- UnitPrice, AvailableQuantity (Từ Inventory)
- AverageRating (Từ Reviews)
- IsActive

---

## 🔍 UC1202: XEM CHI TIẾT SẢN PHẨM

### Mô Tả
Khách hàng xem chi tiết một sản phẩm, bao gồm giá, tồn kho, đánh giá.

### Luồng Chính
1. Khách hàng chọn sản phẩm từ danh sách
2. Hệ thống hiển thị:
   - Tên, Mô tả, Hình ảnh (Ảnh chính + Ảnh phụ)
   - Giá bán hiện tại
   - Tồn kho có sẵn (AvailableQuantity)
   - Danh mục sản phẩm
   - Số lượng đã bán
3. Kiểm tra Flash Sale:
   - Nếu sản phẩm trong Flash Sale đang diễn ra:
     - Hiển thị giá sale (Giảm X%)
     - Hiển thị "Flash Sale" badge
4. Kiểm tra Promotion:
   - Nếu có Promotion:
     - Hiển thị thông tin khuyến mại
5. Hiển thị đánh giá:
   - Điểm trung bình (1-5 sao)
   - Số lượng đánh giá
   - Danh sách đánh giá (Review đã duyệt)
6. Nút hành động:
   - "Thêm Vào Giỏ" (Nếu AvailableQuantity > 0)
   - "Hết Hàng" (Nếu AvailableQuantity = 0)

---

## 🛒 UC1203: THÊM SẢN PHẨM VÀO GIỎ HÀNG

### Mô Tả
Khách hàng chọn số lượng và thêm sản phẩm vào giỏ hàng.

### Luồng Chính
1. Khách hàng xem chi tiết sản phẩm
2. Nhập số lượng (1 - AvailableQuantity)
3. Nhấn "Thêm Vào Giỏ"
4. Hệ thống kiểm tra:
   - Sản phẩm tồn tại?
   - Quantity > 0 và ≤ AvailableQuantity?
5. Nếu sản phẩm đã có trong giỏ:
   - Cập nhật: CartQuantity += Quantity
6. Nếu sản phẩm chưa có trong giỏ:
   - Tạo Cart mới
7. Lưu vào database: Cart table
8. Hiển thị thành công: "Thêm vào giỏ thành công"
9. Tùy chọn: Quay lại danh sách hoặc Xem giỏ hàng

### Dữ Liệu
```json
{
  "CartId": 1,
  "UserId": 5,
  "ProductId": 10,
  "Quantity": 50,
  "Price": 95000,
  "CreatedDate": "2026-02-10T14:00:00",
  "UpdatedDate": "2026-02-10T14:05:00"
}
```

---

## 🛒 UC1204: XEM GIỎ HÀNG

### Mô Tả
Khách hàng xem danh sách sản phẩm trong giỏ hàng và tổng tiền.

### Luồng Chính
1. Khách hàng nhấn "Xem Giỏ Hàng"
2. Hệ thống lấy tất cả Cart items của user
3. Hiển thị bảng:
   | Sản Phẩm | Giá | Số Lượng | Thành Tiền | Hành Động |
   |----------|-----|---------|-----------|----------|
   | Xi măng Hà Tiên | 95,000 | 50 | 4,750,000 | Xóa |
   | Cát vàng | 450,000 | 10 | 4,500,000 | Xóa |
4. Tính toán:
   - Subtotal = Σ (Quantity × Price) = 9,250,000 VNĐ
5. Hiển thị:
   - Subtotal
   - Nút: "Tiếp Tục Mua Hàng" (Quay lại danh sách)
   - Nút: "Thanh Toán" (Đi đến Checkout)

---

## 🛒 UC1205: CẬP NHẬT GIỎ HÀNG

### Mô Tả
Khách hàng cập nhật số lượng hoặc xóa sản phẩm khỏi giỏ.

### Luồng Chính
1. Khách hàng xem giỏ hàng (UC1204)
2. Cập nhật số lượng:
   - Chỉnh sửa ô "Số Lượng"
   - Nhấn "Cập Nhật" hoặc "Lưu"
   - Hệ thống kiểm tra: NewQuantity ≤ AvailableQuantity?
   - Cập nhật Cart.Quantity
3. Hoặc xóa sản phẩm:
   - Nhấn "Xóa" trên hàng sản phẩm
   - Xóa khỏi Cart
   - Tính toán lại Subtotal
4. Hiển thị lại Giỏ hàng (UC1204)

---

## 💳 UC1206: THANH TOÁN TỪ GIỎ HÀNG

### Mô Tả
Khách hàng thanh toán đơn hàng từ giỏ hàng.

### Luồng Chính
1. Khách hàng xem giỏ hàng, nhấn "Thanh Toán"
2. Hệ thống chuyển sang trang Checkout:
   - Hiển thị tóm tắt đơn hàng (Cart items)
   - Hiển thị Subtotal, Discount, Final Amount
3. Khách hàng nhập thông tin giao hàng:
   - Tên người nhận (Nếu khác khách hàng)
   - Địa chỉ giao hàng
   - Số điện thoại
4. Chọn phương thức thanh toán:
   - Tiền mặt (Thanh toán khi nhận hàng)
   - Chuyển khoản (Ngân hàng)
   - Thẻ tín dụng
5. Tùy chọn nhập Coupon:
   - Nhập mã coupon
   - Kiểm tra hợp lệ
   - Cập nhật Final Amount (Nếu coupon hợp lệ)
6. Nhấn "Xác Nhận Thanh Toán"
7. Hệ thống:
   - Tạo SalesOrder từ Cart items
   - Cập nhật Inventory (QuantityReserved)
   - Xóa Cart items
   - Tạo Delivery (nếu đã thanh toán ngay)
   - Tạo Receivable (nếu nợ)
   - Hiển thị "Đơn hàng được tạo thành công - Mã: ORD20260210001"

---

## 🎟️ UC1207: NHẬP MÃ COUPON

### Mô Tả
Khách hàng nhập mã coupon để giảm giá.

### Luồng Chính
1. Khách hàng ở trang Checkout (UC1206)
2. Nhìn thấy ô "Nhập mã coupon"
3. Nhập mã: "SALE50"
4. Nhấn "Áp Dụng"
5. Hệ thống kiểm tra:
   ```csharp
   Coupon coupon = Get(code)
   if (coupon == null) → "Mã không tồn tại"
   if (!coupon.IsValid()) → "Mã không còn hiệu lực"
   if (orderAmount < coupon.MinOrderAmount) → "Đơn hàng tối thiểu X"
   ```
6. Nếu OK:
   - Hiển thị: "Áp dụng coupon thành công"
   - Tính discount:
     ```
     discountAmount = orderAmount × coupon.DiscountPercentage / 100
     if (discountAmount > coupon.MaxDiscountAmount)
       discountAmount = coupon.MaxDiscountAmount
     finalAmount = orderAmount - discountAmount
     ```
   - Cập nhật hiển thị: "Tiết kiệm X VNĐ"

---

## ⭐ UC1208: ĐÁNH GIÁ SẢN PHẨM

### Mô Tả
Khách hàng đánh giá sản phẩm sau khi mua hàng.

### Luồng Chính
1. Khách hàng vào "Đơn Mua Của Tôi" (History)
2. Chọn đơn hàng đã giao
3. Nhấn "Đánh Giá Sản Phẩm"
4. Nhập đánh giá:
   - Chọn sao (1-5): ⭐⭐⭐⭐⭐
   - Viết bình luận (≤1000 ký tự): "Sản phẩm tốt, giao hàng nhanh"
5. Nhấn "Gửi Đánh Giá"
6. Hệ thống:
   - Tạo Review
   - IsApproved = false (Chờ admin duyệt)
   - Hiển thị: "Cảm ơn bạn đã đánh giá. Đánh giá sẽ được hiển thị sau khi admin kiểm duyệt"
7. Admin xem Review chờ duyệt:
   - Chấp nhận: IsApproved = true → Hiển thị trên sản phẩm
   - Từ chối: Xóa Review

### Dữ Liệu
```json
{
  "ReviewId": 1,
  "UserId": 5,
  "ProductId": 1,
  "OrderId": 1,
  "Rating": 5,
  "Comment": "Sản phẩm tốt, giao hàng nhanh",
  "IsApproved": false,
  "CreatedDate": "2026-02-12T10:00:00"
}
```

---

## ⭐ UC1209: XEM ĐÁNH GIÁ SẢN PHẨM

### Mô Tả
Khách hàng xem đánh giá của những khách hàng khác trên trang sản phẩm.

### Luồng Chính
1. Khách hàng xem chi tiết sản phẩm (UC1202)
2. Hệ thống hiển thị:
   - Điểm trung bình: 4.5/5 ⭐ (Dựa trên tất cả review)
   - Số lượng đánh giá: 24 đánh giá
   - Danh sách review (5 review gần nhất):
     ```
     [Bình luận 1]
     ⭐⭐⭐⭐⭐ - Nguyễn Văn A - 2026-02-12
     "Sản phẩm rất tốt, giao hàng nhanh. Sẽ mua lại!"
     
     [Bình luận 2]
     ⭐⭐⭐⭐ - Trần Thị B - 2026-02-10
     "Tốt, nhưng giá hơi cao"
     ```
3. Tùy chọn: "Xem tất cả đánh giá" → Trang riêng với phân trang

---

## 🎯 UC1210: QUẢN LÝ FLASH SALE

### Mô Tả
Admin tạo và quản lý chương trình Flash Sale (Bán chớp).

### Luồng Chính (Admin)
1. Admin vào "Quản Lý Flash Sale"
2. Tạo Flash Sale mới:
   - Title: "Sáng Siêu Rẻ"
   - Description: "Sáng hôm nay từ 6h-10h, các sản phẩm xi măng giảm 20%"
   - StartTime: 2026-02-15 06:00:00
   - EndTime: 2026-02-15 10:00:00
   - IsActive: Yes
3. Thêm sản phẩm vào Flash Sale:
   - Chọn sản phẩm
   - Nhập chiết khấu: 20%
   - Hoặc nhập giá cố định: 75,000 VNĐ
4. Lưu Flash Sale
5. Hệ thống tự động:
   - Kích hoạt khi StartTime đến
   - Hiển thị giá sale trên web
   - Cập nhật giá sản phẩm trong Flash Sale
   - Vô hiệu khi hết thời gian EndTime

### Xem Danh Sách Flash Sale
1. Hiển thị danh sách tất cả Flash Sale
2. Trạng thái: Sắp diễn ra / Đang diễn ra / Đã kết thúc
3. Hành động: Sửa / Xóa / Xem Chi Tiết

---

## 🎟️ UC1211: QUẢN LÝ COUPON

### Mô Tả
Admin tạo và quản lý mã coupon (Mã giảm giá).

### Luồng Chính (Admin)
1. Admin vào "Quản Lý Coupon"
2. Tạo Coupon mới:
   - Code: "SALE50" (Phải unique)
   - Description: "Giảm 50% cho đơn hàng từ 1,000,000 VNĐ"
   - DiscountPercentage: 50%
   - MaxDiscountAmount: 500,000 VNĐ (Tối đa giảm bao nhiêu)
   - MinOrderAmount: 1,000,000 VNĐ (Mua tối thiểu)
   - Quantity: 100 (Có 100 mã)
   - StartDate: 2026-02-01
   - EndDate: 2026-02-28
   - IsActive: Yes
3. Lưu Coupon
4. Quản lý Coupon:
   - Xem danh sách tất cả mã
   - Xem số lần đã dùng (UsedQuantity)
   - Sửa / Xóa mã
   - Tìm kiếm theo Code

### Theo Dõi
- Hiển thị: Code, Discount%, UsedQuantity/Quantity, Trạng thái (Active/Inactive)

---

## 🎨 UC1212: QUẢN LÝ BANNER

### Mô Tả
Admin tạo và quản lý banner quảng cáo trên trang chủ.

### Luồng Chính (Admin)
1. Admin vào "Quản Lý Banner"
2. Tạo Banner mới:
   - Title: "Xi Măng Hà Tiên - Giảm 20%"
   - Description: "Xi măng đa dụng, chất lượng cao"
   - ImageUrl: /images/banner-ximang.jpg (Upload ảnh)
   - LinkUrl: /product/xi-mang-ha-tien (Link khi bấm)
   - DisplayOrder: 1 (Vị trí: 1, 2, 3,...)
   - StartDate: 2026-02-01 00:00:00
   - EndDate: 2026-02-28 23:59:59
   - IsActive: Yes
3. Lưu Banner
4. Quản lý Banner:
   - Xem danh sách
   - Sắp xếp theo DisplayOrder (1 là đầu tiên)
   - Sửa / Xóa Banner
   - Xem preview

### Hiển Thị Trên Web
- Hệ thống tự động hiển thị Banner có:
  - IsActive = true
  - NOW() >= StartDate
  - NOW() <= EndDate
- Sắp xếp theo DisplayOrder

---

---

## 📋 BẢNG TÓM TẮT TRẠNG THÁI

### ImportOrder Status
| Trạng Thái | Mô Tả | Hành Động Tiếp Theo |
|-----------|-------|-------------------|
| `PENDING` | Chờ nhập hàng | Kiểm nhận → RECEIVED |
| `RECEIVED` | Đã nhập thành công | - |
| `CANCELLED` | Hủy đơn | - |

### SalesOrder Status
| Trạng Thái | Mô Tả | Hành Động Tiếp Theo |
|-----------|-------|-------------------|
| `PENDING` | Chờ xác nhận | Xác nhận → CONFIRMED |
| `CONFIRMED` | Xác nhận, chờ giao | Tạo Phiếu Giao |
| `READY_FOR_DELIVERY` | Chuẩn bị giao | Giao hàng → IN_TRANSIT |
| `IN_TRANSIT` | Đang giao | Xác nhận giao → DELIVERED |
| `DELIVERED` | Giao thành công | Thanh toán (nếu nợ) |
| `CANCELLED` | Hủy đơn | - |

### Delivery Status
| Trạng Thái | Mô Tả | Hành Động Tiếp Theo |
|-----------|-------|-------------------|
| `PENDING` | Chờ giao | Giao hàng → IN_TRANSIT |
| `IN_TRANSIT` | Đang giao | Xác nhận → DELIVERED |
| `DELIVERED` | Giao thành công | - |
| `FAILED` | Giao thất bại | Thử lại |

### Payment Status
| Trạng Thái | Mô Tả |
|-----------|-------|
| `PENDING` | Chờ thanh toán |
| `COMPLETED` | Đã thanh toán |
| `FAILED` | Thanh toán thất bại |

### Receivable Status
| Trạng Thái | Mô Tả |
|-----------|-------|
| `OUTSTANDING` | Chưa thanh toán |
| `PARTIAL` | Thanh toán một phần |
| `PAID` | Đã thanh toán hết |

---

**Cập nhật: 04/02/2026**  
**Phiên bản: 1.0**  
**Trạng thái: Hoàn chỉnh**
