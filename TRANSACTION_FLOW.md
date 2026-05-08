# 🔄 QJSSUY TRÌNH GIAO DỊCH CHI TIẾT - HỆ THỐNG QUẢN LÝ CỬA HÀNG VẬT LIỆU XÂY DỰNG

## 📌 TỔNG QUAN CÁC QUY TRÌNH CHÍNH

```
NHẬP HÀNG → TỒNG KHO → BÁN HÀNG → GIAO HÀNG → THANH TOÁN → CÔNG NỢ
   ↓         ↓          ↓          ↓           ↓            ↓
Create    Update      Update      Update     Create     Create/Update
Import    Inventory   Sales       Delivery   Payment    Receivable
Order                 Order                  Records

                                             ← TRẢ HÀNG ← HOÀN TIỀN
                                                  ↓
                                             Cập nhật Inventory
                                             Cập nhật Receivable
```

---

## 🏭 QUY TRÌNH 1: NHẬP HÀNG (INBOUND)

### 1.1 Tổng Quan Luồng
```
┌─────────────────────────────────────────────────────────────────┐
│                        NHẬP HÀNG                                │
│                    (Import Goods Flow)                          │
└─────────────────────────────────────────────────────────────────┘

Step 1: LẬP ĐƠN NHẬP
├─ Nhân viên kiểm tra mức tồn kho
├─ So sánh với ReorderLevel
├─ Tạo ImportOrder
│  ├─ ImportCode: Mã đơn duy nhất (e.g., "IMP20260204001")
│  ├─ SupplierId: Nhà cung cấp
│  ├─ ImportDate: Ngày đặt
│  ├─ DeliveryDate: Ngày giao dự kiến
│  ├─ Status: "PENDING"
│  └─ CreatedBy: Nhân viên tạo đơn
└─ Thêm ImportOrderDetails
   └─ Cho mỗi sản phẩm:
      ├─ ProductId
      ├─ Quantity: Số lượng đặt
      ├─ UnitPrice: Giá từ nhà cung cấp
      └─ TotalPrice: Quantity × UnitPrice

Step 2: XÁC NHẬN NHẬP HÀNG
├─ Nhà cung cấp giao hàng
├─ Nhân viên kiểm nhận
├─ Cập nhật ImportOrderDetail.ReceivedQuantity
├─ Kiểm tra:
│  ├─ Số lượng giao = Số lượng đặt?
│  ├─ Sản phẩm đúng chủng loại?
│  └─ Hàng không hư hỏng?
└─ Nếu OK → Step 3, Nếu không → Liên hệ nhà cung cấp

Step 3: CẬP NHẬT TỒng KHO
├─ Cập nhật Status: "PENDING" → "RECEIVED"
├─ Với mỗi sản phẩm:
│  ├─ inventory.QuantityInStock += ReceivedQuantity
│  ├─ inventory.LastRestockDate = Ngày nhập
│  └─ inventory.UpdatedAt = Ngày hiện tại
└─ Ghi nhận: "Nhập thành công 100 bao xi măng"

Step 4: TẠO CÔNG NỢ PHẢI TRẢ
├─ Tạo Payable:
│  ├─ SupplierId: Nhà cung cấp
│  ├─ ImportOrderId: Đơn nhập
│  ├─ Amount: ImportOrder.TotalAmount
│  ├─ AmountPaid: 0 (chưa trả)
│  ├─ AmountDue: Amount (còn nợ)
│  ├─ DueDate: Thường là 30 ngày kể từ ImportDate
│  └─ Status: "OUTSTANDING"
└─ Ghi lịch: "Nợ nhà cung cấp XYZ: 50,000,000 VNĐ"
```

### 1.2 Dữ Liệu Tham Gia

**Bảng ImportOrder**
```json
{
  "ImportOrderId": 1,
  "ImportCode": "IMP20260204001",
  "SupplierId": 1,
  "ImportDate": "2026-02-04T10:00:00",
  "DeliveryDate": "2026-02-05T14:00:00",
  "Status": "RECEIVED",
  "TotalAmount": 50000000,
  "Notes": "Giao tại kho A",
  "CreatedBy": 2,
  "CreatedAt": "2026-02-04T09:30:00",
  "UpdatedAt": "2026-02-05T16:00:00"
}
```

**Bảng ImportOrderDetail**
```json
{
  "ImportDetailId": 1,
  "ImportOrderId": 1,
  "ProductId": 1,
  "Quantity": 100,
  "UnitPrice": 500000,
  "TotalPrice": 50000000,
  "ReceivedQuantity": 100,
  "CreatedAt": "2026-02-04T09:30:00"
}
```

**Bảng Inventory (sau cập nhật)**
```json
{
  "InventoryId": 1,
  "ProductId": 1,
  "QuantityInStock": 150,  // Cập nhật: 50 + 100
  "QuantityReserved": 20,
  "AvailableQuantity": 130, // 150 - 20
  "WarehouseLocation": "Kho A - Kệ 1",
  "LastRestockDate": "2026-02-05T16:00:00",
  "CreatedAt": "2026-02-04T09:30:00",
  "UpdatedAt": "2026-02-05T16:00:00"
}
```

**Bảng Payable (tạo mới)**
```json
{
  "PayableId": 1,
  "SupplierId": 1,
  "ImportOrderId": 1,
  "Amount": 50000000,
  "AmountPaid": 0,
  "AmountDue": 50000000,
  "DueDate": "2026-03-07",
  "Status": "OUTSTANDING",
  "Notes": "Nhập hàng xi măng",
  "CreatedAt": "2026-02-05T16:00:00",
  "UpdatedAt": "2026-02-05T16:00:00"
}
```

### 1.3 Tính Toán Chi Tiết

```
TotalAmount = Σ (Quantity × UnitPrice)
            = 100 × 500,000
            = 50,000,000 VNĐ

QuantityInStock (sau nhập) = QuantityInStock (trước) + ReceivedQuantity
                           = 50 + 100
                           = 150

AvailableQuantity = QuantityInStock - QuantityReserved
                  = 150 - 20
                  = 130
```

---

## 🛍️ QUY TRÌNH 2: BÁN HÀNG (SALES)

### 2.1 Tổng Quan Luồng
```
┌─────────────────────────────────────────────────────────────────┐
│                        BÁN HÀNG                                 │
│                    (Sales Order Flow)                           │
└─────────────────────────────────────────────────────────────────┘

Step 1: KHÁCH HÀNG ĐẶT HÀNG
├─ Khách hàng xem danh sách sản phẩm
├─ Chọn sản phẩm, số lượng
├─ Hệ thống hiển thị:
│  ├─ Tên sản phẩm
│  ├─ Giá bán (UnitPrice)
│  ├─ Tồn kho có sẵn (AvailableQuantity)
│  └─ Thừa nhân nếu hết hàng
├─ Khách hàng xác nhận đặt hàng
└─ Ghi nhận: "Đặt 50 cái xi măng"

Step 2: TẠO ĐƠN BÁN
├─ Tạo SalesOrder:
│  ├─ OrderCode: Mã đơn duy nhất (e.g., "ORD20260204001")
│  ├─ CustomerId: Khách hàng
│  ├─ OrderDate: Ngày đặt hôm nay
│  ├─ DeliveryDate: Ngày giao dự kiến
│  ├─ Status: "PENDING"
│  ├─ Discount: Chiết khấu chung (%)
│  └─ CreatedBy: Nhân viên tạo
├─ Thêm SalesOrderDetail cho mỗi sản phẩm:
│  ├─ ProductId
│  ├─ Quantity: Số lượng đặt
│  ├─ UnitPrice: Giá bán
│  ├─ TotalPrice: Quantity × UnitPrice
│  └─ Discount: Chiết khấu riêng từng sản phẩm (%)
├─ Tính TotalAmount = Σ TotalPrice
├─ Tính FinalAmount = TotalAmount × (1 - Discount)
└─ Ghi: "Tạo đơn ORD20260204001 thành công"

Step 3: KIỂM TRA TỐN KHO
├─ Với mỗi sản phẩm trong đơn:
│  ├─ Lấy AvailableQuantity từ Inventory
│  ├─ Nếu Quantity > AvailableQuantity:
│  │  └─ Báo lỗi: "Chỉ còn X cái, bạn đặt Y cái"
│  │  └─ Cho phép:
│  │     ├─ Giảm số lượng
│  │     ├─ Chờ nhập hàng
│  │     └─ Hủy đơn
│  └─ Nếu Quantity ≤ AvailableQuantity → OK
└─ Nếu OK → Step 4

Step 4: ĐẶT CỌC TỒng KHO (RESERVE)
├─ Với mỗi sản phẩm:
│  ├─ inventory.QuantityReserved += OrderQuantity
│  └─ inventory.AvailableQuantity = QuantityInStock - QuantityReserved
├─ Cập nhật Status: "PENDING" → "CONFIRMED"
└─ Ghi: "Đặt cọc 50 cái xi măng từ kho"

Step 5: THANH TOÁN (Tùy Chọn)
├─ Nếu khách hàng thanh toán ngay:
│  ├─ Tạo Payment
│  │  ├─ PaymentDate: Ngày hôm nay
│  │  ├─ Amount: FinalAmount
│  │  ├─ PaymentMethod: Cash / Card / Bank
│  │  └─ Status: "COMPLETED"
│  ├─ Tạo Receivable với Status: "PAID"
│  │  └─ AmountDue: 0
│  └─ Ghi: "Thanh toán 50 triệu VNĐ thành công"
├─ Nếu khách hàng nợ:
│  ├─ Tạo Receivable
│  │  ├─ CustomerId
│  │  ├─ OrderId
│  │  ├─ Amount: FinalAmount
│  │  ├─ AmountPaid: 0
│  │  ├─ AmountDue: Amount
│  │  ├─ DueDate: Ngày hạn thanh toán (thường 30 ngày)
│  │  └─ Status: "OUTSTANDING"
│  └─ Ghi: "Ghi nợ khách hàng 50 triệu VNĐ"
└─ Nếu không thanh toán ngay → Chờ thanh toán sau giao hàng
```

### 2.2 Dữ Liệu Tham Gia

**Bảng SalesOrder**
```json
{
  "OrderId": 1,
  "OrderCode": "ORD20260204001",
  "CustomerId": 5,
  "OrderDate": "2026-02-04T11:00:00",
  "DeliveryDate": "2026-02-06T14:00:00",
  "Status": "CONFIRMED",
  "TotalAmount": 50000000,
  "Discount": 5,          // 5% chiết khấu
  "FinalAmount": 47500000, // 50,000,000 × (1 - 0.05)
  "Notes": "Giao tại công trường A",
  "CreatedBy": 2,
  "CreatedAt": "2026-02-04T11:00:00",
  "UpdatedAt": "2026-02-04T11:30:00"
}
```

**Bảng SalesOrderDetail**
```json
{
  "OrderDetailId": 1,
  "OrderId": 1,
  "ProductId": 1,
  "Quantity": 50,
  "UnitPrice": 500000,
  "TotalPrice": 25000000,  // 50 × 500,000
  "Discount": 10,          // 10% chiết khấu riêng
  "CreatedAt": "2026-02-04T11:00:00"
}
```

**Bảng Inventory (sau cập nhật)**
```json
{
  "InventoryId": 1,
  "ProductId": 1,
  "QuantityInStock": 150,
  "QuantityReserved": 70,  // Cập nhật: 20 + 50
  "AvailableQuantity": 80,  // 150 - 70
  "WarehouseLocation": "Kho A - Kệ 1",
  "LastRestockDate": "2026-02-05T16:00:00",
  "CreatedAt": "2026-02-04T09:30:00",
  "UpdatedAt": "2026-02-04T11:30:00"
}
```

**Bảng Receivable (tạo nếu nợ)**
```json
{
  "ReceivableId": 1,
  "CustomerId": 5,
  "OrderId": 1,
  "Amount": 47500000,
  "AmountPaid": 0,
  "AmountDue": 47500000,
  "DueDate": "2026-03-06",
  "Status": "OUTSTANDING",
  "Notes": "Công trình A",
  "CreatedAt": "2026-02-04T11:30:00",
  "UpdatedAt": "2026-02-04T11:30:00"
}
```

### 2.3 Tính Toán Chi Tiết

```
TotalPrice (chi tiết) = Quantity × UnitPrice
                      = 50 × 500,000
                      = 25,000,000 VNĐ

TotalAmount (đơn) = Σ TotalPrice (chi tiết)
                  = 25,000,000 VNĐ

FinalAmount = TotalAmount × (1 - Discount%)
            = 25,000,000 × (1 - 0.05)
            = 23,750,000 VNĐ

QuantityReserved (sau đặt) = QuantityReserved (trước) + OrderQuantity
                           = 20 + 50
                           = 70

AvailableQuantity (sau đặt) = QuantityInStock - QuantityReserved
                            = 150 - 70
                            = 80
```

---

## 🚚 QUY TRÌNH 3: GIAO HÀNG (DELIVERY)

### 3.1 Tổng Quan Luồng
```
┌─────────────────────────────────────────────────────────────────┐
│                        GIAO HÀNG                                │
│                    (Delivery Flow)                              │
└─────────────────────────────────────────────────────────────────┘

Step 1: TẠO PHIẾU GIAO
├─ Nhân viên chọn đơn hàng Status = "CONFIRMED"
├─ Tạo Delivery:
│  ├─ DeliveryCode: Mã phiếu duy nhất (e.g., "DEL20260204001")
│  ├─ OrderId: Liên kết với SalesOrder
│  ├─ DeliveryDate: Ngày giao dự kiến
│  ├─ Driver: Tên tài xế
│  ├─ DeliveryAddress: Địa chỉ giao (từ Customers.Address)
│  ├─ Status: "PENDING"
│  └─ CreatedBy: Nhân viên tạo
├─ Cập nhật SalesOrder.Status: "CONFIRMED" → "READY_FOR_DELIVERY"
└─ Ghi: "Tạo phiếu giao hàng DEL20260204001"

Step 2: CHUẨN BỊ HÀNG
├─ Nhân viên kho chuẩn bị hàng:
│  ├─ Lấy từng sản phẩm theo DeliveryDetails
│  ├─ Kiểm tra số lượng, chất lượng
│  ├─ Đóng gói sản phẩm
│  └─ Dán nhãn delivery
├─ Ghi chú: "Hàng đã sẵn sàng giao"
└─ Cập nhật Status: "PENDING" → "READY"

Step 3: GIAO HÀNG
├─ Tài xế nhận phiếu giao
├─ Vận chuyển đến địa chỉ khách hàng
├─ Cập nhật Status: "READY" → "IN_TRANSIT"
├─ Ghi lịch: "Đang giao hàng - Tài xế: Nguyễn Văn A"
└─ Thông báo khách hàng: "Hàng của bạn đang trên đường giao"

Step 4: XÁC NHẬN GIAO
├─ Khách hàng nhận hàng
├─ Kiểm tra:
│  ├─ Số lượng hàng
│  ├─ Sản phẩm đúng loại
│  └─ Hàng không hư hỏng
├─ Ký xác nhận
├─ Cập nhật ActualDeliveryDate = Ngày hiện tại
├─ Cập nhật Status: "IN_TRANSIT" → "DELIVERED"
├─ Cập nhật SalesOrder.Status: "READY_FOR_DELIVERY" → "DELIVERED"
└─ Ghi: "Giao hàng thành công vào 14:30"

Step 5: CẬP NHẬT TỐN KHO
├─ Với mỗi sản phẩm đã giao:
│  ├─ inventory.QuantityReserved -= DeliveryQuantity
│  ├─ inventory.QuantityInStock -= DeliveryQuantity
│  └─ inventory.AvailableQuantity = QuantityInStock - QuantityReserved
├─ Nếu AvailableQuantity < ReorderLevel:
│  └─ Gửi cảnh báo: "Sản phẩm X sắp hết hàng"
└─ Ghi: "Cập nhật tồn kho sau giao hàng"
```

### 3.2 Dữ Liệu Tham Gia

**Bảng Delivery**
```json
{
  "DeliveryId": 1,
  "DeliveryCode": "DEL20260204001",
  "OrderId": 1,
  "DeliveryDate": "2026-02-06T08:00:00",
  "ExpectedDeliveryDate": "2026-02-06T14:00:00",
  "ActualDeliveryDate": "2026-02-06T14:30:00",
  "Status": "DELIVERED",
  "DeliveryAddress": "123 Đường A, Quận B, TP HCM",
  "Driver": "Nguyễn Văn A",
  "Notes": "Giao thành công, khách hàng ký xác nhận",
  "CreatedBy": 2,
  "CreatedAt": "2026-02-04T11:30:00",
  "UpdatedAt": "2026-02-06T14:35:00"
}
```

**Bảng Inventory (sau giao)**
```json
{
  "InventoryId": 1,
  "ProductId": 1,
  "QuantityInStock": 100,       // Cập nhật: 150 - 50
  "QuantityReserved": 20,        // Cập nhật: 70 - 50
  "AvailableQuantity": 80,       // 100 - 20
  "WarehouseLocation": "Kho A - Kệ 1",
  "LastRestockDate": "2026-02-05T16:00:00",
  "CreatedAt": "2026-02-04T09:30:00",
  "UpdatedAt": "2026-02-06T14:35:00"
}
```

### 3.3 Tính Toán Chi Tiết

```
QuantityReserved (sau giao) = QuantityReserved (trước) - DeliveryQuantity
                            = 70 - 50
                            = 20

QuantityInStock (sau giao) = QuantityInStock (trước) - DeliveryQuantity
                           = 150 - 50
                           = 100

AvailableQuantity (sau giao) = QuantityInStock - QuantityReserved
                             = 100 - 20
                             = 80

Kiểm tra Cảnh báo:
  Nếu AvailableQuantity < ReorderLevel (e.g., 30)
  → 80 >= 30 → Không cần cảnh báo
```

---

## 💳 QUY TRÌNH 4: THANH TOÁN & CÔNG NỢ

### 4.1 Ghi Nhận Thanh Toán
```
┌─────────────────────────────────────────────────────────────────┐
│                      THANH TOÁN & CÔNG NỢ                       │
│              (Payment & Receivable Management)                  │
└─────────────────────────────────────────────────────────────────┘

Step 1: KHÁCH HÀNG THANH TOÁN
├─ Khách hàng liên hệ thanh toán
├─ Nhân viên ghi nhận:
│  ├─ Chọn đơn hàng
│  ├─ Hiển thị:
│  │  ├─ Tổng Tiền: 47,500,000 VNĐ
│  │  ├─ Đã Thanh Toán: 0 VNĐ
│  │  └─ Còn Nợ: 47,500,000 VNĐ
│  ├─ Nhập Số Tiền Thanh Toán: (e.g., 25,000,000)
│  ├─ Chọn Phương Thức: Cash / Card / Bank Transfer
│  ├─ Nhập Ghi Chú: "Thanh toán đơn hàng ORD20260204001"
│  └─ Nhấn "Ghi Nhận Thanh Toán"
└─ Hệ thống xác thực

Step 2: XÁC THỰC THANH TOÁN
├─ Kiểm tra:
│  ├─ Số tiền > 0?
│  ├─ Số tiền ≤ AmountDue?
│  ├─ Phương thức hợp lệ?
│  └─ Tất cả dữ liệu bắt buộc?
├─ Nếu OK → Step 3
└─ Nếu không → Báo lỗi

Step 3: TẠO PAYMENT
├─ Tạo Payment:
│  ├─ PaymentId: Tự tăng
│  ├─ OrderId: 1
│  ├─ PaymentDate: 2026-02-10 (ngày thanh toán)
│  ├─ Amount: 25,000,000
│  ├─ PaymentMethod: "CASH"
│  ├─ Status: "COMPLETED"
│  ├─ TransactionNumber: "" (nếu không có)
│  └─ CreatedBy: Nhân viên ghi
└─ Lưu vào database

Step 4: CẬP NHẬT RECEIVABLE
├─ Lấy Receivable của đơn hàng
├─ Cập nhật:
│  ├─ AmountPaid += PaymentAmount
│  │  └─ 0 + 25,000,000 = 25,000,000
│  ├─ AmountDue = Amount - AmountPaid
│  │  └─ 47,500,000 - 25,000,000 = 22,500,000
│  ├─ Nếu AmountDue = 0:
│  │  └─ Status: "OUTSTANDING" → "PAID"
│  ├─ Nếu AmountDue > 0:
│  │  └─ Status: "OUTSTANDING" → "PARTIAL"
│  └─ UpdatedAt: Ngày hiện tại
└─ Lưu vào database

Step 5: HIỂN THỊ KẾT QUẢ
├─ Ghi: "Ghi nhận thanh toán 25,000,000 VNĐ thành công"
├─ Hiển thị trạng thái:
│  ├─ Tổng Tiền: 47,500,000 VNĐ
│  ├─ Đã Thanh Toán: 25,000,000 VNĐ ✓
│  ├─ Còn Nợ: 22,500,000 VNĐ
│  └─ Trạng Thái: "Thanh toán một phần"
└─ Tùy chọn: In phiếu thanh toán
```

### 4.2 Dữ Liệu Tham Gia

**Bảng Payment (tạo mới)**
```json
{
  "PaymentId": 1,
  "OrderId": 1,
  "PaymentDate": "2026-02-10T10:00:00",
  "Amount": 25000000,
  "PaymentMethod": "CASH",
  "TransactionNumber": null,
  "Status": "COMPLETED",
  "Notes": "Thanh toán đơn hàng ORD20260204001",
  "CreatedBy": 2,
  "CreatedAt": "2026-02-10T10:00:00"
}
```

**Bảng Receivable (cập nhật)**
```json
{
  "ReceivableId": 1,
  "CustomerId": 5,
  "OrderId": 1,
  "Amount": 47500000,
  "AmountPaid": 25000000,     // Cập nhật
  "AmountDue": 22500000,       // Cập nhật
  "DueDate": "2026-03-06",
  "Status": "PARTIAL",          // Cập nhật
  "Notes": "Công trình A",
  "CreatedAt": "2026-02-04T11:30:00",
  "UpdatedAt": "2026-02-10T10:00:00"
}
```

---

## 🔄 QUY TRÌNH 5: TRẢ HÀNG & HOÀN TIỀN

### 5.1 Tổng Quan Luồng
```
┌─────────────────────────────────────────────────────────────────┐
│                        TRẢ HÀNG                                 │
│                   (Return Goods Flow)                           │
└─────────────────────────────────────────────────────────────────┘

Step 1: KHÁCH HÀNG MUỐN TRẢ HÀNG
├─ Khách hàng gọi, email hoặc đến cửa hàng
├─ Nêu lý do trả:
│  ├─ Hàng lỗi (DEFECTIVE)
│  ├─ Giao nhầm sản phẩm (WRONG_PRODUCT)
│  ├─ Không cần nữa (CHANGED_MIND)
│  └─ Khác (OTHER)
├─ Nhân viên ghi nhận
└─ Tạo phiếu trả hàng

Step 2: TẠO ĐƠN TRẢ HÀNG
├─ Tạo Return:
│  ├─ ReturnCode: Mã đơn trả (e.g., "RET20260210001")
│  ├─ OrderId: Liên kết với SalesOrder
│  ├─ ReturnDate: Ngày trả hôm nay
│  ├─ Reason: Lý do trả
│  ├─ Status: "PENDING"
│  └─ CreatedBy: Nhân viên ghi
├─ Thêm ReturnDetail cho mỗi sản phẩm trả:
│  ├─ ProductId
│  ├─ Quantity: Số lượng trả
│  ├─ UnitPrice: Giá bán lúc mua
│  └─ TotalPrice: Quantity × UnitPrice
├─ Tính TotalRefund = Σ TotalPrice
└─ Lưu vào database

Step 3: KIỂM NHẬN HÀNG TRẢ
├─ Nhân viên kiểm tra:
│  ├─ Số lượng hàng trả
│  ├─ Tình trạng hàng
│  └─ Lý do trả có hợp lý?
├─ Nếu hàng sử dụng: Giảm giá trị hoàn lại
├─ Nếu hàng không dùng: Hoàn lại 100%
└─ Xác nhận trả hàng

Step 4: CẬP NHẬT TỐN KHO
├─ Nhân viên kho nhận lại hàng
├─ Với mỗi sản phẩm trả:
│  ├─ inventory.QuantityInStock += ReturnQuantity
│  ├─ inventory.QuantityReserved -= ReturnQuantity
│  └─ inventory.AvailableQuantity = QuantityInStock - QuantityReserved
├─ Cập nhật Status: "PENDING" → "COMPLETED"
└─ Ghi: "Nhập lại 10 cái xi măng từ trả hàng"

Step 5: HOÀN TIỀN HOẶC GHI GIẢM NỢ
├─ Nếu khách hàng đã thanh toán:
│  ├─ Tạo Payment với Amount âm
│  ├─ AmountPaid -= RefundAmount
│  ├─ AmountDue += RefundAmount (nếu đã thanh toán hết)
│  └─ Hoàn tiền bằng:
│     ├─ Cash → Trả tiền mặt
│     ├─ Card → Hoàn lại thẻ
│     └─ Bank Transfer → Chuyển khoản
├─ Nếu khách hàng nợ:
│  ├─ Cập nhật Receivable
│  ├─ AmountDue -= RefundAmount
│  └─ Ghi giảm công nợ
└─ Ghi: "Hoàn tiền 5,000,000 VNĐ cho trả hàng"

Step 6: HIỂN THỊ KẾT QUẢ
├─ Ghi: "Trả hàng thành công"
├─ In phiếu hoàn tiền/ghi giảm nợ
└─ Thông báo khách hàng
```

### 5.2 Dữ Liệu Tham Gia

**Bảng Return (tạo mới)**
```json
{
  "ReturnId": 1,
  "ReturnCode": "RET20260210001",
  "OrderId": 1,
  "ReturnDate": "2026-02-10T11:00:00",
  "Status": "COMPLETED",
  "TotalRefund": 5000000,
  "Reason": "Hàng lỗi",
  "Notes": "10 cái xi măng bị nứt",
  "CreatedBy": 2,
  "CreatedAt": "2026-02-10T11:00:00",
  "UpdatedAt": "2026-02-10T15:00:00"
}
```

**Bảng ReturnDetail (tạo mới)**
```json
{
  "ReturnDetailId": 1,
  "ReturnId": 1,
  "ProductId": 1,
  "Quantity": 10,
  "UnitPrice": 500000,
  "TotalPrice": 5000000,
  "CreatedAt": "2026-02-10T11:00:00"
}
```

**Bảng Inventory (cập nhật)**
```json
{
  "InventoryId": 1,
  "ProductId": 1,
  "QuantityInStock": 110,      // Cập nhật: 100 + 10
  "QuantityReserved": 10,       // Cập nhật: 20 - 10
  "AvailableQuantity": 100,     // 110 - 10
  "WarehouseLocation": "Kho A - Kệ 1",
  "LastRestockDate": "2026-02-05T16:00:00",
  "CreatedAt": "2026-02-04T09:30:00",
  "UpdatedAt": "2026-02-10T15:00:00"
}
```

**Bảng Receivable (cập nhật)**
```json
{
  "ReceivableId": 1,
  "CustomerId": 5,
  "OrderId": 1,
  "Amount": 47500000,
  "AmountPaid": 25000000,
  "AmountDue": 17500000,        // Cập nhật: 22,500,000 - 5,000,000
  "DueDate": "2026-03-06",
  "Status": "PARTIAL",
  "Notes": "Công trình A",
  "CreatedAt": "2026-02-04T11:30:00",
  "UpdatedAt": "2026-02-10T15:00:00"
}
```

---

## 📊 BẢNG TÓMOỂM GIAO DỊCH

### Ví Dụ Giao Dịch Hoàn Chỉnh Từ Đầu Đến Cuối

| Giai Đoạn | Hành Động | Giá Trị | Trạng Thái | Ghi Chú |
|-----------|----------|--------|-----------|---------|
| 1. Nhập Hàng | Nhập 100 cái xi măng từ Supplier A | 50,000,000 | RECEIVED | ImportOrder IMP001 |
| | Tồng kho: 50 → 150 | | | |
| 2. Bán Hàng | Bán 50 cái cho Customer B (5% chiết khấu) | 23,750,000 | CONFIRMED | SalesOrder ORD001 |
| | Tồng đặt cọc: 20 → 70 | | | |
| 3. Giao Hàng | Giao 50 cái cho Customer B | | DELIVERED | Delivery DEL001 |
| | Tồng kho: 150 → 100 | | | |
| | Đặt cọc: 70 → 20 | | | |
| 4. Thanh Toán | Khách thanh toán 25,000,000 VNĐ (50%) | 25,000,000 | PARTIAL | Payment PAY001 |
| | Receivable: OUTSTANDING → PARTIAL | | | |
| 5. Trả Hàng | Khách trả 10 cái hàng lỗi | 5,000,000 | COMPLETED | Return RET001 |
| | Hoàn tiền 5,000,000 VNĐ | | | |
| | Tồng kho: 100 → 110 | | | |
| | Công nợ: 22,500,000 → 17,500,000 | | | |

---

**Cập nhật: 04/02/2026**  
**Phiên bản: 1.0**  
**Trạng thái: Hoàn chỉnh**
