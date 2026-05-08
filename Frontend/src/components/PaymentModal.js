import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, 
  TextField, Button, Grid, ToggleButton, ToggleButtonGroup, 
  Divider, InputAdornment, Alert, IconButton, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import debtService from '../services/debtService';

function PaymentModal({ open, onClose, debt, onSuccess }) {
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [customerCash, setCustomerCash] = useState(0);
  const [change, setChange] = useState(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && debt) {
      setAmount(debt.soTienConLai || 0);
      setCustomerCash(debt.soTienConLai || 0);
      setError('');
      setNote('');
    }
  }, [open, debt]);

  useEffect(() => {
    if (paymentMethod === 'Tiền mặt' && customerCash >= amount) {
      setChange(customerCash - amount);
    } else {
      setChange(0);
    }
  }, [customerCash, amount, paymentMethod]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const handlePayment = async () => {
    if (amount <= 0) {
      setError('Số tiền thanh toán phải lớn hơn 0');
      return;
    }
    if (amount > debt.soTienConLai) {
      setError('Số tiền thanh toán vượt quá số nợ còn lại');
      return;
    }
    if (paymentMethod === 'Tiền mặt' && customerCash < amount) {
      setError('Tiền mặt chưa đủ để thanh toán');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        maCongNo: debt.maCongNo,
        soTien: amount,
        pttt: paymentMethod,
        ghiChu: note,
        maNhanVien: localStorage.getItem('maNhanVien') || 1, // Placeholder
        ngayTT: new Date().toISOString()
      };

      await debtService.recordPayment(payload);
      onSuccess();
      onClose();
      alert('Thanh toán thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentsIcon color="success" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Thanh Toán Công Nợ</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ p: 2, bgcolor: '#f1f8e9', borderRadius: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Đang Nợ Còn Lại</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>{formatCurrency(debt?.soTienConLai)}</Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Đối Tượng</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{debt?.tenKhachHang || debt?.tenNhaCungCap}</Typography>
              <Typography variant="caption" color="textSecondary">{debt?.maHD || debt?.maPN}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Chọn Phương Thức Thanh Toán</Typography>
        <ToggleButtonGroup
          value={paymentMethod}
          exclusive
          onChange={(e, v) => v && setPaymentMethod(v)}
          fullWidth
          sx={{ mb: 3 }}
          color="primary"
        >
          <ToggleButton value="Tiền mặt" sx={{ py: 1.5, gap: 1 }}>
            <PaymentsIcon fontSize="small" /> Tiền mặt
          </ToggleButton>
          <ToggleButton value="Chuyển khoản" sx={{ py: 1.5, gap: 1 }}>
            <AccountBalanceIcon fontSize="small" /> Chuyển khoản / QR
          </ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Số tiền muốn trả"
              type="number"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                endAdornment: amount === debt?.soTienConLai ? <Chip label="Hết" size="small" color="primary" /> : null
              }}
              helperText={`Bạn có thể trả một phần hoặc toàn bộ số nợ.`}
            />
          </Grid>

          {paymentMethod === 'Tiền mặt' ? (
            <>
              <Grid item xs={6}>
                <TextField
                  label="Tiền khách đưa"
                  type="number"
                  fullWidth
                  value={customerCash}
                  onChange={(e) => setCustomerCash(Number(e.target.value))}
                  InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Tiền Thừa Trả Khách</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: change > 0 ? '#2e7d32' : 'inherit' }}>{formatCurrency(change)}</Typography>
                </Box>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
               <Box sx={{ border: '2px dashed #e0e0e0', p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold' }}>Quét Mã QR VietQR</Typography>
                  <Box sx={{ width: 120, height: 120, bgcolor: '#eee', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, mb: 1, border: '1px solid #ddd' }}>
                    <QrCode2Icon sx={{ fontSize: 80, color: '#444' }} />
                  </Box>
                  <Typography variant="caption" display="block">STK: 123456789 - MB Bank</Typography>
                  <Typography variant="caption" display="block">Chủ TK: CÔNG TY VLXD ANTIGRAVITY</Typography>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>Nội dung: {debt?.maCN} PAY</Typography>
               </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              label="Ghi chú thanh toán"
              fullWidth
              multiline
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập nội dung nếu cần..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} color="inherit">Hủy</Button>
        <Button 
          variant="contained" 
          onClick={handlePayment} 
          disabled={loading || (paymentMethod === 'Tiền mặt' && customerCash < amount)}
          sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: 2, px: 4, fontWeight: 'bold' }}
          startIcon={loading ? null : <CheckCircleOutlineIcon />}
        >
          {loading ? 'Đang Xử Lý...' : 'Xác Nhận Thanh Toán'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentModal;
