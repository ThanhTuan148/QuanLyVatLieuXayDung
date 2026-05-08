# CRUD Implementation - Quick Start Testing Guide

## 🚀 Current Status
- ✅ **Backend**: Running on http://localhost:5000
- ✅ **Frontend**: Running on http://localhost:3001
- ✅ **Build**: No compilation errors

---

## 📝 Quick Test Steps

### 1. Access the Application
```
Frontend: http://localhost:3001
```

### 2. Login (if authentication is required)
- Check the LoginPage for credentials
- Use localStorage token if already logged in

### 3. Navigate to Each CRUD Page

#### **Products Page** (`/products`)
1. Click "Products" in left menu
2. **Test Create**: Click "Add Product" button
   - Fill: Product Name, SKU, Category ID, Unit, Price, Description
   - Click "Save"
3. **Test Read**: Verify product appears in table
4. **Test Edit**: Click edit icon (pencil) on any row
   - Modify fields
   - Click "Save"
5. **Test Delete**: Click delete icon (trash) on any row
   - Confirm deletion in dialog
   - Verify product removed from list

#### **Customers Page** (`/customers`)
- Same pattern as Products
- Fields: Customer Name, Phone, Email, Address, City, Tax Code, Contact Person, IsActive

#### **Suppliers Page** (`/suppliers`) - NEW
- Same pattern as Products
- Fields: Supplier Name, Phone, Email, Address, City, Tax Code, Contact Person, IsActive

#### **Inventory Page** (`/inventory`)
- Same pattern as Products
- Fields: Product ID, Quantity In Stock, Quantity Reserved, Warehouse Location

#### **Orders Page** (`/orders`)
- Same pattern as Products
- Fields: Order Code, Customer ID, Order Date, Status (dropdown), Notes
- **Special Test**: Try changing order status in the dropdown

---

## 🔍 API Testing (Curl Commands)

### Health Check
```bash
curl -X GET "http://localhost:5000/api/health"
```
Expected: `{"status":"healthy","timestamp":"2026-02-04T..."}`

### Products API
```bash
# List all products
curl -X GET "http://localhost:5000/api/products"

# Create product
curl -X POST "http://localhost:5000/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Product",
    "sku": "TEST-001",
    "categoryId": 1,
    "unit": "pcs",
    "unitPrice": 100.00,
    "description": "Test"
  }'

# Get single product
curl -X GET "http://localhost:5000/api/products/1"

# Update product (ID=1)
curl -X PUT "http://localhost:5000/api/products/1" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "productName": "Updated Product",
    "sku": "TEST-001",
    "categoryId": 1,
    "unit": "pcs",
    "unitPrice": 150.00,
    "description": "Updated"
  }'

# Delete product (ID=1)
curl -X DELETE "http://localhost:5000/api/products/1"
```

### Customers API
```bash
curl -X GET "http://localhost:5000/api/customers"
```

### Suppliers API
```bash
curl -X GET "http://localhost:5000/api/suppliers"
```

### Inventory API
```bash
curl -X GET "http://localhost:5000/api/inventory"
```

### Orders API
```bash
curl -X GET "http://localhost:5000/api/orders"
```

---

## 📊 Database Verification

### SQL Server Query to Check Data
```sql
-- Products
SELECT TOP 10 * FROM Product

-- Customers
SELECT TOP 10 * FROM Customer

-- Suppliers
SELECT TOP 10 * FROM Supplier

-- Inventory
SELECT TOP 10 * FROM Inventory

-- Sales Orders
SELECT TOP 10 * FROM SalesOrder
```

---

## 🐛 Troubleshooting

### Issue: Frontend cannot reach backend
**Solution**:
- Verify backend is running: `http://localhost:5000/api/health`
- Check CORS settings in `Backend/Program.cs`
- Ensure both services are running on correct ports

### Issue: Form won't submit
**Solution**:
- Check browser console (F12) for errors
- Verify API endpoint URL matches service
- Check network tab to see if request is being sent

### Issue: Data not persisting
**Solution**:
- Verify database connection string in `appsettings.json`
- Check SQL Server is running
- Review API response status codes

### Issue: Port already in use
**Solution**:
```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

## 📱 Feature Verification Checklist

### Products ✅
- [ ] List displays with all columns
- [ ] Add product opens form dialog
- [ ] Form validation prevents empty required fields
- [ ] Save button creates new product
- [ ] Edit button populates form with current data
- [ ] Updated data saves correctly
- [ ] Delete button removes product
- [ ] Confirmation dialog appears before delete

### Customers ✅
- [ ] All CRUD operations working
- [ ] Phone and email fields validate correctly
- [ ] IsActive toggle switch works

### Suppliers ✅
- [ ] All CRUD operations working
- [ ] Menu navigation reaches Suppliers page
- [ ] Form fields pre-populate on edit

### Inventory ✅
- [ ] Numeric input validation works
- [ ] Product ID references correct product
- [ ] Quantity fields accept decimals

### Orders ✅
- [ ] Status dropdown shows all 5 options: Pending, Confirmed, Shipped, Delivered, Cancelled
- [ ] Order date picker works
- [ ] Customer ID field accepts input
- [ ] Note field supports multiline

---

## 🎯 Success Criteria

All tests pass when:
1. ✅ All pages load without errors
2. ✅ Add/Create forms appear and submit
3. ✅ Data displays in tables
4. ✅ Edit forms pre-populate with data
5. ✅ Updates save without errors
6. ✅ Delete operations remove data
7. ✅ Menu navigation works smoothly
8. ✅ No console errors in browser
9. ✅ Backend responses include correct HTTP status codes
10. ✅ Forms include proper validation

---

## 📞 Support

If you encounter issues:
1. Check CRUD_IMPLEMENTATION_STATUS.md for detailed architecture
2. Review browser console (F12) for error messages
3. Check backend terminal for API errors
4. Verify database connection and data

**Backend Running**: Terminal with ID `a931b908-331e-489a-8ce7-97d797d0e0a9`
**Frontend Running**: Terminal with ID `8815b9ed-6561-4ebb-af5e-eb8cb7b78839`

---

## 🎉 Ready to Test!

Open http://localhost:3001 in your browser and start testing the CRUD operations.

All features are fully implemented and ready for user acceptance testing! 🚀
