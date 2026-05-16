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
      const initItems = outboundNote.chiTiet.map(item => {
        const remaining = item.soLuong - (item.soLuongThucNhan || 0);
        return {
          maSanPham: item.maSanPham,
          tenSanPham: item.tenSP || item.tenSanPham,
          soLuongYeuCau: item.soLuong,
          soLuongDaNhan: item.soLuongThucNhan || 0,
          soLuongConLai: remaining,
          soLuongNhan: remaining,
          isFull: true,
          ghiChu: ''
        };
      }).filter(item => item.soLuongConLai > 0);
      setItems(initItems);
    }
  }, [open, outboundNote]);

  const handleToggleFull = (index) => {
    const newItems = [...items];
    newItems[index].isFull = !newItems[index].isFull;
    if (newItems[index].isFull) {
      newItems[index].soLuongNhan = newItems[index].soLuongConLai;
    }
    setItems(newItems);
  };

  const handleQtyChange = (index, val) => {
    const newItems = [...items];
    let v = parseInt(val);
    if (isNaN(v)) v = 0;
    if (v > newItems[index].soLuongConLai) v = newItems[index].soLuongConLai;
    newItems[index].soLuongNhan = v;
    newItems[index].isFull = (v === newItems[index].soLuongConLai);
    setItems(newItems);
  };

  const handleGhiChuChange = (index, val) => {
    const newItems = [...items];
    newItems[index].ghiChu = val;
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (items.every(i => i.soLuongNhan <= 0)) {
        alert("Vui lòng nhập số lượng nhận của ít nhất một sản phẩm.");
        return;
    }
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
          {outboundNote?.trangThai === 'Đã nhận một phần' 
            ? 'Tiếp tục nhận số hàng còn thiếu từ kho.' 
            : 'Tài xế vui lòng kiểm tra kỹ số lượng hàng nhận từ kho trước khi xác nhận đi giao.'}
        </Alert>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Sản phẩm</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tổng yêu cầu</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Đã nhận</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Còn lại</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Nhận đủ</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>S.Lần này</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.tenSanPham}</TableCell>
                  <TableCell align="center">{item.soLuongYeuCau}</TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      {item.soLuongDaNhan}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      {item.soLuongConLai}
                    </Typography>
                  </TableCell>
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
                      sx={{ width: 70 }}
                      inputProps={{ min: 0, max: item.soLuongConLai }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="..."
                      value={item.ghiChu}
                      onChange={(e) => handleGhiChuChange(idx, e.target.value)}
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
