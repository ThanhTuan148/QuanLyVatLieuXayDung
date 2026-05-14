import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Typography, Paper, Chip, LinearProgress, Card, CardContent, Grid, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete,
  IconButton, Tabs, Tab, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, Divider, Stack, Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import InventoryIcon from '@mui/icons-material/Inventory';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '../services/api';
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

  const [outboundHistory, setOutboundHistory] = useState([]);
  const [outboundLoading, setOutboundLoading] = useState(false);
  const [expandedOutbound, setExpandedOutbound] = useState(null);
  
  const [outboundSearch, setOutboundSearch] = useState('');
  const [outboundFilters, setOutboundFilters] = useState({ tuNgay: '', denNgay: '', trangThai: 'All' });

  const [activeTab, setActiveTab] = useState(0);

  const filteredOutboundHistory = useMemo(() => {
    return outboundHistory.filter(row => {
      const searchLower = outboundSearch.toLowerCase();
      const matchesSearch = !outboundSearch || 
        row.maXK?.toLowerCase().includes(searchLower) ||
        row.maGH?.toLowerCase().includes(searchLower) ||
        row.maHD?.toLowerCase().includes(searchLower);
      
      const matchesStatus = outboundFilters.trangThai === 'All' || row.trangThai?.trim() === outboundFilters.trangThai;
      
      const rowDate = new Date(row.ngayXuat);
      const matchesFrom = !outboundFilters.tuNgay || rowDate >= new Date(outboundFilters.tuNgay);
      let matchesTo = true;
      if (outboundFilters.denNgay) {
        const toDate = new Date(outboundFilters.denNgay);
        toDate.setHours(23, 59, 59, 999);
        matchesTo = rowDate <= toDate;
      }
      
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [outboundHistory, outboundSearch, outboundFilters]);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const roleStr = String(user?.roleName || user?.role || user?.Role || user?.vaiTro || '').trim().toLowerCase();
  const isQuanLy = roleStr === 'quản lý' || roleStr === 'giám đốc';
  const isTaiXe = roleStr.includes('tài xế');
  const isThuKho = roleStr.includes('thủ kho') || roleStr.includes('nhân viên kho');
  const userId = user?.maNhanVien || user?.id || 0;

  useEffect(() => {
    if (isTaiXe) setActiveTab(2);
  }, [isTaiXe]);

  useEffect(() => { 
    fetchInventory(); 
    fetchWarehouses();
    if (activeTab === 2) fetchOutboundHistory();
  }, [activeTab]);

  const fetchOutboundHistory = async () => {
    setOutboundLoading(true);
    try {
      const res = await inventoryService.getOutboundHistory();
      setOutboundHistory(res.data || []);
    } catch (err) { console.error('Fetch outbound err:', err); }
    finally { setOutboundLoading(false); }
  };

  const handleConfirmExport = async (id) => {
    if (!window.confirm('Xác nhận đã lấy hàng và ký tên vào phiếu xuất kho này?')) return;
    try {
      await api.post(`/inventory/${id}/confirm-export`, { managerId: userId });
      alert('Đã xác nhận lấy hàng thành công.');
      fetchOutboundHistory();
    } catch (err) {
      alert('Lỗi xác nhận: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleConfirmReceipt = async (id) => {
    if (!window.confirm('Tài xế xác nhận đã nhận đủ hàng và chuẩn bị đi giao?')) return;
    try {
      await api.post(`/inventory/${id}/confirm-receipt`, { managerId: userId });
      alert('Đã xác nhận nhận hàng thành công. Trạng thái giao hàng đã được cập nhật.');
      fetchOutboundHistory();
    } catch (err) {
      alert('Lỗi xác nhận: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveOutbound = async (row) => {
    if (!row.maGH || row.maGH === 'N/A' || String(row.maGH).trim() === '') {
      alert(`⚠️ CẢNH BÁO!\n\nBạn phải tạo Phiếu giao hàng cho Hóa đơn ${row.maHD || ''} trước khi duyệt phiếu xuất kho.\n\nVui lòng sang trang "Giao Hàng" để thực hiện.`);
      return;
    }

    if (!window.confirm('Xác nhận phê duyệt và ký số cho phiếu xuất kho này?')) return;
    try {
      await api.post(`/inventory/${row.maPhieuXK}/approve`, { managerId: userId });
      alert('Đã phê duyệt phiếu xuất kho thành công.');
      fetchOutboundHistory();
    } catch (err) {
      alert('Lỗi khi phê duyệt: ' + (err.response?.data?.message || err.message));
    }
  };

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

  const outboundColumns = [
    { field: 'maXK', headerName: 'Mã Phiếu XK', width: 130, renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{params.value}</Typography> },
    { field: 'ngayXuat', headerName: 'Ngày Xuất', width: 150, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString('vi-VN') : '' },
    { 
      field: 'lienKet', 
      headerName: 'Liên Kết', 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
           <Typography variant="caption" sx={{ fontWeight: 'bold' }}>📦 GH: {params.row.maGH || 'N/A'}</Typography>
           <Typography variant="caption" color="textSecondary">🛒 HĐ: {params.row.maHD || 'N/A'}</Typography>
        </Box>
      )
    },
    { field: 'tenNhanVien', headerName: 'Người Thực Hiện', width: 180, renderCell: (params) => params.row.tenNhanVien || params.row.nguoiXuat },
    { 
      field: 'soLuongSP', 
      headerName: 'Số Lượng SP', 
      width: 120,
      renderCell: (params) => <Chip label={`${params.row.chiTiet?.length || 0} mặt hàng`} size="small" variant="outlined" />
    },
    { 
      field: 'trangThai', 
      headerName: 'Trạng Thái', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={
            params.value?.trim() === 'Đã xuất' ? 'success' : 
            params.value?.trim() === 'Chờ nhận' ? 'secondary' :
            params.value?.trim() === 'Chờ xuất' ? 'warning' : 'info'
          } 
          variant="filled"
        />
      )
    },
    { field: 'ghiChu', headerName: 'Ghi Chú', flex: 1, minWidth: 150 },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 220,
      sortable: false,
      filterable: false,
      align: 'right',
      renderCell: (params) => {
        const row = params.row;
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Xem chi tiết sản phẩm">
              <IconButton size="small" color="info" onClick={() => setExpandedOutbound(row)}>
                <KeyboardArrowDownIcon />
              </IconButton>
            </Tooltip>
            {row.trangThai?.trim() === 'Chờ duyệt' && isQuanLy && (
              <Tooltip title="Quản lý phê duyệt & Ký số (Bước 1)">
                <IconButton size="small" color="success" onClick={() => handleApproveOutbound(row)}>
                  <CheckCircleOutlineIcon />
                </IconButton>
              </Tooltip>
            )}
            {row.trangThai?.trim() === 'Chờ xuất' && (isThuKho || isQuanLy) && (
              <Tooltip title="Thủ kho xác nhận soạn hàng xong (Bước 2)">
                <IconButton size="small" color="primary" onClick={() => handleConfirmExport(row.maPhieuXK)}>
                  <InventoryIcon />
                </IconButton>
              </Tooltip>
            )}
            {row.trangThai?.trim() === 'Chờ nhận' && (isTaiXe || isQuanLy) && (
              <Tooltip title="Tài xế xác nhận nhận hàng để đi giao (Bước 3)">
                <IconButton size="small" sx={{ color: '#f57c00' }} onClick={() => handleConfirmReceipt(row.maPhieuXK)}>
                  <LocalShippingIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Xuất PDF phiếu xuất kho">
              <IconButton 
                size="small" 
                color="error" 
                onClick={async () => {
                try {
                  const response = await inventoryService.exportPdf(row.maPhieuXK);
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `PhieuXuatKho_${row.maXK}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (e) {
                  alert('Lỗi khi xuất PDF');
                }
              }}>
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      }
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
        {!isTaiXe && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => setWarehouseDialogOpen(true)}>Quản Lý Danh Mục Kho</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              Thêm Mục Kho
            </Button>
          </Box>
        )}
      </Box>

      <Tabs value={isTaiXe ? 0 : activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {!isTaiXe && <Tab icon={<InventoryIcon />} iconPosition="start" label="Tồn Kho Chi Tiết" />}
        {!isTaiXe && <Tab icon={<CardGiftcardIcon />} iconPosition="start" label="Sản Phẩm Quà Tặng" />}
        <Tab icon={<LocalShippingIcon />} iconPosition="start" label="Lịch Sử Xuất Kho" />
      </Tabs>

      {!isTaiXe && (
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
      )}

      {(!isTaiXe && activeTab < 2) ? (
        <DataTable 
          rows={currentList}
          columns={columns}
          getRowId={(row) => row.maCTKho}
          loading={loading}
          dateField="ngayNhapCuoi"
        />
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {!isTaiXe && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #eee' }}>
              <Button 
                variant="outlined" 
                startIcon={<HistoryIcon />} 
                onClick={async () => {
                  if (window.confirm('Hệ thống sẽ quét các đơn hàng/phiếu giao cũ để tạo lịch sử xuất kho. Bạn có muốn tiếp tục?')) {
                    try {
                      setOutboundLoading(true);
                      const res = await inventoryService.syncOldOutbound();
                      alert(res.data.message);
                      fetchOutboundHistory();
                    } catch (err) {
                      alert('Đồng bộ thất bại: ' + (err.response?.data?.message || err.message));
                    } finally {
                      setOutboundLoading(false);
                    }
                  }
                }}
                disabled={outboundLoading}
              >
                Đồng Bộ Dữ Liệu Cũ
              </Button>
            </Box>
          )}
          {outboundLoading && <LinearProgress />}
          
          <DataTable 
            rows={outboundHistory}
            columns={outboundColumns}
            getRowId={(row) => row.maPhieuXK}
            loading={outboundLoading}
            dateField="ngayXuat"
          />
        </Paper>
      )}

      {/* Dialog xem chi tiết sản phẩm xuất kho */}
      <Dialog open={!!expandedOutbound} onClose={() => setExpandedOutbound(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
          Chi tiết sản phẩm Phiếu {expandedOutbound?.maXK}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Số Lượng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Từ Kho</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expandedOutbound?.chiTiet?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3 }}>Không có sản phẩm nào</TableCell></TableRow>
                ) : (
                  expandedOutbound?.chiTiet?.map((ct, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{ct.tenSanPham}</TableCell>
                      <TableCell align="center"><Typography variant="body2" fontWeight="bold" color="primary">{ct.soLuong}</Typography></TableCell>
                      <TableCell>{ct.tenKho}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fcfcfc', borderTop: '1px solid #eee' }}>
          <Button onClick={() => setExpandedOutbound(null)} variant="outlined">Đóng</Button>
        </DialogActions>
      </Dialog>

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
