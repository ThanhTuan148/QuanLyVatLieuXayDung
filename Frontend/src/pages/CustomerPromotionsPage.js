import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import couponService from '../services/couponService';

const CustomerPromotionsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [savedCoupons, setSavedCoupons] = useState([]);

  useEffect(() => {
    // Load saved coupons from localStorage
    const saved = JSON.parse(localStorage.getItem('savedVouchers') || '[]');
    setSavedCoupons(saved);

    const fetchCoupons = async () => {
      try {
        const res = await couponService.getAll();
        const rawCoupons = res.data || (Array.isArray(res) ? res : []);
        
        const allCoupons = rawCoupons.map(c => ({
          maUUDAI: c.maKhuyenMai,
          code: c.maApDung,
          tenUuDai: c.tenKM,
          loaiUuDai: c.loaiGiamGia,
          giaTriGiam: c.giaTriGiam,
          giamToiDa: c.giamToiDa,
          donHangToiThieu: c.donHangToiThieu,
          ngayBatDau: c.thoiGianBatDau || c.ngayBatDau,
          ngayKetThuc: c.thoiGianKetThuc || c.ngayKetThuc,
          trangThai: c.trangThai
        }));
        
        // Filter active coupons: trangThai === true and within date range
        const now = new Date();
        const activeCoupons = allCoupons.filter(c => {
          if (c.trangThai === false || c.trangThai === 0) return false;
          
          const startDate = new Date(c.ngayBatDau);
          const endDate = new Date(c.ngayKetThuc);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return true;
          
          if (now < startDate || now > endDate) return false;
          return true;
        });

        setCoupons(activeCoupons);
      } catch (err) {
        console.error("Lỗi khi tải mã ưu đãi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    
    // Save to localStorage if not already saved
    if (!savedCoupons.includes(code)) {
      const newSaved = [...savedCoupons, code];
      setSavedCoupons(newSaved);
      localStorage.setItem('savedVouchers', JSON.stringify(newSaved));
    }

    setToast({ open: true, message: `Đã sao chép mã: ${code} và lưu vào ví!`, severity: 'success' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '80vh', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LocalOfferOutlinedIcon sx={{ fontSize: 40, mr: 1 }} />
            Mã Ưu Đãi Dành Cho Bạn
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Lưu ngay các mã giảm giá hấp dẫn để sử dụng khi thanh toán nhé!
          </Typography>
        </Box>

        {loading ? (
          <Typography textAlign="center">Đang tải dữ liệu...</Typography>
        ) : coupons.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 5, bgcolor: '#fff', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Hiện tại cửa hàng chưa có mã ưu đãi nào. Bạn hãy quay lại sau nhé!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {coupons.map((coupon) => (
              <Grid item xs={12} md={6} lg={4} key={coupon.maUUDAI}>
                <Card 
                  sx={{ 
                    display: 'flex', 
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ 
                    bgcolor: 'primary.main', 
                    color: '#fff', 
                    width: 100, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 2,
                    position: 'relative',
                    borderRight: '2px dashed #fff'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>
                      {coupon.loaiUuDai === 'PhanTram' || coupon.loaiUuDai === 'Giảm %'
                        ? `GIẢM ${coupon.giaTriGiam}%` 
                        : coupon.loaiUuDai === 'Freeship' 
                          ? `FREESHIP`
                          : `GIẢM ${(coupon.giaTriGiam / 1000)}K`}
                    </Typography>
                    <Box sx={{ 
                      position: 'absolute', top: -10, right: -10, width: 20, height: 20, bgcolor: '#f5f7fa', borderRadius: '50%' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute', bottom: -10, right: -10, width: 20, height: 20, bgcolor: '#f5f7fa', borderRadius: '50%' 
                    }} />
                  </Box>

                  <CardContent sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#333' }}>
                          {coupon.tenUuDai}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Đơn tối thiểu: <b>{formatCurrency(coupon.donHangToiThieu)}</b>
                      </Typography>
                      {(coupon.loaiUuDai === 'PhanTram' || coupon.loaiUuDai === 'Giảm %') && coupon.giamToiDa > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Giảm tối đa: <b>{formatCurrency(coupon.giamToiDa)}</b>
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block">
                        HSD: {new Date(coupon.thoiGianKetThuc || coupon.ngayKetThuc).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Chip 
                        label={coupon.code} 
                        size="small" 
                        sx={{ bgcolor: '#f0f0f0', fontWeight: 'bold', letterSpacing: 1 }} 
                      />
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleCopyCode(coupon.code)}
                        startIcon={<ContentCopyIcon fontSize="small" />}
                        sx={{ 
                          bgcolor: savedCoupons.includes(coupon.code) ? '#4caf50' : '#e68c55', 
                          borderRadius: 20,
                          textTransform: 'none',
                          boxShadow: 'none',
                          '&:hover': {
                            bgcolor: savedCoupons.includes(coupon.code) ? '#43a047' : '#d87b45',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        {savedCoupons.includes(coupon.code) ? 'Đã lưu' : 'Lưu mã'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={3000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerPromotionsPage;
