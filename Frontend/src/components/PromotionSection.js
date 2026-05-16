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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  onBuyMore,
  bestCoupon, 
  appliedCode, // New prop to track applied coupon
  eligibleCount,
  selectedGiftsCount,
  giftLimit,
  label = "Khuyến mãi"
}) => {
  const [openFreeshipModal, setOpenFreeshipModal] = React.useState(false);

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
        <CardContent sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VoucherIcon sx={{ color: '#1976d2', fontSize: 18 }} />
              <Typography fontSize={12} fontWeight={700} color="#1976d2" sx={{ textTransform: 'uppercase' }}>{label}</Typography>
            </Box>
            <Button 
                endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />} 
                onClick={onOpenCoupons}
                size="small" 
                sx={{ textTransform: 'none', fontWeight: 600, color: '#1976d2', fontSize: 11 }}
            >
              Xem thêm
            </Button>
          </Box>

          <Box sx={{ position: 'relative', mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <Box sx={{ flex: 1 }}>
                 <Typography fontSize={13} fontWeight={800} sx={{ mb: 0.5, color: appliedCode ? '#4caf50' : 'inherit' }}>
                   {appliedCode 
                    ? `Đã áp dụng mã: ${appliedCode}` 
                    : (bestCoupon ? (bestCoupon.tenKM || bestCoupon.maApDung) : 'Tuyệt vời! Bạn đã đạt mức ưu đãi cao nhất')}
                 </Typography>
                 <Typography fontSize={11} color="text.secondary" display="block" sx={{ maxWidth: '220px', lineHeight: 1.3 }}>
                   {appliedCode 
                    ? 'Ưu đãi đang được áp dụng cho đơn hàng của bạn.' 
                    : (bestCoupon 
                        ? `Đơn hàng từ ${targetAmount >= 1000000 ? '1.000k' : `₫${targetAmount.toLocaleString('vi-VN')}`} để nhận ưu đãi...` 
                        : 'Tiếp tục mua sắm để nhận thêm nhiều quà tặng hấp dẫn.')
                   }
                 </Typography>
                 {bestCoupon && !appliedCode && (
                   <Typography fontSize={10} sx={{ mt: 0.5, color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}>
                     HSD: {new Date(bestCoupon.thoiGianKetThuc).toLocaleDateString('vi-VN')}
                   </Typography>
                 )}
               </Box>
               <IconButton size="small" sx={{ color: '#1976d2', p: 0.5 }}><InfoIcon sx={{ fontSize: 16 }} /></IconButton>
            </Box>

            <Box sx={{ mt: 1.5 }}>
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ height: 5, borderRadius: 2.5, bgcolor: '#e3f2fd', '& .MuiLinearProgress-bar': { bgcolor: '#42a5f5' } }} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography fontSize={11} fontWeight={600} color="text.secondary">
                      {remaining > 0 ? `Mua thêm ₫${remaining.toLocaleString('vi-VN')}` : 'Đã đủ điều kiện!'}
                    </Typography>
                    {remaining > 0 && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={onBuyMore}
                          sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#1976d2', fontSize: 10, py: 0.2, px: 1.5 }}
                        >
                          Mua thêm
                        </Button>
                    )}
                </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Qualified Promo count bar */}
          <Box 
            onClick={onOpenCoupons}
            sx={{ 
                bgcolor: '#e3f2fd', p: 1, px: 1.5, borderRadius: '8px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: '#bbdefb'} 
            }}
          >
            <Typography fontSize={12} color="#1976d2" fontWeight={600}>{eligibleCount} ưu đãi đủ điều kiện</Typography>
            <ChevronRightIcon sx={{ color: '#1976d2', fontSize: 18 }} />
          </Box>
          <Typography fontSize={11} color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Hướng dẫn sử dụng Gift Card <InfoIcon sx={{ fontSize: 13 }} />
          </Typography>
        </CardContent>
      </Card>

      {/* 2. NHẬN QUÀ CARD */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: '#d32f2f', p: 0.5, borderRadius: '6px', display: 'flex' }}>
              <GiftIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography fontSize={13} fontWeight={700}>Nhận quà ({selectedGiftsCount}/{giftLimit})</Typography>
          </Box>
          <Button 
            onClick={onOpenGifts}
            endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />} 
            sx={{ textTransform: 'none', color: '#1976d2', fontWeight: 600, fontSize: 12 }}
          >
            Chọn quà <Box component="span" sx={{ bgcolor: '#d32f2f', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ml: 0.5, fontSize: 10 }}>{giftLimit}</Box>
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
            <Typography 
                variant="body2" 
                onClick={() => setOpenFreeshipModal(true)}
                sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
                Chi tiết
            </Typography>
        </Box>
      )}

      {/* FREESHIP POLICY MODAL */}
      <Dialog 
        open={openFreeshipModal} 
        onClose={() => setOpenFreeshipModal(false)}
        PaperProps={{ sx: { borderRadius: '16px', maxWidth: '450px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
            <ShippingIcon sx={{ color: '#2e7d32' }} />
            <Typography variant="h6" fontWeight={700}>Chính sách giao hàng</Typography>
        </DialogTitle>
        <DialogContent>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.6 }}>
                Chào mừng bạn đến với **Cửa hàng Vật Liệu Xây Dựng**. Để mang lại trải nghiệm mua sắm tốt nhất, chúng tôi áp dụng chính sách vận chuyển như sau:
            </Typography>
            
            <Box sx={{ bgcolor: '#f1f8e9', p: 2, borderRadius: '12px', mb: 2, border: '1px solid #c8e6c9' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#2e7d32" gutterBottom>
                    🚚 Miễn phí vận chuyển (FREESHIP)
                </Typography>
                <Typography variant="body2">
                    Áp dụng cho mọi đơn hàng có **tổng giá trị sản phẩm từ 500.000₫ trở lên**.
                </Typography>
            </Box>

            <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: '12px', mb: 2, border: '1px solid #ffe0b2' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#e65100" gutterBottom>
                    📦 Phí vận chuyển tiêu chuẩn
                </Typography>
                <Typography variant="body2">
                    Đối với đơn hàng dưới 500.000₫, phí vận chuyển đồng giá là **30.000₫** cho mỗi địa chỉ nhận hàng.
                </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                * Lưu ý: Chính sách áp dụng cho tất cả các tỉnh thành trên toàn quốc. Thời gian giao hàng dự kiến từ 2-5 ngày làm việc.
            </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
                fullWidth 
                variant="contained" 
                onClick={() => setOpenFreeshipModal(false)}
                sx={{ borderRadius: '8px', bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
            >
                Đã hiểu
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromotionSection;
