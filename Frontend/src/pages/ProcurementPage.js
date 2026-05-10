import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  DialogContent, DialogActions, TextField, Autocomplete, Alert,
  Checkbox, FormControlLabel, Collapse, CircularProgress, Divider,
  Chip, Tooltip, IconButton, Dialog, DialogTitle, TableHead, TableRow,
  Card, CardContent, Grid, TablePagination, InputAdornment,
  Select, MenuItem, FormControl
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GetAppIcon from '@mui/icons-material/GetApp';
import EmailIcon from '@mui/icons-material/Email';
import BlockIcon from '@mui/icons-material/Block';
import CancelIcon from '@mui/icons-material/Cancel';
import Warning from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import DataTable from '../components/DataTable';

function ProcurementPage() {
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);


  // Create Proposal Dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newProposal, setNewProposal] = useState({ note: '', items: [] });
  const [productSelect, setProductSelect] = useState(null);
  const [qtySelect, setQtySelect] = useState(1);
  const [priceSelect, setPriceSelect] = useState(0);
  const [supplierSelect, setSupplierSelect] = useState(null);
  const [warehouseSelect, setWarehouseSelect] = useState(null);

  // Price comparison state
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showPriceCompare, setShowPriceCompare] = useState(false);
  const [showInlineSuppliers, setShowInlineSuppliers] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Detail/Action Dialog
  const [viewDialog, setViewDialog] = useState(null);
  const [itemSearch, setItemSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [receiveData, setReceiveData] = useState([]);

  // Quick Add Product state
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [approveSelectedIds, setApproveSelectedIds] = useState(new Set()); // Chọn để YÊU CẦU SỬA
  const [rejectSelectedIds, setRejectSelectedIds] = useState(new Set()); // Chọn để TỪ CHỐI HẲN
  const [statusHistory, setStatusHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState([]);
  const [revisionNote, setRevisionNote] = useState(''); // Still used in some legacy logic or as fallback

  // Inventory Alerts state
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [alertPage, setAlertPage] = useState(0);
  const [alertRowsPerPage, setAlertRowsPerPage] = useState(5);

  // Quick Proposal from Alerts
  const [quickProposalDialog, setQuickProposalDialog] = useState(false);
  const [selectedAlertIds, setSelectedAlertIds] = useState(new Set()); // Set of maSP
  const [alertConfigs, setAlertConfigs] = useState({}); // { maSP: { qty: 1, supplier: null, prices: [], loading: false } }
  const [quickSearch, setQuickSearch] = useState('');
  const [quickCategory, setQuickCategory] = useState(null);
  const [quickPage, setQuickPage] = useState(0);
  const [quickRowsPerPage, setQuickRowsPerPage] = useState(5);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierPage, setSupplierPage] = useState(0);

  // New Approval Actions: { maCTPN: 'approve' | 'revise' | 'reject' }
  const [itemActions, setItemActions] = useState({});

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const roleStr = String(user?.role || user?.Role || user?.roleName || '').trim().toLowerCase();

  const isNhanVienKho = roleStr === 'nhân viên kho';
  const isQuanLy = roleStr === 'quản lý';

  const userId = user?.id || user?.maNhanVien || 0;

  useEffect(() => {
    loadData();
    loadDependencies();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resProc, resAlerts] = await Promise.all([
        api.get('/procurement'),
        api.get('/dashboard/inventory-alerts')
      ]);
      setProcurements(resProc.data);
      setInventoryAlerts(resAlerts.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [resSuppliers, resProducts, resWarehouses, resCategories] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products'),
        api.get('/inventory/warehouses'),
        api.get('/categories')
      ]);
      setSuppliers(resSuppliers.data);
      setProducts(resProducts.data);
      setWarehouses(resWarehouses.data || []);
      setCategories(resCategories.data || []);
    } catch (e) {
      console.error('Error loading dependencies', e);
    }
  };

  const handleToggleQuickAlert = async (maSP, isChecked) => {
    setSelectedAlertIds(prev => {
      const next = new Set(prev);
      if (isChecked) next.add(maSP);
      else next.delete(maSP);
      return next;
    });

    if (isChecked && (!alertConfigs[maSP] || alertConfigs[maSP].prices.length === 0)) {
      const product = products.find(p => p.maSP === maSP);
      if (!product) return;

      setAlertConfigs(prev => ({
        ...prev,
        [maSP]: { ...prev[maSP], loading: true, qty: 1 }
      }));

      try {
        const res = await api.get(`/procurement/price-compare/${product.maSanPham}`);
        setAlertConfigs(prev => ({
          ...prev,
          [maSP]: { 
            ...prev[maSP], 
            loading: false, 
            prices: res.data, 
            supplier: res.data.length > 0 ? res.data[0] : null // Auto select first one (usually best/latest)
          }
        }));
      } catch (e) {
        setAlertConfigs(prev => ({ ...prev, [maSP]: { ...prev[maSP], loading: false } }));
      }
    }
  };

  const updateQuickConfig = (maSP, delta) => {
    setAlertConfigs(prev => ({
      ...prev,
      [maSP]: { ...prev[maSP], ...delta }
    }));
  };

  const handleSubmitQuickProposal = async () => {
    const selectedItems = Array.from(selectedAlertIds).map(maSP => {
      const alert = inventoryAlerts.find(a => a.maSP === maSP);
      const product = products.find(p => p.maSP === maSP);
      const config = alertConfigs[maSP];
      
      if (!config || !config.supplier) return null;
      
      return {
        maSanPham: product.maSanPham,
        soLuong: config.qty,
        donGia: config.supplier.giaHienTai,
        maNhaCungCap: config.supplier.maNCC || config.supplier.maNhaCungCap,
        maKhoHang: warehouses.find(w => w.tenKho === alert.tenKho)?.maKhoHang || 1
      };
    }).filter(Boolean);

    if (selectedItems.length === 0) return alert('Vui lòng cấu hình đầy đủ NCC cho các mục đã chọn!');

    setActionLoading(true);
    try {
      await api.post('/procurement/proposal', {
        maNhanVien: userId,
        ghiChu: "Đề xuất nhanh từ cảnh báo tồn kho",
        chiTiet: selectedItems
      });
      alert('Gửi đề xuất hàng loạt thành công!');
      setQuickProposalDialog(false);
      loadData();
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.message || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleProductSelect = async (val) => {
    setProductSelect(val);
    setPriceHistory([]);
    if (!val) {
      setPriceSelect(0);
      setSupplierSelect(null);
      setShowInlineSuppliers(false);
      return;
    }

    setPriceLoading(true);
    setEditingProductId(val.maSanPham);
    try {
      const res = await api.get(`/procurement/price-compare/${val.maSanPham}`);
      setPriceHistory(res.data);
      // Hiện bảng chọn nhà cung cấp ngay trong form
      if (res.data.length > 0) setShowInlineSuppliers(true);
    } catch (e) {
      console.error('Error loading price history', e);
    } finally {
      setPriceLoading(false);
    }
  };

  const getMinPrice = () => {
    if (priceHistory.length === 0) return null;
    return Math.min(...priceHistory.map(h => h.giaHienTai));
  };

  const handleAddItem = () => {
    if (!productSelect) return;
    if (!supplierSelect) {
      alert('Vui lòng chọn Nhà cung cấp từ bảng danh sách bên dưới trước khi thêm.');
      return;
    }
    const maNCC = supplierSelect.maNCC || supplierSelect.maNhaCungCap;
    const itemKey = `${productSelect.maSanPham}_${maNCC}`;

    setNewProposal(prev => {
      const exists = prev.items.find(x => x.itemKey === itemKey);
      if (exists) {
        alert(`Sản phẩm này đã được đặt từ Nhà CC "${supplierSelect.tenNCC}" rồi.`);
        return prev;
      }
      return {
        ...prev,
        items: [...prev.items, {
          itemKey,
          maSanPham: productSelect.maSanPham,
          tenSanPham: productSelect.tenSP,
          soLuong: Number(qtySelect) || 1,
          donGia: Number(priceSelect) || 0,
          maNhaCungCap: maNCC,
          tenNhaCungCap: supplierSelect.tenNCC,
          maKhoHang: warehouseSelect?.maKhoHang || 1,
          tenKho: warehouseSelect?.tenKho || 'Mặc định'
        }]
      };
    });

    // Only reset supplier + price, keep product selected so user can quickly add another supplier
    setQtySelect(1);
    setPriceSelect(0);
    setSupplierSelect(null);
  };

  const handleUpdateProposal = async (targetStatus = null) => {
    if (!viewDialog) return;
    setActionLoading(true);
    try {
      let finalTargetStatus = targetStatus;
      let isApproveAction = false;
      let isRejectAction = false;
      let hasRevise = false;
      
      // Nếu targetStatus là 'processed', có nghĩa là Quản lý đang bấm Xử Lý
      if (targetStatus === 'processed') {
        const hasApprove = Object.values(itemActions).some(v => v === 'approve');
        hasRevise = Object.values(itemActions).some(v => v === 'revise');
        
        if (hasRevise) {
          finalTargetStatus = 'Yêu Cầu Sửa';
        } else if (hasApprove) {
          finalTargetStatus = null; // Để API đầu tiên không đổi Trạng Thái, API sau /approve sẽ đổi
          isApproveAction = true;
        } else {
          finalTargetStatus = null; // API sau /reject sẽ tự lo
          isRejectAction = true;
        }

        // Validation: All revised/rejected items must have a note
        const missingNotes = viewDialog.chiTiet.filter(c => {
          const action = itemActions[c.maCTPN];
          return (action === 'revise' || action === 'reject') && !c.ghiChu;
        });

        if (missingNotes.length > 0) {
          setActionLoading(false);
          return alert(`Vui lòng nhập lý do (Ghi chú) cho ${missingNotes.length} sản phẩm bị Yêu cầu sửa/Từ chối!`);
        }
      }

      if (targetStatus === 'processed') {
          // Use batch approval endpoint to process everything at once
          const batchPayload = {
              macTPNDuyet: Object.keys(itemActions).filter(k => itemActions[k] === 'approve').map(Number),
              macTPNSua:   Object.keys(itemActions).filter(k => itemActions[k] === 'revise').map(Number),
              macTPNTuChoi: Object.keys(itemActions).filter(k => itemActions[k] === 'reject').map(Number),
              chiTietUpdate: viewDialog.chiTiet
                .filter(c => !c.maPhieuHienTai || c.maPhieuHienTai === viewDialog.maPhieuNhap)
                .map(c => ({
                  maCTPN: c.maCTPN,
                  maSanPham: c.maSanPham,
                  soLuong: Number(c.soLuong),
                  donGia: Number(c.donGia),
                  maNhaCungCap: Number(c.maNhaCungCap) || viewDialog.maNhaCungCap || 0,
                  maKhoHang: c.maKhoHang || 1,
                  ghiChu: c.ghiChu
                })),
              userId: userId
          };
          await api.put(`/procurement/${viewDialog.maPhieuNhap}/approve-items`, batchPayload);
      } else {
          // Standard update (for warehouse staff re-submitting or simple edits)
          const payload = {
            maNhanVien: userId || 1, 
            ghiChu: viewDialog.ghiChu,
            ngayNhap: viewDialog.ngayNhap,
            targetStatus: finalTargetStatus, 
            chiTiet: viewDialog.chiTiet
              .filter(c => !c.maPhieuHienTai || c.maPhieuHienTai === viewDialog.maPhieuNhap)
              .map(c => ({
                maCTPN: c.maCTPN,
                maSanPham: c.maSanPham,
                soLuong: Number(c.soLuong),
                donGia: Number(c.donGia),
                maNhaCungCap: Number(c.maNhaCungCap) || viewDialog.maNhaCungCap || 0,
                maKhoHang: c.maKhoHang || 1,
                ghiChu: c.ghiChu,
                trangThai: c.trangThai
              }))
          };
          await api.put(`/procurement/${viewDialog.maPhieuNhap}`, payload);

          if (isApproveAction && !hasRevise) {
              await api.put(`/procurement/${viewDialog.maPhieuNhap}/approve`, { userId: userId || 1 });
          } else if (isRejectAction && !hasRevise && !isApproveAction) {
              await api.put(`/procurement/${viewDialog.maPhieuNhap}/reject`, { lyDo: "Quản lý từ chối phiếu đề xuất", userId: userId || 1 });
          }
      }

      alert('Thao tác thành công!');
      loadData();
      const updated = await api.get(`/procurement/${viewDialog.maPhieuNhap}`);
      setViewDialog({ ...updated.data, mode: 'view' });
      loadHistory(viewDialog.maPhieuNhap);
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data || e.message;
      alert('Lỗi cập nhật: ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditItemValue = (idx, field, val) => {
    setViewDialog(prev => {
      if (!prev) return prev;
      const updated = [...prev.chiTiet];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, chiTiet: updated };
    });
  };

  const removeItem = (itemKey) => {
    setNewProposal(prev => ({
      ...prev,
      items: prev.items.filter(x => x.itemKey !== itemKey)
    }));
  };

  const updateItem = (itemKey, changes) => {
    setNewProposal(prev => ({
      ...prev,
      items: prev.items.map(x => {
        if (x.itemKey !== itemKey) return x;
        const updated = { ...x, ...changes };
        // Recompute composite key if supplier changed
        updated.itemKey = `${updated.maSanPham}_${updated.maNhaCungCap}`;
        return updated;
      })
    }));
  };

  const handleSubmitProposal = async () => {
    if (newProposal.items.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm!');

    setActionLoading(true);
    try {
      const res = await api.post('/procurement/proposal', {
        maNhanVien: userId,
        ghiChu: newProposal.note,
        chiTiet: newProposal.items.map(x => ({
          maSanPham: x.maSanPham,
          soLuong: x.soLuong,
          donGia: x.donGia,
          maNhaCungCap: x.maNhaCungCap,
          maKhoHang: x.maKhoHang
        }))
      });
      alert(res.data.message || 'Gửi đề xuất thành công!');
      setCreateDialog(false);
      setNewProposal({ note: '', items: [] });
      loadData();
    } catch (ex) {
      alert(ex.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn CHẤP THUẬN TOÀN BỘ đề xuất này?')) return;
    setActionLoading(true);
    try {
      await api.put(`/procurement/${id}/approve`, { userId: userId });
      loadData();
      setViewDialog(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi duyệt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSelected = async (id) => {
    const allIds = viewDialog.chiTiet.map(c => c.maCTPN);

    // Items with no explicit action default to 'approve'
    const approveIds = allIds.filter(id2 => !itemActions[id2] || itemActions[id2] === 'approve');
    const reviseIds  = allIds.filter(id2 => itemActions[id2] === 'revise');
    const rejectIds  = allIds.filter(id2 => itemActions[id2] === 'reject');

    const confirmMsg = `Xác nhận xử lý phiếu: Duyệt ${approveIds.length}, Sửa ${reviseIds.length}, Từ chối ${rejectIds.length}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await api.put(`/procurement/${id}/approve-items`, {
        macTPNDuyet: approveIds,
        macTPNSua:   reviseIds,
        macTPNTuChoi: rejectIds,
        chiTietUpdate: viewDialog.chiTiet
          .filter(c => !c.maPhieuHienTai || c.maPhieuHienTai === viewDialog.maPhieuNhap)
          .map(c => ({
            maCTPN: c.maCTPN,
            maSanPham: c.maSanPham,
            soLuong: Number(c.soLuong),
            donGia: Number(c.donGia),
            maNhaCungCap: Number(c.maNhaCungCap) || null,
            maKhoHang: c.maKhoHang || 1,
            ghiChu: c.ghiChu
          })),
        ghiChuChung: rejectReason || "Xử lý chi tiết mặt hàng",
        lyDoSua: "Xử lý chi tiết mặt hàng",
        userId: userId
      });
      alert(`✅ ${res.data.message}`);
      loadData();
      setViewDialog(null);
      setItemActions({});
      setRejectReason('');
      setRejectReason('');
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi duyệt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) return alert('Vui lòng nhập lý do từ chối');
    if (!window.confirm('Từ chối đề xuất này?')) return;
    setActionLoading(true);
    try {
      await api.put(`/procurement/${id}/reject`, { lyDo: rejectReason, userId: userId });
      loadData();
      setViewDialog(null);
      setRejectReason('');
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi từ chối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReceive = async (p) => {
    try {
      const detail = await api.get(`/procurement/${p.maPhieuNhap}`);
      setViewDialog({ ...detail.data, mode: 'receive' });
      setReceiveData(detail.data.chiTiet.map(c => ({
        maCTPN: c.maCTPN,
        soLuongDaNhan: c.soLuong,
        maKhoHang: c.maKhoHang || 1 // Mặc định kho 1
      })));
    } catch (e) {
      alert('Lỗi tải chi tiết');
    }
  };

  const handleExport = async (id, format, maPN) => {
    try {
      const response = await api.get(`/procurement/${id}/export/${format}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DonNhapHang_${maPN}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Lỗi khi xuất file');
    }
  };

  const handleSendEmail = async (id, maPN) => {
    if (!window.confirm(`Gửi đơn hàng ${maPN} qua Email cho nhà cung cấp?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/procurement/${id}/send-email`);
      alert(res.data.message);
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi khi gửi Email');
    } finally {
      setActionLoading(false);
    }
  };

  const loadHistory = async (id) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/procurement/${id}/history`);
      setStatusHistory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenView = async (p) => {
    try {
      const detail = await api.get(`/procurement/${p.maPhieuNhap}`);
      setViewDialog({ ...detail.data, mode: 'view' });
      loadHistory(p.maPhieuNhap);
      
      // Nếu là NV kho đang vào phiếu Yêu Cầu Sửa => Auto load price cho SP đầu tiên để hiện bảng chọn
      if (detail.data.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho && detail.data.chiTiet?.length > 0) {
         handleProductSelect(detail.data.chiTiet[0]);
      }

      // Initialize actions from database status
      const initialActions = {};
      detail.data.chiTiet?.forEach(c => {
        if (c.trangThai === 'Đã Duyệt') initialActions[c.maCTPN] = 'approve';
        else if (c.trangThai === 'Yêu Cầu Sửa') initialActions[c.maCTPN] = 'revise';
        else if (c.trangThai === 'Từ Chối') initialActions[c.maCTPN] = 'reject';
        // Nếu là 'Đề Xuất' hoặc null thì để trống cho Quản lý chọn mới
      });
      setItemActions(initialActions);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Lỗi khi tải chi tiết phiếu nhập. Vui lòng kiểm tra kết nối API hoặc Database.');
    }
  };

  const handleReceiveItems = async (id) => {
    if (!window.confirm('Xác nhận đã nhận hàng thực tế và Cộng Tồn Kho? Lưu ý hành động này không thể hoàn tác!')) return;
    setActionLoading(true);
    try {
      const payload = receiveData.map(r => ({ ...r, userId: userId }));
      const res = await api.put(`/procurement/${id}/receive`, payload);
      alert(res.data.message);
      loadData();
      setViewDialog(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi nhập kho');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveChange = (maCTPN, field, value) => {
    setReceiveData(prev => prev.map(p => p.maCTPN === maCTPN ? { ...p, [field]: value } : p));
  };

  // Checkbox = Chọn để Yêu Cầu Sửa
  const toggleApproveItem = (maCTPN) => {
    setApproveSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(maCTPN)) next.delete(maCTPN);
      else {
        next.add(maCTPN);
        setRejectSelectedIds(prevR => { const n = new Set(prevR); n.delete(maCTPN); return n; });
      }
      return next;
    });
  };

  const toggleRejectItem = (maCTPN) => {
    setRejectSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(maCTPN)) next.delete(maCTPN);
      else {
        next.add(maCTPN);
        setApproveSelectedIds(prevA => { const n = new Set(prevA); n.delete(maCTPN); return n; });
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!viewDialog) return;
    const all = viewDialog.chiTiet.map(c => c.maCTPN);
    if (approveSelectedIds.size === all.length) {
      setApproveSelectedIds(new Set());
    } else {
      setApproveSelectedIds(new Set(all));
      setRejectSelectedIds(new Set()); // Đã sửa thì không từ chối
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đề Xuất':
      case 'Chờ Duyệt':
      case 'Đề Xuất (Nhập Bù)': return 'info';
      case 'Yêu Cầu Sửa': return 'warning';
      case 'Đã Duyệt': return 'primary';
      case 'Từ Chối': return 'error';
      case 'Hoàn Thành': return 'success';
      case 'Đang Xử Lý Đổi Trả': return 'warning';
      case 'Đã Xử Lý Đổi Trả': return 'success';
      case 'Nhập Thiếu (Cần Đổi Trả)': return 'error';
      default: return 'default';
    }
  };

  const canReProcess = viewDialog && !viewDialog.chiTiet?.some(c => c.soLuongDaNhan > 0);
  const isApprovalMode = viewDialog && (['Đề Xuất', 'Đề Xuất (Nhập Bù)', 'Đang xử lý', 'Chờ Duyệt', 'Yêu Cầu Sửa'].includes(viewDialog.trangThai) || (['Đã Duyệt', 'Từ Chối'].includes(viewDialog.trangThai) && canReProcess)) && isQuanLy;

  const getItemStatusChip = (row) => {
    if (!row.trangThai) return null;
    const isSplit = row.maPhieuHienTai && row.maPhieuHienTai !== viewDialog?.maPhieuNhap;
    
    switch (row.trangThai) {
      case 'Đã Duyệt': 
        return (
          <Tooltip title={isSplit ? `Đã tách sang phiếu nhập #${row.maPhieuHienTai}` : ""}>
            <Chip 
              label={isSplit ? "Đã Tách" : "Đã Duyệt"} 
              color="success" size="small" variant={isSplit ? "outlined" : "filled"} 
            />
          </Tooltip>
        );
      case 'Yêu Cầu Sửa': return <Chip label="Sửa" color="warning" size="small" variant="filled" />;
      case 'Từ Chối': return <Chip label="Từ Chối" color="error" size="small" variant="filled" />;
      case 'Đề Xuất': 
      case 'Chờ Duyệt': 
        return <Chip label="Đề Xuất" color="info" size="small" variant="outlined" />;
      default: return <Chip label={row.trangThai} size="small" variant="outlined" />;
    }
  };

  const minPrice = getMinPrice();
  const allSelected = viewDialog && approveSelectedIds.size === viewDialog.chiTiet?.length;
  const someSelected = viewDialog && approveSelectedIds.size > 0 && !allSelected;

  // Render price comparison for a specific row
  const renderBenchmarking = (row) => {
    const canSee = isApprovalMode || (viewDialog?.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho);
    if (!canSee) return null;
    return (
      <Tooltip title="Xem giá các NCC khác cho sản phẩm này">
        <IconButton
          size="small" color="primary"
          onClick={async () => {
            setPriceLoading(true);
            try {
              const res = await api.get(`/procurement/price-compare/${row.maSanPham}`);
              setPriceHistory(res.data);
              setEditingProductId(row.maSanPham);
              
              if (viewDialog?.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho) {
                setShowInlineSuppliers(true);
              } else {
                setShowPriceCompare(true);
              }
            } catch (e) {
              console.error(e);
            } finally {
              setPriceLoading(false);
            }
          }}
        >
          <CompareArrowsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box>
      {/* DIALOG: SO SÁNH GIÁ (DÀNH CHO QUẢN LÝ XEM) */}
      <Dialog open={showPriceCompare} onClose={() => setShowPriceCompare(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <CompareArrowsIcon color="primary" /> So Sánh Giá Với Các Nhà Cung Cấp Khác
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ height: 400 }}>
            <DataTable 
              rows={priceHistory}
              getRowId={(row) => row.maNCC + row.loai}
              loading={priceLoading}
              pageSize={5}
              columns={[
                { 
                  field: 'tenNCC', 
                  headerName: 'Nhà Cung Cấp', 
                  flex: 1.5,
                  renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{params.value}</Typography>
                },
                { 
                  field: 'loai', 
                  headerName: 'Loại', 
                  width: 140,
                  renderCell: (params) => (
                    <Chip 
                      label={params.value} 
                      size="small" 
                      variant="outlined" 
                      color={params.value === "Giá chào hàng" ? "primary" : "default"} 
                    />
                  )
                },
                { 
                  field: 'giaHienTai', 
                  headerName: 'Đơn Giá', 
                  width: 130,
                  renderCell: (params) => (
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {params.value?.toLocaleString()} đ
                    </Typography>
                  )
                },
                { 
                  field: 'ngayCapNhat', 
                  headerName: 'Cập Nhật', 
                  width: 130,
                  valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN')
                },
                {
                  field: 'actions',
                  headerName: 'Thao Tác',
                  width: 100,
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => {
                    const isSửaMode = viewDialog?.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho;
                    if (!isSửaMode && !isApprovalMode) return null;
                    
                    return (
                      <Button 
                        variant="contained" size="small" color="success"
                        onClick={() => {
                          const h = params.row;
                          setViewDialog(prev => {
                            const updated = [...prev.chiTiet];
                            const itemIdx = updated.findIndex(x => x.maSanPham === editingProductId);
                            if (itemIdx > -1) {
                              updated[itemIdx] = { 
                                ...updated[itemIdx], 
                                donGia: h.giaHienTai,
                                maNhaCungCap: h.maNCC,
                                tenNhaCungCap: h.tenNCC
                              };
                            }
                            return { ...prev, chiTiet: updated };
                          });
                          alert(`Đã cập nhật mặt hàng sang NCC: ${h.tenNCC} với giá ${h.giaHienTai.toLocaleString()} đ`);
                          setShowPriceCompare(false);
                        }}
                      >
                        CHỌN
                      </Button>
                    );
                  }
                }
              ]}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPriceCompare(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>📥 Quản Lý Nhập Hàng</Typography>
          <Typography color="textSecondary">Quy trình cấp phép và đối soát kho theo chuẩn ERP</Typography>
        </Box>
        {isNhanVienKho && (
          <Button
            variant="contained"
            startIcon={<AddShoppingCartIcon />}
            onClick={() => setCreateDialog(true)}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Lập Phiếu Đề Xuất Mới
          </Button>
        )}
      </Box>

      {/* Inventory Alerts Panel */}
      {isNhanVienKho && inventoryAlerts.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #ffe0b2' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Cảnh Báo Tồn Kho (Cần nhập hàng ngay)</Typography>
              </Box>
              <Button size="small" color="primary" onClick={() => {
                setQuickProposalDialog(true);
                setSelectedAlertIds(new Set());
                setAlertConfigs({});
              }}>Lập đề xuất nhanh</Button>
            </Box>
            <Grid container spacing={2}>
              {inventoryAlerts.slice(alertPage * alertRowsPerPage, alertPage * alertRowsPerPage + alertRowsPerPage).map((alert, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Box sx={{
                    p: 1.5, background: alert.soLuongTon <= 0 ? '#fff5f5' : '#fffbee',
                    borderRadius: 1, borderLeft: `4px solid ${alert.soLuongTon <= 0 ? '#f5576c' : '#ffa726'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%'
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{alert.tenSP}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Mã: {alert.maSP} | Kho: {alert.tenKho}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: alert.soLuongTon <= 0 ? '#f5576c' : '#ffa726' }}>
                        Tồn: {alert.soLuongTon} / {alert.mucToiThieu}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {inventoryAlerts.length > alertRowsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <TablePagination
                  rowsPerPageOptions={[3, 6, 12]}
                  component="div"
                  count={inventoryAlerts.length}
                  rowsPerPage={alertRowsPerPage}
                  page={alertPage}
                  onPageChange={(e, p) => setAlertPage(p)}
                  onRowsPerPageChange={(e) => { setAlertRowsPerPage(parseInt(e.target.value, 10)); setAlertPage(0); }}
                  labelRowsPerPage="Dòng:"
                  size="small"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <DataTable 
        rows={procurements}
        columns={[
          { 
            field: 'maPN', 
            headerName: 'Mã Phiếu', 
            width: 120,
            renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>{params.value}</Typography>
          },
          { 
            field: 'ngayNhap', 
            headerName: 'Ngày Lập', 
            width: 150,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN')
          },
          { field: 'tenNhaCungCap', headerName: 'Nhà Cung Cấp', flex: 1.5, minWidth: 200 },
          { 
            field: 'tongTien', 
            headerName: 'Tổng Tiền', 
            width: 150,
            renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{params.value?.toLocaleString()} đ</Typography>
          },
          { field: 'tenNhanVien', headerName: 'Người Lập', flex: 1 },
          { 
            field: 'trangThai', 
            headerName: 'Trạng Thái', 
            width: 180,
            renderCell: (params) => <Chip label={params.value} color={getStatusColor(params.value)} size="small" />
          },
          {
            field: 'actions',
            headerName: 'Tác Vụ',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
              <Box>
                <Tooltip title="Xem Chi Tiết">
                  <IconButton color="info" onClick={() => handleOpenView(params.row)}><VisibilityIcon /></IconButton>
                </Tooltip>
                {params.row.trangThai === 'Đã Duyệt' && isNhanVienKho && (
                  <Tooltip title="Nhập Kho (Nghiệm thu)">
                    <IconButton color="success" onClick={() => handleOpenReceive(params.row)}><LocalShippingIcon /></IconButton>
                  </Tooltip>
                )}
              </Box>
            )
          }
        ]}
        getRowId={(row) => row.maPhieuNhap}
        loading={loading}
        dateField="ngayNhap"
      />

      {/* DIALOG: LẬP ĐỀ XUẤT */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Tạo Phiếu Đề Xuất Nhập Hàng Mới</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Ghi chú / Lý do đề xuất (Dùng chung cho cả lô hàng)"
              value={newProposal.note}
              fullWidth
              onChange={e => setNewProposal({ ...newProposal, note: e.target.value })}
            />
          </Box>

          {/* Thêm sản phẩm */}
          <Box sx={{ background: '#f5f6fa', p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Thêm sản phẩm cần nhập:</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', background: '#f5f7ff', p: 2, borderRadius: 2 }}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={categories}
                getOptionLabel={(opt) => opt.tenLoai}
                value={selectedCategory}
                onChange={(e, val) => {
                  setSelectedCategory(val);
                  setProductSelect(null);
                }}
                renderInput={(params) => <TextField {...params} label="1. Lọc theo Nhóm hàng" size="small" />}
              />
              <Autocomplete
                sx={{ flex: 1.5 }}
                options={products.filter(p => !selectedCategory || p.maLoaiSP === selectedCategory.maLoaiSanPham)}
                getOptionLabel={(opt) => `${opt.maSP} - ${opt.tenSP}`}
                value={productSelect}
                onChange={(e, val) => handleProductSelect(val)}
                renderInput={(params) => (
                  <Box sx={{ position: 'relative' }}>
                    <TextField 
                      {...params} 
                      label="2. Chọn sản phẩm cụ thể" 
                      size="small" 
                    />
                    {productSelect && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          position: 'absolute', 
                          bottom: -20, 
                          left: 0, 
                          color: 'primary.main', 
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Hiện có: {productSelect.soLuongTon} {productSelect.donViTinh}
                      </Typography>
                    )}
                  </Box>
                )}
              />
              <TextField label="S.Lượng đề xuất" type="number" sx={{ width: 120 }} size="small" value={qtySelect} onChange={e => setQtySelect(e.target.value)} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Autocomplete
                sx={{ flex: 1.5 }}
                options={warehouses}
                getOptionLabel={(opt) => `${opt.tenKho} (${opt.loaiKho || 'Khác'})`}
                value={warehouseSelect}
                onChange={(e, val) => setWarehouseSelect(val)}
                renderInput={(params) => <TextField {...params} label="3. Chọn kho nhập dự kiến" size="small" />}
              />
              <Button variant="contained" onClick={handleAddItem} sx={{ background: '#667eea', height: 40, px: 4 }}>Thêm vào đơn</Button>
            </Box>

            {/* Price comparison panel - INLINE SELECTION */}
            {priceLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: 2, color: 'text.secondary' }}>
                <CircularProgress size={16} /> <Typography variant="body2">Đang tải giá từ các NCC...</Typography>
              </Box>
            )}

            <Collapse in={showInlineSuppliers}>
              <Box sx={{ mt: 1, mb: 3 }}>
                <DataTable
                  rows={priceHistory.map((h, idx) => ({ ...h, id: idx }))}
                  columns={[
                    { 
                      field: 'tenNCC', 
                      headerName: 'Nhà Cung Cấp', 
                      flex: 1,
                      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{params.value}</Typography>
                    },
                    { 
                      field: 'loai', 
                      headerName: 'Loại dữ liệu', 
                      width: 150,
                      renderCell: (params) => (
                        <Chip label={params.value} size="small" variant="outlined" color={params.value === "Giá chào hàng" ? "primary" : "default"} />
                      )
                    },
                    { 
                      field: 'giaHienTai', 
                      headerName: 'Đơn Giá', 
                      width: 150,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params) => (
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {params.value?.toLocaleString()} đ
                        </Typography>
                      )
                    },
                    { 
                      field: 'ngayCapNhat', 
                      headerName: 'Cập nhật cuối', 
                      width: 150,
                      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN')
                    },
                    {
                      field: 'actions',
                      headerName: 'Thao Tác',
                      width: 120,
                      sortable: false,
                      filterable: false,
                      align: 'center',
                      headerAlign: 'center',
                      renderCell: (params) => {
                        const h = params.row;
                        const isActive = supplierSelect?.maNCC === h.maNCC && priceSelect === h.giaHienTai;
                        return (
                          <Button 
                            variant={isActive ? "outlined" : "contained"} 
                            size="small"
                            color={isActive ? "success" : "primary"}
                            sx={{ fontWeight: 'bold' }}
                            onClick={() => {
                              setSupplierSelect({ maNCC: h.maNCC, tenNCC: h.tenNCC });
                              setPriceSelect(h.giaHienTai);
                            }}
                            disabled={isActive}
                          >
                            {isActive ? 'ĐÃ CHỌN' : 'CHỌN'}
                          </Button>
                        );
                      }
                    }
                  ]}
                  pageSize={5}
                  sx={{ height: 350 }}
                />
              </Box>
            </Collapse>

          </Box>

          <Table size="small">
            <TableHead sx={{ bgcolor: 'rgba(102,126,234,0.06)' }}><TableRow>
              <TableCell sx={{ width: 50 }}>STT</TableCell>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Nhà cung cấp</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>S.Lượng</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>Giá nhập</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>Thành tiền</TableCell>
              <TableCell sx={{ width: 48 }}></TableCell>
            </TableRow></TableHead>
            <TableBody>
              {newProposal.items.map((item, idx) => (
                <TableRow key={item.itemKey} sx={{ verticalAlign: 'top' }}>
                  <TableCell sx={{ pt: 1.5 }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.tenSanPham}</Typography>
                    <Typography variant="caption" color="textSecondary">Kho: {item.tenKho}</Typography>
                  </TableCell>
                  {/* Supplier - read only display */}
                  <TableCell>
                    <Chip label={item.tenNhaCungCap || '—'} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  {/* Inline quantity edit */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={item.soLuong}
                      onChange={e => updateItem(item.itemKey, { soLuong: Math.max(1, Number(e.target.value)) })}
                      inputProps={{ min: 1, style: { textAlign: 'center', width: 60 } }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  {/* Price - read only */}
                  <TableCell align="right" sx={{ color: 'text.primary' }}>
                    {item.donGia?.toLocaleString()} đ
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main', pt: 1.5 }}>
                    {(item.soLuong * item.donGia).toLocaleString()} đ
                  </TableCell>
                  <TableCell sx={{ pt: 1 }}>
                    <IconButton size="small" color="error" onClick={() => removeItem(item.itemKey)}><CancelOutlinedIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {newProposal.items.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có sản phẩm nào. Hãy chọn sản phẩm và nhà CC bên trên rồi nhấn "Đặt hàng".</TableCell></TableRow>}
              {newProposal.items.length > 0 && (
                <TableRow sx={{ bgcolor: 'rgba(102,126,234,0.04)', fontWeight: 'bold' }}>
                  <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>Tổng cộng:</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1rem' }}>
                    {newProposal.items.reduce((s, x) => s + x.soLuong * x.donGia, 0).toLocaleString()} đ
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitProposal} disabled={actionLoading}>GỬI ĐỀ XUẤT CHO QUẢN LÝ</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: XEM CHI TIẾT HOẶC NGHIỆM THU HOẶC DUYỆT */}
      {viewDialog && (
        <Dialog open={true} onClose={() => { setViewDialog(null); setItemActions({}); setItemSearch(''); }} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" fontWeight="bold">Phiếu: {viewDialog.maPN}</Typography>
              <Chip label={viewDialog.trangThai} color={getStatusColor(viewDialog.trangThai)} size="small" />
            </Box>

            {/* Export & Share Actions */}
            {(viewDialog.trangThai === 'Đã Duyệt' || viewDialog.trangThai === 'Hoàn Thành') && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Xuất PDF">
                  <IconButton size="small" color="error" onClick={() => handleExport(viewDialog.maPhieuNhap, 'pdf', viewDialog.maPN)}>
                    <PictureAsPdfIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xuất Excel">
                  <IconButton size="small" color="success" onClick={() => handleExport(viewDialog.maPhieuNhap, 'excel', viewDialog.maPN)}>
                    <GetAppIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              {viewDialog.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Autocomplete
                    options={suppliers}
                    getOptionLabel={(opt) => opt.tenNCC}
                    value={suppliers.find(s => Number(s.maNhaCungCap || s.maNCC) === Number(viewDialog.maNhaCungCap)) || null}
                    onChange={(e, val) => {
                       if (val) setViewDialog({ ...viewDialog, maNhaCungCap: Number(val.maNhaCungCap || val.maNCC), tenNhaCungCap: val.tenNCC });
                    }}
                    size="small"
                    renderInput={(params) => <TextField {...params} label="Chọn Lại Nhà Cung Cấp" />}
                  />
                  <Typography><b>Ngày lập:</b> {new Date(viewDialog.ngayNhap).toLocaleString('vi-VN')}</Typography>
                  <TextField 
                    label="Ghi chú chỉnh sửa" fullWidth size="small" multiline rows={2}
                    value={viewDialog.ghiChu} 
                    onChange={(e) => setViewDialog({ ...viewDialog, ghiChu: e.target.value })}
                  />
                </Box>
              ) : (
                <>
                  <Typography><b>Nhà cc:</b> {viewDialog.tenNhaCungCap}</Typography>
                  <Typography><b>Ngày lập:</b> {new Date(viewDialog.ngayNhap).toLocaleString('vi-VN')}</Typography>
                  <Typography><b>Ghi chú:</b> {viewDialog.ghiChu}</Typography>
                </>
              )}
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              {viewDialog.mode === 'receive'
                ? '🔔 Tiến hành đếm và nghiệm thu hàng hóa thực tế do NCC giao tới.'
                : isApprovalMode
                  ? '🔔 Chọn quyết định Duyệt, Sửa hoặc Từ chối cho từng mặt hàng trước khi Lưu thay đổi.'
                  : 'Chi tiết các mặt hàng yêu cầu'}
            </Alert>

            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm sản phẩm trong danh sách (Tên hoặc Mã)..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { md: '3fr 1fr' }, gap: 4 }}>
              <Box>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    height: 600, 
                    borderRadius: '16px', 
                    border: '1px solid #eef2f6', 
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
                  }}
                >
                  <DataTable 
                    rows={viewDialog.chiTiet.filter(c => {
                      const matchSearch = (c.tenSanPham + (c.maSanPham || '')).toLowerCase().includes(itemSearch.toLowerCase());
                      return matchSearch;
                    }).map((c, idx) => ({ ...c, id: c.maCTPN || `item-${idx}`, stt: idx + 1 }))}
                    columns={[
                      { field: 'stt', headerName: 'STT', width: 60 },
                      { 
                        field: 'tenSanPham', 
                        headerName: 'Tên Sản Phẩm', 
                        flex: 2,
                        minWidth: 250,
                        renderCell: (params) => (
                          <Box sx={{ py: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{params.value}</Typography>
                            <Typography variant="caption" sx={{ px: 1, py: 0.2, bgcolor: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>
                              mã: {params.row.maSanPham}
                            </Typography>
                          </Box>
                        )
                      },
                      { 
                        field: 'tenNhaCungCap', 
                        headerName: 'Nhà Cung Cấp', 
                        width: 180,
                        renderCell: (params) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={params.value || '---'} 
                              size="small" 
                              variant="outlined" 
                              sx={{ borderRadius: '8px', fontWeight: 700, border: '1px solid #e2e8f0', color: '#334155' }} 
                            />
                            {isApprovalMode && (
                               <Tooltip title="Chọn nhà cung cấp khác">
                                 <IconButton size="small" onClick={async () => {
                                     setPriceLoading(true); 
                                     try { 
                                       const res = await api.get(`/procurement/price-compare/${params.row.maSanPham}`); 
                                       setPriceHistory(res.data); 
                                       setEditingProductId(params.row.maSanPham); 
                                       setShowPriceCompare(true); 
                                     } catch (e) { console.error(e); } 
                                     finally { setPriceLoading(false); } 
                                 }}>
                                    <FilterListIcon fontSize="inherit" />
                                 </IconButton>
                               </Tooltip>
                            )}
                          </Box>
                        )
                      },
                      { 
                        field: 'donGia', 
                        headerName: 'Đơn Giá', 
                        width: 160,
                        renderCell: (params) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0ea5e9' }}>
                               {params.value?.toLocaleString()} đ
                            </Typography>
                            {(isApprovalMode || (viewDialog.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho && params.row.trangThai === 'Yêu Cầu Sửa')) && (
                              <IconButton 
                                size="small" 
                                sx={{ bgcolor: '#f0f9ff', color: '#0ea5e9', '&:hover': { bgcolor: '#e0f2fe' } }}
                                onClick={async () => { 
                                  setPriceLoading(true); 
                                  try { 
                                    const res = await api.get(`/procurement/price-compare/${params.row.maSanPham}`); 
                                    setPriceHistory(res.data); 
                                    setEditingProductId(params.row.maSanPham); 
                                    setShowPriceCompare(true); 
                                  } catch (e) { console.error(e); } 
                                  finally { setPriceLoading(false); } 
                                }}
                              >
                                <CompareArrowsIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )
                      },
                      {
                        field: 'actions',
                        headerName: isApprovalMode ? 'Quyết Định' : 'Trạng Thái',
                        width: 240,
                        sortable: false,
                        filterable: false,
                        headerAlign: 'center',
                        renderHeader: () => {
                          if (!isApprovalMode) return <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569' }}>TRẠNG THÁI</Typography>;
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', letterSpacing: 1 }}>HÀNH ĐỘNG NHANH</Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Duyệt tất cả">
                                  <IconButton size="small" sx={{ color: '#10b981', border: '1.5px solid #10b981', '&:hover': { bgcolor: '#ecfdf5' } }} onClick={() => {
                                    const next = { ...itemActions };
                                    viewDialog.chiTiet.forEach(c => next[c.maCTPN] = 'approve');
                                    setItemActions(next);
                                  }}><CheckCircleOutlineIcon fontSize="small" /></IconButton>
                                </Tooltip>
                                <Tooltip title="Yêu cầu sửa tất cả">
                                  <IconButton size="small" sx={{ color: '#f59e0b', border: '1.5px solid #f59e0b', '&:hover': { bgcolor: '#fffbeb' } }} onClick={() => {
                                    const next = { ...itemActions };
                                    viewDialog.chiTiet.forEach(c => next[c.maCTPN] = 'revise');
                                    setItemActions(next);
                                  }}><CompareArrowsIcon fontSize="small" /></IconButton>
                                </Tooltip>
                                <Tooltip title="Từ chối tất cả">
                                  <IconButton size="small" sx={{ color: '#ef4444', border: '1.5px solid #ef4444', '&:hover': { bgcolor: '#fef2f2' } }} onClick={() => {
                                    const next = { ...itemActions };
                                    viewDialog.chiTiet.forEach(c => next[c.maCTPN] = 'reject');
                                    setItemActions(next);
                                  }}><BlockIcon fontSize="small" /></IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          );
                        },
                        renderCell: (params) => {
                          if (!isApprovalMode) return getItemStatusChip(params.row);
                          const maCTPN = params.row.maCTPN;
                          const currentAction = itemActions[maCTPN];
                          
                          // Nếu món này đã được tách sang phiếu khác, không cho chọn lại hành động
                          const isSplit = params.row.maPhieuHienTai && params.row.maPhieuHienTai !== viewDialog?.maPhieuNhap;
                          if (isSplit) return getItemStatusChip(params.row);

                          return (
                            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', width: '100%' }}>
                              <Tooltip title="Duyệt">
                                <Button 
                                  size="small" variant={currentAction === 'approve' ? 'contained' : 'outlined'}
                                  color="success" sx={{ minWidth: 44, borderRadius: '10px', p: 1 }}
                                  onClick={() => setItemActions(prev => ({ ...prev, [maCTPN]: 'approve' }))}
                                >
                                  <CheckCircleOutlineIcon fontSize="small" />
                                </Button>
                              </Tooltip>
                              <Tooltip title="Yêu cầu sửa">
                                <Button 
                                  size="small" variant={currentAction === 'revise' ? 'contained' : 'outlined'}
                                  color="warning" sx={{ minWidth: 44, borderRadius: '10px', p: 1 }}
                                  onClick={() => setItemActions(prev => ({ ...prev, [maCTPN]: 'revise' }))}
                                >
                                  <CompareArrowsIcon fontSize="small" />
                                </Button>
                              </Tooltip>
                              <Tooltip title="Từ chối">
                                <Button 
                                  size="small" variant={currentAction === 'reject' ? 'contained' : 'outlined'}
                                  color="error" sx={{ minWidth: 44, borderRadius: '10px', p: 1 }}
                                  onClick={() => setItemActions(prev => ({ ...prev, [maCTPN]: 'reject' }))}
                                >
                                  <BlockIcon fontSize="small" />
                                </Button>
                              </Tooltip>
                            </Box>
                          );
                        }
                      },
                      {
                        field: 'ghiChu',
                        headerName: 'Ghi Chú',
                        width: 250,
                        renderCell: (params) => {
                          const isItemEditable = (viewDialog.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho && params.row.trangThai === 'Yêu Cầu Sửa');
                          if (!isApprovalMode && !isItemEditable) return <Typography variant="caption">{params.value || params.row.ghiChu || '---'}</Typography>;
                          
                          const maCTPN = params.row.maCTPN;
                          const action = isApprovalMode ? itemActions[maCTPN] : 'revise'; // NV kho mặc định là sửa nếu được cho phép
                          const isRequired = isApprovalMode && (action === 'revise' || action === 'reject');
                          const idx = viewDialog.chiTiet.findIndex(x => x.maCTPN === maCTPN);
                          
                          return (
                            <NoteInput 
                              value={params.row.ghiChu || ''}
                              action={action}
                              isRequired={isRequired}
                              onChange={(val) => handleEditItemValue(idx, 'ghiChu', val)}
                            />
                          );
                        }
                      },
                      { 
                        field: 'soLuong', 
                        headerName: 'S.Lượng', 
                        width: 100,
                        renderCell: (params) => {
                          const isEditable = isApprovalMode || (viewDialog.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho && params.row.trangThai === 'Yêu Cầu Sửa');
                          if (isEditable) {
                            return (
                              <TextField 
                                type="number" size="small" 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f8fafc' } }}
                                value={params.value} 
                                onChange={(e) => {
                                  const idx = viewDialog.chiTiet.findIndex(x => x.maCTPN === params.row.maCTPN);
                                  handleEditItemValue(idx, 'soLuong', Number(e.target.value));
                                }} 
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            );
                          }
                          return <Typography variant="body2" sx={{ fontWeight: 800, textAlign: 'center', width: '100%' }}>{params.value}</Typography>;
                        }
                      },
                      {
                        field: 'daNhan',
                        headerName: 'Đã Nhận',
                        width: 120,
                        hide: isApprovalMode || viewDialog.mode === 'receive' || viewDialog.trangThai === 'Yêu Cầu Sửa',
                        renderCell: (params) => (
                          <Chip 
                            label={params.row.soLuongDaNhan || 0} 
                            color={(params.row.soLuongDaNhan || 0) < params.row.soLuong ? 'error' : 'success'} 
                            size="small" variant="outlined" 
                          />
                        )
                      },
                      {
                        field: 'thucNhan',
                        headerName: 'Thực Nhận',
                        width: 120,
                        hide: viewDialog.mode !== 'receive',
                        renderCell: (params) => (
                          <TextField
                            size="small" type="number" 
                            sx={{ 
                              width: 80,
                              filter: viewDialog.mode !== 'receive' ? 'blur(3px)' : 'none',
                              opacity: viewDialog.mode !== 'receive' ? 0.3 : 1,
                              pointerEvents: viewDialog.mode !== 'receive' ? 'none' : 'auto'
                            }}
                            value={receiveData.find(r => r.maCTPN === params.row.maCTPN)?.soLuongDaNhan || 0}
                            onChange={(e) => handleReceiveChange(params.row.maCTPN, 'soLuongDaNhan', Number(e.target.value))}
                          />
                        )
                      }
                    ]}
                  />
                </Paper>

                {isApprovalMode && (
                  <Paper 
                    elevation={0} 
                    sx={{ p: 2.5, mt: 3, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'center', gap: 6 }}
                  >
                    {(() => {
                      const approveCount = Object.values(itemActions).filter(v => v === 'approve').length;
                      const reviseCount  = Object.values(itemActions).filter(v => v === 'revise').length;
                      const rejectCount  = Object.values(itemActions).filter(v => v === 'reject').length;
                      return (
                        <>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#10b981' }}>{approveCount}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>DUYET</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#f59e0b' }}>{reviseCount}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>CAN SUA</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#ef4444' }}>{rejectCount}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>TU CHOI</Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Paper>
                )}

                {/* Management approval section */}
                {isApprovalMode && (
                  <Paper elevation={0} sx={{ mt: 3, p: 3, borderRadius: '16px', border: '1px solid #fee2e2', bgcolor: '#fff' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ef4444', mb: 2 }}>KHU VUC QUAN LY</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        fullWidth variant="contained" 
                        sx={{ 
                          borderRadius: '12px', py: 1.5, fontWeight: 800, 
                          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)'
                        }}
                        onClick={() => handleUpdateProposal('processed')}
                        disabled={actionLoading}
                      >
                        XU LY PHIEU NGAY
                      </Button>
                    </Box>
                  </Paper>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #eef2f6', bgcolor: '#fff', flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                    LICH SU THAO TAC
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                    {statusHistory.length === 0 ? (
                      <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#94a3b8' }}>Chua co lich su.</Typography>
                    ) : statusHistory.map((h, i) => (
                      <Box key={i} sx={{ position: 'relative', pl: 3.5 }}>
                        {i !== statusHistory.length - 1 && (
                          <Box sx={{ position: 'absolute', left: 8, top: 22, bottom: -20, width: 2, bgcolor: '#f1f5f9' }} />
                        )}
                        <Box sx={{ 
                          position: 'absolute', left: 0, top: 4, width: 18, height: 18, 
                          borderRadius: '50%', bgcolor: i === 0 ? '#6366f1' : '#fff', 
                          border: `3px solid ${i === 0 ? '#6366f1' : '#e2e8f0'}`,
                          boxShadow: i === 0 ? '0 0 0 4px rgba(99, 102, 241, 0.15)' : 'none'
                        }} />
                        <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2, pr: 2 }}>
                            {h.tenNguoiThucHien}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            {new Date(h.ngayThayDoi).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date(h.ngayThayDoi).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ bgcolor: i === 0 ? '#f5f3ff' : '#f8fafc', p: 1.5, borderRadius: '12px', border: `1px solid ${i === 0 ? '#ddd6fe' : '#f1f5f9'}` }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: i === 0 ? '#5b21b6' : '#334155', fontSize: '0.85rem' }}>
                            {h.trangThaiCu ? `${h.trangThaiCu} -> ` : ''} {h.trangThaiMoi}
                          </Typography>
                          {h.noiDungThayDoi && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, p: 1, bgcolor: '#fff', borderRadius: '6px', border: '1px solid #eef2f6', color: '#64748b', fontStyle: 'italic', lineHeight: 1.3 }}>
                              "{h.noiDungThayDoi}"
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>

            {viewDialog.trangThai === 'Yêu Cầu Sửa' && isNhanVienKho && (
              <Button variant="contained" color="warning" onClick={() => handleUpdateProposal()} disabled={actionLoading}>
                GỬI LẠI ĐỀ XUẤT (ĐÃ CHỈNH SỬA)
              </Button>
            )}
            <Button onClick={() => { setViewDialog(null); setItemActions({}); setItemSearch(''); }}>Đóng</Button>
            {viewDialog.mode === 'receive' && isNhanVienKho && (
              <Button variant="contained" color="success" onClick={() => handleReceiveItems(viewDialog.maPhieuNhap)} disabled={actionLoading}>
                Hoàn Tất Nhập Kho (Cộng Tồn Kho)
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* DIALOG: LẬP ĐỀ XUẤT NHANH TỪ CẢNH BÁO */}
      <Dialog open={quickProposalDialog} onClose={() => setQuickProposalDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddShoppingCartIcon color="primary" /> Lập Đề Xuất Nhanh Từ Hàng Sắp Hết
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Tích chọn các sản phẩm bạn muốn nhập thêm. Hệ thống sẽ hỗ trợ chọn nhà cung cấp và giá tốt nhất cho từng mặt hàng.
          </Alert>

          {/* Filters for Quick Proposal */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Tìm theo tên hoặc mã SP..."
              size="small"
              sx={{ flex: 1 }}
              value={quickSearch}
              onChange={(e) => { setQuickSearch(e.target.value); setQuickPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Autocomplete
              sx={{ width: 250 }}
              size="small"
              options={categories}
              getOptionLabel={(opt) => opt.tenLoai}
              value={quickCategory}
              onChange={(e, val) => { setQuickCategory(val); setQuickPage(0); }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Lọc theo Nhóm hàng" 
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterListIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Box>
          
          <Box sx={{ height: 500, mt: 2 }}>
            <DataTable 
              rows={inventoryAlerts.filter(a => {
                const matchSearch = a.tenSP.toLowerCase().includes(quickSearch.toLowerCase()) || 
                                  a.maSP.toLowerCase().includes(quickSearch.toLowerCase());
                const product = products.find(p => p.maSP === a.maSP);
                const matchCat = !quickCategory || (product && product.maLoaiSP === quickCategory.maLoaiSanPham);
                return matchSearch && matchCat;
              })}
              getRowId={(row) => row.maSP}
              checkboxSelection
              rowSelectionModel={Array.from(selectedAlertIds)}
              onRowSelectionModelChange={(newSelection) => setSelectedAlertIds(new Set(newSelection))}
              columns={[
                { 
                  field: 'tenSP', 
                  headerName: 'Sản Phẩm', 
                  flex: 1,
                  renderCell: (params) => (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{params.value}</Typography>
                      <Typography variant="caption" color="textSecondary">Mã: {params.row.maSP}</Typography>
                    </Box>
                  )
                },
                { 
                  field: 'soLuongTon', 
                  headerName: 'Tồn Kho', 
                  width: 120,
                  renderCell: (params) => (
                    <Chip 
                      label={`Tồn: ${params.value}`} 
                      size="small" 
                      color={params.value <= 0 ? 'error' : 'warning'} 
                      variant="outlined"
                    />
                  )
                },
                {
                  field: 'config',
                  headerName: 'Cấu Hình Nhập Hàng',
                  flex: 2,
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => {
                    const alert = params.row;
                    const isSelected = selectedAlertIds.has(alert.maSP);
                    if (!isSelected) return <Typography variant="caption" color="textSecondary">Tích chọn để cấu hình</Typography>;
                    
                    const config = alertConfigs[alert.maSP] || {};
                    if (config.loading) return <CircularProgress size={20} />;
                    
                    return (
                      <Box sx={{ display: 'flex', gap: 1, p: 1, width: '100%', alignItems: 'center' }}>
                        <TextField 
                          label="SL nhập" size="small" type="number" sx={{ width: 100 }}
                          value={config.qty || ''}
                          onChange={(e) => setAlertConfigs(prev => ({
                            ...prev,
                            [alert.maSP]: { ...prev[alert.maSP], qty: Number(e.target.value) }
                          }))}
                        />
                        <Autocomplete
                          size="small" sx={{ width: 220 }}
                          options={suppliers}
                          getOptionLabel={(opt) => opt.tenNCC || opt.tenNhaCungCap || ''}
                          value={config.supplier || null}
                          onChange={(e, val) => {
                            if (!val) {
                              setAlertConfigs(prev => ({ ...prev, [alert.maSP]: { ...prev[alert.maSP], supplier: null } }));
                              return;
                            }
                            const product = products.find(p => p.maSP === alert.maSP);
                            const quoted = (config.prices || []).find(p => p.maNCC === val.maNCC || p.maNCC === val.maNhaCungCap);
                            const supplierToSet = { ...val, giaHienTai: quoted ? quoted.giaHienTai : (product?.giaNhap || 0) };
                            
                            setAlertConfigs(prev => ({
                              ...prev,
                              [alert.maSP]: { ...prev[alert.maSP], supplier: supplierToSet }
                            }));
                          }}
                          renderInput={(params) => <TextField {...params} label="Nhà cung cấp" size="small" />}
                          renderOption={(props, opt) => {
                            const product = products.find(p => p.maSP === alert.maSP);
                            const quoted = (config.prices || []).find(p => p.maNCC === opt.maNCC || p.maNCC === opt.maNhaCungCap);
                            const price = quoted ? quoted.giaHienTai : (product?.giaNhap || 0);
                            return (
                              <li {...props}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                  <Typography variant="body2">{opt.tenNCC || opt.tenNhaCungCap}</Typography>
                                  <Typography variant="caption" sx={{ color: quoted ? 'primary.main' : 'text.secondary', fontWeight: quoted ? 'bold' : 'normal' }}>
                                    {price > 0 ? `${price.toLocaleString()} đ` : 'Chưa có giá'}
                                  </Typography>
                                </Box>
                              </li>
                            );
                          }}
                        />
                        <TextField 
                          label="Đơn giá" size="small" type="text" sx={{ width: 140 }}
                          value={config.supplier?.giaHienTai ? `${config.supplier.giaHienTai.toLocaleString()} đ` : ''}
                          disabled
                          InputProps={{ readOnly: true }}
                        />
                      </Box>
                    );
                  }
                }
              ]}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, background: '#f8f9fa' }}>
          <Button onClick={() => setQuickProposalDialog(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            color="primary"
            disabled={selectedAlertIds.size === 0 || actionLoading}
            onClick={handleSubmitQuickProposal}
            sx={{ px: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : `GỬI ĐỀ XUẤT (${selectedAlertIds.size} MẶT HÀNG)`}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

// Sub-component to handle stable input for Notes (prevent cursor jumps and IME doubling)
const NoteInput = ({ value, action, isRequired, onChange }) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <TextField 
      size="small" fullWidth 
      placeholder={isRequired ? "Bắt buộc nhập lý do..." : "Không cần ghi chú"}
      value={localValue || ''}
      disabled={action === 'approve'}
      error={isRequired && !localValue}
      sx={{ 
        '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: action === 'approve' ? '#f1f5f9' : '#fff' },
        filter: action === 'approve' ? 'grayscale(1) opacity(0.5)' : 'none'
      }}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) {
          onChange(localValue);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === ' ') e.stopPropagation();
      }}
    />
  );
};

export default ProcurementPage;
