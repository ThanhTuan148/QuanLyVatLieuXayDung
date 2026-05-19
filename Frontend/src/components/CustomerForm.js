import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Switch, Grid } from '@mui/material';

function CustomerForm({ open, onClose, onSaved, initial = {} }) {
  const [form, setForm] = useState({
    maKH: '', tenKH: '', sdt: '', email: '', diaChi: '', loaiKH: '', maSoThue: '', nguoiLienHe: '', trangThai: true,
  });

  useEffect(() => {
    if (initial && Object.keys(initial).length) {
      setForm({
        maKH: initial.maKH || '', tenKH: initial.tenKH || '', sdt: initial.sdt || '', email: initial.email || '',
        diaChi: initial.diaChi || '', loaiKH: initial.loaiKH || '', maSoThue: initial.maSoThue || '',
        nguoiLienHe: initial.nguoiLienHe || '', trangThai: initial.trangThai ?? true,
      });
    }
  }, [initial, open]);

  const handleChange = (e) => { const { name, value } = e.target; setForm((s) => ({ ...s, [name]: value })); };

  const handleSubmit = () => {
    if (!form.sdt || !form.sdt.trim()) {
      alert("Vui lòng nhập Số điện thoại (SĐT sẽ dùng làm tên đăng nhập tài khoản của khách hàng).");
      return;
    }
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
        <TextField fullWidth margin="normal" label="Tên Khách Hàng" name="tenKH" value={form.tenKH} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="SĐT (Tài khoản đăng nhập)" name="sdt" value={form.sdt} onChange={handleChange} required helperText="SĐT dùng làm tên đăng nhập, mật khẩu mặc định là 123456" />
        <TextField fullWidth margin="normal" label="Email" name="email" value={form.email} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Địa Chỉ" name="diaChi" value={form.diaChi} onChange={handleChange} />
        

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
