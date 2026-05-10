import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Checkbox,
  Avatar,
  IconButton,
  Pagination,
} from '@mui/material';
import { Delete as DeleteIcon, Home as HomeIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import cartService from '../services/cartService';
import couponService from '../services/couponService';
import voucherUuDaiService from '../services/voucherUuDaiService';
import productService from '../services/productService';
import CouponInput from '../components/CouponInput';
import PromotionSection from '../components/PromotionSection';
import CouponsModal from '../components/CouponsModal';
import GiftsModal from '../components/GiftsModal';

const ShoppingCartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Manual Coupon state (from text input)
  const [appliedManualCoupon, setAppliedManualCoupon] = useState(null);
  const [manualDiscountAmount, setManualDiscountAmount] = useState(0);

  // Selected Promo state (from browsing list)
  const [appliedPromoCoupon, setAppliedPromoCoupon] = useState(null);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);

  // Rewards state
  const [allVouchers, setAllVouchers] = useState([]);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [giftsOpen, setGiftsOpen] = useState(false);
  const [selectedGifts, setSelectedGifts] = useState([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  
  // Fetch cart items
  const fetchCart = async () => {
    try {
      setLoading(true);
      const [cart, productsRes] = await Promise.all([
        cartService.getUserCart(),
        productService.getAllProducts()
      ]);

      const allProducts = Array.isArray(productsRes.data) ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []);

      // Hydrate cart items with full product info
      const hydratedCart = await Promise.all((cart || []).map(async (item) => {
        let prod = allProducts.find(p => (p.maSanPham || p.maSP) == item.productId);
        
        // If not found in bulk list, try fetching individually (might be discontinued/hidden)
        if (!prod) {
          try {
            const singleProdRes = await productService.getProductById(item.productId);
            prod = singleProdRes.data || singleProdRes;
          } catch (err) {
            console.warn(`Could not find details for product ${item.productId}`);
          }
        }

        return {
          ...item,
          productName: prod?.tenSP || `Sản phẩm #${item.productId}`,
          image: prod?.hinhAnh || '',
          originalPrice: prod?.giaBan || item.price,
          currentPrice: prod?.giaSauKhuyenMai || prod?.giaBan || item.price,
          hasDiscount: prod && prod.giaSauKhuyenMai && prod.giaSauKhuyenMai < prod.giaBan,
          soLuongTon: prod?.soLuongTon || 0,
          isDiscontinued: !allProducts.find(p => (p.maSanPham || p.maSP) == item.productId) && prod
        };
      }));

      setCartItems(hydratedCart);
      // Auto-select all items initially if not already set
      if (selectedIds.length === 0 && hydratedCart.length > 0) {
        setSelectedIds(hydratedCart.map(i => i.cartId));
      }

      // Fetch all vouchers for the browse modal
      const voucherRes = await voucherUuDaiService.getAll();
      setAllVouchers(Array.isArray(voucherRes.data) ? voucherRes.data : (Array.isArray(voucherRes) ? voucherRes : []));

    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Calculate totals for SELECTED items
  const selectedItems = cartItems.filter(item => selectedIds.includes(item.cartId));
  const subtotalSelected = selectedItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const productDiscount = selectedItems.reduce((sum, item) => sum + ((item.originalPrice - item.currentPrice) * item.quantity), 0);
  const total = Math.max(0, subtotalSelected - productDiscount - manualDiscountAmount - promoDiscountAmount);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map(item => item.cartId));
    }
  };

  // Handle quantity change
  const handleQuantityChange = async (cartId, newQuantity) => {
    const item = cartItems.find(i => i.cartId === cartId);
    if (!item) return;

    if (newQuantity < 1) return;

    const maxStock = item.soLuongTon || 0;
    if (newQuantity > maxStock) {
      alert(`Sản phẩm "${item.productName}" chỉ còn ${maxStock} sản phẩm trong kho.`);
      return;
    }

    try {
      await cartService.updateCartItem(cartId, {
        quantity: newQuantity,
      });
      // Update local state directly for smoother UI
      setCartItems(prev => prev.map(i =>
        i.cartId === cartId ? { ...i, quantity: newQuantity } : i
      ));
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  // Handle remove item
  const handleRemoveItem = async (cartId) => {
    try {
      await cartService.removeFromCart(cartId);
      setCartItems(prev => prev.filter(item => item.cartId !== cartId));
      setSelectedIds(prev => prev.filter(id => id !== cartId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
      try {
        await cartService.clearUserCart();
        setCartItems([]);
        setSelectedIds([]);
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  };

  // Handle manual coupon apply (receives data from CouponInput)
  const handleApplyManualCoupon = (couponData) => {
    if (couponData && couponData.code) {
      setAppliedManualCoupon(couponData.code);
      setManualDiscountAmount(couponData.discount);
    }
  };

  // Handle promo selection (receives data from CouponsModal)
  const handleSelectPromo = (uudai) => {
    if (uudai) {
      const discount = uudai.loaiUuDai === 'PhanTram'
        ? (total * uudai.giaTriGiam / 100)
        : uudai.giaTriGiam;

      setAppliedPromoCoupon(uudai.code);
      setPromoDiscountAmount(discount);
    }
  };

  // Determine gift limit
  let giftLimit = 0;
  if (total >= 3000000) giftLimit = 3;
  else if (total >= 2000000) giftLimit = 2;
  else if (total >= 500000) giftLimit = 1;

  // Find next best voucher for progress bar
  const nextVouchers = allVouchers.filter(v => total < (v.donHangToiThieu || 0));
  const nextVoucher = nextVouchers.length > 0 ? nextVouchers.reduce((prev, curr) =>
    (curr.donHangToiThieu < prev.donHangToiThieu ? curr : prev), nextVouchers[0]) : null;

  // Calculate eligible vouchers count
  const eligibleVouchersCount = allVouchers.filter(v => total >= (v.donHangToiThieu || 0)).length;

  // Sync selected gifts with limit
  useEffect(() => {
    if (selectedGifts.length > giftLimit) {
      setSelectedGifts(prev => prev.slice(0, giftLimit));
    }
  }, [giftLimit, selectedGifts.length]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          🛒 Giỏ Hàng Của Bạn
        </Typography>
        <Button variant="outlined" startIcon={<HomeIcon />} href="/shopping">
          Tiếp Tục Mua Sắm
        </Button>
      </Box>

      {cartItems.length > 0 ? (
        <Grid container spacing={3}>
          {/* Cart Items Table */}
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox 
                        checked={cartItems.length > 0 && selectedIds.length === cartItems.length}
                        indeterminate={selectedIds.length > 0 && selectedIds.length < cartItems.length}
                        onChange={handleToggleSelectAll}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Giá</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Số Lượng</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Thành Tiền</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hành Động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((item) => (
                    <TableRow key={item.cartId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(item.cartId)}
                          onChange={() => handleToggleSelect(item.cartId)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={item.image}
                            variant="rounded"
                            sx={{ width: 60, height: 60, bgcolor: '#f5f5f5', border: '1px solid #eee' }}
                          >
                            📦
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 200 }}>
                            {item.productName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {item.hasDiscount && (
                            <Typography variant="caption" sx={{ color: '#999', textDecoration: 'line-through' }}>
                              ₫{item.originalPrice.toLocaleString('vi-VN')}
                            </Typography>
                          )}
                          <Typography sx={{ color: item.hasDiscount ? '#d32f2f' : '#222', fontWeight: 700 }}>
                            ₫{item.currentPrice.toLocaleString('vi-VN')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', borderRadius: '4px', maxWidth: '100px', mx: 'auto' }}>
                          <IconButton size="small" onClick={() => handleQuantityChange(item.cartId, (parseInt(item.quantity) || 1) - 1)}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              const num = parseInt(val);
                              if (!isNaN(num) && num > 0) {
                                handleQuantityChange(item.cartId, num);
                              } else if (val === '') {
                                setCartItems(prev => prev.map(i =>
                                  i.cartId === item.cartId ? { ...i, quantity: '' } : i
                                ));
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                handleQuantityChange(item.cartId, 1);
                              }
                            }}
                            style={{
                              width: '40px',
                              border: 'none',
                              textAlign: 'center',
                              fontWeight: 600,
                              outline: 'none',
                              backgroundColor: 'transparent',
                              padding: '4px 0'
                            }}
                          />
                          <IconButton size="small" onClick={() => handleQuantityChange(item.cartId, (parseInt(item.quantity) || 0) + 1)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: '#e68c55', fontWeight: 700 }}>
                          ₫{(item.currentPrice * item.quantity).toLocaleString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="error" onClick={() => handleRemoveItem(item.cartId)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {cartItems.length > rowsPerPage && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Pagination 
                  count={Math.ceil(cartItems.length / rowsPerPage)} 
                  page={page} 
                  onChange={(e, v) => setPage(v)} 
                  color="primary" 
                />
              </Box>
            )}

            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button color="error" onClick={handleClearCart}>
                🗑️ Xóa Toàn Bộ Giỏ Hàng
              </Button>
            </Box>
          </Grid>

          {/* Order Summary & Rewards */}
          <Grid item xs={12} md={4} sx={{ alignSelf: 'start' }}>
            <Box sx={{ position: 'sticky', top: 20 }}>

              {/* Rewards Section */}
              <PromotionSection
                currentTotal={total}
                onOpenCoupons={() => setCouponsOpen(true)}
                onOpenGifts={() => setGiftsOpen(true)}
                bestCoupon={nextVoucher}
                eligibleCount={eligibleVouchersCount}
                selectedGiftsCount={selectedGifts.length}
                giftLimit={giftLimit}
              />

              <Card sx={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📋 Tóm Tắt Đơn Hàng
                  </Typography>

                  <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Tạm tính ({selectedIds.length} món):</Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        ₫{subtotalSelected.toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    {productDiscount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="text.secondary">Giảm giá sản phẩm:</Typography>
                        <Typography sx={{ color: '#d32f2f', fontWeight: 600 }}>
                          -₫{productDiscount.toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    )}
                    {manualDiscountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="text.secondary">Mã giảm giá ({appliedManualCoupon}):</Typography>
                        <Typography sx={{ color: '#d32f2f', fontWeight: 600 }}>
                          -₫{manualDiscountAmount.toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    )}
                    {promoDiscountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="text.secondary">Khuyến mãi ({appliedPromoCoupon}):</Typography>
                        <Typography sx={{ color: '#d32f2f', fontWeight: 600 }}>
                          -₫{promoDiscountAmount.toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff5f0', borderRadius: '8px', border: '1px solid #ffe8db' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 700 }}>Tổng cộng:</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#e68c55' }}>
                        ₫{total.toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                      (Tiết kiệm được ₫{(productDiscount + manualDiscountAmount + promoDiscountAmount).toLocaleString('vi-VN')})
                    </Typography>
                  </Box>

                  {/* Coupon Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      🎟️ Mã Giảm Giá
                    </Typography>
                    <CouponInput
                      orderAmount={subtotalSelected - productDiscount}
                      onCouponApply={handleApplyManualCoupon}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={selectedIds.length === 0}
                    onClick={() => {
                      // Final stock validation before checkout
                      const outOfStockItems = selectedItems.filter(item => item.quantity > item.soLuongTon);
                      if (outOfStockItems.length > 0) {
                        const names = outOfStockItems.map(i => {
                          if (i.productName.startsWith('Sản phẩm #')) {
                            return `${i.productName} (Sản phẩm ngừng kinh doanh/đã xóa)`;
                          }
                          return i.productName;
                        }).join(', ');
                        alert(`⚠️ Một số sản phẩm vượt quá tồn kho hoặc không còn bán: ${names}. Vui lòng xóa hoặc điều chỉnh lại số lượng.`);
                        return;
                      }

                      if (selectedGifts.length < giftLimit) {
                        alert(`🎁 Bạn chưa chọn đủ quà tặng! Vui lòng chọn đủ ${giftLimit} món quà để tiếp tục thanh toán.`);
                        setGiftsOpen(true); // Auto-open gifts modal for convenience
                      } else {
                        navigate('/checkout', {
                          state: {
                            selectedItems,
                            total,
                            subtotalSelected,
                            productDiscount,
                            manualDiscountAmount,
                            promoDiscountAmount,
                            appliedManualCoupon,
                            appliedPromoCoupon,
                            gifts: selectedGifts
                          }
                        });
                      }
                    }}
                    sx={{
                      bgcolor: '#e68c55', py: 1.5, borderRadius: '30px', fontWeight: 700,
                      '&:hover': { bgcolor: '#cc7a4a' },
                      boxShadow: '0 4px 14px rgba(230, 140, 85, 0.3)'
                    }}
                  >
                    🚀 Thanh Toán Ngay ({selectedIds.length})
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            😔 Giỏ hàng của bạn trống rỗng
          </Typography>
          <Button variant="contained" href="/shopping">
            <HomeIcon sx={{ mr: 1 }} />
            Quay Lại Cửa Hàng
          </Button>
        </Card>
      )}


      {/* Reward Modals */}
      <CouponsModal
        open={couponsOpen}
        onClose={() => setCouponsOpen(false)}
        coupons={allVouchers}
        currentTotal={total}
        appliedCode={appliedPromoCoupon}
        onApply={handleSelectPromo}
      />

      <GiftsModal
        open={giftsOpen}
        onClose={() => setGiftsOpen(false)}
        currentTotal={total}
        selectedGifts={selectedGifts}
        onSelect={(gifts) => setSelectedGifts(gifts)}
      />
    </Container>
  );
};

export default ShoppingCartPage;
