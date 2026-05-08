import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Typography, Box, CircularProgress
} from '@mui/material';
import api from '../services/api';

function DeliveryStatusUpdateDialog({ open, onClose, delivery, onUpdated }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && delivery) {
      setStatus(delivery.trangThai || 'Chờ giao');
      setNotes(delivery.ghiChu || '');
      setAmountPaid(''); // Reset amount on open
    }
  }, [open, delivery]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        trangThai: status,
        ghiChu: notes,
        ngayGiaoThucTe: status === 'Đã giao' ? new Date().toISOString() : null,
        soTienThu: amountPaid ? parseFloat(amountPaid) : 0
      };

      await api.put(`/deliveries/${delivery.maPhieuGH}`, payload);
      onUpdated();
    } catch (err) {
      console.error('Error updating delivery status:', err);
      alert('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'Chờ giao', label: '⏳ Chờ giao' },
    { value: 'Đang giao', label: '🚚 Đang giao' },
    { value: 'Đã giao', label: '✅ Đã giao' },
    { value: 'Không thành công', label: '❌ Không thành công' },
    { value: 'Đã hủy', label: '🚫 Đã hủy' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Cập Nhật Trạng Thái: {delivery?.maGH}</DialogTitle>
      <DialogContent dividers>
        {delivery && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#fff4e5', borderRadius: 2, border: '1px solid #ffe2b7' }}>
            <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 'bold', mb: 1 }}>
              THÔNG TIN THANH TOÁN (HĐ: {delivery.maHD})
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Tổng cộng đơn hàng:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(delivery.tongTienOrder || 0)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>CÒN NỢ:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((delivery.tongTienOrder || 0) - (delivery.daThanhToanOrder || 0))}
              </Typography>
            </Box>
          </Box>
        )}
        <Box sx={{ mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Trạng Thái"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ mb: 3 }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {status === 'Đã giao' && (
            <TextField
              fullWidth
              label="Số tiền thu được (VNĐ)"
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              sx={{ mb: 3 }}
              helperText="Nhập số tiền khách trả trong đợt này (nếu có)"
              autoFocus
            />
          )}

          <TextField
            fullWidth
            label="Ghi chú cập nhật"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nhập ghi chú (nếu có)..."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Hủy</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Cập Nhật'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeliveryStatusUpdateDialog;
