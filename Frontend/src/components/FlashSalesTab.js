import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Chip, LinearProgress, Card, CardContent, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, IconButton, FormControl, InputLabel, Select, MenuItem, Alert,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import flashSaleService from '../services/flashSaleService';
import api from '../services/api';
import DataTable from './DataTable';

const formatVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

// ─── Dialog Tạo / Sửa FlashSale ─────────────────────────────
function FlashSaleFormDialog({ open, onClose, onSaved, editing }) {
  const [tabIndex, setTabIndex] = useState(0);
  const [form, setForm] = useState({ tieuDe: '', moTa: '', thoiGianBatDau: '', thoiGianKetThuc: '', trangThai: true });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkSettings, setBulkSettings] = useState({ maLoaiSP: '', kieuGiam: 'phan_tram', phanTramGiam: 10, soTienGiam: 0, soLuongMoiSP: 100 });
  const [filterCat, setFilterCat] = useState('');
  const [searchProd, setSearchProd] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setTabIndex(0); setErr('');
      api.get('/products').then(r => setProducts(r.data || [])).catch(() => {});
      api.get('/categories').then(r => setCategories(r.data || [])).catch(() => {});
      if (editing) {
        const fmt = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
        setForm({ tieuDe: editing.tenKM || '', moTa: editing.moTa || '', thoiGianBatDau: fmt(editing.thoiGianBatDau), thoiGianKetThuc: fmt(editing.thoiGianKetThuc), trangThai: editing.trangThai ?? true });
        setSelectedItems((editing.targets || []).map(ct => ({
          maSanPham: ct.maSanPham, tenSP: ct.tenSanPham, giaBan: ct.giaBan,
          hinhAnh: ct.hinhAnh,
          kieuGiam: 'gia_truc_tiep',
          phanTramGiam: 0, giaKhuyenMai: ct.giaKhuyenMai, soTienGiam: 0, soLuong: 100,
        })));

      } else {
        setForm({ tieuDe: '', moTa: '', thoiGianBatDau: '', thoiGianKetThuc: '', trangThai: true });
        setSelectedItems([]);
      }
    }
  }, [open, editing]);

  const filteredProducts = products.filter(p => {
    const matchCat = !filterCat || p.maLoaiSP === parseInt(filterCat);
    const matchSearch = !searchProd || (p.tenSP || '').toLowerCase().includes(searchProd.toLowerCase()) || (p.maSP || '').toLowerCase().includes(searchProd.toLowerCase());
    return matchCat && matchSearch;
  });

  const isSelected = (id) => selectedItems.some(s => s.maSanPham === id);

  const toggleProduct = (p) => {
    if (isSelected(p.maSanPham)) {
      setSelectedItems(prev => prev.filter(s => s.maSanPham !== p.maSanPham));
    } else {
      setSelectedItems(prev => [...prev, {
        maSanPham: p.maSanPham, tenSP: p.tenSP, maSP: p.maSP,
        giaBan: p.giaBan, hinhAnh: p.hinhAnh, tenLoai: p.tenLoai,
        kieuGiam: 'phan_tram', phanTramGiam: 10, soTienGiam: 0, giaKhuyenMai: 0, soLuong: 100,
      }]);
    }
  };

  const updateItem = (idx, field, value) => {
    setSelectedItems(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const applyBulkToSelected = () => {
    setSelectedItems(prev => prev.map(s => ({
      ...s,
      kieuGiam: bulkSettings.kieuGiam,
      phanTramGiam: bulkSettings.kieuGiam === 'phan_tram' ? parseFloat(bulkSettings.phanTramGiam) : s.phanTramGiam,
      soTienGiam: bulkSettings.kieuGiam === 'so_tien' ? parseFloat(bulkSettings.soTienGiam) : s.soTienGiam,
      soLuong: parseInt(bulkSettings.soLuongMoiSP) || 100,
    })));
  };

  const handleSave = async () => {
    if (!form.tieuDe) { setErr('Vui lòng nhập tiêu đề'); return; }
    if (!form.thoiGianBatDau || !form.thoiGianKetThuc) { setErr('Vui lòng nhập thời gian'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        LoaiKM: 'GiaSoc',
        TenKM: form.tieuDe, MoTa: form.moTa,
        ThoiGianBatDau: new Date(form.thoiGianBatDau).toISOString(),
        ThoiGianKetThuc: new Date(form.thoiGianKetThuc).toISOString(),
        TrangThai: form.trangThai,
        DoiTuongs: selectedItems.map(s => ({
          MaSanPham: s.maSanPham,
          GiaKhuyenMai: s.kieuGiam === 'gia_truc_tiep' ? parseFloat(s.giaKhuyenMai) : (s.kieuGiam === 'phan_tram' ? s.giaBan * (1 - s.phanTramGiam/100) : s.giaBan - s.soTienGiam)
        })),
      };
      if (editing) await flashSaleService.updateSale(editing.maKhuyenMai, payload);
      else await flashSaleService.createSale(payload);
      onSaved(); onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lỗi khi lưu');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { height: '80vh' } }}>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', fontWeight: 'bold' }}>
        {editing ? '✏️ Sửa Flash Sale' : '⚡ Tạo Flash Sale Mới'}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="📝 Thông Tin Cơ Bản" />
          <Tab label={`🛒 Chọn Sản Phẩm (${selectedItems.length})`} />
          <Tab label="⚙️ Cài Đặt Giảm Giá" disabled={selectedItems.length === 0} />
        </Tabs>
        {tabIndex === 0 && (
          <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            <TextField fullWidth margin="normal" label="Tiêu Đề Flash Sale *" value={form.tieuDe}
              onChange={e => setForm(f => ({ ...f, tieuDe: e.target.value }))} />
            <TextField fullWidth margin="normal" label="Mô Tả" value={form.moTa}
              onChange={e => setForm(f => ({ ...f, moTa: e.target.value }))} multiline rows={2} />
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}><TextField fullWidth label="⏰ Bắt Đầu *" type="datetime-local" value={form.thoiGianBatDau} onChange={e => setForm(f => ({ ...f, thoiGianBatDau: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="⏰ Kết Thúc *" type="datetime-local" value={form.thoiGianKetThuc} onChange={e => setForm(f => ({ ...f, thoiGianKetThuc: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={form.trangThai} onChange={e => setForm(f => ({ ...f, trangThai: e.target.checked }))} />} label="Kích hoạt ngay" />
          </Box>
        )}
        {tabIndex === 1 && (
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Box sx={{ width: '55%', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1.5, borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <Grid container spacing={1}>
                  <Grid item xs={5}><FormControl size="small" fullWidth><InputLabel>Loại SP</InputLabel><Select value={filterCat} label="Loại SP" onChange={e => setFilterCat(e.target.value)}><MenuItem value="">Tất cả</MenuItem>{categories.map(c => <MenuItem key={c.maLoaiSanPham} value={c.maLoaiSanPham}>{c.tenLoai}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={7}><TextField size="small" fullWidth placeholder="Tìm..." value={searchProd} onChange={e => setSearchProd(e.target.value)} /></Grid>
                  <Grid item xs={12} sx={{ pt: '4px !important', display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => {
                      const toAdd = filteredProducts.filter(p => !isSelected(p.maSanPham));
                      setSelectedItems(prev => [...prev, ...toAdd.map(p => ({
                        maSanPham: p.maSanPham, tenSP: p.tenSP, maSP: p.maSP,
                        giaBan: p.giaBan, hinhAnh: p.hinhAnh, tenLoai: p.tenLoai,
                        kieuGiam: 'phan_tram', phanTramGiam: 10, soTienGiam: 0, giaKhuyenMai: 0, soLuong: 100,
                      }))]);
                    }} sx={{ fontSize: '0.7rem', py: 0.3 }}>
                      Chọn tất cả ({filteredProducts.length})
                    </Button>
                    <Button size="small" color="inherit" onClick={() => setSelectedItems([])}
                      sx={{ fontSize: '0.7rem', py: 0.3 }}>Bỏ chọn hết</Button>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ overflowY: 'auto', flex: 1 }}>
                {filteredProducts.map(p => (
                  <Box key={p.maSanPham} onClick={() => toggleProduct(p)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, cursor: 'pointer', borderBottom: '1px solid #f5f5f5', background: isSelected(p.maSanPham) ? '#f0f4ff' : 'white' }}>
                    <Box sx={{ flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 500 }}>{p.tenSP}</Typography><Typography variant="caption" color="textSecondary">{formatVND(p.giaBan)}</Typography></Box>
                    <Chip label={isSelected(p.maSanPham) ? '✓' : '+'} size="small" color={isSelected(p.maSanPham) ? 'primary' : 'default'} />
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ width: '45%', overflowY: 'auto', p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>✅ Đã Chọn ({selectedItems.length})</Typography>
                {selectedItems.map((s, idx) => (
                  <Box key={s.maSanPham} sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, background: '#f9f9f9', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ flex: 1 }}>{s.tenSP}</Typography>
                    <IconButton size="small" color="error" onClick={() => setSelectedItems(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                ))}
            </Box>
          </Box>
        )}
        {tabIndex === 2 && (
          <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
              <Paper sx={{ p: 2, mb: 2, background: '#f8f0ff' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>🔧 Áp dụng hàng loạt</Typography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={4}><FormControl size="small" fullWidth><Select value={bulkSettings.kieuGiam} onChange={e => setBulkSettings(s => ({ ...s, kieuGiam: e.target.value }))}><MenuItem value="phan_tram">Giảm %</MenuItem><MenuItem value="so_tien">Giảm tiền</MenuItem></Select></FormControl></Grid>
                  <Grid item xs={3}><TextField size="small" fullWidth type="number" value={bulkSettings.kieuGiam === 'phan_tram' ? bulkSettings.phanTramGiam : bulkSettings.soTienGiam} onChange={e => setBulkSettings(s => ({ ...s, [s.kieuGiam === 'phan_tram' ? 'phanTramGiam' : 'soTienGiam']: e.target.value }))} /></Grid>
                  <Grid item xs={3}><TextField size="small" fullWidth label="SL" type="number" value={bulkSettings.soLuongMoiSP} onChange={e => setBulkSettings(s => ({ ...s, soLuongMoiSP: e.target.value }))} /></Grid>
                  <Grid item xs={2}><Button variant="contained" size="small" onClick={applyBulkToSelected}>Gán</Button></Grid>
                </Grid>
              </Paper>
              {selectedItems.map((s, idx) => (
                <Paper key={s.maSanPham} sx={{ p: 1.5, mb: 1, borderLeft: '4px solid #f5576c' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>{s.tenSP} ({formatVND(s.giaBan)})</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}><Select size="small" fullWidth value={s.kieuGiam} onChange={e => updateItem(idx, 'kieuGiam', e.target.value)}><MenuItem value="phan_tram">%</MenuItem><MenuItem value="so_tien">VND</MenuItem><MenuItem value="gia_truc_tiep">Giá</MenuItem></Select></Grid>
                    <Grid item xs={4}><TextField size="small" fullWidth type="number" value={s.kieuGiam === 'phan_tram' ? s.phanTramGiam : s.kieuGiam === 'so_tien' ? s.soTienGiam : s.giaKhuyenMai} onChange={e => updateItem(idx, s.kieuGiam === 'phan_tram' ? 'phanTramGiam' : s.kieuGiam === 'so_tien' ? 'soTienGiam' : 'giaKhuyenMai', parseFloat(e.target.value) || 0)} /></Grid>
                    <Grid item xs={4}><TextField size="small" fullWidth label="SL" type="number" value={s.soLuong} onChange={e => updateItem(idx, 'soLuong', parseInt(e.target.value) || 100)} /></Grid>
                  </Grid>
                </Paper>
              ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Dialog Xem Sản Phẩm Flash Sale ─────────────────────────
function FlashSaleProductsDialog({ open, onClose, sale }) {
  if (!sale) return null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>⚡ Sản phẩm Flash Sale: {sale.tenKM}</DialogTitle>
      <DialogContent dividers>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#ffebee' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Giá Gốc</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Giá Sale</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(sale.targets || []).map(ct => (
                <TableRow key={ct.maSanPham}>
                  <TableCell>{ct.tenSanPham}</TableCell>
                  <TableCell>{formatVND(ct.giaBan)}</TableCell>
                  <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>{formatVND(ct.giaKhuyenMai)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}

export default function FlashSalesTab() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  
  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await flashSaleService.getAllSales(); setSales(Array.isArray(data) ? data : []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa Flash Sale này?')) return;
    await flashSaleService.deleteSale(id); load();
  };

  const now = new Date();

  const columns = [
    { 
      field: 'tenKM', 
      headerName: 'Tiêu Đề', 
      flex: 1.5, 
      minWidth: 200,
      renderCell: (params) => <Box sx={{ fontWeight: 'bold' }}>{params.value}</Box>
    },
    {
      field: 'targets',
      headerName: 'Sản phẩm',
      width: 120,
      renderCell: (params) => (
        <Button size="small" variant="outlined" color="error" onClick={() => setViewing(params.row)}>
          {params.value?.length || 0} SP
        </Button>
      )
    },
    {
      field: 'thoiHan',
      headerName: 'Thời Hạn',
      width: 250,
      renderCell: (params) => (
        <Typography variant="caption">
          {new Date(params.row.thoiGianBatDau).toLocaleString('vi-VN')} - {new Date(params.row.thoiGianKetThuc).toLocaleString('vi-VN')}
        </Typography>
      )
    },
    {
      field: 'trangThai',
      headerName: 'Trạng Thái',
      width: 130,
      renderCell: (params) => {
        const isDangChay = params.value && new Date(params.row.thoiGianBatDau) <= now && new Date(params.row.thoiGianKetThuc) >= now;
        return <Chip label={isDangChay ? 'Đang chạy' : 'Chờ/Kết thúc'} size="small" color={isDangChay ? 'error' : 'default'} />;
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
          <Button size="small" onClick={() => { setEditing(params.row); setFormOpen(true); }}>Sửa</Button>
          <Button size="small" color="error" onClick={() => handleDelete(params.row.maKhuyenMai)}>Xóa</Button>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>⚡ Flash Sales Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          Tạo Flash Sale
        </Button>
      </Box>

      <DataTable 
        rows={sales}
        columns={columns}
        getRowId={(row) => row.maKhuyenMai}
        loading={loading}
      />

      <FlashSaleFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} editing={editing} />
      <FlashSaleProductsDialog open={Boolean(viewing)} onClose={() => setViewing(null)} sale={viewing} />
    </Box>
  );
}
