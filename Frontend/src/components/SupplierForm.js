import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Switch } from '@mui/material';

function SupplierForm({ open, onClose, onSaved, initial = {} }) {
  const [form, setForm] = useState({
    maNCC: '', tenNCC: '', nguoiLienHe: '', sdt: '', email: '', diaChi: '', thanhPho: '', maSoThue: '', trangThai: true,
  });

  useEffect(() => {
    if (initial && Object.keys(initial).length) {
      setForm({
        maNCC: initial.maNCC || '', tenNCC: initial.tenNCC || '', nguoiLienHe: initial.nguoiLienHe || '',
        sdt: initial.sdt || '', email: initial.email || '', diaChi: initial.diaChi || '',
        thanhPho: initial.thanhPho || '', maSoThue: initial.maSoThue || '', trangThai: initial.trangThai ?? true,
      });
    }
  }, [initial, open]);

  const handleChange = (e) => { const { name, value } = e.target; setForm((s) => ({ ...s, [name]: value })); };

  const handleSubmit = () => {
    const payload = {
      MaNCC: form.maNCC, TenNCC: form.tenNCC, NguoiLienHe: form.nguoiLienHe, Sdt: form.sdt,
      Email: form.email, DiaChi: form.diaChi, ThanhPho: form.thanhPho, MaSoThue: form.maSoThue,
      TrangThai: !!form.trangThai,
    };
    onSaved(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial && initial.maNhaCungCap ? 'Sửa NCC' : 'Thêm NCC'}</DialogTitle>
      <DialogContent dividers>
        <TextField fullWidth margin="normal" label="Tên NCC" name="tenNCC" value={form.tenNCC} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Người Liên Hệ" name="nguoiLienHe" value={form.nguoiLienHe} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="SĐT" name="sdt" value={form.sdt} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Email" name="email" value={form.email} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Địa Chỉ" name="diaChi" value={form.diaChi} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Thành Phố" name="thanhPho" value={form.thanhPho} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Mã Số Thuế" name="maSoThue" value={form.maSoThue} onChange={handleChange} />
        <FormControlLabel control={<Switch checked={form.trangThai} onChange={(e) => setForm((s) => ({ ...s, trangThai: e.target.checked }))} />} label="Hoạt động" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SupplierForm;
