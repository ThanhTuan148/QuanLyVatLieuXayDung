import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

function InventoryForm({ open, onClose, onSaved, initial = {} }) {
  const [form, setForm] = useState({
    maKhoHang: '', maSanPham: '', soLuong: '', soLuongTon: '', viTri: '',
  });

  useEffect(() => {
    if (initial && Object.keys(initial).length) {
      setForm({
        maKhoHang: initial.maKhoHang || '', maSanPham: initial.maSanPham || '',
        soLuong: initial.soLuong || '', soLuongTon: initial.soLuongTon || '', viTri: initial.viTri || '',
      });
    }
  }, [initial, open]);

  const handleChange = (e) => { const { name, value } = e.target; setForm((s) => ({ ...s, [name]: value })); };

  const handleSubmit = () => {
    const payload = {
      MaKhoHang: parseInt(form.maKhoHang, 10) || 1, MaSanPham: parseInt(form.maSanPham, 10) || 0,
      SoLuong: parseInt(form.soLuong, 10) || 0, SoLuongTon: parseInt(form.soLuongTon, 10) || 0,
      ViTri: form.viTri,
    };
    onSaved(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial && initial.maCTKho ? 'Sửa Kho Hàng' : 'Thêm Kho Hàng'}</DialogTitle>
      <DialogContent dividers>
        <TextField fullWidth margin="normal" label="Mã Kho" name="maKhoHang" value={form.maKhoHang} onChange={handleChange} type="number" />
        <TextField fullWidth margin="normal" label="Mã Sản Phẩm" name="maSanPham" value={form.maSanPham} onChange={handleChange} type="number" />
        <TextField fullWidth margin="normal" label="Số Lượng" name="soLuong" value={form.soLuong} onChange={handleChange} type="number" />
        <TextField fullWidth margin="normal" label="Số Lượng Tồn" name="soLuongTon" value={form.soLuongTon} onChange={handleChange} type="number" />
        <TextField fullWidth margin="normal" label="Vị Trí" name="viTri" value={form.viTri} onChange={handleChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

export default InventoryForm;
