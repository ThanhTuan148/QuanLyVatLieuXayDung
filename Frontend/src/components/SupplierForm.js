import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Switch } from '@mui/material';

function SupplierForm({ open, onClose, onSaved, initial = {} }) {
  const [form, setForm] = useState({
    maNCC: '', tenNCC: '', nguoiLienHe: '', sdt: '', email: '', diaChi: '', thanhPho: '', maSoThue: '', trangThai: true,
  });
  const [errors, setErrors] = useState({ tenNCC: '', nguoiLienHe: '', sdt: '', email: '', diaChi: '' });

  useEffect(() => {
    setErrors({ tenNCC: '', nguoiLienHe: '', sdt: '', email: '', diaChi: '' });
    if (initial && Object.keys(initial).length) {
      setForm({
        maNCC: initial.maNCC || '', tenNCC: initial.tenNCC || '', nguoiLienHe: initial.nguoiLienHe || '',
        sdt: initial.sdt || '', email: initial.email || '', diaChi: initial.diaChi || '',
        thanhPho: initial.thanhPho || '', maSoThue: initial.maSoThue || '', trangThai: initial.trangThai ?? true,
      });
    } else {
      setForm({
        maNCC: '', tenNCC: '', nguoiLienHe: '', sdt: '', email: '', diaChi: '', thanhPho: '', maSoThue: '', trangThai: true,
      });
    }
  }, [initial, open]);

  const handleChange = (e) => { 
    const { name, value } = e.target; 
    setForm((s) => ({ ...s, [name]: value })); 
    if (errors[name]) {
      setErrors((err) => ({ ...err, [name]: '' }));
    }
  };

  const handleSubmit = () => {
    const newErrors = { tenNCC: '', nguoiLienHe: '', sdt: '', email: '', diaChi: '' };
    let hasError = false;

    if (!form.tenNCC || !form.tenNCC.trim()) {
      newErrors.tenNCC = "Tên nhà cung cấp không được bỏ trống!";
      hasError = true;
    }
    if (!form.nguoiLienHe || !form.nguoiLienHe.trim()) {
      newErrors.nguoiLienHe = "Người liên hệ không được bỏ trống!";
      hasError = true;
    }
    if (!form.sdt || !form.sdt.trim()) {
      newErrors.sdt = "Số điện thoại không được bỏ trống!";
      hasError = true;
    } else {
      const sdtRegex = /^[0-9]{10}$/;
      if (!sdtRegex.test(form.sdt.trim())) {
        newErrors.sdt = "Số điện thoại phải có đúng 10 chữ số!";
        hasError = true;
      }
    }
    if (!form.email || !form.email.trim()) {
      newErrors.email = "Email không được bỏ trống!";
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim()) || !form.email.includes('@')) {
        newErrors.email = "Email không đúng định dạng (phải chứa ký tự @ và tên miền)!";
        hasError = true;
      }
    }
    if (!form.diaChi || !form.diaChi.trim()) {
      newErrors.diaChi = "Địa chỉ không được bỏ trống!";
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

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
        <TextField 
          fullWidth margin="normal" label="Tên NCC *" name="tenNCC" value={form.tenNCC} 
          error={Boolean(errors.tenNCC)} helperText={errors.tenNCC} onChange={handleChange} 
        />
        <TextField 
          fullWidth margin="normal" label="Người Liên Hệ *" name="nguoiLienHe" value={form.nguoiLienHe} 
          error={Boolean(errors.nguoiLienHe)} helperText={errors.nguoiLienHe} onChange={handleChange} 
        />
        <TextField 
          fullWidth margin="normal" label="SĐT *" name="sdt" value={form.sdt} 
          error={Boolean(errors.sdt)} helperText={errors.sdt} onChange={handleChange} 
        />
        <TextField 
          fullWidth margin="normal" label="Email *" name="email" value={form.email} 
          error={Boolean(errors.email)} helperText={errors.email} onChange={handleChange} 
        />
        <TextField 
          fullWidth margin="normal" label="Địa Chỉ *" name="diaChi" value={form.diaChi} 
          error={Boolean(errors.diaChi)} helperText={errors.diaChi} onChange={handleChange} 
        />
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
