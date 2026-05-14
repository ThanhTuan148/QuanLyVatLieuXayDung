import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem, CircularProgress, Box, Alert, Chip
} from '@mui/material';
import api from '../services/api';
import orderService from '../services/orderService';

function DeliveryForm({ open, onClose, onSaved, initialOrderId }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    nguoiGiao: '',
    diaChi: '',
    ghiChu: '',
    maHoaDon: '',
    maNhanVien: '' 
  });
  const [items, setItems] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    if (open) {
      fetchEligibleOrders();
      fetchDrivers();
      const userStr = localStorage.getItem('user');
      let defaultStaff = 1;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          defaultStaff = user.maNhanVien || 1;
        } catch (e) {}
      }
      setFormData({
        nguoiGiao: '',
        diaChi: '',
        ghiChu: '',
        maHoaDon: initialOrderId || '',
        maNhanVien: defaultStaff
      });
      setItems([]);
      setSelectedOrder(null);
      setSelectedDriver(null);
      
      if (initialOrderId) {
        fetchOrderDetails(initialOrderId);
      }
    }
  }, [open, initialOrderId]);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/employees');
      const taiXe = res.data.filter(e => e.tenVaiTro === 'Tài xế');
      setDrivers(taiXe);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEligibleOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await orderService.getAllOrders();
      const eligible = res.data.filter(o => 
        o.trangThai === 'Đã xác nhận' || 
        o.trangThai === 'Chờ xử lý' || 
        o.maHoaDon === initialOrderId
      );
      setOrders(eligible);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchOrderDetails = async (maHoaDon) => {
    setLoadingDetails(true);
    try {
      const res = await orderService.getOrderById(maHoaDon);
      const order = res.data;
      setSelectedOrder(order);
      
      // Nếu là đơn giao nhiều địa chỉ, không pre-fill vào ô địa chỉ tổng
      const mainAddress = order.diaChiGiaoHang === 'Giao hàng nhiều địa chỉ' ? '' : (order.diaChiGiaoHang || '');
      setFormData(prev => ({ ...prev, diaChi: mainAddress }));
      
        if (order.chiTiet) {
          const processedItems = order.chiTiet.map(ct => {
            const mCTHD = ct.maCTHD || ct.MaCTHD;
            const daGiao = ct.soLuongDaGiao || 0;
            const dangGiao = ct.soLuongDangGiao || 0;
            const choGiao = ct.soLuongChoGiao || 0;
            const total = ct.soLuong || ct.SoLuong || 0;
            const conLai = total - daGiao - dangGiao - choGiao;
            
            return {
              maCTHD: mCTHD,
              maSanPham: ct.maSanPham || ct.MaSanPham,
              tenSanPham: ct.tenSanPham || ct.TenSanPham,
              soLuongGoc: total,
              soLuongDaGiao: daGiao,
              soLuongDangGiao: dangGiao,
              soLuongChoGiao: choGiao,
              soLuongConLai: conLai,


              soLuongGiao: conLai > 0 ? conLai : 0,
              ghiChu: '',
              trongLuong: ct.trongLuong || ct.TrongLuong || 0,
              donViTrongLuong: ct.donViTrongLuong || ct.DonViTrongLuong || 'kg',
              diaChiGiaoHang: ct.diaChiGiaoHang || ct.DiaChiGiaoHang || (order.diaChiGiaoHang === 'Giao hàng nhiều địa chỉ' ? '' : order.diaChiGiaoHang),
              tenNguoiNhan: ct.tenNguoiNhan || ct.TenNguoiNhan,
              sdtNguoiNhan: ct.sdtNguoiNhan || ct.SdtNguoiNhan
            };
          });
          
          setItems(processedItems);
        }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOrderChange = async (e) => {
    const maHoaDon = e.target.value;
    setFormData(prev => ({ ...prev, maHoaDon }));
    if (!maHoaDon) {
      setItems([]);
      setSelectedOrder(null);
      return;
    }

    fetchOrderDetails(maHoaDon);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'soLuongGiao') {
        let val = parseInt(value, 10);
        if (isNaN(val)) val = 0;
        if (val > newItems[index].soLuongConLai) val = newItems[index].soLuongConLai;
        if (val < 0) val = 0;
        newItems[index][field] = val;
    } else {
        newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!formData.maHoaDon || !formData.nguoiGiao || !formData.diaChi) {
      alert('Vui lòng nhập đầy đủ thông tin (Hóa đơn, Người giao, Địa chỉ)!');
      return;
    }

    const deliverableItems = items.filter(i => i.soLuongGiao > 0);
    if (deliverableItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để giao (Số lượng giao > 0)');
      return;
    }

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserId = user?.maNhanVien || user?.id || 0;

    const payload = {
      nguoiGiao: formData.nguoiGiao,
      diaChi: formData.diaChi,
      ghiChu: formData.ghiChu,
      maHoaDon: formData.maHoaDon,
      maNhanVien: formData.maNhanVien,
      maNguoiLap: currentUserId,
      items: deliverableItems.map(i => ({
        maSanPham: i.maSanPham,
        maCTHD: i.maCTHD,
        soLuongGiao: i.soLuongGiao,
        ghiChu: i.ghiChu
      }))
    };

    try {
      await api.post('/deliveries', payload);
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Lỗi tạo phiếu giao: ' + (err.response?.data?.message || err.message));
    }
  };

  const calculateTotalWeight = () => {
    return items.reduce((sum, item) => sum + (item.soLuongGiao * (item.trongLuong || 0)), 0);
  };

  const totalWeight = calculateTotalWeight();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa' }}>Tạo Phiếu Giao Hàng (Tách chuyến)</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Chọn Hóa Đơn"
              value={formData.maHoaDon}
              onChange={handleOrderChange}
              disabled={loadingOrders}
              InputProps={{
                endAdornment: loadingOrders && <CircularProgress size={20} />
              }}
            >
              <MenuItem value=""><em>-- Chọn Hóa Đơn --</em></MenuItem>
              {orders.map(o => (
                <MenuItem key={o.maHoaDon} value={o.maHoaDon}>
                  {o.maHD} - Khách: {o.tenKhachHang || 'Khách lẻ'} ({o.trangThai})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Chọn Tài Xế Giao Hàng"
              value={formData.nguoiGiao}
              onChange={e => {
                const name = e.target.value;
                const driver = drivers.find(d => d.tenNV === name);
                setFormData({ 
                    ...formData, 
                    nguoiGiao: name,
                    maNhanVien: driver ? driver.maNhanVien : formData.maNhanVien 
                });
                setSelectedDriver(driver);
              }}
              required
            >
              <MenuItem value=""><em>-- Chọn Tài Xế --</em></MenuItem>
              {drivers.map(d => (
                <MenuItem key={d.maNhanVien} value={d.tenNV}>
                  {d.tenNV} {d.sucChuaToiDa ? `(Sức chứa: ${d.sucChuaToiDa} kg)` : ''}
                </MenuItem>
              ))}
            </TextField>
            {selectedDriver && selectedDriver.sucChuaToiDa && (
              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block', fontWeight: 'bold' }}>
                🚀 Xe này có sức chứa tối đa: {selectedDriver.sucChuaToiDa}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            {selectedOrder && selectedOrder.phiVanChuyen > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Đơn hàng này có phí vận chuyển: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.phiVanChuyen)}</strong>
              </Alert>
            )}
            <TextField
              fullWidth
              label="Địa Chỉ Giao Chuyến Này *"
              placeholder="Nhập địa chỉ hoặc chọn từ danh sách bên dưới"
              value={formData.diaChi}
              onChange={e => setFormData({ ...formData, diaChi: e.target.value })}
              required
              helperText="Địa chỉ này sẽ được in trên phiếu giao hàng"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ghi chú chuyến đi"
              value={formData.ghiChu}
              onChange={e => setFormData({ ...formData, ghiChu: e.target.value })}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        {loadingDetails ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : items.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0f7ff', borderRadius: 1, border: '1px solid #cce3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <Typography variant="body2">
                 Tổng khối lượng chuyến này: <strong>{totalWeight.toLocaleString()} kg</strong>
               </Typography>
               {selectedDriver && selectedDriver.sucChuaToiDa && (
                 <Typography variant="body2" color={totalWeight > parseFloat(selectedDriver.sucChuaToiDa) ? 'error' : 'success.main'} sx={{ fontWeight: 'bold' }}>
                    Sức chứa tối đa: {selectedDriver.sucChuaToiDa}
                 </Typography>
               )}
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#666' }}>Chọn sản phẩm để giao chuyến này:</Typography>

            {(() => {
              const groups = {};
              items.forEach((item, index) => {
                // Sử dụng logic phân nhóm giống OrderDetailDialog
                let addr = item.diaChiGiaoHang;
                if (!addr || addr === 'Giao hàng nhiều địa chỉ') {
                  addr = (selectedOrder.diaChiGiaoHang && selectedOrder.diaChiGiaoHang !== 'Giao hàng nhiều địa chỉ') 
                    ? selectedOrder.diaChiGiaoHang 
                    : 'Địa chỉ giao hàng';
                }
                
                if (!groups[addr]) groups[addr] = [];
                groups[addr].push({ ...item, originalIndex: index });
              });

              const groupEntries = Object.entries(groups);

              return groupEntries.map(([addr, groupItems], gIdx) => (
                <Box key={gIdx} sx={{ mb: 3 }}>
                  <Box sx={{ 
                    bgcolor: '#f8f9fa', p: 1.5, border: '1px solid #e0e0e0', borderBottom: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTopLeftRadius: 8, borderTopRightRadius: 8
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      📍 {groupEntries.length > 1 ? `${gIdx + 1}. ` : ''} {addr}
                    </Typography>
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => setFormData(prev => ({ ...prev, diaChi: addr }))}
                      sx={{ fontSize: '0.7rem' }}
                    >
                      Giao tới đây
                    </Button>
                  </Box>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#ffffff' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quy cách/KL</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>SL Gốc</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Đã Giao</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Còn Lại</TableCell>
                          <TableCell align="center" width="120" sx={{ fontWeight: 'bold' }}>SL Giao</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Ghi Chú</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupItems.map((item) => {
                          const isDone = item.soLuongConLai <= 0;
                          return (
                            <TableRow 
                              key={item.maCTHD || item.maSanPham + '-' + Math.random()} 
                              sx={{ bgcolor: isDone ? '#fcfcfc' : 'inherit', opacity: isDone ? 0.7 : 1 }}
                            >
                              <TableCell>
                                {item.tenSanPham}
                                {isDone && <Chip label="Đã giao đủ" size="small" color="success" sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} />}
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="caption" color="text.secondary">
                                  {item.trongLuong > 0 ? `${item.trongLuong} ${item.donViTrongLuong}/đơn vị` : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">{item.soLuongGoc}</TableCell>
                              <TableCell align="center">{item.soLuongDaGiao}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold', color: item.soLuongConLai > 0 ? 'success.main' : 'text.disabled' }}>
                                {item.soLuongConLai}
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.soLuongGiao}
                                  onChange={e => handleItemChange(item.originalIndex, 'soLuongGiao', e.target.value)}
                                  inputProps={{ min: 0, max: item.soLuongConLai }}
                                  disabled={isDone}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Ghi chú SP..."
                                  value={item.ghiChu}
                                  onChange={e => handleItemChange(item.originalIndex, 'ghiChu', e.target.value)}
                                  disabled={isDone}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ));
            })()}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
        <Button onClick={onClose} color="inherit">Hủy</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ px: 4 }}>Tạo Phiếu Giao</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeliveryForm;
