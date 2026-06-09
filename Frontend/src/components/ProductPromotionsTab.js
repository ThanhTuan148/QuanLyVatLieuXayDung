import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, LinearProgress, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  IconButton, Alert, Tab, Tabs, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import promotionService from '../services/promotionService';
import api from '../services/api';
import DataTable from './DataTable';
import { usePermissions } from '../contexts/PermissionContext';

const formatVND = (v) => v != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

// ─── Dialog Tạo / Sửa Khuyến Mãi ────────────────────────────
function PromotionFormDialog({ open, onClose, onSaved, editing }) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    tenKM: '', moTa: '', phanTramGiam: '', soTienGiam: '',
    thoiGianBatDau: '', thoiGianKetThuc: '', soLanToiDa: '', trangThai: true
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const fmt = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';

  useEffect(() => {
    if (open) {
      setTab(0); setErr(''); setSearch(''); setFilterCat('');
      api.get('/products').then(r => setProducts(r.data || [])).catch(() => {});
      api.get('/categories').then(r => setCategories(r.data || [])).catch(() => {});
      if (editing) {
        setForm({
          tenKM: editing.tenKM || '', moTa: editing.moTa || '',
          phanTramGiam: editing.loaiGiamGia === 'PhanTram' ? editing.giaTriGiam : '',
          soTienGiam: editing.loaiGiamGia === 'SoTien' ? editing.giaTriGiam : '',
          thoiGianBatDau: fmt(editing.thoiGianBatDau), thoiGianKetThuc: fmt(editing.thoiGianKetThuc),
          soLanToiDa: editing.soLuongToiDa || editing.soLanToiDa || '', trangThai: editing.trangThai ?? true,
          hangThanhVien: editing.hangThanhVien ? editing.hangThanhVien.split(',').map(s => s.trim()) : []
        });
        setSelectedIds((editing.targets || []).map(t => t.maSanPham));

      } else {
        setForm({ tenKM: '', moTa: '', phanTramGiam: '', soTienGiam: '', thoiGianBatDau: '', thoiGianKetThuc: '', soLanToiDa: '', trangThai: true });
        setSelectedIds([]);
      }
    }
  }, [open, editing]);

  const toggleProduct = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredProducts = products.filter(p => {
    const matchCat = !filterCat || p.maLoaiSP === parseInt(filterCat);
    const matchSearch = !search || p.tenSP?.toLowerCase().includes(search.toLowerCase()) || p.maSP?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const selectAll = () => setSelectedIds(filteredProducts.map(p => p.maSanPham));
  const clearAll  = () => setSelectedIds([]);

  const handleSave = async () => {
    if (!form.tenKM) { setErr('Vui lòng nhập tên khuyến mãi'); return; }
    if (selectedIds.length === 0) { setErr('Vui lòng chọn ít nhất 1 sản phẩm'); return; }
    if (!form.thoiGianBatDau || !form.thoiGianKetThuc) { setErr('Vui lòng nhập thời gian'); return; }
    if (!form.phanTramGiam && !form.soTienGiam) { setErr('Vui lòng nhập mức giảm giá'); return; }
    
    setSaving(true); setErr('');
    try {
      const payload = {
        LoaiKM: 'SanPham',
        TenKM: form.tenKM, MoTa: form.moTa,
        LoaiGiamGia: form.phanTramGiam ? 'PhanTram' : 'SoTien',
        GiaTriGiam: form.phanTramGiam ? parseFloat(form.phanTramGiam) : parseFloat(form.soTienGiam),
        DonHangToiThieu: 0,
        ThoiGianBatDau: new Date(form.thoiGianBatDau).toISOString(),
        ThoiGianKetThuc: new Date(form.thoiGianKetThuc).toISOString(),
        SoLuongToiDa: form.soLanToiDa ? parseInt(form.soLanToiDa) : null,
        TrangThai: form.trangThai,
        HangThanhVien: Array.isArray(form.hangThanhVien) && form.hangThanhVien.length > 0 ? form.hangThanhVien.join(',') : null,
        DoiTuongs: selectedIds.map(id => ({ MaSanPham: id })),
      };

      if (editing) await promotionService.update(editing.maKhuyenMai, payload);
      else await promotionService.create(payload);
      onSaved(); onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p.maSanPham));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { height: '75vh' } }}>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', color: '#333', fontWeight: 'bold' }}>
        {editing ? '✏️ Sửa Khuyến Mãi' : '🏷️ Tạo Khuyến Mãi Sản Phẩm'}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="📝 Thông Tin Chung" />
          <Tab label={`🛒 Chọn Sản Phẩm (${selectedIds.length})`} />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            <TextField fullWidth margin="dense" label="Tên Chương Trình *" value={form.tenKM}
              onChange={e => setForm(f => ({ ...f, tenKM: e.target.value }))} />
            <TextField fullWidth margin="dense" label="Mô Tả" value={form.moTa} multiline rows={2}
              onChange={e => setForm(f => ({ ...f, moTa: e.target.value }))} />
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <TextField fullWidth label="Giảm %" type="number" value={form.phanTramGiam}
                  onChange={e => setForm(f => ({ ...f, phanTramGiam: e.target.value }))}
                  helperText="Nhập % hoặc số tiền, không nhập cả hai" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Giảm Tiền Cố Định (VND)" type="number" value={form.soTienGiam}
                  onChange={e => setForm(f => ({ ...f, soTienGiam: e.target.value }))} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="⏰ Bắt Đầu *" type="datetime-local" value={form.thoiGianBatDau}
                  onChange={e => setForm(f => ({ ...f, thoiGianBatDau: e.target.value }))} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="⏰ Kết Thúc *" type="datetime-local" value={form.thoiGianKetThuc}
                  onChange={e => setForm(f => ({ ...f, thoiGianKetThuc: e.target.value }))} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                  <InputLabel>🏅 Hạng áp dụng (Chọn nhiều)</InputLabel>
                  <Select
                    multiple
                    value={Array.isArray(form.hangThanhVien) ? form.hangThanhVien : []}
                    label="🏅 Hạng áp dụng (Chọn nhiều)"
                    onChange={e => setForm(f => ({ ...f, hangThanhVien: e.target.value }))}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  >
                    {['Đồng', 'Bạc', 'Vàng', 'Kim Cương'].map((tier) => (
                      <MenuItem key={tier} value={tier}>
                        <Checkbox checked={(form.hangThanhVien || []).indexOf(tier) > -1} />
                        <ListItemText primary={tier} />
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>Bỏ trống nếu áp dụng cho mọi khách hàng</Typography>
                </FormControl>
              </Grid>
            </Grid>
            <FormControlLabel sx={{ mt: 1 }}
              control={<Switch checked={form.trangThai} onChange={e => setForm(f => ({ ...f, trangThai: e.target.checked }))} />}
              label="Kích hoạt ngay" />
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Box sx={{ width: '55%', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1.5, borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={5}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Loại SP</InputLabel>
                      <Select value={filterCat} label="Loại SP" onChange={e => setFilterCat(e.target.value)}>
                        <MenuItem value="">Tất cả</MenuItem>
                        {categories.map(c => (
                          <MenuItem key={c.maLoaiSanPham} value={c.maLoaiSanPham}>{c.tenLoai}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={7}>
                    <TextField size="small" fullWidth placeholder="Tìm sản phẩm..." value={search}
                      onChange={e => setSearch(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sx={{ pt: '4px !important', display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={selectAll}
                      sx={{ fontSize: '0.7rem', py: 0.3 }}>Chọn tất cả ({filteredProducts.length})</Button>
                    <Button size="small" color="inherit" onClick={clearAll}
                      sx={{ fontSize: '0.7rem', py: 0.3 }}>Bỏ chọn hết</Button>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ overflowY: 'auto', flex: 1 }}>
                {filteredProducts.map(p => {
                  const isSel = selectedIds.includes(p.maSanPham);
                  return (
                    <Box key={p.maSanPham} onClick={() => toggleProduct(p.maSanPham)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5', background: isSel ? '#fff8e1' : 'white',
                        '&:hover': { background: isSel ? '#fff0c0' : '#f9f9f9' } }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.tenSP}</Typography>
                        <Typography variant="caption" color="textSecondary">{formatVND(p.giaBan)}</Typography>
                      </Box>
                      <Chip label={isSel ? '✓ Đã chọn' : '+ Chọn'} size="small"
                        color={isSel ? 'warning' : 'default'} />
                    </Box>
                  );
                })}
              </Box>
            </Box>
            <Box sx={{ width: '45%', overflowY: 'auto', p: 1.5 }}>
              {err && <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ✅ Sản Phẩm Áp Dụng ({selectedProducts.length})
              </Typography>
              {selectedProducts.map(p => (
                <Box key={p.maSanPham} sx={{ display: 'flex', alignItems: 'center', mb: 0.5, p: 1, background: '#fff8e1', borderRadius: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{p.tenSP}</Typography>
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {formatVND(p.giaBan)}
                      {form.phanTramGiam && (
                        <span style={{ color: '#e91e63', marginLeft: 6 }}>
                          → {formatVND(p.giaBan * (1 - parseFloat(form.phanTramGiam) / 100))}
                        </span>
                      )}
                      {form.soTienGiam && !form.phanTramGiam && (
                        <span style={{ color: '#e91e63', marginLeft: 6 }}>
                          → {formatVND(Math.max(0, p.giaBan - parseFloat(form.soTienGiam)))}
                        </span>
                      )}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => toggleProduct(p.maSanPham)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {selectedProducts.length === 0 && (
                <Typography variant="caption" color="textSecondary">Chưa chọn sản phẩm nào</Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          sx={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', color: '#333' }}>
          {saving ? 'Đang lưu...' : 'Lưu Khuyến Mãi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Dialog Xem Sản Phẩm ─────────────────────────────────────
function ProductListDialog({ open, onClose, promotion }) {
  if (!promotion) return null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>📦 Sản phẩm áp dụng: {promotion.tenKM}</DialogTitle>
      <DialogContent dividers>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#fff9c4' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Giá Gốc</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Giá Sau KM</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(promotion.targets || []).map(t => {
                let giaKM = t.giaBan;
                if (promotion.loaiGiamGia === 'PhanTram') giaKM = t.giaBan * (1 - promotion.giaTriGiam / 100);
                else if (promotion.loaiGiamGia === 'SoTien') giaKM = Math.max(0, t.giaBan - promotion.giaTriGiam);
                return (
                  <TableRow key={t.maSanPham}>
                    <TableCell>{t.tenSanPham}</TableCell>
                    <TableCell>{formatVND(t.giaBan)}</TableCell>
                    <TableCell sx={{ color: '#e91e63', fontWeight: 'bold' }}>{formatVND(giaKM)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}

// ─── Component Chính ─────────────────────────────────────────
export default function ProductPromotionsTab() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [mainViewMode, setMainViewMode] = useState('table');

  const { permissions } = usePermissions();
  const canCreate = permissions?.promotions?.coTheTao ?? false;
  const canEdit = permissions?.promotions?.coTheSua ?? false;
  const canDelete = permissions?.promotions?.coTheXoa ?? false;

  const load = async () => {
    setLoading(true);
    try { const data = await promotionService.getAll(); setPromotions(Array.isArray(data) ? data : (data?.data || [])); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa khuyến mãi này?')) return;
    try { await promotionService.delete(id); load(); }
    catch { alert('Xóa thất bại'); }
  };

  const now = new Date();

  const columns = [
    { 
      field: 'tenKM', 
      headerName: 'Tên Chương Trình', 
      flex: 1.5, 
      minWidth: 200,
      renderCell: (params) => <Box sx={{ fontWeight: 'bold' }}>{params.value}</Box>
    },
    {
      field: 'hangThanhVien',
      headerName: 'Hạng áp dụng',
      width: 150,
      renderCell: (params) => params.value ? <Chip label={`⭐ ${params.value}`} size="small" variant="outlined" sx={{ borderColor: '#673ab7', color: '#673ab7' }} /> : 'Mọi hạng'
    },
    {
      field: 'giaTriGiam',
      headerName: 'Mức giảm',
      width: 120,
      renderCell: (params) => (
        params.row.loaiGiamGia === 'PhanTram' 
          ? <Chip label={`-${params.value}%`} size="small" color="warning" />
          : <Chip label={`-${formatVND(params.value)}`} size="small" color="info" />
      )
    },
    {
      field: 'targets',
      headerName: 'Sản phẩm',
      width: 120,
      renderCell: (params) => (
        <Button size="small" variant="outlined" onClick={() => setViewing(params.row)}>
          {params.value?.length || 0} SP
        </Button>
      )
    },
    {
      field: 'thoiHan',
      headerName: 'Thời Hạn',
      width: 200,
      renderCell: (params) => (
        <Typography variant="caption">
          {new Date(params.row.thoiGianBatDau).toLocaleDateString('vi-VN')} - {new Date(params.row.thoiGianKetThuc).toLocaleDateString('vi-VN')}
        </Typography>
      )
    },
    {
      field: 'trangThai',
      headerName: 'Trạng Thái',
      width: 120,
      renderCell: (params) => {
        const isActive = params.value && new Date(params.row.thoiGianKetThuc) >= now;
        return <Chip label={isActive ? 'Hiệu lực' : 'Hết hạn'} size="small" color={isActive ? 'success' : 'default'} />;
      }
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => { setEditing(params.row); setFormOpen(true); }}>
            <AddIcon sx={{ transform: 'rotate(45deg)', fontSize: '1.2rem' }} /> {/* Just an edit icon substitute */}
            <Typography variant="button" sx={{ ml: -0.5 }}>Sửa</Typography>
          </IconButton>
          <Button size="small" color="error" onClick={() => handleDelete(params.row.maKhuyenMai)}>Xóa</Button>
        </Box>
      )
    }
  ];

  // Re-define actions column properly
  columns[6].renderCell = (params) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {canEdit && <Button size="small" onClick={() => { setEditing(params.row); setFormOpen(true); }}>Sửa</Button>}
      {canDelete && <Button size="small" color="error" onClick={() => handleDelete(params.row.maKhuyenMai)}>Xóa</Button>}
      {!canEdit && !canDelete && <Typography variant="caption" color="textDisabled">Chỉ xem</Typography>}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>🏷️ Khuyến Mãi Sản Phẩm</Typography>
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', color: '#333' }}>
              Thêm Khuyến Mãi
            </Button>
          )}
        </Box>
      </Box>

      {mainViewMode === 'table' ? (
        <DataTable 
          rows={promotions} 
          columns={columns} 
          getRowId={(row) => row.maKhuyenMai} 
          loading={loading}
          showDateFilter={false}
        />
      ) : (
        <Grid container spacing={3}>
          {promotions.map((item, idx) => {
            const isActive = item.trangThai && new Date(item.thoiGianKetThuc) >= now;
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
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea', lineHeight: 1.2 }}>
                          {item.tenKM}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                          Mã KM: {item.maKhuyenMai}
                        </Typography>
                      </Box>
                      <Chip label={isActive ? 'Hiệu lực' : 'Hết hạn'} size="small" color={isActive ? 'success' : 'default'} sx={{ fontWeight: 'bold' }} />
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">Mức Giảm</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          {item.loaiGiamGia === 'PhanTram' ? `-${item.giaTriGiam}%` : `-${formatVND(item.giaTriGiam)}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">Hạng Áp Dụng</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {item.hangThanhVien ? `⭐ ${item.hangThanhVien}` : 'Mọi hạng'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary" display="block">Thời Hạn</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {new Date(item.thoiGianBatDau).toLocaleDateString('vi-VN')} - {new Date(item.thoiGianKetThuc).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary" display="block">Sản Phẩm</Typography>
                        <Button size="small" variant="outlined" onClick={() => setViewing(item)} sx={{ mt: 0.5 }}>
                          {item.targets?.length || 0} SP Áp Dụng
                        </Button>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                      {canEdit && <Button size="small" variant="outlined" onClick={() => { setEditing(item); setFormOpen(true); }}>Sửa</Button>}
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

      <PromotionFormDialog
        open={formOpen} onClose={() => setFormOpen(false)}
        onSaved={load} editing={editing}
      />
      
      <ProductListDialog
        open={Boolean(viewing)} onClose={() => setViewing(null)}
        promotion={viewing}
      />
    </Box>
  );
}
