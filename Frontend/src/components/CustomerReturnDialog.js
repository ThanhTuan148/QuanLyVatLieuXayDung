import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, TextField, CircularProgress
} from '@mui/material';
import api from '../services/api';
import authService from '../services/authService';

function CustomerReturnDialog({ open, onClose, order, onSaved }) {
  const [items, setItems] = useState([]);
  const [lyDo, setLyDo] = useState('');
  const [images, setImages] = useState([]); // Mảng các ảnh base64
  const [loai, setLoai] = useState('Trả hàng'); // 'Trả hàng' hoặc 'Đổi hàng'
  const [loiDo, setLoiDo] = useState('Cửa hàng'); // 'Cửa hàng' hoặc 'Khách hàng'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && order && order.chiTiet) {
      const initialItems = order.chiTiet.map(ct => ({
        maSanPham: ct.maSanPham || ct.MaSanPham,
        tenSanPham: ct.tenSanPham || ct.TenSanPham,
        soLuongMua: ct.soLuong || ct.SoLuong,
        donGia: ct.donGia || ct.DonGia,
        soLuongTra: 0,
        loai: 'Trả hàng'
      }));
      setItems(initialItems);
      setLyDo('');
      setImages([]);
      setLoai('Trả hàng');
    }
  }, [open, order]);

  const handleItemChange = (index, field, val) => {
    const newItems = [...items];
    if (field === 'soLuongTra') {
      const num = parseInt(val, 10);
      newItems[index].soLuongTra = isNaN(num) ? 0 : num;
    } else {
      newItems[index][field] = val;
    }
    setItems(newItems);
  };

  const handleBulkLoai = (type) => {
    setLoai(type);
    setItems(items.map(item => ({ ...item, loai: type })));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert('Chỉ được chọn tối đa 5 ảnh minh chứng.');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const returnItems = items.filter(i => i.soLuongTra > 0);
    if (returnItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để trả.');
      return;
    }
    if (!lyDo.trim()) {
      alert('Vui lòng nhập lý do đổi/trả.');
      return;
    }

    const user = authService.getUser();
    
    setLoading(true);
    try {
      const payload = {
        maHoaDon: order.maHoaDon || order.maHD, // need the actual ID
        maNhanVien: 1, // Default handler
        lyDo: lyDo,
        loiDo: loiDo,
        hinhAnhMinhChung: images.length > 0 ? JSON.stringify(images) : null,
        loai: loai,
        items: returnItems.map(i => ({
          maSanPham: i.maSanPham,
          soLuong: i.soLuongTra,
          donGia: i.donGia,
          loai: i.loai
        }))
      };

      // Since the API accepts an actual integer MaHoaDon, ensure we pass it correctly.
      // Customer order might have it as `maHoaDon`.
      await api.post('/returns/customer', payload);
      alert('Gửi yêu cầu đổi trả thành công! Cửa hàng sẽ liên hệ với bạn sớm nhất.');
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message || 'Không thể gửi yêu cầu'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Yêu cầu Đổi / Trả hàng</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          Lưu ý: Hàng hóa (như Gạch, Xi măng) phải còn nguyên đai nguyên kiện, chưa sử dụng.
        </Typography>

        <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666' }}>Chọn nhanh loại yêu cầu cho tất cả:</Typography>
          <Button 
            variant={loai === 'Trả hàng' ? 'contained' : 'outlined'} 
            color="error"
            size="small"
            onClick={() => handleBulkLoai('Trả hàng')}
            sx={{ px: 2, borderRadius: 2, textTransform: 'none' }}
          >
            TRẢ HÀNG (Hoàn tiền)
          </Button>
          <Button 
            variant={loai === 'Đổi hàng' ? 'contained' : 'outlined'} 
            color="primary"
            size="small"
            onClick={() => handleBulkLoai('Đổi hàng')}
            sx={{ px: 2, borderRadius: 2, textTransform: 'none' }}
          >
            ĐỔI HÀNG (Giao lại SP mới)
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Sản phẩm</TableCell>
                <TableCell align="center">SL Đã Mua</TableCell>
                <TableCell align="center">SL Trả Lại</TableCell>
                <TableCell align="center">Hình thức</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.tenSanPham}</Typography>
                    <Typography variant="caption" color="text.secondary">Giá: {item.donGia?.toLocaleString()}đ</Typography>
                  </TableCell>
                  <TableCell align="center">{item.soLuongMua}</TableCell>
                  <TableCell align="center">
                    <TextField 
                      type="number" 
                      size="small" 
                      inputProps={{ min: 0, max: item.soLuongMua }}
                      value={item.soLuongTra}
                      onChange={(e) => handleItemChange(index, 'soLuongTra', e.target.value)}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button 
                        size="small" 
                        variant={item.loai === 'Trả hàng' ? 'contained' : 'outlined'}
                        color="error"
                        onClick={() => handleItemChange(index, 'loai', 'Trả hàng')}
                        sx={{ fontSize: '10px', p: 0.5, minWidth: 40 }}
                      >
                        Trả
                      </Button>
                      <Button 
                        size="small" 
                        variant={item.loai === 'Đổi hàng' ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => handleItemChange(index, 'loai', 'Đổi hàng')}
                        sx={{ fontSize: '10px', p: 0.5, minWidth: 40 }}
                      >
                        Đổi
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TextField
          label="Lý do đổi trả cụ thể"
          fullWidth
          multiline
          rows={3}
          value={lyDo}
          onChange={(e) => setLyDo(e.target.value)}
          placeholder="Ví dụ: Hàng bị vỡ, sai màu sắc..."
          required
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Trách nhiệm / Nguyên nhân chính:</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant={loiDo === 'Cửa hàng' ? 'contained' : 'outlined'} 
              color="success"
              onClick={() => setLoiDo('Cửa hàng')}
              sx={{ flex: 1 }}
            >
              Lỗi do Cửa hàng (Hàng hỏng/sai)
            </Button>
            <Button 
              variant={loiDo === 'Khách hàng' ? 'contained' : 'outlined'} 
              color="warning"
              onClick={() => setLoiDo('Khách hàng')}
              sx={{ flex: 1 }}
            >
              Lỗi do Khách hàng (Đổi ý/Đặt nhầm)
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            * Nếu do lỗi khách hàng, phí vận chuyển đổi trả có thể sẽ do khách hàng chi trả.
          </Typography>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Hình ảnh minh chứng (không bắt buộc)</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              size="small"
              sx={{ height: 60, width: 100 }}
              disabled={images.length >= 5}
            >
              + Thêm ảnh
              <input type="file" hidden accept="image/*" multiple onChange={handleImageUpload} />
            </Button>
            
            {images.map((img, idx) => (
              <Box key={idx} sx={{ position: 'relative', border: '1px solid #ddd', p: 0.5, borderRadius: 1 }}>
                <img src={img} alt={`preview-${idx}`} style={{ height: 60, width: 60, objectFit: 'cover' }} />
                <Button 
                  size="small" 
                  color="error" 
                  onClick={() => removeImage(idx)}
                  sx={{ 
                    position: 'absolute', top: -10, right: -10, 
                    minWidth: 20, height: 20, borderRadius: '50%', 
                    bgcolor: '#fff', boxShadow: 1, p: 0 
                  }}
                >
                  ×
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Hủy</Button>
        <Button onClick={handleSubmit} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Gửi Yêu Cầu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CustomerReturnDialog;
