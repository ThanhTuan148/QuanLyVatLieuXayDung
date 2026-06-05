import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, LinearProgress, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  Card, CardContent, Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import voucherUuDaiService from '../services/voucherUuDaiService';
import DataTable from './DataTable';
import { usePermissions } from '../contexts/PermissionContext';

const formatVND = (v) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

export default function UuDaiTab() {
  const [uudais, setUudais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mainViewMode, setMainViewMode] = useState('table');

  const { permissions } = usePermissions();
  const canCreate = permissions?.promotions?.coTheTao ?? false;
  const canEdit = permissions?.promotions?.coTheSua ?? false;
  const canDelete = permissions?.promotions?.coTheXoa ?? false;

  const [form, setForm] = useState({
    tenUuDai: '', code: '', loaiUuDai: 'PhanTram', giaTriGiam: '', donHangToiThieu: '', giamToiDa: '',
    ngayBatDau: '', ngayKetThuc: '', soLuongToiDa: ''
  });

  const load = async () => {
    setLoading(true);
    try { 
      const res = await voucherUuDaiService.getAll(); 
      setUudais(res.data || res || []); 
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleOpenForm = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({
        tenUuDai: item.tenKM, 
        code: item.maApDung, 
        loaiUuDai: item.loaiGiamGia, 
        giaTriGiam: item.giaTriGiam,
        donHangToiThieu: item.donHangToiThieu, 
        giamToiDa: item.giamToiDa || '',
        ngayBatDau: item.thoiGianBatDau ? new Date(item.thoiGianBatDau).toISOString().slice(0, 16) : '',
        ngayKetThuc: item.thoiGianKetThuc ? new Date(item.thoiGianKetThuc).toISOString().slice(0, 16) : '',
        soLuongToiDa: item.soLuongToiDa || ''
      });

    } else {
      setEditing(null);
      setForm({ 
        tenUuDai: '', code: '', loaiUuDai: 'PhanTram', giaTriGiam: '', 
        donHangToiThieu: '', giamToiDa: '', ngayBatDau: '', ngayKetThuc: '', soLuongToiDa: '' 
      });
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        LoaiKM: 'UuDai',
        TenKM: form.tenUuDai,
        MaApDung: form.code,
        LoaiGiamGia: form.loaiUuDai,
        GiaTriGiam: parseFloat(form.giaTriGiam) || 0,
        DonHangToiThieu: parseFloat(form.donHangToiThieu) || 0,
        GiamToiDa: form.giamToiDa ? parseFloat(form.giamToiDa) : null,
        SoLuongToiDa: form.soLuongToiDa ? parseInt(form.soLuongToiDa) : null,
        ThoiGianBatDau: new Date(form.ngayBatDau),
        ThoiGianKetThuc: new Date(form.ngayKetThuc),
        TrangThai: true
      };
      
      if (editing) {
        await voucherUuDaiService.update(editing.maKhuyenMai, payload);
      } else {
        await voucherUuDaiService.create(payload);
      }
      
      setFormOpen(false); 
      load();
    } catch (err) { 
      console.error(err);
      alert(err.response?.data?.message || 'Lưu thất bại'); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa Ưu đãi này?')) return;
    await voucherUuDaiService.delete(id); 
    load();
  };

  const now = new Date();

  const columns = [
    { 
      field: 'tenKM', 
      headerName: 'Tên Ưu Đãi', 
      flex: 1.2,
      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{params.value}</Typography>
    },
    { 
      field: 'maApDung', 
      headerName: 'Mã Code', 
      width: 130,
      renderCell: (params) => <Typography variant="body2" sx={{ color: '#DD2476', fontWeight: 'bold' }}>{params.value}</Typography>
    },
    {
      field: 'loaiGiamGia',
      headerName: 'Loại',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'PhanTram' ? 'Giảm %' : (params.value === 'Freeship' ? 'Freeship' : 'Giảm Tiền')} 
          size="small"
          color={params.value === 'Freeship' ? 'success' : 'primary'}
          variant="outlined"
        />
      )
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
      headerName: 'Thời Hạn',
      width: 180,
      renderCell: (params) => (
        <Typography variant="caption">
          {new Date(params.row.thoiGianBatDau).toLocaleDateString()} - {new Date(params.row.thoiGianKetThuc).toLocaleDateString()}
        </Typography>
      )
    },
    {
      field: 'usage',
      headerName: 'Đã Dùng',
      width: 110,
      renderCell: (params) => `${params.row.soLuongDaDung} / ${params.row.soLuongToiDa || '∞'}`
    },
    {
      field: 'status',
      headerName: 'Trạng Thái',
      width: 110,
      renderCell: (params) => {
        const isActive = new Date(params.row.thoiGianKetThuc) > now;
        return <Chip label={isActive ? 'Hiệu lực' : 'Hết hạn'} size="small" color={isActive ? 'success' : 'default'} />;
      }
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 130,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>🎁 Quản Lý Ưu Đãi Hệ Thống</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={mainViewMode}
            exclusive
            onChange={(e, nextMode) => { if (nextMode) setMainViewMode(nextMode); }}
            size="small"
            sx={{ mr: 1 }}
          >
            <ToggleButton value="table" sx={{ px: 2, fontWeight: 'bold' }}>
              <TableChartIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Bảng
            </ToggleButton>
            <ToggleButton value="card" sx={{ px: 2, fontWeight: 'bold' }}>
              <GridViewIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Card
            </ToggleButton>
          </ToggleButtonGroup>
          {canCreate && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpenForm()} 
              sx={{ background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)' }}
            >
              Tạo Ưu Đãi
            </Button>
          )}
        </Box>
      </Box>

      {mainViewMode === 'table' ? (
        <DataTable 
          rows={uudais}
          columns={columns}
          getRowId={(row) => row.maKhuyenMai}
          loading={loading}
          showDateFilter={false}
        />
      ) : (
        <Grid container spacing={3}>
          {uudais.map((item, idx) => {
            const isActive = new Date(item.thoiGianKetThuc) > now;
            return (
              <Grid item xs={12} sm={6} md={4} key={item.maKhuyenMai || idx}>
                <Card sx={{
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                          {item.tenKM}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                          Mã: <span style={{ color: '#DD2476', fontWeight: 'bold' }}>{item.maApDung}</span>
                        </Typography>
                      </Box>
                      <Chip label={isActive ? 'Hiệu lực' : 'Hết hạn'} size="small" color={isActive ? 'success' : 'default'} sx={{ fontWeight: 'bold' }} />
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">Loại & Giá Trị</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={item.loaiGiamGia === 'PhanTram' ? 'Giảm %' : (item.loaiGiamGia === 'Freeship' ? 'Freeship' : 'Giảm Tiền')} 
                            size="small"
                            color={item.loaiGiamGia === 'Freeship' ? 'success' : 'primary'}
                            variant="outlined"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.loaiGiamGia === 'PhanTram' ? `${item.giaTriGiam}%` : formatVND(item.giaTriGiam)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">Đơn Tối Thiểu</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatVND(item.donHangToiThieu)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary" display="block">Thời Hạn</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {new Date(item.thoiGianBatDau).toLocaleDateString()} - {new Date(item.thoiGianKetThuc).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary" display="block">Lượt Dùng</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.soLuongDaDung} / {item.soLuongToiDa || '∞'}
                          </Typography>
                          {item.soLuongToiDa && (
                            <LinearProgress 
                              variant="determinate" 
                              value={(item.soLuongDaDung / item.soLuongToiDa) * 100} 
                              sx={{ flex: 1, height: 6, borderRadius: 3, ml: 1 }}
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                      {canEdit && <Button size="small" variant="outlined" onClick={() => handleOpenForm(item)}>Sửa</Button>}
                      {canDelete && <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(item.maKhuyenMai)}>Xóa</Button>}
                      {!canEdit && !canDelete && <Typography variant="caption" color="textDisabled">Chỉ xem</Typography>}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? '✏️ Sửa Ưu Đãi' : '🎁 Tạo Ưu Đãi Mới'}</DialogTitle>
        <DialogContent dividers>
          <TextField 
            fullWidth margin="dense" label="Tên Ưu Đãi (VD: Tri ân khách hàng)" 
            value={form.tenUuDai} onChange={e => setForm(f => ({ ...f, tenUuDai: e.target.value }))} 
          />
          <TextField 
            fullWidth margin="dense" label="Mã Code (VD: TRIAN2024)" 
            value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} 
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Loại Ưu Đãi</InputLabel>
            <Select value={form.loaiUuDai} label="Loại Ưu Đãi" onChange={e => setForm(f => ({ ...f, loaiUuDai: e.target.value }))}>
              <MenuItem value="PhanTram">Giảm theo %</MenuItem>
              <MenuItem value="SoTien">Giảm tiền mặt</MenuItem>
              <MenuItem value="Freeship">Miễn phí vận chuyển (Freeship)</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField 
                fullWidth margin="dense" label={form.loaiUuDai === 'PhanTram' ? "Giá Trị (%)" : "Số Tiền Giảm"} 
                type="number" value={form.giaTriGiam} onChange={e => setForm(f => ({ ...f, giaTriGiam: e.target.value }))} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth margin="dense" label="Đơn Tối Thiểu" 
                type="number" value={form.donHangToiThieu} onChange={e => setForm(f => ({ ...f, donHangToiThieu: e.target.value }))} 
              />
            </Grid>
          </Grid>
          {form.loaiUuDai === 'PhanTram' && (
            <TextField 
              fullWidth margin="dense" label="Giảm Tối Đa (VND)" 
              type="number" value={form.giamToiDa} onChange={e => setForm(f => ({ ...f, giamToiDa: e.target.value }))} 
            />
          )}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField 
                fullWidth margin="dense" label="Ngày Bắt Đầu" type="datetime-local" 
                value={form.ngayBatDau} onChange={e => setForm(f => ({ ...f, ngayBatDau: e.target.value }))} 
                InputLabelProps={{ shrink: true }} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth margin="dense" label="Ngày Kết Thúc" type="datetime-local" 
                value={form.ngayKetThuc} onChange={e => setForm(f => ({ ...f, ngayKetThuc: e.target.value }))} 
                InputLabelProps={{ shrink: true }} 
              />
            </Grid>
          </Grid>
          <TextField 
            fullWidth margin="dense" label="Tổng Lượt Dùng (để trống = ∞)" 
            type="number" value={form.soLuongToiDa} onChange={e => setForm(f => ({ ...f, soLuongToiDa: e.target.value }))} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} color="secondary">Lưu Ưu Đãi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
