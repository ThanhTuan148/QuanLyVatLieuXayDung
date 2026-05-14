import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Chip, IconButton, Tooltip, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Autocomplete, Tabs, Tab, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import api from '../services/api';
import supplierService from '../services/supplierService';
import DataTable from '../components/DataTable';

const formatVND = (v) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '0 ₫';

export default function ReturnsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [supplierReturns, setSupplierReturns] = useState([]);
  const [customerReturns, setCustomerReturns] = useState([]);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const roleStr = String(user?.role || user?.Role || user?.roleName || '').trim().toLowerCase();
  const isNhanVien = roleStr.includes('nhân viên');
  const isQuanLy = roleStr.includes('quản lý');
  const userId = user?.id || user?.maNhanVien || 0;

  const [suppDialogOpen, setSuppDialogOpen] = useState(false);
  const [pendingImports, setPendingImports] = useState([]);
  const [selectedPending, setSelectedPending] = useState(null);
  const [suppReason, setSuppReason] = useState('');

  const [custDialogOpen, setCustDialogOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [custItems, setCustItems] = useState([]);
  const [custReason, setCustReason] = useState('');

  const [pivotDialogOpen, setPivotDialogOpen] = useState(false);
  const [pivotData, setPivotData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [pivotItems, setPivotItems] = useState([]);
  const [pivotPriceHistories, setPivotPriceHistories] = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [selectedPivotItemIdx, setSelectedPivotItemIdx] = useState(null);

  const [previewImg, setPreviewImg] = useState(null);
  const [viewingItems, setViewingItems] = useState(null);
  const [selectedCTDTs, setSelectedCTDTs] = useState(new Set());

  useEffect(() => { loadData(); }, [tabValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        const res = await api.get('/returns/supplier');
        setSupplierReturns(res.data || []);
      } else {
        const res = await api.get('/returns/customer');
        setCustomerReturns(res.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpenSuppDialog = async () => {
    setSuppDialogOpen(true);
    try {
      const res = await api.get('/returns/supplier/pending-imports');
      setPendingImports(res.data);
    } catch(e) { console.error(e); }
  };

  const handleCreateSupp = async () => {
    if(!selectedPending) return alert("Vui lòng chọn Phiếu nhập còn thiếu.");
    try {
      await api.post('/returns/supplier', {
        maPhieuNhap: selectedPending.maPhieuNhap,
        maNhanVien: userId,
        lyDo: suppReason
      });
      alert('Đã tạo phiếu đăng ký đổi trả Nhà Cung Cấp thành công!');
      setSuppDialogOpen(false);
      loadData();
    } catch(e) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const handleApproveSupp = async (id) => {
    if(!window.confirm("Quản lý xác nhận phê duyệt đề nghị đổi trả này?")) return;
    try {
      await api.put(`/returns/supplier/${id}/approve`);
      loadData();
    } catch(e) { alert(e.response?.data?.message || "Lỗi duyệt"); }
  };

  const handleReceiveSupp = async (id) => {
    if(!window.confirm("Xác nhận: Hàng bù/đổi của NCC đã về tới kho?")) return;
    try {
      await api.put(`/returns/supplier/${id}/receive`);
      loadData();
    } catch(e) { 
      const msg = e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response?.data : null) || "Lỗi nhập kho";
      alert(msg); 
    }
  };

  const handleOpenCustDialog = async () => {
    setCustDialogOpen(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data.filter(x => x.trangThai === 'Hoàn Thành' || x.trangThai === 'Hoàn thành'));
    } catch(e) { console.error(e); }
  };

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    if(order) {
      try {
        const res = await api.get(`/returns/customer/by-order/${order.maHoaDon || order.id}`);
        setCustItems(res.data.map(i => ({...i, slTra: 0})));
      } catch(e) { console.error(e); }
    } else { setCustItems([]); }
  };

  const handleCreateCust = async () => {
    const itemsToReturn = custItems.filter(i => i.slTra > 0);
    if(itemsToReturn.length === 0) return alert('Vui lòng nhập số lượng trả.');
    try {
      await api.post('/returns/customer', {
        maHoaDon: selectedOrder.maHoaDon || selectedOrder.id,
        maNhanVien: userId,
        lyDo: custReason,
        items: itemsToReturn.map(i => ({ maSanPham: i.maSanPham, soLuong: i.slTra, donGia: i.donGia }))
      });
      setCustDialogOpen(false);
      loadData();
    } catch(e) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const handleApproveItems = async (ctdtIds, status = 'Đã Duyệt') => {
    try {
      await api.put('/returns/customer/approve-items', { maCTDTs: ctdtIds, status });
      loadData();
      if (viewingItems) {
         const res = await api.get('/returns/customer');
         const updatedRow = res.data.find(r => r.maPhieuDT === viewingItems.maPhieuDT);
         if (updatedRow) setViewingItems(updatedRow);
      }
    } catch (err) { alert('Lỗi: ' + (err.response?.data?.message || err.message)); }
  };

  const handleApproveCust = async (row) => {
    const pendingIds = row.items.filter(it => it.trangThai === 'Chờ duyệt').map(it => it.maCTDT);
    if (pendingIds.length === 0) return alert('Không có mặt hàng nào chờ duyệt.');
    handleApproveItems(pendingIds, 'Đã Duyệt');
  };

  const handleReceiveCust = async (id) => {
    if(!window.confirm("Xác nhận đã nhận lại hàng lỗi từ khách?")) return;
    try {
      await api.put(`/returns/customer/${id}/receive`);
      loadData();
    } catch(e) { 
      const msg = e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response?.data : null) || "Lỗi nhập kho";
      alert(msg); 
    }
  };

  const handleOpenPivotDialog = async (row) => {
    setPivotData(row);
    try {
      const res = await supplierService.getAllSuppliers();
      setSuppliers(res.data || []);
      if (row.chiTiet) {
        setPivotItems(row.chiTiet.map(c => ({
          maSanPham: c.maSanPham, tenSanPham: c.tenSanPham, quantity: c.soLuongTra, price: c.donGia
        })));
        setPriceLoading(true);
        const histories = {};
        for(const c of row.chiTiet) {
          try {
            const priceRes = await api.get(`/procurement/price-compare/${c.maSanPham}`);
            histories[c.maSanPham] = priceRes.data || [];
          } catch (e) { histories[c.maSanPham] = []; }
        }
        setPivotPriceHistories(histories);
        setPriceLoading(false);
        setSelectedPivotItemIdx(0);
      }
    } catch (e) { console.error(e); }
    setPivotDialogOpen(true);
  };

  const handlePivotSubmit = async () => {
    const hasUnselected = pivotItems.some(i => !i.newSupplierId);
    if (hasUnselected) return alert("Vui lòng chọn NCC mới cho TẤT CẢ sản phẩm!");
    try {
      await api.put(`/returns/supplier/${pivotData.maPhieuTra}/pivot-supplier`, {
        userId,
        newItems: pivotItems.map(i => ({ maSanPham: i.maSanPham, quantity: i.quantity, price: i.price, newSupplierId: i.newSupplierId }))
      });
      setPivotDialogOpen(false);
      loadData();
    } catch (e) { alert(e.response?.data?.message || "Lỗi khi chuyển đổi NCC"); }
  };

  const supplierColumns = [
    { field: 'maPT', headerName: 'Mã', width: 100, renderCell: (params) => <b>{params.value}</b> },
    { field: 'maPN', headerName: 'Phiếu Nhập', width: 120, renderCell: (params) => <Chip label={params.value} size="small" /> },
    { field: 'tenNhaCungCap', headerName: 'Nhà Cung Cấp', flex: 1.2 },
    { field: 'tongTienHoan', headerName: 'Giá Trị', width: 130, renderCell: (params) => formatVND(params.value) },
    { field: 'lyDo', headerName: 'Lý Do', flex: 1 },
    { 
      field: 'trangThai', 
      headerName: 'Trạng Thái', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'Hoàn Tất' ? 'success' : params.value === 'Đang Chờ Hàng Về' ? 'secondary' : 'warning'} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Tác Vụ',
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const p = params.row;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
             {isQuanLy && p.trangThai === 'Chờ Duyệt Trả' && (
                <Button size="small" variant="contained" onClick={() => handleApproveSupp(p.maPhieuTra)}>Duyệt</Button>
              )}
              {isNhanVien && p.trangThai === 'Đang Chờ Hàng Về' && (
                <>
                  <Button size="small" variant="contained" color="success" onClick={() => handleReceiveSupp(p.maPhieuTra)}>Nhập Kho</Button>
                  <Tooltip title="Chuyển sang NCC khác">
                    <Button size="small" variant="outlined" startIcon={<SwapHorizIcon />} onClick={() => handleOpenPivotDialog(p)}>Chuyển</Button>
                  </Tooltip>
                </>
              )}
          </Box>
        );
      }
    }
  ];

  const customerColumns = [
    { field: 'maDT', headerName: 'Mã Phiếu', width: 100, renderCell: (params) => <b>{params.value}</b> },
    { field: 'maHD', headerName: 'Hóa Đơn', width: 110, renderCell: (params) => <Chip label={params.value} size="small" /> },
    { field: 'tenKhachHang', headerName: 'Khách Hàng', flex: 1 },
    { field: 'ngayDT', headerName: 'Ngày Trả', width: 120, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'tongTienHoan', headerName: 'Tiền Hoàn', width: 130, renderCell: (params) => formatVND(params.value) },
    { 
      field: 'loai', 
      headerName: 'Loại', 
      width: 100,
      renderCell: (params) => <Chip label={params.value || 'Trả hàng'} size="small" color={params.value === 'Đổi hàng' ? 'info' : 'warning'} variant="outlined" />
    },
    {
        field: 'items_list',
        headerName: 'Chi Tiết',
        width: 110,
        renderCell: (params) => (
            <Button size="small" variant="outlined" onClick={() => { setViewingItems(params.row); setSelectedCTDTs(new Set()); }}>
                {params.row.items?.length || 0} mục
            </Button>
        )
    },
    { 
      field: 'trangThai', 
      headerName: 'Trạng Thái', 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Chip label={params.value} color={params.value === 'Hoàn Tất' ? 'success' : params.value.includes('Đã Duyệt') ? 'info' : 'warning'} size="small" />
          <Chip label={params.row.trangThaiNhapKho || 'Chưa nhập kho'} variant="outlined" size="small" />
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Tác Vụ',
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const p = params.row;
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
             {isQuanLy && (p.trangThai === 'Chờ Xử Lý' || p.trangThai.includes('Duyệt một phần')) && (
               <Button size="small" variant="contained" onClick={() => handleApproveCust(p)}>Duyệt Hết</Button>
             )}
             {isNhanVien && (p.trangThai.includes('Đã Duyệt') || p.trangThai.includes('một phần')) && p.trangThaiNhapKho !== 'Đã nhập kho' && (p.loai === 'Trả hàng' || p.loai === 'Hỗn hợp') && (
               <Button size="small" variant="contained" color="success" onClick={() => handleReceiveCust(p.maPhieuDT)}>Nhập Kho</Button>
             )}
          </Box>
        );
      }
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>🔄 Quản Lý Đổi / Trả</Typography>
        <Typography color="textSecondary">Xử lý bù trừ hàng với nhà cung cấp và nhận lại hàng lỗi từ khách</Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="secondary" indicatorColor="secondary">
          <Tab label="📦 Đổi trả hàng - Nhà cung cấp" />
          <Tab label="👥 Đổi trả hàng - Khách hàng" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {tabValue === 0 ? (
          isNhanVien && <Button variant="contained" color="warning" onClick={handleOpenSuppDialog}>+ Đăng Ký Đổi Trả NCC</Button>
        ) : (
          isNhanVien && <Button variant="contained" color="secondary" onClick={handleOpenCustDialog}>+ Tiếp Nhận Khách Trả Lỗi</Button>
        )}
      </Box>

      <DataTable 
        rows={tabValue === 0 ? supplierReturns : customerReturns}
        columns={tabValue === 0 ? supplierColumns : customerColumns}
        getRowId={(row) => row.maPhieuTra || row.maPhieuDT}
        loading={loading}
      />

      {/* MODALS remain largely similar but with some cleanup */}
      <Dialog open={suppDialogOpen} onClose={() => setSuppDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lập Phiếu Đổi/Trả Cho Nhà Cung Cấp</DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            options={pendingImports}
            getOptionLabel={(opt) => `${opt.maPN} - ${opt.tenNhaCungCap} (${opt.chiTietLoi.length} mục)`}
            onChange={(e, val) => setSelectedPending(val)}
            renderInput={(params) => <TextField {...params} label="Chọn Phiếu Nhập Thiếu / Lỗi" fullWidth sx={{ mb: 2 }} />}
          />
          {selectedPending && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">Chi Tiết:</Typography>
              <ul>{selectedPending.chiTietLoi.map(c => <li key={c.maSanPham}>{c.tenSanPham} - Thiếu: <b>{c.soLuongThieu}</b></li>)}</ul>
            </Box>
          )}
          <TextField label="Lý do" fullWidth multiline rows={2} value={suppReason} onChange={e => setSuppReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuppDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="warning" onClick={handleCreateSupp}>Gửi Đề Nghị</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={custDialogOpen} onClose={() => setCustDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mở Hồ Sơ Khách Trả Hàng</DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            options={orders}
            getOptionLabel={(opt) => `${opt.maHD || 'HD'+opt.id} - ${opt.khachHang?.tenKH || opt.tenKH || 'Khách'}`}
            onChange={(e, val) => handleSelectOrder(val)}
            renderInput={(params) => <TextField {...params} label="Truy xuất Hóa đơn cũ" fullWidth sx={{ mb: 2 }} />}
          />
          {custItems.length > 0 && (
            <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>Sản phẩm</TableCell><TableCell>SL Mua</TableCell><TableCell>Nhập SL Trả</TableCell></TableRow></TableHead>
                <TableBody>
                  {custItems.map((c, i) => (
                    <TableRow key={c.maSanPham}>
                      <TableCell>{c.tenSanPham}</TableCell><TableCell>{c.soLuongMua}</TableCell>
                      <TableCell><TextField type="number" size="small" sx={{ width: 70 }} inputProps={{ min: 0, max: c.soLuongMua }} value={c.slTra} onChange={e => setCustItems(prev => prev.map((itm, idx) => idx === i ? {...itm, slTra: Number(e.target.value)} : itm))} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TextField label="Lý do" fullWidth multiline rows={2} value={custReason} onChange={e => setCustReason(e.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setCustDialogOpen(false)}>Hủy</Button><Button variant="contained" color="secondary" onClick={handleCreateCust}>Tạo Báo Cáo</Button></DialogActions>
      </Dialog>

      <Dialog open={pivotDialogOpen} onClose={() => setPivotDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Chuyển NCC nhập bù cho phiếu {pivotData?.maPT}</DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#eee' }}>
                <TableRow><TableCell>Sản phẩm</TableCell><TableCell>SL thiếu</TableCell><TableCell>NCC Đã Chọn</TableCell><TableCell align="center">Thao tác</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {pivotItems.map((item, idx) => {
                  const selectedSupp = suppliers.find(s => s.maNhaCungCap === item.newSupplierId || s.maNCC === item.newSupplierId);
                  const isSelected = selectedPivotItemIdx === idx;
                  return (
                    <TableRow key={item.maSanPham} sx={{ bgcolor: isSelected ? '#f0fdf4' : 'inherit' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{item.tenSanPham}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.newSupplierId ? <Typography variant="body2" color="primary.main" fontWeight="bold">{selectedSupp?.tenNCC || item.newSupplierId}</Typography> : <Typography variant="body2" color="error">Chưa chọn</Typography>}</TableCell>
                      <TableCell align="center"><Button variant={isSelected ? "contained" : "outlined"} size="small" onClick={() => setSelectedPivotItemIdx(idx)}>{item.newSupplierId ? "Đổi" : "Chọn"}</Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {selectedPivotItemIdx !== null && pivotItems[selectedPivotItemIdx] && (
            <Box sx={{ border: '1px solid #e0e7ff', borderRadius: 2, overflow: 'hidden' }}>
                <Typography variant="subtitle2" sx={{ p: 1, background: '#f5f7ff', fontWeight: 'bold' }}>Báo giá NCC: {pivotItems[selectedPivotItemIdx].tenSanPham}</Typography>
                <Table size="small">
                    <TableHead><TableRow><TableCell>NCC</TableCell><TableCell align="right">Đơn Giá</TableCell><TableCell align="center">Thao Tác</TableCell></TableRow></TableHead>
                    <TableBody>
                        {(pivotPriceHistories[pivotItems[selectedPivotItemIdx].maSanPham] || []).map((h, i) => (
                            <TableRow key={i} hover onClick={() => setPivotItems(prev => prev.map((itm, idx) => idx === selectedPivotItemIdx ? { ...itm, price: h.giaHienTai, newSupplierId: h.maNCC } : itm))}>
                                <TableCell>{h.tenNCC}</TableCell><TableCell align="right">{h.giaHienTai?.toLocaleString('vi-VN')} đ</TableCell>
                                <TableCell align="center"><Button size="small" variant={pivotItems[selectedPivotItemIdx].newSupplierId === h.maNCC ? "contained" : "outlined"} color="success">Chọn</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setPivotDialogOpen(false)}>Hủy</Button><Button variant="contained" onClick={handlePivotSubmit}>Xác nhận Tách Đơn</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(viewingItems)} onClose={() => setViewingItems(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">📦 Chi tiết mặt hàng trả: {viewingItems?.maDT}</Typography>
            {isQuanLy && selectedCTDTs.size > 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                        variant="contained" color="success" size="small"
                        onClick={() => handleApproveItems(Array.from(selectedCTDTs), 'Đã Duyệt')}
                    >
                        Duyệt {selectedCTDTs.size} mục
                    </Button>
                    <Button 
                        variant="outlined" color="error" size="small"
                        onClick={() => handleApproveItems(Array.from(selectedCTDTs), 'Từ chối')}
                    >
                        Từ chối {selectedCTDTs.size} mục
                    </Button>
                </Box>
            )}
        </DialogTitle>
        <DialogContent dividers>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <input 
                                type="checkbox"
                                checked={viewingItems?.items?.filter(it => it.trangThai === 'Chờ duyệt').length > 0 && selectedCTDTs.size === viewingItems?.items?.filter(it => it.trangThai === 'Chờ duyệt').length}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        const pending = viewingItems.items.filter(it => it.trangThai === 'Chờ duyệt').map(it => it.maCTDT);
                                        setSelectedCTDTs(new Set(pending));
                                    } else {
                                        setSelectedCTDTs(new Set());
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell>S.Lượng</TableCell>
                        <TableCell>Trạng Thái</TableCell>
                        <TableCell align="right">Hành động</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {viewingItems?.items?.map(it => (
                        <TableRow key={it.maCTDT} hover>
                            <TableCell padding="checkbox">
                                <input 
                                    type="checkbox"
                                    disabled={it.trangThai !== 'Chờ duyệt'}
                                    checked={selectedCTDTs.has(it.maCTDT)}
                                    onChange={(e) => {
                                        setSelectedCTDTs(prev => {
                                            const next = new Set(prev);
                                            if (e.target.checked) next.add(it.maCTDT);
                                            else next.delete(it.maCTDT);
                                            return next;
                                        });
                                    }}
                                />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{it.tenSanPham}</TableCell>
                            <TableCell>{it.soLuong}</TableCell>
                            <TableCell>
                                <Chip 
                                    label={it.trangThai || 'Chờ duyệt'} 
                                    size="small" 
                                    color={it.trangThai === 'Đã Duyệt' ? 'success' : it.trangThai === 'Từ chối' ? 'error' : 'default'} 
                                />
                            </TableCell>
                            <TableCell align="right">
                                {isQuanLy && it.trangThai === 'Chờ duyệt' && (
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button 
                                            size="small" variant="text" color="primary" sx={{ fontWeight: 'bold' }}
                                            onClick={() => handleApproveItems([it.maCTDT], 'Đã Duyệt')}
                                        >
                                            DUYỆT
                                        </Button>
                                        <Button 
                                            size="small" variant="text" color="error" sx={{ fontWeight: 'bold' }}
                                            onClick={() => handleApproveItems([it.maCTDT], 'Từ chối')}
                                        >
                                            TỪ CHỐI
                                        </Button>
                                    </Box>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setViewingItems(null)}>Đóng</Button></DialogActions>
      </Dialog>

      <Dialog open={!!previewImg} onClose={() => setPreviewImg(null)} maxWidth="md" fullWidth>
        <DialogTitle>Ảnh Minh Chứng</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {Array.isArray(previewImg) ? previewImg.map((img, i) => <img key={i} src={img} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />) : <img src={previewImg} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setPreviewImg(null)}>Đóng</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
