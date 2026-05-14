import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, TextField, Typography, Box, Alert
} from '@mui/material';

export default function ConfirmReceiptDialog({ open, onClose, outboundNote, onConfirm }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open && outboundNote && outboundNote.chiTiet) {
      setItems(outboundNote.chiTiet.map(item => ({
        maSanPham: item.maSanPham,
        tenSanPham: item.tenSP || item.tenSanPham,
        soLuongYeuCau: item.soLuong,
        soLuongNhan: item.soLuong,
        isFull: true,
        ghiChu: ''
      })));
    }
  }, [open, outboundNote]);

  const handleToggleFull = (index) => {
    const newItems = [...items];
    newItems[index].isFull = !newItems[index].isFull;
    if (newItems[index].isFull) {
      newItems[index].soLuongNhan = newItems[index].soLuongYeuCau;
    }
    setItems(newItems);
  };

  const handleQtyChange = (index, val) => {
    const newItems = [...items];
    let v = parseInt(val);
    if (isNaN(v)) v = 0;
    if (v > newItems[index].soLuongYeuCau) v = newItems[index].soLuongYeuCau;
    newItems[index].soLuongNhan = v;
    newItems[index].isFull = (v === newItems[index].soLuongYeuCau);
    setItems(newItems);
  };

  const handleGhiChuChange = (index, val) => {
    const newItems = [...items];
    newItems[index].ghiChu = val;
    setItems(newItems);
  };

  const handleSubmit = () => {
    const payload = items.map(i => ({
      maSanPham: i.maSanPham,
      soLuongNhan: i.soLuongNhan,
      ghiChu: i.ghiChu
    }));
    onConfirm(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Xác nhận nhận hàng thực tế</DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          Tài xế vui lòng kiểm tra kỹ số lượng hàng nhận từ kho trước khi xác nhận đi giao.
        </Alert>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Sản phẩm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>SL Kho soạn</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Đủ</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>SL Thực nhận</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ghi chú (nếu thiếu)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.tenSanPham}</TableCell>
                  <TableCell align="center">{item.soLuongYeuCau}</TableCell>
                  <TableCell align="center">
                    <Checkbox 
                      checked={item.isFull} 
                      onChange={() => handleToggleFull(idx)}
                      color="success"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={item.soLuongNhan}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      disabled={item.isFull}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Lý do thiếu..."
                      value={item.ghiChu}
                      onChange={(e) => handleGhiChuChange(idx, e.target.value)}
                      disabled={item.isFull}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {items.some(i => !i.isFull) && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff4e5', borderRadius: 1, border: '1px solid #ffe2b9' }}>
            <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 'bold' }}>
              ⚠️ Cảnh báo: Bạn đang xác nhận nhận thiếu hàng. Đơn hàng sẽ được cập nhật trạng thái "Đang giao (Thiếu hàng)".
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Hủy bỏ</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          sx={{ px: 4 }}
        >
          Xác nhận nhận hàng & Đi giao
        </Button>
      </DialogActions>
    </Dialog>
  );
}
