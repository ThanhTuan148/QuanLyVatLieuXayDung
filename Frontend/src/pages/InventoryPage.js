import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Typography, Paper, Chip, LinearProgress, Card, CardContent, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete,
  IconButton, Tabs, Tab, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, Divider, Stack, Collapse, Checkbox, CircularProgress, Select, MenuItem,
  ToggleButton, ToggleButtonGroup
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
import GridViewIcon from '@mui/icons-material/GridView';
import TableChartIcon from '@mui/icons-material/TableChart';
import api from '../services/api';
import inventoryService from '../services/inventoryService';
import productService from '../services/productService';
import InventoryForm from '../components/InventoryForm';
import DataTable from '../components/DataTable';
import ConfirmReceiptDialog from '../components/ConfirmReceiptDialog';
import OutboundHistoryDialog from '../components/OutboundHistoryDialog';
import { usePermissions } from '../contexts/PermissionContext';

let cachedInventory = null;
let cachedWarehouses = null;
let cachedOutboundHistory = null;

export default function InventoryPage() {
  const { permissions } = usePermissions();
  const [inventory, setInventory] = useState(cachedInventory || []);
  const [loading, setLoading] = useState(!cachedInventory);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [warehouses, setWarehouses] = useState(cachedWarehouses || []);
  const [products, setProducts] = useState([]);
  const [newWarehouse, setNewWarehouse] = useState({ tenKho: '', loaiKho: '', diaChi: '' });
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const [historyDialog, setHistoryDialog] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(5);
  const [historyFilters, setHistoryFilters] = useState({ maPhieuNhap: '', tenNhaCungCap: '', tuNgay: '', denNgay: '' });

  const [outboundHistory, setOutboundHistory] = useState(cachedOutboundHistory || []);
  const [outboundLoading, setOutboundLoading] = useState(!cachedOutboundHistory);
  const [expandedOutbound, setExpandedOutbound] = useState(null);

  const [outboundSearch, setOutboundSearch] = useState('');
  const [outboundFilters, setOutboundFilters] = useState({ tuNgay: '', denNgay: '', trangThai: 'All' });

  const [confirmReceiptOpen, setConfirmReceiptOpen] = useState(false);
  const [selectedOutbound, setSelectedOutbound] = useState(null);
  const [outboundHistoryLogOpen, setOutboundHistoryLogOpen] = useState(false);
  const [selectedOutboundId, setSelectedOutboundId] = useState(null);
  const [selectedOutboundCode, setSelectedOutboundCode] = useState('');

  const [procurementDetail, setProcurementDetail] = useState(null);
  const [procurementDetailLoading, setProcurementDetailLoading] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [mainViewMode, setMainViewMode] = useState('table');

  const [aiForecastOpen, setAiForecastOpen] = useState(false);
  const [aiForecastLoading, setAiForecastLoading] = useState(false);
  const [aiForecastData, setAiForecastData] = useState(null);
  const [selectedForecastIds, setSelectedForecastIds] = useState(new Set());
  const [forecastConfigs, setForecastConfigs] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [forecastViewMode, setForecastViewMode] = useState('table');

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data || []);
    } catch (err) { console.error('Fetch suppliers err:', err); }
  };

  const handleRunAiForecast = async () => {
    setSelectedForecastIds(new Set());
    setAiForecastOpen(true);
    setAiForecastLoading(true);
    try {
      const res = await api.get('/ai/demand-forecast');
      setAiForecastData(res.data);

      // Initialize configurations with cheapest suppliers pre-selected
      const configs = {};
      res.data?.danhSachDuBao?.forEach(item => {
        const product = products.find(p => p.maSP === item.maSP);
        if (product) {
          let selectedSup = null;
          let qty = item.soLuongDeXuatNhap || 100;
          if (product.nhaCungCaps && product.nhaCungCaps.length > 0) {
            selectedSup = [...product.nhaCungCaps].sort((a, b) => a.giaCungCap - b.giaCungCap)[0];
          }
          configs[item.maSP] = {
            selectedSupplier: selectedSup,
            qty: qty
          };
        }
      });
      setForecastConfigs(configs);
    } catch (err) {
      alert('Lỗi khi gọi AI Dự báo nhu cầu: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiForecastLoading(false);
    }
  };

  const handleToggleForecastSelect = (maSP) => {
    setSelectedForecastIds(prev => {
      const next = new Set(prev);
      if (next.has(maSP)) next.delete(maSP);
      else next.add(maSP);
      return next;
    });
  };

  const handleSelectAllForecast = (isChecked) => {
    if (isChecked) {
      const allIds = aiForecastData?.danhSachDuBao?.map(item => item.maSP) || [];
      setSelectedForecastIds(new Set(allIds));
    } else {
      setSelectedForecastIds(new Set());
    }
  };

  const handleCreateProposalFromForecast = async () => {
    if (selectedForecastIds.size === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm!');

    // Check if any selected item is missing a supplier
    const missingSupplierSp = [];
    for (const maSP of selectedForecastIds) {
      const config = forecastConfigs[maSP];
      if (!config || !config.selectedSupplier) {
        const item = aiForecastData.danhSachDuBao.find(x => x.maSP === maSP);
        missingSupplierSp.push(item?.tenSP || maSP);
      }
    }
    if (missingSupplierSp.length > 0) {
      return alert(`Vui lòng chọn Nhà cung cấp cho các sản phẩm sau:\n- ${missingSupplierSp.join('\n- ')}`);
    }

    setActionLoading(true);
    try {
      const proposalItems = [];
      for (const maSP of selectedForecastIds) {
        const forecastItem = aiForecastData.danhSachDuBao.find(item => item.maSP === maSP);
        if (!forecastItem) continue;

        const product = products.find(p => p.maSP === maSP);
        if (!product) {
          throw new Error(`Không tìm thấy sản phẩm ${maSP} trong hệ thống!`);
        }

        const config = forecastConfigs[maSP];
        const supplier = config?.selectedSupplier;

        proposalItems.push({
          maSanPham: product.maSanPham,
          soLuong: Number(config?.qty ?? forecastItem.soLuongDeXuatNhap ?? 0) || 100,
          donGia: Number(supplier?.giaCungCap || product.giaNhap || 0),
          maNhaCungCap: Number(supplier?.maNCC || supplier?.maNhaCungCap || 0),
          maKhoHang: warehouses[0]?.maKhoHang || 1
        });
      }

      if (proposalItems.length === 0) {
        return alert('Không có sản phẩm hợp lệ nào được chọn!');
      }

      await api.post('/procurement/proposal', {
        maNhanVien: userId || 1,
        ghiChu: `Đề xuất nhập hàng tự động từ AI Dự Báo Nhu Cầu`,
        chiTiet: proposalItems
      });

      alert('Gửi phiếu đề xuất nhập hàng thành công!');
      setAiForecastOpen(false);
    } catch (ex) {
      alert('Lỗi khi lập đề xuất: ' + (ex.message || 'Có lỗi xảy ra'));
    } finally {
      setActionLoading(false);
    }
  };

  const allTabs = [
    { label: "Tồn Kho Chi Tiết", icon: <InventoryIcon />, moduleKey: 'inventory', type: 'inventory' },
    { label: "Sản Phẩm Quà Tặng", icon: <CardGiftcardIcon />, moduleKey: 'inventory_gift', type: 'gift' },
    { label: "Xuất Kho", icon: <LocalShippingIcon />, moduleKey: 'inventory_history', type: 'history' }
  ];

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const roleStr = String(user?.roleName || user?.role || user?.Role || user?.vaiTro || '').trim().toLowerCase();
  const isQuanLy = roleStr === 'quản lý' || roleStr === 'giám đốc';
  const isTaiXe = roleStr.includes('tài xế');
  const isThuKho = roleStr.includes('thủ kho') || roleStr.includes('nhân viên kho');
  const userId = user?.maNhanVien || user?.id || 0;

  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => {
      return !tab.moduleKey || permissions?.[tab.moduleKey]?.coTheXem;
    });
  }, [permissions]);

  useEffect(() => {
    if (activeTab >= visibleTabs.length) setActiveTab(0);
  }, [visibleTabs.length, activeTab]);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    const currentTabType = visibleTabs[activeTab]?.type;
    if (currentTabType === 'inventory' || currentTabType === 'gift') {
      fetchInventory();
      fetchWarehouses();
      fetchProducts();
      fetchSuppliers();
    }
    if (currentTabType === 'history') fetchOutboundHistory();
  }, [activeTab, visibleTabs]);

  const fetchOutboundHistory = async () => {
    try {
      if (!cachedOutboundHistory) setOutboundLoading(true);
      const res = await inventoryService.getOutboundHistory();
      const data = res.data || [];
      cachedOutboundHistory = data;
      setOutboundHistory(data);
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

  const handleConfirmReceipt = async (items) => {
    try {
      const payload = {
        managerId: userId,
        items: items
      };
      const res = await api.post(`/inventory/${selectedOutbound.maPhieuXK}/confirm-receipt`, payload);
      alert(res.data.message);
      setConfirmReceiptOpen(false);
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
      const data = res.data || [];
      cachedWarehouses = data;
      setWarehouses(data);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.getAllProducts();
      setProducts(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchInventory = async () => {
    try {
      if (!cachedInventory) setLoading(true);
      const res = await inventoryService.getAll();
      const data = res.data || [];
      cachedInventory = data;
      setInventory(data);
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
      const res = await inventoryService.getImportHistory(row.maSanPham, row.maKhoHang);
      setHistoryItems(res.data || []);
    } catch (err) { console.error('Fetch history err:', err); }
    finally { setHistoryLoading(false); }
  };

  const handleOpenProcurementDetail = async (id) => {
    setProcurementDetailLoading(true);
    try {
      const res = await api.get(`/procurement/${id}`);
      setProcurementDetail(res.data);
    } catch (err) {
      alert('Không thể tải chi tiết phiếu nhập');
    } finally {
      setProcurementDetailLoading(false);
    }
  };

  const handleSave = async (payload) => {
    try {
      if (editing?.maCTKho) await inventoryService.update(editing.maCTKho, payload);
      else await inventoryService.create(payload);
      setFormOpen(false);
      fetchInventory();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lưu thất bại';
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa mục kho này?')) return;
    try { await inventoryService.delete(id); fetchInventory(); }
    catch { alert('Xóa thất bại'); }
  };

  const handleAddWarehouse = async () => {
    if (!newWarehouse.tenKho) return alert('Vui lòng nhập tên kho');
    try {
      if (editingWarehouse) {
        await inventoryService.updateWarehouse(editingWarehouse.maKhoHang, newWarehouse);
        alert('Cập nhật kho thành công');
      } else {
        await inventoryService.createWarehouse(newWarehouse);
        alert('Thêm kho mới thành công');
      }
      setNewWarehouse({ tenKho: '', loaiKho: '', diaChi: '' });
      setEditingWarehouse(null);
      fetchWarehouses();
    } catch (err) {
      alert(editingWarehouse ? 'Cập nhật thất bại' : 'Thêm kho thất bại');
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kho này? Lưu ý: Không thể xóa kho nếu đang có hàng tồn.')) return;
    try {
      await inventoryService.deleteWarehouse(id);
      alert('Đã xóa kho thành công');
      fetchWarehouses();
      fetchInventory(); // Cập nhật lại danh sách tồn kho vì có thể ảnh hưởng đến hiển thị
    } catch (err) {
      alert(err.response?.data || 'Xóa kho thất bại');
    }
  };

  const handleEditWarehouse = (w) => {
    setEditingWarehouse(w);
    setNewWarehouse({ tenKho: w.tenKho, loaiKho: w.loaiKho, diaChi: w.diaChi });
  };

  const giftInventory = inventory.filter(i => !!i.isGift);
  const regularInventory = inventory.filter(i => !i.isGift);
  const currentTabType = visibleTabs[activeTab]?.type;
  const currentList = currentTabType === 'inventory' ? regularInventory : giftInventory;
  const currentModuleKey = visibleTabs[activeTab]?.moduleKey || 'inventory';

  const columns = [
    { field: 'maKhoHang', headerName: 'Mã Kho', width: 90 },
    {
      field: 'loaiKho',
      headerName: 'Loại Kho',
      width: 180,
      renderCell: (params) => <Chip label={params.value || 'Kho Khác'} size="small" variant="outlined" />
    },
    { field: 'maSanPham', headerName: 'Mã SP', width: 100 },
    { field: 'tenSP', headerName: 'Tên Sản Phẩm', flex: 1.5, minWidth: 250 },
    { field: 'soLuongNhap', headerName: 'SL Nhập', width: 100 },
    {
      field: 'soLuongTon', headerName: 'SL Tồn', width: 100, renderCell: (params) => {
        const isCritical = params.value <= (params.row.mucTonToiThieu || 0);
        return (
          <Chip
            label={params.value}
            size="small"
            color={isCritical ? 'error' : params.value < (params.row.mucTonToiThieu || 0) * 2 ? 'warning' : 'success'}
            variant={isCritical ? 'filled' : 'outlined'}
          />
        );
      }
    },
    {
      field: 'ngayNhapCuoi',
      headerName: 'Ngày Nhập Cuối',
      width: 150,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('vi-VN') : '—'
    },
    { field: 'mucTonToiThieu', headerName: 'SL Tồn Tối Thiểu', width: 120 },
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
          {permissions?.[currentModuleKey]?.coTheSua && (
            <Tooltip title="Chỉnh Sửa">
              <IconButton color="primary" size="small" onClick={() => { setEditing(params.row); setFormOpen(true); }}><EditIcon fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {permissions?.[currentModuleKey]?.coTheXoa && (
            <Tooltip title="Xóa">
              <IconButton color="error" size="small" onClick={() => handleDelete(params.row.maCTKho)}><DeleteIcon fontSize="small" /></IconButton>
            </Tooltip>
          )}
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
      width: 280,
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
            {row.trangThai?.trim() === 'Đã duyệt' && (isThuKho || isQuanLy) && (
              <Tooltip title="Thủ kho xác nhận soạn hàng xong (Bước 2)">
                <IconButton size="small" color="primary" onClick={() => handleConfirmExport(row.maPhieuXK)}>
                  <InventoryIcon />
                </IconButton>
              </Tooltip>
            )}
            {(row.trangThai?.trim() === 'Chờ nhận' || row.trangThai?.trim() === 'Đã nhận một phần') && (isTaiXe || isQuanLy) && (
              <Tooltip title="Tài xế xác nhận nhận hàng để đi giao (Bước 3)">
                <IconButton size="small" sx={{ color: '#f57c00' }} onClick={() => { setSelectedOutbound(row); setConfirmReceiptOpen(true); }}>
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
            <Tooltip title="Xem lịch sử xử lý">
              <IconButton size="small" color="inherit" onClick={() => {
                setSelectedOutboundId(row.maPhieuXK);
                setSelectedOutboundCode(row.maPXK);
                setOutboundHistoryLogOpen(true);
              }}>
                <HistoryIcon />
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

  if (visibleTabs.length === 0) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>📊 Quản Lý Kho Hàng</Typography>
          <Typography variant="body2" color="textSecondary">Chi tiết tồn kho hiện tại</Typography>
        </Box>
        {permissions?.[currentModuleKey]?.coTheTao && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {currentTabType === 'inventory' && (
              <>
                <Button variant="contained" onClick={handleRunAiForecast} sx={{ background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', color: '#fff', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,114,255,0.3)' }}>
                  🤖 AI Dự Báo Nhu Cầu Nhập Hàng
                </Button>
                <Button variant="outlined" onClick={() => setWarehouseDialogOpen(true)}>Quản Lý Danh Mục Kho</Button>
              </>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              Thêm Mục Kho
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          {visibleTabs.map((tab, idx) => (
            <Tab key={idx} icon={tab.icon} iconPosition="start" label={tab.label} />
          ))}
        </Tabs>

        <ToggleButtonGroup
          value={mainViewMode}
          exclusive
          onChange={(e, nextMode) => { if (nextMode) setMainViewMode(nextMode); }}
          size="small"
        >
          <ToggleButton value="table" sx={{ px: 2, fontWeight: 'bold' }}>
            <TableChartIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Bảng
          </ToggleButton>
          <ToggleButton value="card" sx={{ px: 2, fontWeight: 'bold' }}>
            <GridViewIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Card
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {currentTabType !== 'history' ? (
        <>
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
          {mainViewMode === 'table' ? (
            <DataTable
              rows={currentList}
              columns={columns}
              getRowId={(row) => row.maCTKho}
              loading={loading}
              dateField="ngayNhapCuoi"
            />
          ) : (
            <Grid container spacing={3}>
              {currentList.map((item, idx) => {
                const isCritical = item.soLuongTon <= (item.mucTonToiThieu || 0);
                return (
                  <Grid item xs={12} sm={6} md={4} key={item.maCTKho || idx}>
                    <Card sx={{
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              #{item.maCTKho} - {item.maKhoHang}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3, mt: 0.5 }}>
                              {item.tenSP}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                              Mã SP: {item.maSanPham}
                            </Typography>
                          </Box>
                          <Chip label={item.loaiKho || 'Kho Khác'} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary" display="block">SL Nhập / Tối thiểu</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {item.soLuongNhap} / {item.mucTonToiThieu || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary" display="block">SL Tồn Kho</Typography>
                            <Chip
                              label={item.soLuongTon}
                              size="small"
                              color={isCritical ? 'error' : item.soLuongTon < (item.mucTonToiThieu || 0) * 2 ? 'warning' : 'success'}
                              variant={isCritical ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="textSecondary" display="block">Ngày Nhập Cuối</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {item.ngayNhapCuoi ? new Date(item.ngayNhapCuoi).toLocaleDateString('vi-VN') : '—'}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                          <Tooltip title="Lịch Sử Nhập">
                            <IconButton color="info" size="small" onClick={() => handleOpenHistory(item)}><HistoryIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          {permissions?.[currentModuleKey]?.coTheSua && (
                            <Tooltip title="Chỉnh Sửa">
                              <IconButton color="primary" size="small" onClick={() => { setEditing(item); setFormOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          {permissions?.[currentModuleKey]?.coTheXoa && (
                            <Tooltip title="Xóa">
                              <IconButton color="error" size="small" onClick={() => handleDelete(item.maCTKho)}><DeleteIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {permissions?.[currentModuleKey]?.coTheTao && (
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

          {mainViewMode === 'table' ? (
            <DataTable
              rows={outboundHistory}
              columns={outboundColumns}
              getRowId={(row) => row.maPhieuXK}
              loading={outboundLoading}
              dateField="ngayXuat"
            />
          ) : (
            <Grid container spacing={3} sx={{ p: 2 }}>
              {outboundHistory.map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={item.maPhieuXK || idx}>
                  <Card sx={{
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {item.maXK}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {item.ngayXuat ? new Date(item.ngayXuat).toLocaleString('vi-VN') : '—'}
                          </Typography>
                        </Box>
                        <Chip
                          label={item.trangThai}
                          size="small"
                          color={
                            item.trangThai?.trim() === 'Đã xuất' ? 'success' :
                              item.trangThai?.trim() === 'Chờ nhận' ? 'secondary' :
                                item.trangThai?.trim() === 'Chờ xuất' ? 'warning' : 'info'
                          }
                          variant="filled"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary" display="block">Liên Kết Giao Hàng</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            📦 {item.maGH || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary" display="block">Liên Kết Hóa Đơn</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            🛒 {item.maHD || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="textSecondary" display="block">Tổng Mặt Hàng</Typography>
                          <Chip label={`${item.chiTiet?.length || 0} mặt hàng`} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                        <Tooltip title="Xem Chi Tiết">
                          <IconButton size="small" color="info" onClick={() => setExpandedOutbound(item)}>
                            <KeyboardArrowDownIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {item.trangThai?.trim() === 'Chờ duyệt' && isQuanLy && (
                          <Tooltip title="Quản lý phê duyệt & Ký số (Bước 1)">
                            <IconButton size="small" color="success" onClick={() => handleApproveOutbound(item)}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.trangThai?.trim() === 'Đã duyệt' && (isThuKho || isQuanLy) && (
                          <Tooltip title="Thủ kho xác nhận soạn hàng xong (Bước 2)">
                            <IconButton size="small" color="primary" onClick={() => handleConfirmExport(item.maPhieuXK)}>
                              <InventoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(item.trangThai?.trim() === 'Chờ nhận' || item.trangThai?.trim() === 'Đã nhận một phần') && (isTaiXe || isQuanLy) && (
                          <Tooltip title="Tài xế xác nhận nhận hàng để đi giao (Bước 3)">
                            <IconButton size="small" sx={{ color: '#f57c00' }} onClick={() => { setSelectedOutbound(item); setConfirmReceiptOpen(true); }}>
                              <LocalShippingIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Xuất PDF phiếu xuất kho">
                          <IconButton size="small" color="error" onClick={async () => {
                            try {
                              const response = await inventoryService.exportPdf(item.maPhieuXK);
                              const url = window.URL.createObjectURL(new Blob([response.data]));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `PhieuXuatKho_${item.maXK}.pdf`);
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                            } catch (e) {
                              alert('Lỗi khi xuất PDF');
                            }
                          }}>
                            <PictureAsPdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xem Lịch Sử / Log">
                          <IconButton size="small" color="inherit" onClick={() => {
                            setSelectedOutboundId(item.maPhieuXK);
                            setSelectedOutboundCode(item.maXK);
                            setOutboundHistoryLogOpen(true);
                          }}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* Dialogs ... (HistoryDialog, OutboundDetail, InventoryForm, WarehouseDialog) */}
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

      <InventoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSave}
        initial={editing || {}}
        warehouses={warehouses}
        products={products}
      />

      <Dialog open={warehouseDialogOpen} onClose={() => setWarehouseDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Quản Lý Danh Mục Kho Hàng</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3, p: 2, background: '#f8f9fc', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              {editingWarehouse ? 'Chỉnh Sửa Kho:' : 'Thêm Kho Mới:'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" label="Tên Kho" value={newWarehouse.tenKho} onChange={e => setNewWarehouse({ ...newWarehouse, tenKho: e.target.value })} sx={{ flex: 1.5 }} />
              <Autocomplete
                size="small" sx={{ flex: 1 }}
                options={['Kho Tổng Hợp 1', 'Kho Tổng Hợp 2', 'Kho Tổng Hợp 3', 'Kho Tổng Hợp 4', 'Kho Tổng Hợp 5', 'Kho Khác']}
                freeSolo value={newWarehouse.loaiKho} onChange={(e, val) => setNewWarehouse({ ...newWarehouse, loaiKho: val })}
                renderInput={(params) => <TextField {...params} label="Loại Kho" />}
              />
              <TextField size="small" label="Địa chỉ" value={newWarehouse.diaChi} onChange={e => setNewWarehouse({ ...newWarehouse, diaChi: e.target.value })} sx={{ flex: 2 }} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleAddWarehouse}>
                  {editingWarehouse ? 'Lưu' : 'Thêm'}
                </Button>
                {editingWarehouse && (
                  <Button variant="outlined" color="inherit" onClick={() => { setEditingWarehouse(null); setNewWarehouse({ tenKho: '', loaiKho: '', diaChi: '' }); }}>
                    Hủy
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ background: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Mã Kho</TableCell>
                  <TableCell>Tên Kho</TableCell>
                  <TableCell>Loại Kho</TableCell>
                  <TableCell>Địa Chỉ</TableCell>
                  <TableCell align="right">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouses.map(w => (
                  <TableRow key={w.maKhoHang} sx={editingWarehouse?.maKhoHang === w.maKhoHang ? { bgcolor: 'rgba(25, 118, 210, 0.08)' } : {}}>
                    <TableCell>{w.maKho}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{w.tenKho}</TableCell>
                    <TableCell><Chip label={w.loaiKho || '—'} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell>{w.diaChi}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleEditWarehouse(w)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteWarehouse(w.maKhoHang)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
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
                <TextField size="small" label="Nhà cung cấp" value={historyFilters.tenNhaCungCap}
                  onChange={e => { setHistoryFilters(p => ({ ...p, tenNhaCungCap: e.target.value })); setHistoryPage(0); }}
                  sx={{ minWidth: 160 }}
                />
                <TextField size="small" label="Từ ngày" type="date" value={historyFilters.tuNgay}
                  onChange={e => { setHistoryFilters(p => ({ ...p, tuNgay: e.target.value })); setHistoryPage(0); }}
                  InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
                />
                <TextField size="small" label="Đến ngày" type="date" value={historyFilters.denNgay}
                  onChange={e => { setHistoryFilters(p => ({ ...p, denNgay: e.target.value })); setHistoryPage(0); }}
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
                            <TableCell sx={{ fontWeight: 'bold', width: 130 }}>Loại</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 170 }}>Ngày Nhập</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nguồn Giao / NCC</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 90 }} align="center">S.Lượng</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 110 }} align="right">Đơn Giá</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 130 }} align="right">Thành Tiền</TableCell>
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
                            <TableRow key={h.maPhieu || i} hover>
                              <TableCell
                                sx={{
                                  color: h.loai === 'Nhập hàng' ? 'primary.main' : 'text.primary',
                                  fontWeight: 'bold',
                                  cursor: h.loai === 'Nhập hàng' ? 'pointer' : 'default',
                                  '&:hover': { textDecoration: h.loai === 'Nhập hàng' ? 'underline' : 'none' }
                                }}
                                onClick={() => h.loai === 'Nhập hàng' && handleOpenProcurementDetail(h.idPhieu)}
                              >
                                {h.maPhieu}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {h.loai}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>{h.ngayNhap ? new Date(h.ngayNhap).toLocaleString('vi-VN') : '—'}</TableCell>
                              <TableCell sx={{ fontSize: '0.85rem' }}>{h.tenNhaCungCap}</TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{h.soLuongNhan}</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{h.donGia?.toLocaleString('vi-VN')} đ</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '0.85rem' }}>{h.thanhTien?.toLocaleString('vi-VN')} đ</TableCell>
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
                          Tổng SL: {totalSL.toLocaleString('vi-VN')}
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                          Tổng tiền: {totalTT.toLocaleString('vi-VN')} đ
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

      {/* DIALOG: CHI TIẾT PHIẾU NHẬP */}
      <Dialog open={!!procurementDetail} onClose={() => setProcurementDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chi Tiết Phiếu Nhập: {procurementDetail?.maPN}
          <Chip label={procurementDetail?.trangThai} color="primary" size="small" />
        </DialogTitle>
        <DialogContent dividers>
          {procurementDetailLoading ? <LinearProgress /> : (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2"><b>Nhà Cung Cấp:</b> {procurementDetail?.tenNhaCungCap}</Typography>
                  <Typography variant="body2"><b>Ngày Nhập:</b> {new Date(procurementDetail?.ngayNhap).toLocaleString('vi-VN')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><b>Người Lập:</b> {procurementDetail?.tenNhanVien}</Typography>
                  <Typography variant="body2"><b>Tổng Tiền:</b> {procurementDetail?.tongTien?.toLocaleString('vi-VN')} đ</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><b>Ghi Chú:</b> {procurementDetail?.ghiChu || 'Không có'}</Typography>
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">S.Lượng Đặt</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">S.Lượng Nhận</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Đơn Giá</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Thành Tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {procurementDetail?.chiTiet?.map((ct, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{ct.tenSanPham}</TableCell>
                        <TableCell align="center">{ct.soLuong}</TableCell>
                        <TableCell align="center">
                          <Chip label={ct.soLuongDaNhan} size="small" color={ct.soLuongDaNhan >= ct.soLuong ? 'success' : 'warning'} variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{ct.donGia?.toLocaleString('vi-VN')} đ</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{ct.thanhTien?.toLocaleString('vi-VN')} đ</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcurementDetail(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
      <ConfirmReceiptDialog
        open={confirmReceiptOpen}
        onClose={() => setConfirmReceiptOpen(false)}
        outboundNote={selectedOutbound}
        onConfirm={handleConfirmReceipt}
      />
      <OutboundHistoryDialog
        open={outboundHistoryLogOpen}
        onClose={() => setOutboundHistoryLogOpen(false)}
        outboundId={selectedOutboundId}
        outboundCode={selectedOutboundCode}
      />

      <Dialog open={aiForecastOpen} onClose={() => setAiForecastOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🤖 AI DỰ BÁO NHU CẦU KHO HÀNG (DEMAND FORECASTING)</Typography>
          </Box>
          <Chip label="Powered by ML.NET & LLM" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold' }} />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          {aiForecastLoading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <LinearProgress sx={{ mb: 3, height: 8, borderRadius: 4 }} />
              <Typography variant="h6" color="text.secondary" sx={{ animation: 'pulse 1.5s infinite' }}>
                AI đang tổng hợp dữ liệu lịch sử bán hàng, xu hướng theo mùa và chạy mô hình dự báo...
              </Typography>
            </Box>
          ) : aiForecastData ? (
            <Box>
              <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, borderLeft: '5px solid #0072ff', bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e3c72', mb: 1 }}>
                  📅 Kỳ dự báo: {aiForecastData.thangDuBao}
                </Typography>
                <Typography variant="body1" sx={{ color: '#333', lineHeight: 1.6 }}>
                  {aiForecastData.nhanXetChung}
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  📦 Chi Tiết Đề Xuất Kế Hoạch Nhập Hàng
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {forecastViewMode === 'card' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const allSelected = selectedForecastIds.size === (aiForecastData.danhSachDuBao?.length || 0);
                        handleSelectAllForecast(!allSelected);
                      }}
                      sx={{ fontWeight: 'bold', borderRadius: 2 }}
                    >
                      {selectedForecastIds.size === (aiForecastData.danhSachDuBao?.length || 0) ? '❌ Hủy chọn tất cả' : '✅ Chọn tất cả'}
                    </Button>
                  )}
                  <ToggleButtonGroup
                    value={forecastViewMode}
                    exclusive
                    onChange={(e, nextMode) => { if (nextMode) setForecastViewMode(nextMode); }}
                    size="small"
                  >
                    <ToggleButton value="table" sx={{ px: 2, fontWeight: 'bold' }}>
                      <TableChartIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Bảng
                    </ToggleButton>
                    <ToggleButton value="card" sx={{ px: 2, fontWeight: 'bold' }}>
                      <GridViewIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Card
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>

              {forecastViewMode === 'table' ? (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'auto', maxHeight: '55vh' }}>
                  <Table sx={{ minWidth: 1670, tableLayout: 'fixed' }}>
                    <TableHead sx={{ background: 'linear-gradient(135deg, #f1f2f6 0%, #dfe4ea 100%)' }}>
                      <TableRow>
                        <TableCell padding="checkbox" sx={{ width: 50 }}>
                          <Checkbox
                            indeterminate={selectedForecastIds.size > 0 && selectedForecastIds.size < (aiForecastData.danhSachDuBao?.length || 0)}
                            checked={(aiForecastData.danhSachDuBao?.length || 0) > 0 && selectedForecastIds.size === (aiForecastData.danhSachDuBao?.length || 0)}
                            onChange={(e) => handleSelectAllForecast(e.target.checked)}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 90, whiteSpace: 'nowrap' }}>Mã SP</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 220, whiteSpace: 'nowrap' }}>Tên Sản Phẩm</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 110, whiteSpace: 'nowrap' }} align="center">Tồn Kho</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 120, whiteSpace: 'nowrap' }} align="center">Tốc Độ Bán</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 200, whiteSpace: 'nowrap' }}>Xu Hướng Theo Mùa</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 110, whiteSpace: 'nowrap' }} align="center">Đề Xuất AI</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 130, whiteSpace: 'nowrap' }} align="center">SL Muốn Nhập</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 260, whiteSpace: 'nowrap' }}>Nhà Cung Cấp (Giá tốt nhất)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 130, whiteSpace: 'nowrap' }}>Mức Độ Ưu Tiên</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2f3542', width: 250, whiteSpace: 'nowrap' }}>Lý Do Đề Xuất</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aiForecastData.danhSachDuBao?.map((item, idx) => {
                        const isUrgent = item.mucDoUuTien?.includes('Khẩn cấp');
                        const isNormal = item.mucDoUuTien?.includes('Bình thường');
                        const isSelected = selectedForecastIds.has(item.maSP);
                        return (
                          <TableRow
                            key={idx}
                            hover
                            onClick={() => handleToggleForecastSelect(item.maSP)}
                            role="checkbox"
                            aria-checked={isSelected}
                            selected={isSelected}
                            sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 }, bgcolor: isSelected ? 'rgba(25, 118, 210, 0.08)' : (isUrgent ? 'rgba(255, 71, 87, 0.05)' : 'inherit') }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                color="primary"
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleToggleForecastSelect(item.maSP)}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#2e86de', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.maSP}</TableCell>
                            <TableCell sx={{ p: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal', lineHeight: 1.3 }}>
                                {item.tenSP}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: item.tonKhoHienTai < 100 ? '#e84118' : '#273c75' }}>
                                {item.tonKhoHienTai}
                              </Typography>
                            </TableCell>
                            <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#44bd32' }}>{item.tocDoBanTrungBinh}</Typography></TableCell>
                            <TableCell sx={{ p: 1 }}>
                              <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#57606f', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal', lineHeight: 1.3 }}>
                                {item.xuHuongTheoMua}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={`+${item.soLuongDeXuatNhap}`} sx={{ fontWeight: 'bold', bgcolor: item.soLuongDeXuatNhap > 0 ? '#0072ff' : '#ced6e0', color: item.soLuongDeXuatNhap > 0 ? '#fff' : '#57606f' }} />
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <TextField
                                type="number"
                                size="small"
                                value={forecastConfigs[item.maSP]?.qty ?? item.soLuongDeXuatNhap ?? 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setForecastConfigs(prev => ({
                                    ...prev,
                                    [item.maSP]: {
                                      ...prev[item.maSP],
                                      qty: val >= 0 ? val : 0
                                    }
                                  }));
                                }}
                                sx={{
                                  width: 95,
                                  '& .MuiInputBase-input': {
                                    p: '6px 8px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem'
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                const config = forecastConfigs[item.maSP];
                                const product = products.find(p => p.maSP === item.maSP);
                                const productSups = product?.nhaCungCaps || [];

                                const options = productSups.length > 0 ? productSups : suppliers.map(s => ({
                                  maNCC: s.maNhaCungCap || s.maNCC,
                                  tenNCC: s.tenNhaCungCap || s.tenNCC,
                                  giaCungCap: product?.giaNhap || 0
                                }));

                                return (
                                  <Select
                                    size="small"
                                    fullWidth
                                    value={config?.selectedSupplier?.maNCC || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const sup = options.find(o => o.maNCC === val);
                                      setForecastConfigs(prev => ({
                                        ...prev,
                                        [item.maSP]: {
                                          ...prev[item.maSP],
                                          selectedSupplier: sup
                                        }
                                      }));
                                    }}
                                    displayEmpty
                                    sx={{
                                      fontSize: '0.85rem',
                                      bgcolor: '#fff',
                                      borderRadius: 1,
                                      '& .MuiSelect-select': {
                                        p: '6px 10px'
                                      }
                                    }}
                                  >
                                    <MenuItem value="" disabled>
                                      <em>⚠️ Chưa chọn NCC</em>
                                    </MenuItem>
                                    {options.map((opt) => (
                                      <MenuItem key={opt.maNCC} value={opt.maNCC}>
                                        {opt.tenNCC} ({opt.giaCungCap?.toLocaleString('vi-VN')} đ)
                                      </MenuItem>
                                    ))}
                                  </Select>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <Chip label={item.mucDoUuTien} size="small" sx={{ fontWeight: 'bold', bgcolor: isUrgent ? '#ff4757' : isNormal ? '#ffa502' : '#2ed573', color: '#fff' }} />
                            </TableCell>
                            <TableCell sx={{ p: 1 }}>
                              <Typography variant="body2" sx={{ color: '#2f3542', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal', lineHeight: 1.3 }}>
                                {item.lyDoDeXuat}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Grid container spacing={3} sx={{ maxHeight: '55vh', overflowY: 'auto', p: 0.5 }}>
                  {aiForecastData.danhSachDuBao?.map((item, idx) => {
                    const isUrgent = item.mucDoUuTien?.includes('Khẩn cấp');
                    const isNormal = item.mucDoUuTien?.includes('Bình thường');
                    const isSelected = selectedForecastIds.has(item.maSP);
                    const config = forecastConfigs[item.maSP];
                    const product = products.find(p => p.maSP === item.maSP);
                    const productSups = product?.nhaCungCaps || [];
                    const options = productSups.length > 0 ? productSups : suppliers.map(s => ({
                      maNCC: s.maNhaCungCap || s.maNCC,
                      tenNCC: s.tenNhaCungCap || s.tenNCC,
                      giaCungCap: product?.giaNhap || 0
                    }));

                    return (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Card
                          onClick={() => handleToggleForecastSelect(item.maSP)}
                          sx={{
                            cursor: 'pointer',
                            position: 'relative',
                            border: isSelected ? '2px solid #0072ff' : '1px solid #e0e0e0',
                            borderRadius: 3,
                            boxShadow: isSelected ? '0 8px 24px rgba(0,114,255,0.15)' : '0 4px 12px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s ease-in-out',
                            bgcolor: isSelected ? '#f0f7ff' : '#fff',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                            }
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleForecastSelect(item.maSP)}
                              color="primary"
                            />
                          </Box>

                          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                            <Chip
                              label={item.mucDoUuTien}
                              size="small"
                              sx={{
                                fontWeight: 'bold',
                                bgcolor: isUrgent ? '#ff4757' : isNormal ? '#ffa502' : '#2ed573',
                                color: '#fff'
                              }}
                            />
                          </Box>

                          <CardContent sx={{ pt: 6, pb: '16px !important' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#888' }}>
                              {item.maSP}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2c3e50', mt: 0.5, minHeight: 48, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                              {item.tenSP}
                            </Typography>

                            <Divider sx={{ my: 1.5 }} />

                            <Grid container spacing={1} sx={{ mb: 2 }}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary" display="block">Tồn Kho Hiện Tại</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: item.tonKhoHienTai < 100 ? '#e84118' : '#273c75' }}>
                                  {item.tonKhoHienTai}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary" display="block">Tốc Độ Bán / Tháng</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#44bd32' }}>
                                  {item.tocDoBanTrungBinh}
                                </Typography>
                              </Grid>
                            </Grid>

                            <Box sx={{ bgcolor: '#f1f2f6', p: 1, borderRadius: 2, mb: 2, minHeight: 60 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Xu Hướng Theo Mùa:</Typography>
                              <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#57606f', mt: 0.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                                {item.xuHuongTheoMua}
                              </Typography>
                            </Box>

                            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Đề Xuất AI</Typography>
                                <Chip label={`+${item.soLuongDeXuatNhap}`} sx={{ fontWeight: 'bold', bgcolor: '#0072ff', color: '#fff' }} />
                              </Grid>
                              <Grid item xs={6} onClick={(e) => e.stopPropagation()}>
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>SL Muốn Nhập</Typography>
                                <TextField
                                  type="number"
                                  size="small"
                                  fullWidth
                                  value={config?.qty ?? item.soLuongDeXuatNhap ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setForecastConfigs(prev => ({
                                      ...prev,
                                      [item.maSP]: {
                                        ...prev[item.maSP],
                                        qty: val >= 0 ? val : 0
                                      }
                                    }));
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      p: '6px 8px',
                                      fontWeight: 'bold'
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>

                            <Box sx={{ mb: 2 }} onClick={(e) => e.stopPropagation()}>
                              <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Nhà Cung Cấp</Typography>
                              <Select
                                size="small"
                                fullWidth
                                value={config?.selectedSupplier?.maNCC || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const sup = options.find(o => o.maNCC === val);
                                  setForecastConfigs(prev => ({
                                    ...prev,
                                    [item.maSP]: {
                                      ...prev[item.maSP],
                                      selectedSupplier: sup
                                    }
                                  }));
                                }}
                                displayEmpty
                                sx={{
                                  fontSize: '0.85rem',
                                  bgcolor: '#fff',
                                  borderRadius: 1,
                                  '& .MuiSelect-select': {
                                    p: '6px 10px'
                                  }
                                }}
                              >
                                <MenuItem value="" disabled>
                                  <em>⚠️ Chưa chọn NCC</em>
                                </MenuItem>
                                {options.map((opt) => (
                                  <MenuItem key={opt.maNCC} value={opt.maNCC}>
                                    {opt.tenNCC} ({opt.giaCungCap?.toLocaleString('vi-VN')} đ)
                                  </MenuItem>
                                ))}
                              </Select>
                            </Box>

                            <Box sx={{ borderLeft: '3px solid #ff9f43', pl: 1, minHeight: 50 }}>
                              <Typography variant="caption" color="textSecondary" display="block" sx={{ fontWeight: 'bold' }}>Lý Do Đề Xuất:</Typography>
                              <Typography variant="body2" sx={{ color: '#2f3542', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                                {item.lyDoDeXuat}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          ) : (
            <Typography color="error">Không có dữ liệu dự báo</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#fff', justifyContent: 'space-between' }}>
          <Box>
            {selectedForecastIds.size > 0 && (
              <Button
                variant="contained"
                color="success"
                onClick={handleCreateProposalFromForecast}
                disabled={actionLoading}
                sx={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(56,239,125,0.3)',
                  mr: 2
                }}
              >
                {actionLoading ? <CircularProgress size={24} color="inherit" /> : `✨ LẬP ĐỀ XUẤT NHANH (${selectedForecastIds.size} SP)`}
              </Button>
            )}
          </Box>
          <Button variant="contained" onClick={() => setAiForecastOpen(false)} sx={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
