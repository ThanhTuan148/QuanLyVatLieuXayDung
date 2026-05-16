import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, Grid, Divider, Chip, CircularProgress, TextField, MenuItem, Alert,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel
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

  // Payment Option state
  const [paymentOption, setPaymentOption] = useState('partial');

  // Location states
  const [currentLocation, setCurrentLocation] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const currentUser = authService.getUser();

  useEffect(() => {
    if (open && deliveryId) {
      fetchDetail();
      fetchHistory();
    }
  }, [open, deliveryId]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/deliveries/${deliveryId}/history`);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching delivery history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/deliveries/${deliveryId}`);
      const data = res.data;
      setDelivery(data);
      setStatus(data.trangThai || 'Chờ giao');
      setNotes(data.ghiChu || '');
      setAmountPaid('');
      setPhoto(null);
      setPhotoPreview(null);
      setCurrentLocation(data.viTriHienTai || '');
      setLat(data.lat);
      setLng(data.lng);

      // Initialize item updates
      const initialItems = {};
      data.chiTiet?.forEach(it => {
        let defaultStatus = it.trangThai || 'Đang giao';
        if (it.soLuongNhanKho < it.soLuongGiao) {
            defaultStatus = 'Đang giao một phần';
        }
        initialItems[it.maCTGH] = {
          maCTGH: it.maCTGH,
          trangThai: defaultStatus,
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
    const newUpdates = {
      ...itemUpdates,
      [maCTGH]: { ...itemUpdates[maCTGH], [field]: value }
    };
    setItemUpdates(newUpdates);

    // Tự động chuyển trạng thái tổng thể dựa trên trạng thái từng món
    if (field === 'trangThai') {
      const items = Object.values(newUpdates);
      const allDelivered = items.every(it => it.trangThai === 'Đã giao');
      const anyDelivered = items.some(it => it.trangThai === 'Đã giao' || it.trangThai === 'Đã giao một phần');

      // Nếu đơn hàng vẫn còn sản phẩm chưa giao (coTheGiaoTiep = true),
      // thì KHÔNG được chuyển trạng thái tổng thể thành "Đã giao"
      // vì tài xế chưa nhận hàng tiếp từ kho để giao phần còn lại
      const orderStillHasRemaining = delivery?.coTheGiaoTiep === true;

      if (allDelivered && !orderStillHasRemaining) {
        setStatus('Đã giao');
      } else if (allDelivered && orderStillHasRemaining) {
        setStatus('Đã giao một phần');
      } else if (anyDelivered) {
        setStatus('Đã giao một phần');
      } else {
        setStatus('Đang giao');
      }
    }
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

  const calculateDynamicCOD = () => {
    if (!delivery || !delivery.chiTiet) return 0;
    if (delivery.pttt?.includes('ATM')) return 0;

    if (paymentOption === 'full') {
      const remaining = (delivery.tongTienOrder || 0) - (delivery.daThanhToanOrder || 0);
      return remaining > 0 ? remaining : 0;
    }

    let total = 0;
    delivery.chiTiet.forEach(item => {
      const currentStatus = itemUpdates[item.maCTGH]?.trangThai || item.trangThai || 'Đang giao';
      if (currentStatus === 'Đã giao') {
        if (item.thanhTien != null && item.soLuongOrder > 0) {
          const unitValue = item.thanhTien / item.soLuongOrder;
          total += unitValue * (item.soLuongGiao || 0);
        } else {
          total += (item.soLuongGiao || 0) * (item.donGia || 0);
        }
      }
    });

    // Cấn trừ tiền cọc: Số tiền thu đợt này không được vượt quá số tiền còn nợ của đơn hàng
    const remaining = (delivery.tongTienOrder || 0) - (delivery.daThanhToanOrder || 0);
    if (total > remaining) {
      total = remaining;
    }

    return Math.max(0, Math.round(total));
  };

  const dynamicCOD = calculateDynamicCOD();

  const isAnyItemDelivered = delivery?.chiTiet?.some(item => {
    const currentStatus = itemUpdates[item.maCTGH]?.trangThai || item.trangThai || 'Đang giao';
    return currentStatus === 'Đã giao' || currentStatus === 'Đã giao một phần';
  });
  const showPaymentAndPhoto = status === 'Đã giao' || status === 'Đã giao một phần' || isAnyItemDelivered || dynamicCOD > 0;

  const handleSaveStatus = async () => {
    const confirmedPxkStatuses = ['Đã xuất', 'Đã nhận một phần', 'Đã nhận đủ'];
    const pxkConfirmed = confirmedPxkStatuses.includes(delivery?.trangThaiXuatKho);
    const isTryingToDeliver = status === 'Đã giao' || status === 'Đã giao một phần' || status === 'Đang giao một phần' || isAnyItemDelivered;
    
    if (isTryingToDeliver && !pxkConfirmed) {
      alert('⚠️ KHÔNG THỂ CẬP NHẬT: Bạn chưa xác nhận nhận hàng từ kho cho chuyến này!\n\nVui lòng qua mục "Kho hàng → Lịch sử xuất kho" để xác nhận nhận hàng trước khi bắt đầu đi giao.');
      return;
    }

    if (showPaymentAndPhoto && !photoPreview) {
      alert('⚠️ BẮT BUỘC: Vui lòng chụp ảnh xác nhận đã giao hàng để hoàn tất!');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        trangThai: status,
        ghiChu: notes,
        ngayGiaoThucTe: (status === 'Đã giao' || status === 'Đã giao một phần') ? new Date().toISOString() : null,
        soTienThu: amountPaid ? parseFloat(amountPaid) : 0,
        viTriHienTai: currentLocation,
        lat: lat,
        lng: lng,
        hinhAnhXacNhan: photoPreview,
        maNguoiThucHien: currentUserId,
        items: Object.values(itemUpdates)
      };

      if (showPaymentAndPhoto && delivery.pttt?.includes('ATM') === false) {
        const expected = calculateDynamicCOD();
        const actual = amountPaid ? parseFloat(amountPaid) : 0;

        if (expected > 0 && actual !== expected) {
          alert(`❌ SỐ TIỀN THU KHÔNG KHỚP!\nCần thu theo số lượng thực tế giao: ${formatVND(expected)}.\nBạn đang nhập: ${formatVND(actual)}.\nVui lòng kiểm tra và nhập lại chính xác.`);
          setActionLoading(false);
          return;
        }
      }

      await api.put(`/deliveries/${deliveryId}`, payload);
      await fetchDetail(); // Tải lại dữ liệu để hiện nút "Tiếp tục" nếu có hàng thiếu
      fetchHistory();
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
    { value: 'Đã giao một phần', label: '🌤️ Đã giao một phần' },
    { value: 'Đã giao', label: '✅ Đã giao' },
    { value: 'Không thành công', label: '❌ Không thành công' },
    { value: 'Đã hủy', label: '🚫 Đã hủy' }
  ];

  const itemStatusOptions = [
    { value: 'Đang giao', label: '🚚 Đang giao' },
    { value: 'Đang giao một phần', label: '🚚 Đang giao một phần' },
    { value: 'Đã giao một phần', label: '🌤️ Đã giao một phần' },
    { value: 'Đã giao', label: '✅ Đã giao' },
    { value: 'Hỏng/Lỗi', label: '⚠️ Hỏng/Lỗi' },
    { value: 'Khách từ chối', label: '❌ Khách từ chối' }
  ];

  const roleStr = String(currentUser?.roleName || currentUser?.role || currentUser?.Role || currentUser?.vaiTro || '').trim().toLowerCase();
  const isQuanLy = roleStr === 'quản lý' || roleStr === 'giám đốc' || roleStr === 'admin' || roleStr === 'quanly';
  const currentUserId = currentUser?.maNhanVien || currentUser?.id || currentUser?.EmployeeId || 0;

  const canUpdate = delivery && (
    currentUserId === delivery.maNhanVien ||
    isQuanLy
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

            {!['Đã xuất', 'Đã nhận một phần', 'Đã nhận đủ'].includes(delivery.trangThaiXuatKho) && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>🚫 Chưa xác nhận nhận hàng từ kho!</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Bạn cần qua mục <b>Kho hàng → Lịch sử xuất kho</b> để xác nhận nhận hàng trước khi cập nhật trạng thái giao.
                  Hệ thống sẽ không cho phép chuyển trạng thái giao hàng khi chưa nhận hàng từ kho.
                </Typography>
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#666', display: 'flex', alignItems: 'center', gap: 1 }}>
              📦 Cập nhật trạng thái từng sản phẩm
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sản Phẩm</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>SL Kế hoạch</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Nhận từ kho</TableCell>
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
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: item.soLuongNhanKho < item.soLuongGiao ? 'error.main' : 'success.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5
                            }}
                          >
                            {item.soLuongNhanKho}
                            {item.soLuongNhanKho < item.soLuongGiao && (
                              <Typography variant="caption" sx={{ fontWeight: 'normal' }}>(Thiếu)</Typography>
                            )}
                          </Typography>
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
                            {itemStatusOptions
                              .filter(opt => {
                                if (item.soLuongNhanKho < item.soLuongGiao) {
                                  // Nếu thiếu hàng, chỉ hiển thị trạng thái "một phần" hoặc thất bại
                                  return opt.value.includes('một phần') || opt.value === 'Hỏng/Lỗi' || opt.value === 'Khách từ chối';
                                } else {
                                  // Nếu đủ hàng, ẩn các trạng thái "một phần"
                                  return !opt.value.includes('một phần');
                                }
                              })
                              .map(opt => (
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

            {delivery.chiTiet?.some(it => it.soLuongNhanKho < it.soLuongGiao) && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>💡 Hướng dẫn xử lý hàng thiếu:</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Bạn đang nhận thiếu hàng từ kho cho chuyến này (Cột <b>Nhận từ kho</b> màu đỏ).
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2">
                      <b>Muốn lấy thêm hàng ngay:</b> Quay lại <b>Kho hàng -&gt; Lịch sử xuất kho</b>, tìm phiếu này và bấm xác nhận nhận thêm hàng.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <b>Giao số đã có trước, giao phần thiếu sau:</b> Bấm <b>LƯU CẬP NHẬT</b>, sau đó dùng nút <b>Tiếp tục tạo phiếu giao</b> ở góc dưới để tạo chuyến mới cho phần còn lại.
                    </Typography>
                  </li>
                </ul>
              </Alert>
            )}

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

                <FormControl component="fieldset" sx={{ mt: 1, mb: 1, width: '100%' }}>
                  <RadioGroup
                    row
                    value={paymentOption}
                    onChange={(e) => setPaymentOption(e.target.value)}
                  >
                    <FormControlLabel value="partial" control={<Radio size="small" />} label={<Typography variant="body2" fontWeight="bold">Thu theo thực tế đợt này</Typography>} />
                    <FormControlLabel value="full" control={<Radio size="small" />} label={<Typography variant="body2" fontWeight="bold">Thu toàn bộ số tiền còn lại (Đợt cuối)</Typography>} />
                  </RadioGroup>
                </FormControl>

                <Typography variant="body1" sx={{ mt: 1, fontWeight: 800, color: '#d32f2f', fontSize: '1.1rem' }}>
                  Vui lòng thu: {formatVND(dynamicCOD)} cho Tài xế khi nhận hàng.
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {paymentOption === 'partial' && '(Đây là tổng số tiền khách hàng còn nợ của toàn bộ đơn hàng)'}
                  {paymentOption === 'full' && '(Đây là tổng số tiền khách hàng còn nợ của toàn bộ đơn hàng)'}
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
                    {statusOptions
                      .filter(opt => {
                        // Ẩn "Đã giao" nếu đơn hàng vẫn còn sản phẩm chưa giao đủ
                        if (opt.value === 'Đã giao' && delivery?.coTheGiaoTiep === true) return false;
                        return true;
                      })
                      .map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {showPaymentAndPhoto && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth size="small"
                      label="Số tiền thu được (VNĐ)"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      disabled={!canUpdate}
                      sx={{ bgcolor: '#fff', border: dynamicCOD > 0 && parseFloat(amountPaid) !== dynamicCOD ? '2px solid red' : 'none', borderRadius: 1 }}
                      helperText={delivery.pttt?.includes('ATM') ? 'Đã thanh toán qua ATM' : `BẮT BUỘC THU: ${formatVND(dynamicCOD)}`}
                      error={dynamicCOD > 0 && parseFloat(amountPaid) !== dynamicCOD}
                    />
                  </Grid>
                )}

                <Grid item xs={12} md={4}>
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

                {showPaymentAndPhoto && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        📸 CHỤP ẢNH XÁC NHẬN GIAO HÀNG *
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Button
                          variant="outlined"
                          component="label"
                          sx={{ height: 100, width: 200, borderStyle: 'dashed', display: 'flex', flexDirection: 'column', gap: 1 }}
                        >
                          {photoPreview ? 'Thay đổi ảnh' : 'Chụp ảnh xác nhận'}
                          <input
                            type="file" accept="image/*" hidden capture="environment"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setPhoto(file);
                                const reader = new FileReader();
                                reader.onloadend = () => setPhotoPreview(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </Button>
                        {photoPreview && (
                          <Box sx={{ position: 'relative' }}>
                            <img src={photoPreview} alt="Preview" style={{ height: 100, borderRadius: 8, border: '1px solid #ddd' }} />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )}
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

            {/* LỊCH SỬ THEO DÕI GIAO HÀNG */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                🕒 Lịch sử theo dõi giao hàng
              </Typography>
              {loadingHistory ? (
                <CircularProgress size={20} />
              ) : history.length === 0 ? (
                <Typography variant="body2" color="textSecondary">Chưa có lịch sử cập nhật.</Typography>
              ) : (
                <Box sx={{ position: 'relative', pl: 3, '&:before': { content: '""', position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, bgcolor: '#eee' } }}>
                  {history.map((h, i) => (
                    <Box key={i} sx={{ mb: 3, position: 'relative' }}>
                      <Box sx={{
                        position: 'absolute', left: -28, top: 4, width: 12, height: 12,
                        borderRadius: '50%', bgcolor: i === 0 ? 'primary.main' : '#ddd',
                        border: '2px solid #fff', zIndex: 1
                      }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {h.trangThaiMoi}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(h.ngayTao).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>{h.noiDungThayDoi}</Typography>
                      {h.viTriCapNhat && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'info.main', fontStyle: 'italic', mb: 1 }}>
                          📍 {h.viTriCapNhat}
                        </Typography>
                      )}
                      {h.hinhAnhXacNhan && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>📸 Ảnh xác nhận:</Typography>
                          <img
                            src={h.hinhAnhXacNhan}
                            alt="Xác nhận"
                            style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => window.open(h.hinhAnhXacNhan, '_blank')}
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Typography variant="body1" align="center">Không tìm thấy thông tin phiếu giao</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', gap: 1 }}>
        <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
          {delivery?.coTheGiaoTiep && (
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
          )}
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
