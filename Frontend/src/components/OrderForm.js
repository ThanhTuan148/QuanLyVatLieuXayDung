import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, 
  Select, MenuItem, FormControl, InputLabel, Grid, Box, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Autocomplete, Paper, Divider, InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import productService from '../services/productService';
import customerService from '../services/customerService';

function OrderForm({ open, onClose, onSaved, initial = {} }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({
    maHD: '', maKhachHang: '', ngayLap: new Date().toISOString().slice(0, 16), 
    trangThai: 'Chờ xử lý', pttt: 'Tiền mặt', ghiChu: '', 
    maNhanVien: localStorage.getItem('maNhanVien') || 1,
    tongTien: 0, giamGia: 0, thanhToan: 0, items: []
  });

  useEffect(() => {
    if (open) {
      fetchData();
      if (initial && initial.maHoaDon) {
        setForm({
          ...initial,
          maKhachHang: initial.maKhachHang || '',
          maNhanVien: initial.maNhanVien || '',
          items: initial.chiTiet || []
        });
      } else {
        setForm({
          maHD: 'Sẽ tự động tạo',
          maKhachHang: '',
          ngayLap: new Date().toISOString().slice(0, 16),
          trangThai: 'Chờ xử lý',
          pttt: 'Tiền mặt',
          ghiChu: '',
          maNhanVien: localStorage.getItem('maNhanVien') || '',
          tongTien: 0,
          giamGia: 0,
          thanhToan: 0,
          items: []
        });
      }
    }
  }, [open, initial]);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        productService.getAllProducts(),
        customerService.getAllCustomers()
      ]);
      setProducts(pRes.data || []);
      setCustomers(cRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    const exists = form.items.find(i => i.maSanPham === selectedProduct.maSanPham);
    if (exists) {
      updateItem(selectedProduct.maSanPham, 'soLuong', exists.soLuong + 1);
    } else {
      const newItem = {
        maSanPham: selectedProduct.maSanPham,
        tenSanPham: selectedProduct.tenSP,
        soLuong: 1,
        donGia: selectedProduct.giaBan,
        giamGia: 0,
        thanhTien: selectedProduct.giaBan
      };
      setForm(s => ({ 
        ...s, 
        items: [...s.items, newItem] 
      }));
    }
    setSelectedProduct(null);
  };

  const updateItem = (id, field, value) => {
    setForm(s => {
      const newItems = s.items.map(item => {
        if (item.maSanPham === id) {
          const updated = { ...item, [field]: value };
          updated.thanhTien = (updated.soLuong * updated.donGia) - updated.giamGia;
          return updated;
        }
        return item;
      });
      return { ...s, items: newItems };
    });
  };

  const removeItem = (id) => {
    setForm(s => ({
      ...s,
      items: s.items.filter(i => i.maSanPham !== id)
    }));
  };

  // Recalculate total when items or discount changes
  useEffect(() => {
    const subtotal = form.items.reduce((sum, item) => sum + item.thanhTien, 0);
    const total = subtotal - (Number(form.giamGia) || 0);
    setForm(s => ({ ...s, tongTien: total > 0 ? total : 0 }));
  }, [form.items, form.giamGia]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.maKhachHang) return alert("Vui lòng chọn khách hàng");
    if (form.items.length === 0) return alert("Vui lòng thêm ít nhất 1 sản phẩm");
    
    const payload = {
      NgayLap: form.ngayLap,
      NgayGiao: form.ngayGiao || null,
      TongTien: parseFloat(form.tongTien) || 0,
      ThanhToan: parseFloat(form.thanhToan) || 0,
      GiamGia: parseFloat(form.giamGia) || 0,
      PTTT: form.pttt,
      TrangThai: form.trangThai,
      GhiChu: form.ghiChu,
      MaKhachHang: parseInt(form.maKhachHang) || null,
      MaNhanVien: parseInt(form.maNhanVien) || null,
      MaCoupon: parseInt(form.maCoupon) || null,
      Items: (form.items || []).map(i => ({
        MaSanPham: parseInt(i.maSanPham),
        SoLuong: parseInt(i.soLuong),
        DonGia: parseFloat(i.donGia),
        GiamGia: parseFloat(i.giamGia) || 0,
        DiaChiGiaoHang: i.diaChiGiaoHang || null,
        TenNguoiNhan: i.tenNguoiNhan || null,
        SdtNguoiNhan: i.sdtNguoiNhan || null
      }))
    };
    console.log("Order Payload:", payload);
    onSaved(payload);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa' }}>
        {initial?.maHoaDon ? '📝 Chỉnh Sửa Đơn Hàng' : '🆕 Tạo Đơn Hàng Mới'}
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Section 1: Header Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#666' }}>THÔNG TIN CHUNG</Typography>
            <TextField fullWidth size="small" margin="dense" label="Mã HĐ" name="maHD" value={form.maHD} onChange={handleChange} disabled />
            
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => option.tenKH || ''}
              value={customers.find(c => c.maKhachHang === form.maKhachHang) || null}
              onChange={(e, val) => setForm(s => ({ ...s, maKhachHang: val?.maKhachHang || '' }))}
              renderInput={(params) => <TextField {...params} label="Khách hàng" margin="dense" size="small" required />}
              sx={{ mt: 1 }}
            />

            <TextField 
              fullWidth size="small" margin="dense" label="Ngày Lập" name="ngayLap" 
              type="datetime-local" value={form.ngayLap} onChange={handleChange}
              InputLabelProps={{ shrink: true }} 
            />

            <FormControl fullWidth size="small" margin="dense">
              <InputLabel>Trạng Thái</InputLabel>
              <Select name="trangThai" value={form.trangThai} onChange={handleChange}>
                <MenuItem value="Chờ xử lý">Chờ xử lý</MenuItem>
                <MenuItem value="Đã xác nhận">Đã xác nhận</MenuItem>
                <MenuItem value="Đang giao">Đang giao</MenuItem>
                <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
                <MenuItem value="Đã hủy">Đã hủy</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" margin="dense">
              <InputLabel>PT Thanh Toán</InputLabel>
              <Select name="pttt" value={form.pttt} onChange={handleChange}>
                <MenuItem value="Tiền mặt">Tiền mặt</MenuItem>
                <MenuItem value="Chuyển khoản">Chuyển khoản</MenuItem>
                <MenuItem value="Công nợ">Công nợ (Thanh toán sau)</MenuItem>
              </Select>
            </FormControl>

            <TextField fullWidth size="small" margin="dense" label="Ghi Chú" name="ghiChu" value={form.ghiChu} onChange={handleChange} multiline rows={2} />
          </Grid>

          {/* Section 2: Product Items */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', flexGrow: 1 }}>DANH SÁCH SẢN PHẨM</Typography>
              <Autocomplete
                size="small"
                options={products}
                getOptionLabel={(option) => `${option.tenSP} (${option.soLuongTon})`}
                value={selectedProduct}
                onChange={(e, val) => setSelectedProduct(val)}
                renderInput={(params) => <TextField {...params} label="Tìm sản phẩm..." sx={{ width: 250 }} />}
              />
              <IconButton color="primary" onClick={handleAddItem} disabled={!selectedProduct}>
                <AddCircleIcon fontSize="large" />
              </IconButton>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ minHeight: 250, maxHeight: 350, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tên Sản Phẩm</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 80 }}>SL</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Đơn Giá</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Thành Tiền</TableCell>
                    <TableCell sx={{ width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5, color: '#999 italic' }}>Chưa có sản phẩm nào được chọn</TableCell>
                    </TableRow>
                  ) : form.items.map((item) => (
                    <TableRow key={item.maSanPham}>
                      <TableCell>{item.tenSanPham}</TableCell>
                      <TableCell>
                        <TextField 
                          size="small" type="number" variant="standard" 
                          value={item.soLuong} 
                          onChange={(e) => updateItem(item.maSanPham, 'soLuong', parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.donGia)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(item.thanhTien)}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => removeItem(item.maSanPham)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals Section */}
            <Box sx={{ mt: 2, p: 2, bgcolor: '#fcfcfc', border: '1px solid #eee', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth size="small" label="Giảm giá đơn hàng" name="giamGia" 
                    type="number" value={form.giamGia} onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                  />
                  <Box sx={{ mt: 2 }} />
                  <TextField 
                    fullWidth size="small" label="Khách đã thanh toán" name="thanhToan" 
                    type="number" value={form.thanhToan} onChange={handleChange}
                    helperText="Nếu trả thiếu, hệ thống sẽ tự tạo công nợ."
                    InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                   <Typography variant="body2" color="textSecondary">Tổng cộng:</Typography>
                   <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#11998e' }}>
                     {formatCurrency(form.tongTien)}
                   </Typography>
                   <Divider sx={{ my: 1 }} />
                   {form.tongTien - form.thanhToan > 0 && (
                     <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                       * Sẽ phát sinh nợ: {formatCurrency(form.tongTien - form.thanhToan)}
                     </Typography>
                   )}
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', px: 4, fontWeight: 'bold' }}
        >
          {initial?.maHoaDon ? 'Cập nhật hóa đơn' : 'Hoàn tất & Lưu đơn'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default OrderForm;
