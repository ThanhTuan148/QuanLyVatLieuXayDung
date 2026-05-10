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
  const [receiptImage, setReceiptImage] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isCustomer = user.role === 'Customer' || !!user.maKhachHang;

  useEffect(() => {
    if (open && debt) {
      setAmount(debt.soTienConLai || 0);
      setCustomerCash(debt.soTienConLai || 0);
      setError('');
      setNote('');
      setReceiptImage(null);
      if (isCustomer) setPaymentMethod('Chuyển khoản');
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
    if (isCustomer && paymentMethod === 'Chuyển khoản' && !receiptImage) {
      setError('Vui lòng tải ảnh minh chứng chuyển khoản (Biên lai)');
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        maCongNo: debt.maCongNo,
        soTien: amount,
        pttt: paymentMethod,
        ghiChu: note,
        maNhanVien: user.employeeId || user.maNhanVien || null,
        ngayTT: new Date().toISOString(),
        anhBangChung: receiptImage
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

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result);
      };
      reader.readAsDataURL(file);
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
          {!isCustomer && (
            <ToggleButton value="Tiền mặt" sx={{ py: 1.5, gap: 1 }}>
              <PaymentsIcon fontSize="small" /> Tiền mặt
            </ToggleButton>
          )}
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
               <Box sx={{ border: '2px dashed #1976d2', p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#f0f7ff' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold' }}>Quét Mã QR VietQR để thanh toán</Typography>
                  <Box sx={{ bgcolor: '#fff', p: 1, borderRadius: 2, display: 'inline-block', mb: 1, border: '1px solid #e0e0e0' }}>
                    <img 
                      src={`https://img.vietqr.io/image/vcb-1031657749-compact2.png?amount=${amount}&addInfo=THANH TOAN CONG NO ${debt?.maCN || debt?.maCongNo}&accountName=TRUONG THANH TUAN`}
                      alt="VietQR"
                      style={{ width: 200, height: 'auto', borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="caption" display="block">Ngân hàng: <b>Vietcombank</b></Typography>
                  <Typography variant="caption" display="block">STK: <b>1031657749</b></Typography>
                  <Typography variant="caption" display="block">Chủ TK: <b>TRƯƠNG THANH TUẤN</b></Typography>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: '#c92127' }}>
                    Nội dung: THANH TOAN CONG NO {debt?.maCN || debt?.maCongNo}
                  </Typography>

                  <Box sx={{ mt: 2, borderTop: '1px solid #ddd', pt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Tải lên ảnh chứng từ (Biên lai):</Typography>
                    <Button variant="outlined" component="label" size="small" startIcon={<span>📷</span>} sx={{ mb: 1 }}>
                      {receiptImage ? "Thay đổi ảnh" : "Chọn ảnh biên lai"}
                      <input type="file" hidden accept="image/*" onChange={handleReceiptUpload} />
                    </Button>
                    {receiptImage && (
                      <Box sx={{ position: 'relative', width: 100, mx: 'auto', mt: 1 }}>
                        <img src={receiptImage} alt="Receipt" style={{ width: '100%', borderRadius: 4, border: '1px solid #ddd' }} />
                        <IconButton 
                          size="small" 
                          sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: '#a8161a' }, p: 0.2 }}
                          onClick={() => setReceiptImage(null)}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
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
