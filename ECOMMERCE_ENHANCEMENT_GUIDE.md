# E-Commerce Enhancement Implementation Guide

## Overview
This document outlines the integration of book selling system (webbansach) features into the Building Materials Management System, creating a comprehensive B2B e-commerce platform.

---

## Features Added

### 1. Shopping Cart System
**Models**: `Cart`
**Controllers**: `CartController`
**Endpoints**:
```
GET    /api/cart/user/{userId}          - Get user's cart
POST   /api/cart                          - Add item to cart
PUT    /api/cart/{id}                    - Update cart item quantity
DELETE /api/cart/{id}                    - Remove item from cart
DELETE /api/cart/user/{userId}           - Clear entire cart
```

**Frontend Components**:
- `ShoppingCart.js` - Full shopping cart management UI
- `cartService.js` - Service layer for cart API calls

---

### 2. Product Reviews & Ratings
**Models**: `Review`
**Controllers**: `ReviewController`
**Endpoints**:
```
GET    /api/review                       - List all reviews
GET    /api/review/product/{productId}   - Get reviews for a product
GET    /api/review/{id}                  - Get single review
POST   /api/review                       - Submit new review
PUT    /api/review/{id}                  - Update review
PUT    /api/review/{id}/approve          - Admin approve review
DELETE /api/review/{id}                  - Delete review
```

**Frontend Components**:
- `ProductReviews.js` - Display and submit reviews
- `reviewService.js` - Service layer for review API calls

**Features**:
- 1-5 star rating system
- Written comments/feedback
- Admin approval workflow
- Average rating calculation per product

---

### 3. Flash Sales / Promotions
**Models**: `FlashSale`, `FlashSaleItem`
**Controllers**: `FlashSaleController`
**Endpoints**:
```
GET    /api/flashsale                    - List all flash sales
GET    /api/flashsale/active             - Get currently active sales
GET    /api/flashsale/{id}               - Get single flash sale
POST   /api/flashsale                    - Create flash sale
PUT    /api/flashsale/{id}               - Update flash sale
DELETE /api/flashsale/{id}               - Delete flash sale
```

**Frontend Components**:
- `FlashSaleCarousel.js` - Carousel display for active sales
- `flashSaleService.js` - Service layer for flash sale API calls

**Features**:
- Time-limited promotions
- Percentage-based discounts
- Quantity limits
- Sold tracking
- Automatic expiration

---

### 4. Coupon / Discount System
**Models**: `Coupon`
**Controllers**: `CouponController`
**Endpoints**:
```
GET    /api/coupon                       - List all coupons
GET    /api/coupon/{id}                  - Get single coupon
GET    /api/coupon/code/{code}           - Get by coupon code
POST   /api/coupon/validate              - Validate coupon & calculate discount
POST   /api/coupon                       - Create coupon
PUT    /api/coupon/{id}                  - Update coupon
DELETE /api/coupon/{id}                  - Delete coupon
```

**Frontend Components**:
- `CouponInput.js` - Coupon code input & validation UI
- `couponService.js` - Service layer for coupon API calls

**Features**:
- Coupon code validation
- Percentage discounts
- Minimum order amount requirements
- Maximum discount caps
- Usage tracking & quantity limits
- Date-based validity

---

### 5. Banner Management
**Models**: `Banner`
**Controllers**: `BannerController`
**Endpoints**:
```
GET    /api/banner                       - List all banners
GET    /api/banner/active                - Get active/displayable banners
GET    /api/banner/{id}                  - Get single banner
POST   /api/banner                       - Create banner
PUT    /api/banner/{id}                  - Update banner
DELETE /api/banner/{id}                  - Delete banner
```

**Frontend Components**:
- `BannerCarousel.js` - Rotating banner carousel UI
- `bannerService.js` - Service layer for banner API calls

**Features**:
- Image banners with descriptions
- Display order control
- Date-based activation/deactivation
- Click-through URLs
- Active carousel on homepage

---

## Database Schema

### Cart Table
```sql
CREATE TABLE Cart (
    CartId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES [User](UserId),
    FOREIGN KEY (ProductId) REFERENCES Product(ProductId)
);
```

### Review Table
```sql
CREATE TABLE Review (
    ReviewId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    OrderId INT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(1000) NULL,
    IsApproved BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES [User](UserId),
    FOREIGN KEY (ProductId) REFERENCES Product(ProductId),
    FOREIGN KEY (OrderId) REFERENCES SalesOrder(OrderId)
);
```

### FlashSale Tables
```sql
CREATE TABLE FlashSale (
    FlashSaleId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500) NULL,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL
);

CREATE TABLE FlashSaleItem (
    FlashSaleItemId INT PRIMARY KEY IDENTITY(1,1),
    FlashSaleId INT NOT NULL,
    ProductId INT NOT NULL,
    SalePrice DECIMAL(10,2) NOT NULL,
    DiscountPercentage DECIMAL(5,2) NOT NULL,
    Quantity INT NOT NULL,
    SoldQuantity INT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (FlashSaleId) REFERENCES FlashSale(FlashSaleId),
    FOREIGN KEY (ProductId) REFERENCES Product(ProductId)
);
```

### Coupon Table
```sql
CREATE TABLE Coupon (
    CouponId INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(500) NULL,
    DiscountPercentage DECIMAL(5,2) NOT NULL,
    MaxDiscountAmount DECIMAL(10,2) NULL,
    MinOrderAmount DECIMAL(10,2) DEFAULT 0,
    Quantity INT NOT NULL,
    UsedQuantity INT DEFAULT 0,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL
);
```

### Banner Table
```sql
CREATE TABLE Banner (
    BannerId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500) NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    LinkUrl NVARCHAR(500) NULL,
    DisplayOrder INT NOT NULL,
    IsActive BIT DEFAULT 1,
    StartDate DATETIME NULL,
    EndDate DATETIME NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL
);
```

---

## Frontend Integration Steps

### 1. Update App.js
Add new pages for shopping:
```javascript
import ShoppingCart from './pages/ShoppingCartPage';
import ProductCatalog from './pages/ProductCatalogPage';
import CheckoutPage from './pages/CheckoutPage';

// Add routes
<Route path="/cart" element={<ShoppingCart />} />
<Route path="/catalog" element={<ProductCatalog />} />
<Route path="/checkout" element={<CheckoutPage />} />
```

### 2. Update Layout.js
Add shopping menu items:
```javascript
const menuItems = [
  // ... existing items
  { text: 'Product Catalog', icon: <StorefrontIcon />, path: '/catalog' },
  { text: 'Shopping Cart', icon: <ShoppingCartIcon />, path: '/cart' },
  { text: 'My Orders', icon: <LocalShippingIcon />, path: '/my-orders' },
];
```

### 3. Add Components to ProductsPage
```javascript
import BannerCarousel from '../components/BannerCarousel';
import FlashSaleCarousel from '../components/FlashSaleCarousel';
import ProductReviews from '../components/ProductReviews';

// In JSX
<BannerCarousel />
<FlashSaleCarousel />
{/* product list */}
<ProductReviews productId={product.id} reviews={reviews} />
```

### 4. Add Components to OrdersPage
```javascript
import CouponInput from '../components/CouponInput';

// In checkout section
<CouponInput 
  orderAmount={totalAmount} 
  onCouponApply={handleCouponApply} 
/>
```

---

## API Usage Examples

### Add to Cart
```javascript
const cartItem = {
  userId: 1,
  productId: 5,
  quantity: 3,
  price: 49.99
};
await cartService.addToCart(cartItem);
```

### Submit Review
```javascript
const review = {
  userId: 1,
  productId: 5,
  rating: 4,
  comment: "Great quality product!",
  isApproved: false
};
await reviewService.createReview(review);
```

### Create Flash Sale
```javascript
const flashSale = {
  title: "Weekend Mega Sale",
  description: "50% off selected items",
  startTime: "2026-02-06T08:00:00",
  endTime: "2026-02-07T23:59:59",
  isActive: true
};
await flashSaleService.createSale(flashSale);
```

### Validate Coupon
```javascript
const result = await couponService.validateCoupon("SAVE20", 500);
// Returns: { valid: true, discount: 100, finalAmount: 400 }
```

### Create Banner
```javascript
const banner = {
  title: "Spring Collection",
  description: "New products available now",
  imageUrl: "https://example.com/banner.jpg",
  linkUrl: "/products/spring",
  displayOrder: 1,
  isActive: true
};
await bannerService.createBanner(banner);
```

---

## Testing Checklist

### Cart Functionality
- [ ] Add items to cart
- [ ] Update item quantities
- [ ] Remove items from cart
- [ ] Clear entire cart
- [ ] Cart persists across sessions

### Reviews System
- [ ] Submit new review
- [ ] View product reviews
- [ ] Rate products (1-5 stars)
- [ ] See average rating
- [ ] Admin approval workflow

### Flash Sales
- [ ] Create flash sale
- [ ] Set time limits
- [ ] Display active sales
- [ ] Track sold quantity
- [ ] Apply sale prices to products

### Coupons
- [ ] Create coupon code
- [ ] Validate coupon code
- [ ] Calculate discount
- [ ] Check minimum order amount
- [ ] Track usage quantity
- [ ] Handle expired coupons

### Banners
- [ ] Upload banner images
- [ ] Display banner carousel
- [ ] Navigate on banner click
- [ ] Set display order
- [ ] Show/hide based on dates

---

## Performance Optimization Tips

1. **Caching**: Cache active banners and flash sales (they don't change frequently)
2. **Pagination**: Implement pagination for reviews on product pages
3. **Lazy Loading**: Load reviews on demand
4. **Compression**: Optimize banner images for web
5. **Database Indexes**: Add indexes on userId, productId, couponCode

---

## Security Considerations

1. **Coupon Validation**: Validate server-side (not just client-side)
2. **User Authorization**: Verify user owns the cart they're accessing
3. **Review Moderation**: Require admin approval before displaying
4. **Image Upload**: Validate and sanitize banner image uploads
5. **Price Verification**: Don't trust client-submitted prices from cart

---

## Next Steps

1. Run database migrations to create new tables
2. Rebuild backend solution
3. Test all new API endpoints
4. Create admin management pages for:
   - Coupon management
   - Banner management
   - Flash sale creation
   - Review moderation
5. Integrate components into existing pages
6. User acceptance testing

---

**Status**: Ready for Implementation ✅
**Features**: 5 new modules with 25+ endpoints
**Components**: 10 React components
**Database Tables**: 5 new tables

Let me know when you're ready to proceed!
