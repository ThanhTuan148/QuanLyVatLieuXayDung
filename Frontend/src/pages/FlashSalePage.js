import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Button, Typography, Box, Skeleton, IconButton, Dialog, Snackbar, Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import flashSaleService from '../services/flashSaleService';
import cartService from '../services/cartService';
import storageHelper from '../services/storageHelper';
import ProductCard from '../components/ProductCard';

let cachedFlashSaleData = null;

const FlashSalePage = () => {
  const [flashSale, setFlashSale] = useState(cachedFlashSaleData);
  const [loading, setLoading] = useState(!cachedFlashSaleData);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [activeSlot, setActiveSlot] = useState('12:00');
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [favorites, setFavorites] = useState(() => storageHelper.getFavorites());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleToggleFavorite = (product, e) => {
    if (e) e.stopPropagation();
    const productId = product.maSanPham || product.maSP;
    if (!productId) return;
    const isFav = favorites.includes(productId);
    let newFavs;
    if (isFav) {
      newFavs = favorites.filter(id => id !== productId);
    } else {
      newFavs = [...favorites, productId];
    }
    setFavorites(newFavs);
    storageHelper.saveFavorites(newFavs);
  };

  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    if (!product) return;
    try {
      await cartService.addToCart({
        userId: parseInt(localStorage.getItem('userId') || 1),
        productId: product.maSanPham || product.maSP,
        price: product.giaKhuyenMai || product.giaBan || 0,
        quantity: 1
      });
      setSnackbar({ open: true, message: 'Đã thêm vào giỏ hàng!', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Lỗi khi thêm vào giỏ hàng!', severity: 'error' });
    }
  };

  useEffect(() => {
    const fetchActiveFlashSale = async () => {
      try {
        if (!cachedFlashSaleData) setLoading(true);
        const data = await flashSaleService.getActiveSales();
        // Assuming we take the first active flash sale
        if (data && data.length > 0) {
          cachedFlashSaleData = data[0];
          setFlashSale(data[0]);
        } else {
          cachedFlashSaleData = null;
          setFlashSale(null);
        }
      } catch (error) {
        console.error('Error fetching flash sales:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveFlashSale();
  }, []);

  useEffect(() => {
    if (!flashSale) return;

    const updateTimer = () => {
      const now = new Date();
      const currentHour = now.getHours();
      let nextSlotHour = 9;
      let currentSlot = '00:00';
      if (currentHour >= 20) { currentSlot = '20:00'; nextSlotHour = 24; }
      else if (currentHour >= 15) { currentSlot = '15:00'; nextSlotHour = 20; }
      else if (currentHour >= 12) { currentSlot = '12:00'; nextSlotHour = 15; }
      else if (currentHour >= 9) { currentSlot = '09:00'; nextSlotHour = 12; }
      else { currentSlot = '00:00'; nextSlotHour = 9; }

      setActiveSlot(currentSlot);

      const endTime = flashSale.thoiGianKetThuc ? new Date(flashSale.thoiGianKetThuc).getTime() : new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextSlotHour, 0, 0).getTime();
      const distance = endTime - now.getTime();

      if (distance < 0) {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const h = Math.floor(distance / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0')
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [flashSale]);

  const handleOpenQuickView = (prod) => {
    setSelectedProduct(prod);
    setQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setQuickViewOpen(false);
    setSelectedProduct(null);
  };

  if (!loading && !flashSale) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ color: '#555' }}>Hiện không có chương trình Flash Sale nào.</Typography>
      </Container>
    );
  }

  const products = flashSale?.targets?.map(t => ({
    ...t,
    tenSP: t.tenSanPham,
  })) || [];


  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', bgcolor: '#f5f5f5', pb: 8 }}>
      {/* Fahasa Style Banner Banner */}
      <Box sx={{ 
        bgcolor: '#0f172a', // Dark blue background like Fahasa
        color: '#fff',
        py: 6,
        px: { xs: 2, md: 8 },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <Box sx={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,57,70,0.4) 0%, transparent 70%)', filter: 'blur(20px)' }} />
        <Box sx={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,97,238,0.4) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h2" sx={{ 
            fontWeight: 900, 
            fontStyle: 'italic', 
            color: '#fff', 
            textShadow: '0 0 10px rgba(255,0,0,0.8), 0 0 20px rgba(255,0,0,0.4)',
            mb: 1,
            letterSpacing: '2px'
          }}>
            FLA<span style={{ color: '#fed7aa' }}>⚡</span>H SALE
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#93c5fd', textTransform: 'uppercase' }}>
            {flashSale?.tieuDe || 'Bão Sale Sập Sàn'}
          </Typography>

          {/* Time Tabs (Mock like Fahasa) */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
             {['00:00', '09:00', '12:00', '15:00', '20:00'].map((time, i) => {
                const slotHour = parseInt(time.split(':')[0], 10);
                const activeHour = parseInt(activeSlot.split(':')[0], 10);
                let statusText = 'Sắp diễn ra';
                if (time === activeSlot) {
                  statusText = 'Đang diễn ra';
                } else if (slotHour < activeHour) {
                  statusText = 'Đã kết thúc';
                }

                return (
                  <Box key={i} sx={{ 
                    bgcolor: time === activeSlot ? '#e63946' : 'rgba(255,255,255,0.1)', 
                    border: time === activeSlot ? '2px solid #fca5a5' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px', 
                    py: 1, 
                    px: 3,
                    minWidth: '100px'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{time}</Typography>
                    <Typography variant="caption">{statusText}</Typography>
                  </Box>
                );
             })}
          </Box>
        </Container>
      </Box>

      {/* Red Countdown Bar */}
      <Box sx={{ bgcolor: '#ef4444', py: 2, mb: 4 }}>
        <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontStyle: 'italic', display: { xs: 'none', md: 'block' } }}>
            FLA⚡H SALE
          </Typography>
          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>Kết thúc trong:</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ bgcolor: '#000', color: '#fff', px: 1.5, py: 0.5, borderRadius: '4px', fontWeight: 'bold', fontSize: '1.2rem' }}>{timeLeft.hours}</Box>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>:</Typography>
            <Box sx={{ bgcolor: '#000', color: '#fff', px: 1.5, py: 0.5, borderRadius: '4px', fontWeight: 'bold', fontSize: '1.2rem' }}>{timeLeft.minutes}</Box>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>:</Typography>
            <Box sx={{ bgcolor: '#000', color: '#fff', px: 1.5, py: 0.5, borderRadius: '4px', fontWeight: 'bold', fontSize: '1.2rem' }}>{timeLeft.seconds}</Box>
          </Box>
        </Container>
      </Box>

      {/* Products Grid */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 8, lg: 12 } }}>
        <Grid container spacing={3}>
          {(loading ? Array(10).fill({}) : products).map((prod, idx) => (
            <Grid item xs={12} sm={6} md={3} lg={2.4} key={prod.maSanPham || idx}>
              {loading ? (
                <Skeleton variant="rectangular" height={380} sx={{ borderRadius: 2 }} />
              ) : (
                <ProductCard
                  product={prod}
                  isFavorite={favorites.includes(prod.maSanPham || prod.maSP)}
                  onToggleFav={handleToggleFavorite}
                  onAddToCart={handleAddToCart}
                  onQuickView={() => handleOpenQuickView(prod)}
                  showProgressBar
                />
              )}
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Quick View Dialog (Similar to Shopping Page) */}
      <Dialog open={quickViewOpen} onClose={handleCloseQuickView} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px', m: 2 } }}>
         {/* Render selected product details here */}
         {selectedProduct && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: 3, position: 'relative' }}>
             <IconButton onClick={handleCloseQuickView} sx={{ position: 'absolute', top: 8, right: 8 }}><CloseIcon /></IconButton>
             <Box sx={{ width: { xs: '100%', md: '50%' }, p: 2, display: 'flex', justifyContent: 'center' }}>
                {selectedProduct.hinhAnh ? <img src={selectedProduct.hinhAnh} alt={selectedProduct.tenSP} style={{ maxWidth: '90%', maxHeight: '300px', objectFit: 'contain' }} /> : <Box sx={{ fontSize: '8rem' }}>🏗️</Box>}
             </Box>
             <Box sx={{ width: { xs: '100%', md: '50%' }, p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{selectedProduct.tenSP}</Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>Mã SP: {selectedProduct.maSanPham}</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                   <Typography variant="h4" sx={{ color: '#ef4444', fontWeight: 700 }}>
                     {selectedProduct.giaKhuyenMai?.toLocaleString('vi-VN')}đ
                   </Typography>
                   {selectedProduct.giaBan > selectedProduct.giaKhuyenMai && (
                      <Typography variant="h6" sx={{ textDecoration: 'line-through', color: '#9ca3af' }}>
                        {selectedProduct.giaBan?.toLocaleString('vi-VN')}đ
                      </Typography>
                   )}
                </Box>
                <Button variant="contained" fullWidth onClick={() => handleAddToCart(selectedProduct)} sx={{ bgcolor: '#ef4444', color: '#fff', py: 1.5, fontWeight: 700, '&:hover': { bgcolor: '#dc2626' } }}>
                   Thêm vào giỏ hàng
                </Button>
             </Box>
          </Box>
         )}
      </Dialog>
      <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FlashSalePage;
