import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Switch, Grid } from '@mui/material';

function CustomerForm({ open, onClose, onSaved, initial = {} }) {
  const [form, setForm] = useState({
    maKH: '', tenKH: '', sdt: '', email: '', diaChi: '', loaiKH: '', maSoThue: '', nguoiLienHe: '', trangThai: true,
  });
  const [errors, setErrors] = useState({ tenKH: '', sdt: '', email: '', diaChi: '' });

  useEffect(() => {
    setErrors({ tenKH: '', sdt: '', email: '', diaChi: '' });
    if (initial && Object.keys(initial).length) {
      setForm({
        maKH: initial.maKH || '', tenKH: initial.tenKH || '', sdt: initial.sdt || '', email: initial.email || '',
        diaChi: initial.diaChi || '', loaiKH: initial.loaiKH || '', maSoThue: initial.maSoThue || '',
        nguoiLienHe: initial.nguoiLienHe || '', trangThai: initial.trangThai ?? true,
      });
    } else {
      setForm({
        maKH: '', tenKH: '', sdt: '', email: '', diaChi: '', loaiKH: '', maSoThue: '', nguoiLienHe: '', trangThai: true,
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
    const newErrors = { tenKH: '', sdt: '', email: '', diaChi: '' };
    let hasError = false;

    if (!form.tenKH || !form.tenKH.trim()) {
      newErrors.tenKH = "Tên khách hàng không được bỏ trống!";
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
      MaKH: form.maKH, TenKH: form.tenKH, Sdt: form.sdt, Email: form.email,
      DiaChi: form.diaChi, LoaiKH: '', MaSoThue: '', NguoiLienHe: '',
      TrangThai: !!form.trangThai,
    };
    onSaved(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial && initial.maKhachHang ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng'}</DialogTitle>
      <DialogContent dividers>
        <TextField 
          fullWidth margin="normal" label="Tên Khách Hàng *" name="tenKH" value={form.tenKH} 
          error={Boolean(errors.tenKH)} helperText={errors.tenKH} onChange={handleChange} 
        />
        <TextField 
          fullWidth margin="normal" label="SĐT (Tài khoản đăng nhập) *" name="sdt" value={form.sdt} 
          error={Boolean(errors.sdt)} helperText={errors.sdt || "SĐT dùng làm tên đăng nhập, mật khẩu mặc định là 123456"} onChange={handleChange} 
          required 
        />
        <TextField 
          fullWidth margin="normal" label="Email *" name="email" value={form.email} 
          error={Boolean(errors.email)} helperText={errors.email} onChange={handleChange} 
        />
        <TextField 
          fullWidth margin="normal" label="Địa Chỉ *" name="diaChi" value={form.diaChi} 
          error={Boolean(errors.diaChi)} helperText={errors.diaChi} onChange={handleChange} 
        />
        

        {initial && initial.maKhachHang && (
          <Grid container spacing={2} sx={{ mt: 1, mb: 1, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Hạng thành viên" value={initial.hangThanhVien || 'Đồng'} InputProps={{ readOnly: true }} size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Tổng chi tiêu" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(initial.tongChiTieu || 0)} InputProps={{ readOnly: true }} size="small" />
            </Grid>
          </Grid>
        )}

        <FormControlLabel control={<Switch checked={form.trangThai} onChange={(e) => setForm((s) => ({ ...s, trangThai: e.target.checked }))} />} label="Hoạt động" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CustomerForm;
