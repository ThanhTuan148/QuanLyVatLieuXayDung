import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Typography, Paper, Chip, LinearProgress, Card, CardContent, Grid, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete,
  IconButton, Tabs, Tab, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, Divider, Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import InventoryIcon from '@mui/icons-material/Inventory';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import inventoryService from '../services/inventoryService';
import InventoryForm from '../components/InventoryForm';
import DataTable from '../components/DataTable';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [newWarehouse, setNewWarehouse] = useState({ tenKho: '', loaiKho: '', diaChi: '' });

  const [historyDialog, setHistoryDialog] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(5);
  const [historyFilters, setHistoryFilters] = useState({ maPhieuNhap: '', tenNhaCungCap: '', tuNgay: '', denNgay: '' });

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => { 
    fetchInventory(); 
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await inventoryService.getWarehouses();
      setWarehouses(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try { 
      const res = await inventoryService.getAll(); 
      setInventory(res.data || []); 
    }
    catch (err) { console.error('Fetch inventory error:', err); }
    finally { setLoading(false); }
  };

  const handleOpenHistory = async (row) => {
    setHistoryDialog(row);
    setHistoryLoading(true);
    setHistorySearch('');
    setHistoryPage(0);
    setHistoryFilters({ maPhieuNhap: '', tenNhaCungCap: '', tuNgay: '', denNgay: '' });
    try {
      const res = await inventoryService.getImportHistory(row.maSanPham);
      setHistoryItems(res.data || []);
    } catch (err) { console.error('Fetch history err:', err); }
    finally { setHistoryLoading(false); }
  };

  const handleSave = async (payload) => {
    try {
      if (editing?.maCTKho) await inventoryService.update(editing.maCTKho, payload);
      else await inventoryService.create(payload);
      setFormOpen(false); fetchInventory();
    } catch { alert('Lưu thất bại'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa mục kho này?')) return;
    try { await inventoryService.delete(id); fetchInventory(); }
    catch { alert('Xóa thất bại'); }
  };

  const handleAddWarehouse = async () => {
    if (!newWarehouse.tenKho) return alert('Vui lòng nhập tên kho');
    try {
      await inventoryService.createWarehouse(newWarehouse);
      setNewWarehouse({ tenKho: '', loaiKho: '', diaChi: '' });
      fetchWarehouses();
    } catch { alert('Thêm kho thất bại'); }
  };

  const giftInventory = inventory.filter(i => !!i.isGift);
  const regularInventory = inventory.filter(i => !i.isGift);
  const currentList = activeTab === 0 ? regularInventory : giftInventory;

  const columns = [
    { field: 'maCTKho', headerName: 'ID', width: 80, renderCell: (params) => <b>{params.value}</b> },
    { field: 'maKhoHang', headerName: 'Mã Kho', width: 90 },
    { 
      field: 'loaiKho', 
      headerName: 'Loại Kho', 
      width: 120,
      renderCell: (params) => <Chip label={params.value || 'Kho Khác'} size="small" variant="outlined" />
    },
    { field: 'maSanPham', headerName: 'Mã SP', width: 100 },
    { field: 'tenSP', headerName: 'Tên Sản Phẩm', flex: 1.5, minWidth: 250 },
    { field: 'soLuongTon', headerName: 'Tồn Kho', width: 120, renderCell: (params) => {
        const isCritical = params.value <= (params.row.mucTonToiThieu || 0);
        return (
          <Chip 
            label={params.value} 
            size="small"
            color={isCritical ? 'error' : params.value < (params.row.mucTonToiThieu || 0) * 2 ? 'warning' : 'success'}
            variant={isCritical ? 'filled' : 'outlined'} 
          />
        );
    }},
    { field: 'viTri', headerName: 'Vị Trí', width: 100 },
    { 
      field: 'ngayNhapCuoi', 
      headerName: 'Ngày Nhập Cuối', 
      width: 150,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('vi-VN') : '—'
    },
    { field: 'mucTonToiThieu', headerName: 'Mức Báo Động', width: 120 },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Lịch Sử Nhập">
            <IconButton color="info" size="small" onClick={() => handleOpenHistory(params.row)}><HistoryIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh Sửa">
            <IconButton color="primary" size="small" onClick={() => { setEditing(params.row); setFormOpen(true); }}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton color="error" size="small" onClick={() => handleDelete(params.row.maCTKho)}><DeleteIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const tongTon = currentList.reduce((s, i) => s + (i.soLuongTon || 0), 0);
  const canNhap = currentList.filter(i => i.soLuongTon <= (i.mucTonToiThieu || 0));
  const stats = [
    { label: 'Tổng mặt hàng', value: currentList.length, color: '#667eea' },
    { label: 'Tổng tồn kho', value: tongTon, color: '#43e97b' },
    { label: 'Cần nhập hàng', value: canNhap.length, color: '#f5576c' },
    { label: 'Kho đang quản lý', value: [...new Set(currentList.map(i => i.maKhoHang))].length, color: '#ffa726' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>📊 Quản Lý Kho Hàng</Typography>
          <Typography variant="body2" color="textSecondary">Chi tiết tồn kho hiện tại</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => setWarehouseDialogOpen(true)}>Quản Lý Danh Mục Kho</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            Thêm Mục Kho
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<InventoryIcon />} iconPosition="start" label="Tồn Kho Chi Tiết" />
        <Tab icon={<CardGiftcardIcon />} iconPosition="start" label="Sản Phẩm Quà Tặng" />
      </Tabs>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="textSecondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <DataTable 
        rows={currentList}
        columns={columns}
        getRowId={(row) => row.maCTKho}
        loading={loading}
      />

      <InventoryForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSave} initial={editing || {}} />

      <Dialog open={warehouseDialogOpen} onClose={() => setWarehouseDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Quản Lý Danh Mục Kho Hàng</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3, p: 2, background: '#f8f9fc', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Thêm Kho Mới:</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" label="Tên Kho" value={newWarehouse.tenKho} onChange={e => setNewWarehouse({...newWarehouse, tenKho: e.target.value})} sx={{ flex: 1.5 }} />
              <Autocomplete
                size="small" sx={{ flex: 1 }}
                options={['Kho Cát', 'Kho Đá', 'Kho Xi Măng', 'Kho Sắt Thép', 'Kho Gạch', 'Kho Panel', 'Kho Khác']}
                freeSolo value={newWarehouse.loaiKho} onChange={(e, val) => setNewWarehouse({...newWarehouse, loaiKho: val})}
                renderInput={(params) => <TextField {...params} label="Loại Kho" />}
              />
              <TextField size="small" label="Địa chỉ" value={newWarehouse.diaChi} onChange={e => setNewWarehouse({...newWarehouse, diaChi: e.target.value})} sx={{ flex: 2 }} />
              <Button variant="contained" onClick={handleAddWarehouse}>Thêm</Button>
            </Box>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ background: '#f5f5f5' }}><TableRow><TableCell>Mã Kho</TableCell><TableCell>Tên Kho</TableCell><TableCell>Loại Kho</TableCell><TableCell>Địa Chỉ</TableCell></TableRow></TableHead>
              <TableBody>
                {warehouses.map(w => (
                  <TableRow key={w.maKhoHang}>
                    <TableCell>{w.maKho}</TableCell><TableCell sx={{ fontWeight: 'bold' }}>{w.tenKho}</TableCell>
                    <TableCell><Chip label={w.loaiKho || '—'} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell>{w.diaChi}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions><Button onClick={() => setWarehouseDialogOpen(false)}>Đóng</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(historyDialog)} onClose={() => setHistoryDialog(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          🔄 Lịch Sử Lô Hàng: <span style={{ color: '#667eea' }}>{historyDialog?.tenSP}</span>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {historyLoading ? <LinearProgress sx={{ mb: 2 }} /> : (
            <>
              {/* Search + Filters */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                <TextField
                  size="small"
                  placeholder="Tìm kiếm mã phiếu, nhà CC..."
                  value={historySearch}
                  onChange={e => { setHistorySearch(e.target.value); setHistoryPage(0); }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                    endAdornment: historySearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setHistorySearch(''); setHistoryPage(0); }}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                  sx={{ minWidth: 220 }}
                />
                <TextField size="small" label="Mã phiếu" value={historyFilters.maPhieuNhap}
                  onChange={e => { setHistoryFilters(p => ({...p, maPhieuNhap: e.target.value})); setHistoryPage(0); }}
                  sx={{ width: 130 }}
                />
                <TextField size="small" label="Nhà cung cấp" value={historyFilters.tenNhaCungCap}
                  onChange={e => { setHistoryFilters(p => ({...p, tenNhaCungCap: e.target.value})); setHistoryPage(0); }}
                  sx={{ minWidth: 160 }}
                />
                <TextField size="small" label="Từ ngày" type="date" value={historyFilters.tuNgay}
                  onChange={e => { setHistoryFilters(p => ({...p, tuNgay: e.target.value})); setHistoryPage(0); }}
                  InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
                />
                <TextField size="small" label="Đến ngày" type="date" value={historyFilters.denNgay}
                  onChange={e => { setHistoryFilters(p => ({...p, denNgay: e.target.value})); setHistoryPage(0); }}
                  InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
                />
                {(historySearch || Object.values(historyFilters).some(v => v)) && (
                  <Button size="small" color="error" variant="outlined" startIcon={<ClearIcon />}
                    onClick={() => { setHistorySearch(''); setHistoryFilters({ maPhieuNhap: '', tenNhaCungCap: '', tuNgay: '', denNgay: '' }); setHistoryPage(0); }}
                  >
                    Xóa lọc
                  </Button>
                )}
              </Stack>

              {/* Table + Pagination */}
              {(() => {
                const keyword = historySearch.toLowerCase();
                const filtered = historyItems.filter(h => {
                  const matchSearch = !keyword ||
                    (h.maPhieuNhap || '').toLowerCase().includes(keyword) ||
                    (h.tenNhaCungCap || '').toLowerCase().includes(keyword);
                  const matchMa = !historyFilters.maPhieuNhap || (h.maPhieuNhap || '').toLowerCase().includes(historyFilters.maPhieuNhap.toLowerCase());
                  const matchNCC = !historyFilters.tenNhaCungCap || (h.tenNhaCungCap || '').toLowerCase().includes(historyFilters.tenNhaCungCap.toLowerCase());
                  const ngay = h.ngayNhap ? new Date(h.ngayNhap) : null;
                  const matchTu = !historyFilters.tuNgay || (ngay && ngay >= new Date(historyFilters.tuNgay));
                  const matchDen = !historyFilters.denNgay || (ngay && ngay <= new Date(historyFilters.denNgay + 'T23:59:59'));
                  return matchSearch && matchMa && matchNCC && matchTu && matchDen;
                });
                const paginated = filtered.slice(historyPage * historyRowsPerPage, historyPage * historyRowsPerPage + historyRowsPerPage);
                const totalSL = filtered.reduce((s, h) => s + (h.soLuongNhan || 0), 0);
                const totalTT = filtered.reduce((s, h) => s + (h.thanhTien || 0), 0);
                const totalPages = Math.ceil(filtered.length / historyRowsPerPage);

                return (
                  <>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'rgba(102,126,234,0.07)' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: 90 }}>Mã Phiếu</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 170 }}>Ngày Nhập</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nhà Cung Cấp</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">Số Lượng</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 120 }} align="right">Đơn Giá</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 150 }} align="right">Thành Tiền</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginated.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                Không tìm thấy dữ liệu phù hợp.
                              </TableCell>
                            </TableRow>
                          ) : paginated.map((h, i) => (
                            <TableRow key={h.maPhieuNhap || i} hover>
                              <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>{h.maPhieuNhap}</TableCell>
                              <TableCell>{h.ngayNhap ? new Date(h.ngayNhap).toLocaleString('vi-VN') : '—'}</TableCell>
                              <TableCell>{h.tenNhaCungCap}</TableCell>
                              <TableCell align="center">
                                <Chip label={h.soLuongNhan} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                              </TableCell>
                              <TableCell align="right">{h.donGia?.toLocaleString()} đ</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>{h.thanhTien?.toLocaleString()} đ</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Summary */}
                    <Box sx={{ mt: 1.5, px: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Hiển thị <b>{paginated.length}</b> / <b>{filtered.length}</b> bản ghi
                        {filtered.length !== historyItems.length && ` (lọc từ ${historyItems.length} tổng cộng)`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          Tổng SL: {totalSL.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                          Tổng tiền: {totalTT.toLocaleString()} đ
                        </Typography>
                      </Box>
                    </Box>

                    {/* Pagination */}
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">Số dòng:</Typography>
                      {[5, 10, 20].map(n => (
                        <Button key={n} size="small"
                          variant={historyRowsPerPage === n ? 'contained' : 'outlined'}
                          sx={{ minWidth: 36, px: 1, py: 0.3, fontSize: '0.75rem' }}
                          onClick={() => { setHistoryRowsPerPage(n); setHistoryPage(0); }}
                        >{n}</Button>
                      ))}
                      <Button size="small" variant="outlined" disabled={historyPage === 0}
                        onClick={() => setHistoryPage(p => p - 1)} sx={{ minWidth: 36 }}>‹</Button>
                      <Typography variant="caption" sx={{ mx: 0.5 }}>
                        {historyPage + 1} / {totalPages || 1}
                      </Typography>
                      <Button size="small" variant="outlined"
                        disabled={historyPage + 1 >= totalPages}
                        onClick={() => setHistoryPage(p => p + 1)} sx={{ minWidth: 36 }}>›</Button>
                    </Box>
                  </>
                );
              })()}
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setHistoryDialog(null)}>Đóng</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
