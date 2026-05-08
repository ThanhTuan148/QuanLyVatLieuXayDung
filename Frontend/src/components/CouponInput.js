import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import couponService from '../services/couponService';

function CouponInput({ orderAmount, onCouponApply }) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isError, setIsError] = useState(false);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage('Vui lòng nhập mã giảm giá');
      setIsError(true);
      return;
    }

    try {
      setLoading(true);
      const result = await couponService.validateCoupon(couponCode, orderAmount);

      if (result.valid) {
        setMessage(`Áp dụng mã thành công! Bạn được giảm ₫${result.discount.toLocaleString('vi-VN')}`);
        setDiscount(result.discount);
        setIsError(false);
        if (onCouponApply) {
          onCouponApply({
            code: couponCode,
            discount: result.discount,
            finalAmount: result.finalAmount
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
