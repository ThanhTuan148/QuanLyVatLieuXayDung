import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  Chip
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import couponService from '../services/couponService';

function CouponInput({ orderAmount, onCouponApply, systemVoucherCodes = [] }) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isError, setIsError] = useState(false);
  const [savedCoupons, setSavedCoupons] = useState([]);

  useEffect(() => {
    let saved = JSON.parse(localStorage.getItem('savedVouchers') || '[]');
    // Filter out codes that are in systemVoucherCodes
    if (systemVoucherCodes.length > 0) {
      saved = saved.filter(code => !systemVoucherCodes.includes(code));
    }
    setSavedCoupons(saved);
  }, [systemVoucherCodes]);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage('Vui lòng nhập mã giảm giá');
      setIsError(true);
      return;
    }

    try {
      if (systemVoucherCodes.includes(couponCode.trim())) {
        setMessage('Mã này là Ưu đãi hệ thống. Vui lòng chọn ở mục "Ưu đãi hệ thống" phía trên.');
        setIsError(true);
        setDiscount(0);
        return;
      }
      setLoading(true);
      const result = await couponService.validateCoupon(couponCode, orderAmount);

      if (result.valid) {
        if (result.type === 'Freeship') {
            setMessage('Áp dụng mã Freeship thành công!');
        } else {
            setMessage(`Áp dụng mã thành công! Bạn được giảm ₫${result.discount.toLocaleString('vi-VN')}`);
        }
        setDiscount(result.discount);
        setIsError(false);
        if (onCouponApply) {
          onCouponApply({
            code: couponCode,
            discount: result.discount,
            finalAmount: result.finalAmount,
            type: result.type // Pass type to parent
          });
        }
      } else {
        setMessage(result.message || 'Mã giảm giá không hợp lệ');
        setIsError(true);
        setDiscount(0);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to validate coupon';
      setMessage(errorMsg);
      setIsError(true);
      setDiscount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalOfferIcon />
          <Typography variant="h6">Áp dụng mã giảm giá</Typography>
        </Box>

        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
            <TextField
              placeholder="Nhập mã giảm giá..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              size="medium"
              fullWidth
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <Button
              variant="contained"
              onClick={handleValidateCoupon}
              disabled={loading || !couponCode}
              sx={{ 
                bgcolor: '#e68c55', '&:hover': { bgcolor: '#cc7a4a' },
                borderRadius: '8px', px: 3, fontWeight: 700, whiteSpace: 'nowrap'
              }}
            >
              {loading ? '...' : 'Áp dụng'}
            </Button>
          </Box>

          {savedCoupons.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', mr: 1 }}>
                Mã đã lưu:
              </Typography>
              {savedCoupons.map((code) => (
                <Chip 
                  key={code} 
                  label={code} 
                  size="small" 
                  onClick={() => setCouponCode(code)}
                  sx={{ 
                    bgcolor: couponCode === code ? '#e68c55' : '#f0f0f0',
                    color: couponCode === code ? '#fff' : 'inherit',
                    fontWeight: couponCode === code ? 'bold' : 'normal',
                    '&:hover': { bgcolor: couponCode === code ? '#cc7a4a' : '#e0e0e0' }
                  }}
                />
              ))}
            </Box>
          )}

          {message && (
            <Alert severity={isError ? 'error' : 'success'}>
              {message}
            </Alert>
          )}

          {discount > 0 && (
            <Box sx={{ bgcolor: '#fff5f0', p: 2, borderRadius: 1, border: '1px solid #ffe8db' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Số tiền giảm:</strong> ₫{discount.toLocaleString('vi-VN')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#e68c55', mt: 0.5 }}>
                <strong>Sau khi giảm:</strong> ₫{(orderAmount - discount).toLocaleString('vi-VN')}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default CouponInput;
