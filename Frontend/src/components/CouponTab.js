import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, LinearProgress, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import couponService from '../services/couponService';
import DataTable from './DataTable';
import { usePermissions } from '../contexts/PermissionContext';

const formatVND = (v) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

export default function CouponTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { permissions } = usePermissions();
  const canCreate = permissions?.promotions?.coTheTao ?? false;
  const canEdit = permissions?.promotions?.coTheSua ?? false;
  const canDelete = permissions?.promotions?.coTheXoa ?? false;

  const [form, setForm] = useState({
    code: '', loaiCoupon: 'PhanTram', giaTriGiam: '', donHangToiThieu: '', giamToiDa: '',
    ngayBatDau: '', ngayKetThuc: '', soLanDungToiDa: ''
  });

  const load = async () => {
    setLoading(true);
    try { const res = await couponService.getAll(); setCoupons(res.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleOpenForm = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({
        code: item.maApDung, loaiCoupon: item.loaiGiamGia, giaTriGiam: item.giaTriGiam,
        donHangToiThieu: item.donHangToiThieu, giamToiDa: item.giamToiDa || '',
        ngayBatDau: item.thoiGianBatDau ? new Date(item.thoiGianBatDau).toISOString().slice(0, 16) : '',
        ngayKetThuc: item.thoiGianKetThuc ? new Date(item.thoiGianKetThuc).toISOString().slice(0, 16) : '',
        soLanDungToiDa: item.soLuongToiDa || ''
      });

    } else {
      setEditing(null);
      setForm({ code: '', loaiCoupon: 'PhanTram', giaTriGiam: '', donHangToiThieu: '', giamToiDa: '', ngayBatDau: '', ngayKetThuc: '', soLanDungToiDa: '' });
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        LoaiKM: 'Coupon',
        TenKM: `Coupon ${form.code}`,
        MaApDung: form.code,
        LoaiGiamGia: form.loaiCoupon,
        GiaTriGiam: parseFloat(form.giaTriGiam) || 0,
        DonHangToiThieu: parseFloat(form.donHangToiThieu) || 0,
        GiamToiDa: form.giamToiDa ? parseFloat(form.giamToiDa) : null,
        SoLuongToiDa: form.soLanDungToiDa ? parseInt(form.soLanDungToiDa) : null,
        ThoiGianBatDau: new Date(form.ngayBatDau),
        ThoiGianKetThuc: new Date(form.ngayKetThuc),
        TrangThai: true
      };
      if (editing) await couponService.update(editing.maKhuyenMai, payload);
      else await couponService.create(payload);

      setFormOpen(false); load();
    } catch (e) { 
      const errMsg = e.response?.data?.message || 'Lưu thất bại';
      const errDetails = e.response?.data?.details ? `\nChi tiết: ${e.response.data.details}` : '';
      alert(`${errMsg}${errDetails}`); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa Coupon này?')) return;
    await couponService.delete(id); load();
  };

  const now = new Date();

  const columns = [
    { 
      field: 'maApDung', 
      headerName: 'Mã Code', 
      width: 150,
      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#11998e' }}>{params.value}</Typography>
    },
    {
      field: 'loaiGiamGia',
      headerName: 'Loại',
      width: 120,
      renderCell: (params) => <Chip label={params.value === 'PhanTram' ? 'Giảm %' : 'Giảm Tiền'} size="small" variant="outlined" color="primary" />
    },
    {
      field: 'giaTriGiam',
      headerName: 'Giá Trị',
      width: 120,
      renderCell: (params) => params.row.loaiGiamGia === 'PhanTram' ? `${params.value}%` : formatVND(params.value)
    },
    {
      field: 'donHangToiThieu',
      headerName: 'Đơn Tối Thiểu',
      width: 130,
      valueFormatter: (params) => formatVND(params.value)
    },
    {
      field: 'thoiHan',
      headerName: 'Hạn Dùng',
      width: 200,
      renderCell: (params) => (
        <Typography variant="caption">
          {new Date(params.row.thoiGianBatDau).toLocaleDateString()} - {new Date(params.row.thoiGianKetThuc).toLocaleDateString()}
        </Typography>
      )
    },
    {
      field: 'usage',
      headerName: 'Đã Dùng',
      width: 120,
      renderCell: (params) => `${params.row.soLuongDaDung} / ${params.row.soLuongToiDa || '∞'}`
    },
    {
      field: 'status',
      headerName: 'Trạng Thái',
      width: 130,
      renderCell: (params) => {
        const isActive = new Date(params.row.thoiGianKetThuc) > now;
        return <Chip label={isActive ? 'Hiệu lực' : 'Hết hạn'} size="small" color={isActive ? 'success' : 'default'} />;
      }
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {canEdit && <Button size="small" onClick={() => handleOpenForm(params.row)}>Sửa</Button>}
          {canDelete && <Button size="small" color="error" onClick={() => handleDelete(params.row.maKhuyenMai)}>Xóa</Button>}
          {!canEdit && !canDelete && <Typography variant="caption" color="textDisabled">Chỉ xem</Typography>}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>🎟️ Coupon Management</Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()} sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            Tạo Coupon
          </Button>
        )}
      </Box>

      <DataTable 
        rows={coupons}
        columns={columns}
        getRowId={(row) => row.maKhuyenMai}
        loading={loading}
        showDateFilter={false}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? '✏️ Sửa Coupon' : '🎟️ Tạo Coupon Mới'}</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth margin="dense" label="Mã Code (VD: SUMMER50)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <FormControl fullWidth margin="dense">
            <InputLabel>Loại Giảm Giá</InputLabel>
            <Select value={form.loaiCoupon} label="Loại Giảm Giá" onChange={e => setForm(f => ({ ...f, loaiCoupon: e.target.value }))}>
              <MenuItem value="PhanTram">Giảm theo %</MenuItem>
              <MenuItem value="SoTien">Giảm theo số tiền cố định</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth margin="dense" label="Giá Trị Giảm" type="number" value={form.giaTriGiam} onChange={e => setForm(f => ({ ...f, giaTriGiam: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField fullWidth margin="dense" label="Đơn Tối Thiểu" type="number" value={form.donHangToiThieu} onChange={e => setForm(f => ({ ...f, donHangToiThieu: e.target.value }))} /></Grid>
          </Grid>
          {form.loaiCoupon === 'PhanTram' && <TextField fullWidth margin="dense" label="Giảm Tối Đa (VND)" type="number" value={form.giamToiDa} onChange={e => setForm(f => ({ ...f, giamToiDa: e.target.value }))} />}
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth margin="dense" label="Bắt Đầu" type="datetime-local" value={form.ngayBatDau} onChange={e => setForm(f => ({ ...f, ngayBatDau: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField fullWidth margin="dense" label="Kết Thúc" type="datetime-local" value={form.ngayKetThuc} onChange={e => setForm(f => ({ ...f, ngayKetThuc: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
          <TextField fullWidth margin="dense" label="Tổng Lượt Dùng (để trống = ∞)" type="number" value={form.soLanDungToiDa} onChange={e => setForm(f => ({ ...f, soLanDungToiDa: e.target.value }))} />
        </DialogContent>
        <DialogActions><Button onClick={() => setFormOpen(false)}>Hủy</Button><Button variant="contained" onClick={handleSave}>Lưu Coupon</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
