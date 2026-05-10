import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, Grid, Divider, Chip, CircularProgress, TextField, MenuItem, Alert
} from '@mui/material';
import api from '../services/api';
import authService from '../services/authService';

const formatVND = (v) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '0 ₫';

function DeliveryDetailDialog({ open, onClose, deliveryId, onContinueDelivery, onUpdated }) {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Overall delivery states
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Per-item states
  const [itemUpdates, setItemUpdates] = useState({});

  // Location states
  const [currentLocation, setCurrentLocation] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const currentUser = authService.getUser();

  useEffect(() => {
    if (open && deliveryId) {
      fetchDetail();
    }
  }, [open, deliveryId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/deliveries/${deliveryId}`);
      const data = res.data;
      setDelivery(data);
      setStatus(data.trangThai || 'Chờ giao');
      setNotes(data.ghiChu || '');
      setAmountPaid('');
      setCurrentLocation(data.viTriHienTai || '');
      setLat(data.lat);
      setLng(data.lng);

      // Initialize item updates
      const initialItems = {};
      data.chiTiet?.forEach(it => {
        initialItems[it.maCTGH] = {
          maCTGH: it.maCTGH,
          trangThai: it.trangThai || 'Đang giao',
          ghiChu: it.ghiChu || ''
        };
      });
      setItemUpdates(initialItems);
    } catch (err) {
      console.error('Error fetching delivery detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemUpdate = (maCTGH, field, value) => {
    setItemUpdates(prev => ({
      ...prev,
      [maCTGH]: { ...prev[maCTGH], [field]: value }
    }));
  };

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setIsGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setIsGettingGPS(false);
        // Tự động cập nhật mô tả nếu chưa có
        if (!currentLocation) setCurrentLocation(`Tọa độ: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        console.error(err);
        alert("Không thể lấy vị trí GPS. Hãy kiểm tra quyền truy cập vị trí.");
        setIsGettingGPS(false);
      }
    );
  };

  const handleSaveStatus = async () => {
    setActionLoading(true);
    try {
      const payload = {
        trangThai: status,
        ghiChu: notes,
        ngayGiaoThucTe: status === 'Đã giao' ? new Date().toISOString() : null,
        soTienThu: amountPaid ? parseFloat(amountPaid) : 0,
        viTriHienTai: currentLocation,
        lat: lat,
        lng: lng,
        items: Object.values(itemUpdates)
      };

      if (status === 'Đã giao' && delivery.pttt?.includes('ATM') === false) {
        const expected = delivery.soTienPhaiThu || 0;
        const actual = amountPaid ? parseFloat(amountPaid) : 0;
        
        if (expected > 0 && actual !== expected) {
          alert(`❌ SỐ TIỀN THU KHÔNG KHỚP!\nKhách hàng đã chọn thanh toán: ${formatVND(expected)} khi nhận hàng.\nBạn đang nhập: ${formatVND(actual)}.\nVui lòng kiểm tra và nhập lại chính xác.`);
          setActionLoading(false);
          return;
        }
      }

      await api.put(`/deliveries/${deliveryId}`, payload);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Error updating delivery status:', err);
      alert('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const statusColor = (s) => {
    if (!s) return 'default';
    if (s.includes('Đã giao')) return 'success';
    if (s.includes('Đang giao')) return 'info';
    if (s.includes('Chờ')) return 'warning';
    if (s === 'Không thành công' || s === 'Hỏng/Lỗi') return 'error';
    return 'default';
  };

  const statusOptions = [
    { value: 'Chờ giao', label: '⏳ Chờ giao' },
    { value: 'Đang giao', label: '🚚 Đang giao' },
    { value: 'Đã giao', label: '✅ Đã giao' },
    { value: 'Không thành công', label: '❌ Không thành công' },
    { value: 'Đã hủy', label: '🚫 Đã hủy' }
  ];

  const itemStatusOptions = [
    { value: 'Đang giao', label: '🚚 Đang giao' },
    { value: 'Đã giao', label: '✅ Đã giao' },
    { value: 'Hỏng/Lỗi', label: '⚠️ Hỏng/Lỗi' },
    { value: 'Khách từ chối', label: '❌ Khách từ chối' }
  ];

  const canUpdate = delivery && (
    currentUser?.EmployeeId === delivery.maNhanVien || 
    currentUser?.RoleName === 'QuanLy' || 
    currentUser?.RoleName === 'Admin'
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Chi Tiết Giao Hàng: {delivery?.maGH || '...'}
            </Typography>
            {delivery && (
              <Chip label={delivery.trangThai} color={statusColor(delivery.trangThai)} variant="outlined" size="small" />
            )}
          </Box>
           <Typography variant="caption" color="textSecondary">HĐ: {delivery?.maHD}</Typography>
        </Box>
        {!canUpdate && delivery && (
          <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
             Bạn không có quyền cập nhật phiếu giao này (Chỉ dành cho tài xế {delivery.nguoiGiao}).
          </Alert>
        )}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : delivery ? (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem' }}>📍 Thông tin vận chuyển</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Tài xế/Người giao: {delivery.nguoiGiao}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{delivery.diaChi}</Typography>
                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
                  Ngày giao (dự kiến): {delivery.ngayGiaoDuKien ? new Date(delivery.ngayGiaoDuKien).toLocaleDateString('vi-VN') : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem' }}>👤 Thông tin khách hàng</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Khách hàng: {delivery.tenKhachHang}</Typography>
                <Typography variant="body2">Người nhận: {delivery.tenKhachHang}</Typography>
                <Typography variant="body2">SĐT: {delivery.sdtKhachHang || '—'}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#666', display: 'flex', alignItems: 'center', gap: 1 }}>
               📦 Cập nhật trạng thái từng sản phẩm
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>SL</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 140 }}>Trạng Thái</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ghi Chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {delivery.chiTiet?.map((item, index) => {
                    const currentStatus = itemUpdates[item.maCTGH]?.trangThai || 'Đang giao';
                    const isDone = currentStatus === 'Đã giao';
                    
                    return (
                      <TableRow 
                        key={item.maCTGH || index}
                        sx={{ 
                          opacity: isDone ? 0.6 : 1,
                          bgcolor: isDone ? '#f9f9f9' : 'inherit',
                          transition: 'all 0.2s'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: isDone ? 'text.secondary' : 'text.primary' }}>
                            {item.tenSanPham}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">Đặt: {item.soLuongOrder || 0}</Typography>
                        </TableCell>
                        <TableCell align="center">
                           <Chip 
                            label={item.soLuongGiao} 
                            size="small" 
                            color={isDone ? "default" : "primary"} 
                            sx={{ fontWeight: 'bold' }} 
                           />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            select fullWidth size="small"
                            value={currentStatus}
                            onChange={(e) => handleItemUpdate(item.maCTGH, 'trangThai', e.target.value)}
                            disabled={isDone || !canUpdate}
                            sx={{ 
                              '& .MuiSelect-select': { py: 0.5, fontSize: '0.85rem' },
                              bgcolor: isDone ? '#fff' : (statusColor(currentStatus) === 'success' ? '#f0fdf4' : 'inherit')
                            }}
                          >
                            {itemStatusOptions.map(opt => (
                              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.85rem' }}>{opt.label}</MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth size="small"
                            placeholder="Ghi chú SP..."
                            value={itemUpdates[item.maCTGH]?.ghiChu || ''}
                            onChange={(e) => handleItemUpdate(item.maCTGH, 'ghiChu', e.target.value)}
                            disabled={isDone || !canUpdate}
                            sx={{ '& .MuiInputBase-input': { py: 0.5, fontSize: '0.85rem' } }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Hướng dẫn thu tiền cho Tài xế */}
            {delivery.pttt?.includes('ATM') ? (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  💳 ĐƠN HÀNG ĐÃ THANH TOÁN QUA ATM/BANKING. KHÔNG THU THÊM TIỀN MẶT.
                </Typography>
              </Alert>
            ) : (
              <Box sx={{ p: 2, mb: 2, bgcolor: '#fff4e5', borderRadius: 2, border: '1px solid #ffb74d' }}>
                 <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f57c00', display: 'flex', alignItems: 'center', gap: 1 }}>
                   💰 HƯỚNG DẪN THU TIỀN (COD)
                 </Typography>
                 <Typography variant="body1" sx={{ mt: 1, fontWeight: 800, color: '#d32f2f', fontSize: '1.1rem' }}>
                   Vui lòng thu: {formatVND(delivery.soTienPhaiThu)} cho Tài xế khi nhận hàng.
                 </Typography>
                 <Typography variant="caption" color="textSecondary">
                   (Đây là số tiền {delivery.soTienPhaiThu >= delivery.tongTienOrder ? '100%' : 'Đặt cọc'} khách hàng đã chọn lúc đặt đơn)
                 </Typography>
              </Box>
            )}

            {/* Cập nhật trạng thái chuyến hàng */}
            <Box sx={{ p: 2, mb: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid #cce3f5' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                ⚡ CẬP NHẬT TRẠNG THÁI CHUYẾN ĐI (TỔNG THỂ)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    select fullWidth size="small"
                    label="Trạng Thái Giao"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!canUpdate}
                    sx={{ bgcolor: '#fff' }}
                  >
                    {statusOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {status === 'Đã giao' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth size="small"
                      label="Số tiền thu được (VNĐ)"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      disabled={!canUpdate}
                      sx={{ bgcolor: '#fff', border: delivery.soTienPhaiThu > 0 && parseFloat(amountPaid) !== delivery.soTienPhaiThu ? '2px solid red' : 'none', borderRadius: 1 }}
                      helperText={delivery.pttt?.includes('ATM') ? 'Đã thanh toán qua ATM' : `BẮT BUỘC THU: ${formatVND(delivery.soTienPhaiThu)}`}
                      error={delivery.soTienPhaiThu > 0 && parseFloat(amountPaid) !== delivery.soTienPhaiThu}
                    />
                  </Grid>
                )}

                <Grid item xs={12} md={status === 'Đã giao' ? 4 : 8}>
                  <TextField
                    fullWidth size="small"
                    label="Ghi chú cập nhật"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!canUpdate}
                    sx={{ bgcolor: '#fff' }}
                    placeholder="Lý do nếu giao không thành công..."
                  />
                </Grid>
              </Grid>
            </Box>

            {/* CẬP NHẬT VỊ TRÍ TRỰC TIẾP */}
            <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffe0b2' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#e65100', display: 'flex', alignItems: 'center', gap: 1 }}>
                📡 VỊ TRÍ TRỰC TIẾP (LIVE TRACKING)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={7}>
                  <TextField
                    fullWidth size="small"
                    label="Vị trí hiện tại (Ví dụ: Ngã tư A, Cách khách 2km...)"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    disabled={!canUpdate}
                    sx={{ bgcolor: '#fff' }}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                   <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button 
                        variant="contained" 
                        color="warning" 
                        size="small"
                        onClick={getGeolocation}
                        disabled={isGettingGPS || !canUpdate}
                        sx={{ fontWeight: 'bold' }}
                      >
                        {isGettingGPS ? <CircularProgress size={20} color="inherit" /> : '📍 LẤY GPS'}
                      </Button>
                      {lat && lng && (
                        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, bgcolor: '#4caf50', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                          Đã có tọa độ
                        </Typography>
                      )}
                   </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        ) : (
          <Typography variant="body1" align="center">Không tìm thấy thông tin phiếu giao</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', gap: 1 }}>
        <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
           <Button 
            onClick={() => {
              if (delivery?.maHoaDon && onContinueDelivery) {
                onContinueDelivery(delivery.maHoaDon);
              }
            }}
            variant="outlined" 
            color="success"
            size="small"
            disabled={!onContinueDelivery}
          >
            Tiếp Tục Tạo Phiếu Giao
          </Button>
        </Box>

        <Button onClick={onClose} variant="outlined" color="inherit">Đóng</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSaveStatus}
          disabled={actionLoading || !delivery || !canUpdate}
          sx={{ px: 4, fontWeight: 'bold' }}
        >
          {actionLoading ? <CircularProgress size={24} /> : 'LƯU CẬP NHẬT'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeliveryDetailDialog;
