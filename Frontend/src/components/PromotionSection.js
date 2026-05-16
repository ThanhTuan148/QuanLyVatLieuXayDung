import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import { 
  ConfirmationNumberOutlined as VoucherIcon,
  ChevronRight as ChevronRightIcon,
  CardGiftcard as GiftIcon,
  LocalShippingOutlined as ShippingIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';

const PromotionSection = ({ 
  currentTotal, 
  onOpenCoupons, 
  onOpenGifts, 
  bestCoupon, 
  eligibleCount,
  selectedGiftsCount,
  giftLimit,
  label = "Khuyến mãi"
}) => {
  // Free shipping logic
  const freeShipThreshold = 500000;
  const isFreeShip = currentTotal >= freeShipThreshold;

  // Progress for the best coupon (mock logic if no bestCoupon)
  const targetAmount = bestCoupon?.donHangToiThieu || 1000000;
  const progress = Math.min(100, (currentTotal / targetAmount) * 100);
  const remaining = Math.max(0, targetAmount - currentTotal);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
      {/* 1. KHUYẾN MÃI CARD */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VoucherIcon sx={{ color: '#1976d2' }} />
              <Typography variant="subtitle2" fontWeight={700} color="#1976d2" sx={{ textTransform: 'uppercase' }}>{label}</Typography>
            </Box>
            <Button 
                endIcon={<ChevronRightIcon />} 
                onClick={onOpenCoupons}
                size="small" 
                sx={{ textTransform: 'none', fontWeight: 600, color: '#1976d2' }}
            >
              Xem thêm
            </Button>
          </Box>

          <Box sx={{ position: 'relative', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <Box>
                 <Typography variant="body2" fontWeight={800} sx={{ mb: 0.5 }}>
                   {bestCoupon ? (bestCoupon.tenKM || bestCoupon.maApDung) : 'Tuyệt vời! Bạn đã đạt mức ưu đãi cao nhất'}
                 </Typography>
                 <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: '200px' }}>
                   {bestCoupon 
                    ? `Đơn hàng từ ${targetAmount >= 1000000 ? '1.000k' : `₫${targetAmount.toLocaleString('vi-VN')}`} để nhận ưu đãi...` 
                    : 'Tiếp tục mua sắm để nhận thêm nhiều quà tặng hấp dẫn.'}
                 </Typography>
                 <Typography fontSize={11} sx={{ mt: 1, color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}>
                   {bestCoupon ? `HSD: ${new Date(bestCoupon.thoiGianKetThuc).toLocaleDateString('vi-VN')}` : ''}
                 </Typography>
               </Box>
               <IconButton size="small" sx={{ color: '#1976d2' }}><InfoIcon fontSize="small" /></IconButton>
            </Box>

            <Box sx={{ mt: 2 }}>
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#e3f2fd', '& .MuiLinearProgress-bar': { bgcolor: '#42a5f5' } }} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {remaining > 0 ? `Mua thêm ₫${remaining.toLocaleString('vi-VN')}` : 'Đã đủ điều kiện!'}
                    </Typography>
                    {remaining > 0 && (
                        <Button size="small" variant="contained" sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#1976d2', fontSize: '0.75rem', px: 2 }}>
                          Mua thêm
                        </Button>
                    )}
                </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Qualified Promo count bar */}
          <Box 
            onClick={onOpenCoupons}
            sx={{ 
                bgcolor: '#e3f2fd', p: 1.5, borderRadius: '8px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: '#bbdefb'} 
            }}
          >
            <Typography variant="body2" color="#1976d2" fontWeight={600}>{eligibleCount} ưu đãi đủ điều kiện</Typography>
            <ChevronRightIcon sx={{ color: '#1976d2' }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Hướng dẫn sử dụng Gift Card <InfoIcon sx={{ fontSize: 14 }} />
          </Typography>
        </CardContent>
      </Card>

      {/* 2. NHẬN QUÀ CARD */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: '#d32f2f', p: 0.5, borderRadius: '6px', display: 'flex' }}>
              <GiftIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="body2" fontWeight={700}>Nhận quà ({selectedGiftsCount}/{giftLimit})</Typography>
          </Box>
          <Button 
            onClick={onOpenGifts}
            endIcon={<ChevronRightIcon />} 
            sx={{ textTransform: 'none', color: '#1976d2', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Chọn quà <Box component="span" sx={{ bgcolor: '#d32f2f', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ml: 1, fontSize: 11 }}>{giftLimit}</Box>
          </Button>
        </CardContent>
      </Card>

      {/* 3. FREE SHIPPING NOTICE */}
      {isFreeShip && (
        <Box sx={{ bgcolor: '#e8f5e9', p: 1.5, borderRadius: '12px', border: '1px solid #c8e6c9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ShippingIcon sx={{ color: '#2e7d32' }} />
                <Typography variant="body2" fontWeight={600} color="#2e7d32">
                    Miễn phí giao hàng <Box component="span" sx={{ fontWeight: 400 }}>cho đơn từ 500k trở lên!</Box>
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer' }}>Chi tiết</Typography>
        </Box>
      )}
    </Box>
  );
};

export default PromotionSection;
