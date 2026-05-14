import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Autocomplete, Box, Typography, Divider 
} from '@mui/material';

function InventoryForm({ open, onClose, onSaved, initial = {}, warehouses = [], products = [] }) {
  const [form, setForm] = useState({
    maKhoHang: '',
    maSanPham: '',
    soLuong: 0,
    soLuongNhap: 0,
    soLuongTon: 0,
  });

  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (open) {
      if (initial && initial.maCTKho) {
        // Edit mode
        setForm({
          maKhoHang: initial.maKhoHang || '',
          maSanPham: initial.maSanPham || '',
          soLuong: initial.soLuong || 0,
          soLuongNhap: initial.soLuongNhap || 0,
          soLuongTon: initial.soLuongTon || 0,
        });
        
        // Cố gắng tìm object tương ứng từ danh sách warehouses/products
        const w = warehouses.find(wh => wh.maKhoHang === initial.maKhoHang);
        const p = products.find(prod => prod.maSanPham === initial.maSanPham);
        
        setSelectedWarehouse(w || null);
        setSelectedProduct(p || null);
      } else {
        // Add mode
        setForm({ maKhoHang: '', maSanPham: '', soLuong: 0, soLuongNhap: 0, soLuongTon: 0 });
        setSelectedWarehouse(null);
        setSelectedProduct(null);
      }
    }
  }, [open, initial?.maCTKho, warehouses, products]);

  const handleSubmit = () => {
    if (!form.maKhoHang || !form.maSanPham) {
      alert('Vui lòng chọn Kho và Sản phẩm');
      return;
    }
    const payload = {
      MaKhoHang: parseInt(form.maKhoHang, 10),
      MaSanPham: parseInt(form.maSanPham, 10),
      SoLuong: parseInt(form.soLuong, 10) || 0,
      SoLuongNhap: parseInt(form.soLuongNhap, 10) || 0,
      SoLuongTon: parseInt(form.soLuongTon, 10) || 0,
    };
    onSaved(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {initial && initial.maCTKho ? `Sửa Mục Kho (ID: ${initial.maCTKho})` : 'Thêm Mục Kho Mới'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          
          <Autocomplete
            options={warehouses}
            getOptionLabel={(option) => `${option.tenKho} (${option.loaiKho || 'Kho khác'})`}
            isOptionEqualToValue={(option, value) => option.maKhoHang === value.maKhoHang}
            value={selectedWarehouse}
            onChange={(event, newValue) => {
              setSelectedWarehouse(newValue);
              setForm(prev => ({ ...prev, maKhoHang: newValue ? newValue.maKhoHang : '' }));
            }}
            renderInput={(params) => <TextField {...params} label="Chọn Kho Hàng" required variant="outlined" />}
          />

          <Autocomplete
            options={products}
            getOptionLabel={(option) => `${option.tenSP} - [${option.maSP}]`}
            isOptionEqualToValue={(option, value) => option.maSanPham === value.maSanPham}
            value={selectedProduct}
            onChange={(event, newValue) => {
              setSelectedProduct(newValue);
              setForm(prev => ({ ...prev, maSanPham: newValue ? newValue.maSanPham : '' }));
            }}
            renderInput={(params) => <TextField {...params} label="Chọn Sản Phẩm" required variant="outlined" />}
          />

          <Divider>Thông tin số lượng</Divider>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              sx={{ flex: 1 }}
              label="SL Nhập"
              type="number"
              value={form.soLuongNhap}
              onChange={(e) => setForm(prev => ({ ...prev, soLuongNhap: e.target.value }))}
            />
            <TextField
              sx={{ flex: 1 }}
              label="SL Tồn"
              type="number"
              value={form.soLuongTon}
              onChange={(e) => setForm(prev => ({ ...prev, soLuongTon: e.target.value }))}
              color={form.soLuongTon <= (selectedProduct?.mucTonToiThieu || 0) ? "error" : "primary"}
            />
          </Box>

          {selectedProduct && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              Mức tồn tối thiểu (Báo động): <b>{selectedProduct.mucTonToiThieu || 0}</b> {selectedProduct.donViTinh}
            </Typography>
          )}


        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ minWidth: 100 }}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

export default InventoryForm;
