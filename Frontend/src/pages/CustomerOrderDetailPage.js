import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, Button, Skeleton, Alert, Breadcrumbs, Link, Divider, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Event as DateIcon,
  OpenInNew as OpenInNewIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import reviewService from '../services/reviewService';
import CustomerReturnDialog from '../components/CustomerReturnDialog';

import ProductReviewDialog from '../components/ProductReviewDialog';

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const CustomerOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', isDestructive: false, onConfirm: null });
  const triggerConfirm = (title, message, onConfirm, isDestructive = false) => {
    setConfirmDialog({ open: true, title, message, isDestructive, onConfirm });
  };
  const handleCloseConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));

  // Review state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewsStatus, setReviewsStatus] = useState({}); // { productId: reviewData }
  const [editReviewData, setEditReviewData] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));

  const fetchReviewStatus = async (orderData) => {
    if (!user || !orderData.chiTiet) return;

    const statusObj = {};
    const promises = orderData.chiTiet.map(async (item) => {
      try {
        const res = await reviewService.checkReviewStatus(
          item.maSanPham,
          user.maKhachHang || user.id,
          orderData.maHoaDon || orderData.id
        );
        if (res.data?.hasReviewed) {
          statusObj[item.maSanPham] = res.data.reviewData;
        }
      } catch (err) {
        console.error('Error checking review status:', err);
      }
    });

    await Promise.all(promises);
    setReviewsStatus(statusObj);
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderById(id);
      const orderData = res.data || res;
      setOrder(orderData);

      // Fetch history
      const histRes = await orderService.getOrderHistory(id);
      setHistory(histRes.data || []);

      // Fetch review status for products
      if (orderData.trangThai?.toLowerCase() === 'hoàn thành') {
        fetchReviewStatus(orderData);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleOpenReview = (item, editData = null) => {
    setSelectedProduct({
      maSanPham: item.maSanPham,
      tenSP: item.tenSanPham,
      hinhAnh: item.hinhAnh
    });
    setEditReviewData(editData);
    setReviewDialogOpen(true);
  };

  const handleDeleteReview = async (reviewId) => {
    triggerConfirm(
      '🗑️ Xóa đánh giá',
      'Bạn có chắc chắn muốn xóa đánh giá này không?',
      async () => {
        try {
          await reviewService.deleteReview(reviewId);
          alert('Đã xóa đánh giá thành công.');
          fetchReviewStatus(order);
        } catch (err) {
          alert('Không thể xóa đánh giá. Vui lòng thử lại sau.');
        }
      },
      true
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'cho_xac_nhan': case 'chờ xác nhận': return 'warning';
      case 'da_xac_nhan': case 'đã xác nhận': return 'info';
      case 'dang_giao': case 'đang giao': return 'primary';
      case 'đang giao phần còn lại': return 'primary';
      case 'hoan_thanh': case 'hoàn thành': return 'success';
      case 'da_huy': case 'đã hủy': return 'error';
      case 'yêu cầu đổi/trả hàng': return 'error';
      case 'đang đổi trả': return 'warning';
      case 'đang giao hàng đổi/trả': return 'primary';
      case 'đã đổi trả': return 'success';
      case 'đã thu hồi hàng': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'cho_xac_nhan': return 'Chờ xác nhận';
      case 'cho_xu_ly': case 'chờ xử lý': return 'Chờ xử lý';
      case 'da_xac_nhan': return 'Đã xác nhận';
      case 'dang_giao': return 'Đang giao hàng';
      case 'đang giao phần còn lại': return 'Đang giao phần còn lại';
      case 'hoan_thanh': return 'Hoàn thành';
      case 'da_huy': return 'Đã hủy';
      default: return status || 'N/A';
    }
  };

  const canRequestReturn = (order) => {
    if (!order) return { can: false, reason: "" };
    if (order.trangThai !== "Hoàn thành") return { can: false, reason: "Đơn hàng chưa hoàn thành." };
    if (order.coYeuCauDoiTra) return { can: false, reason: "Đơn hàng đã yêu cầu đổi/trả trước đó. (Mỗi đơn hàng chỉ được yêu cầu 1 lần duy nhất)" };

    // Check 24h
    if (order.ngayGiao) {
      const deliveryDate = new Date(order.ngayGiao);
      const now = new Date();
      const diffMs = now - deliveryDate;
      const diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs > 24) return { can: false, reason: "Đã quá thời hạn 24h kể từ lúc nhận hàng." };
    }

    return { can: true, reason: "" };
  };

  const handleDownloadVatInvoice = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/vat-invoice/${id}/download`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Không thể tải hóa đơn.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HoaDon_GTGT_${order.maHD}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Lỗi khi tải hóa đơn: ' + err.message);
    }
  };

  const handleSendVatEmail = async () => {
    triggerConfirm(
      '📧 Gửi hóa đơn qua Email',
      `Gửi hóa đơn GTGT đến email: ${order.vatEmail}?`,
      async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/vat-invoice/${id}/send-email`, { method: 'POST' });
          const data = await res.json();
          if (res.ok) alert('✅ ' + data.message);
          else alert('❌ ' + data.message);
        } catch (err) {
          alert('Lỗi khi gửi email: ' + err.message);
        }
      }
    );
  };

  const handleCancelOrder = async () => {
    triggerConfirm(
      '🚨 Xác nhận hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.',
      async () => {
        try {
          await orderService.cancelOrder(id);
          alert('Đã hủy đơn hàng thành công.');
          window.location.reload();
        } catch (err) {
          alert(err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng.');
        }
      },
      true
    );
  };

  const handleReorder = () => {
    // Redirect to checkout with order data
    navigate('/checkout', {
      state: {
        reorderFrom: order,
        // We'll extract items and addresses in CheckoutPage
      }
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="200px" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 4, borderRadius: '16px' }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '16px' }} />
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>{error || 'Đơn hàng không tồn tại'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/my-orders')}>Quay lại danh sách</Button>
      </Container>
    );
  }

  const groupedItems = order.chiTiet?.reduce((acc, item) => {
    // Determine the best address for grouping
    let addr = item.diaChiGiaoHang || item.DiaChiGiaoHang;

    // If item address is missing or is the generic "multiple" string, try order address
    if (!addr || addr === 'Giao hàng nhiều địa chỉ') {
      addr = (order.diaChiGiaoHang !== 'Giao hàng nhiều địa chỉ') ? order.diaChiGiaoHang : '';
    }

    // Ultimate fallback
    if (!addr) addr = 'Địa chỉ giao hàng';

    if (!acc[addr]) acc[addr] = {
      items: [],
      receiver: item.tenNguoiNhan || item.TenNguoiNhan || order.tenNguoiNhan || order.tenKhachHang,
      phone: item.sdtNguoiNhan || item.SdtNguoiNhan || order.sdtNguoiNhan
    };
    acc[addr].items.push(item);
    return acc;
  }, {}) || {};

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/shopping')}
        >
          Trang chủ
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/my-orders')}
        >
          Đơn hàng của tôi
        </Link>
        <Typography color="text.primary">Chi tiết đơn hàng</Typography>
      </Breadcrumbs>

      {/* Header Info */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom sx={{ color: '#1a202c' }}>
            Chi Tiết Đơn Hàng
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ gap: 1.5 }}>
            <Chip 
              label={`Mã đơn: ${order.maHD || order.maHoaDon}`} 
              size="small" 
              sx={{ bgcolor: '#edf2f7', color: '#4a5568', fontWeight: 600, borderRadius: '6px', px: 0.5 }} 
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Ngày đặt: {order.ngayLap ? new Date(order.ngayLap).toLocaleString('vi-VN') : 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Chip
          label={getStatusLabel(order.trangThai)}
          color={getStatusColor(order.trangThai)}
          sx={{ fontWeight: 700, px: 2, height: 40, fontSize: '0.95rem', borderRadius: '10px' }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left: Items List Grouped by Address */}
        <Grid item xs={12} md={8}>
          {Object.entries(groupedItems).map(([address, groupData], idx) => (
            <Paper key={idx} elevation={0} sx={{ p: 0, borderRadius: '16px', border: '1px solid #eaeaea', mb: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eaeaea' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShippingIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Địa chỉ {Object.keys(groupedItems).length > 1 ? idx + 1 : ""}: <span style={{ fontWeight: 400, color: '#666' }}>{address}</span>
                  </Typography>
                </Box>
                <Box sx={{ ml: 3 }}>
                  <Typography variant="body2" fontWeight={600}>Người nhận: {groupData.receiver || order.tenNguoiNhan || 'N/A'}</Typography>
                  <Typography variant="body2" color="text.secondary">SĐT: {groupData.phone || order.sdtNguoiNhan || 'N/A'}</Typography>
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Đơn giá</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>SL Đặt</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Đã Giao</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Regular Items */}
                    {groupData.items.filter(i => i.donGia > 0 || ['Xi măng', 'Thép', 'Gạch', 'Cát', 'Đá', 'Sắt'].some(kw => i.tenSanPham?.includes(kw))).map((item, iIdx) => (
                      <React.Fragment key={iIdx}>
                        <TableRow>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{item.tenSanPham}</Typography>
                            <Typography variant="caption" color="text.secondary">SKU: {item.maSanPham}</Typography>
                            {(order.trangThai === 'Hoàn thành' || order.trangThai === 'Yêu cầu đổi/trả hàng' || order.trangThai === 'Đang đổi trả') && (
                              <Box sx={{ mt: 1 }}>
                                {reviewsStatus[item.maSanPham] ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="Đã đánh giá" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '10px' }} />
                                    <Button
                                      size="small"
                                      onClick={() => handleOpenReview(item, reviewsStatus[item.maSanPham])}
                                      sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: '11px' }}
                                    >
                                      Sửa
                                    </Button>
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteReview(reviewsStatus[item.maSanPham].maDanhGia)}
                                      sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: '11px' }}
                                    >
                                      Xóa
                                    </Button>
                                  </Box>
                                ) : order.trangThai === 'Hoàn thành' && (
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => handleOpenReview(item)}
                                    sx={{ textTransform: 'none', p: 0, minWidth: 0, fontWeight: 700, color: '#e68c55' }}
                                  >
                                    ★ Đánh giá sản phẩm
                                  </Button>
                                )}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="right">{item.donGia === 0 ? 'Miễn phí' : formatVND(item.donGia)}</TableCell>
                          <TableCell align="center">{item.soLuong}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Chip
                                label={`${item.soLuongDaGiao || 0} / ${item.soLuong} đã nhận`}
                                size="small"
                                color={(item.soLuongDaGiao || 0) >= item.soLuong ? 'success' : 'default'}
                                variant={(item.soLuongDaGiao || 0) > 0 ? 'filled' : 'outlined'}
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', width: '100%' }}
                              />
                              {(item.soLuongDangGiao > 0) && (
                                <Chip
                                  label={`${item.soLuongDangGiao} đang giao`}
                                  size="small"
                                  color="primary"
                                  variant="filled"
                                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 'bold', width: '100%' }}
                                />
                              )}
                              {(item.soLuongChoGiao > 0 && item.soLuongDangGiao <= 0) && (
                                <Chip
                                  label={`${item.soLuongChoGiao} chờ giao`}
                                  size="small"
                                  color="warning"
                                  variant="filled"
                                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 'bold', width: '100%' }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatVND(item.thanhTien || 0)}</TableCell>
                        </TableRow>

                        {item.doiTra && item.doiTra.length > 0 && item.doiTra.map((dt, dtIdx) => (
                          <TableRow key={`return-${iIdx}-${dtIdx}`} sx={{ bgcolor: '#fff5f5' }}>
                            <TableCell colSpan={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                <Chip label={dt.loai} size="small" color="error" variant="filled" sx={{ height: 18, fontSize: '9px' }} />
                                <Typography variant="caption" fontWeight={600} color="error.main">
                                  {dt.maDT}: <span style={{ textTransform: 'uppercase' }}>{dt.trangThai}</span>
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption" fontWeight={700} color="error.main">-{dt.soLuong}</Typography>
                            </TableCell>
                            <TableCell colSpan={2}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                (Đang trong quy trình xử lý đổi/trả)
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}

                    {/* Actual Gift Items */}
                    {groupData.items.filter(i => i.donGia === 0 && !(['Xi măng', 'Thép', 'Gạch', 'Cát', 'Đá', 'Sắt'].some(kw => i.tenSanPham?.includes(kw)))).map((item, iIdx) => (
                      <TableRow key={`gift-${iIdx}`}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{item.tenSanPham}</Typography>
                            <Chip label="Quà tặng" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#e68c55', color: '#fff' }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary">SKU: {item.maSanPham}</Typography>
                        </TableCell>
                        <TableCell align="right">Miễn phí</TableCell>
                        <TableCell align="center">{item.soLuong}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                              label={`${item.soLuongDaGiao || 0} / ${item.soLuong} đã nhận`}
                              size="small"
                              color={(item.soLuongDaGiao || 0) >= item.soLuong ? 'success' : 'default'}
                              variant={(item.soLuongDaGiao || 0) > 0 ? 'filled' : 'outlined'}
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', width: '100%' }}
                            />
                            {(item.soLuongDangGiao > 0) && (
                              <Chip
                                label={`${item.soLuongDangGiao} đang giao`}
                                size="small"
                                color="primary"
                                variant="filled"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 'bold', width: '100%' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatVND(0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}

          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #eaeaea' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Ghi chú đơn hàng</Typography>
            <Typography variant="body2" color={order.ghiChu ? 'text.primary' : 'text.secondary'}>
              {order.ghiChu || 'Không có ghi chú nào cho đơn hàng này.'}
            </Typography>
          </Paper>

          {/* Timeline History */}
          <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: '16px', border: '1px solid #eaeaea' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Trạng thái đơn hàng</Typography>
            <Box sx={{ mt: 2, borderLeft: '2px solid #e0e0e0', ml: 1, pl: 3 }}>
              {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Chưa có thông tin trạng thái chi tiết.</Typography>
              ) : history.map((h, idx) => (
                <Box key={h.maLichSu} sx={{ mb: 2, position: 'relative' }}>
                  <Box sx={{
                    position: 'absolute', left: -31, top: 4, width: 10, height: 10,
                    borderRadius: '50%', bgcolor: idx === 0 ? 'primary.main' : '#bdbdbd'
                  }} />
                  <Typography variant="subtitle2" fontWeight={700} color={idx === 0 ? 'primary.main' : 'text.primary'}>
                    {h.trangThaiMoi}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(h.ngayTao).toLocaleString('vi-VN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {h.noiDungThayDoi}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Total Summary & Payment Info */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Total Summary */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #eaeaea', bgcolor: '#fff' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Tổng kết đơn hàng</Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Tạm tính:</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatVND(order.tongTien - order.phiVanChuyen + order.giamGia)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Phí vận chuyển:</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatVND(order.phiVanChuyen)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Giảm giá:</Typography>
                  <Typography variant="body2" color="error.main">-{formatVND(order.giamGia)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={700}>Tổng cộng:</Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="error.main">{formatVND(order.tongTien)}</Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Info Cards */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #eaeaea' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PaymentIcon color="action" />
                <Typography variant="subtitle2" fontWeight={700}>Thanh toán</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{order.pttt || 'N/A'}</Typography>

              <Box sx={{ mt: 1 }}>
                {order.thanhToan >= order.tongTien ? (
                  <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #2e7d32' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      ✅ Đã thanh toán thành công {formatVND(order.thanhToan)}
                    </Typography>
                  </Box>
                ) : order.thanhToan > 0 ? (
                  <Box sx={{ p: 1.5, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ef6c00' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ef6c00' }}>
                      💰 Đã thanh toán {formatVND(order.thanhToan)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#d32f2f', display: 'block', mt: 0.5 }}>
                      🔴 Công nợ phải trả: {formatVND(order.tongTien - order.thanhToan)}
                    </Typography>
                  </Box>
                ) : order.pttt?.includes('ATM') ? (
                  <Box sx={{ p: 1.5, bgcolor: '#ffebee', borderRadius: 2, border: '1px solid #c62828' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#c62828' }}>
                      ⌛ Chờ xác nhận thanh toán ATM
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #1976d2' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      🚚 Vui lòng thanh toán {formatVND(order.soTienPhaiThu || order.tongTien)} cho Tài xế khi nhận hàng
                    </Typography>
                  </Box>
                )}
              </Box>

              {history.some(h => h.noiDungThayDoi?.includes('Đã thu')) && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom display="block">
                    CHI TIẾT THANH TOÁN
                  </Typography>
                  {history.filter(h => h.noiDungThayDoi?.includes('Đã thu')).map((h, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(h.ngayTao).toLocaleDateString('vi-VN')}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="success.main">
                        +{formatVND(parseFloat(h.noiDungThayDoi.match(/Đã thu\s+([\d.,]+)/)?.[1].replace(/[.,]/g, '') || 0))}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {order.anhBangChung && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom display="block">
                    ẢNH CHỨNG TỪ THANH TOÁN
                  </Typography>
                  <Box
                    component="img"
                    src={order.anhBangChung}
                    sx={{
                      width: '100%', maxHeight: 200, borderRadius: 2, cursor: 'pointer',
                      border: '1px solid #ddd', objectFit: 'contain', bgcolor: '#fff'
                    }}
                    onClick={() => window.open(order.anhBangChung, '_blank')}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                    (Nhấp vào ảnh để xem kích thước lớn)
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Live Tracking Section */}
            {order.latestDelivery && (order.trangThai === 'Đang giao' || order.trangThai === 'Đang đổi trả' || order.trangThai === 'Đang giao hàng đổi/trả') && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #eaeaea', bgcolor: '#f0f7ff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ShippingIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700}>Theo dõi lộ trình đơn hàng</Typography>
                </Box>

                <Box sx={{ position: 'relative', pl: 3, borderLeft: '2px dashed #1976d2', ml: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Vị trí hiện tại của Shipper:</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {order.latestDelivery.viTriHienTai || "Đang rời cửa hàng"}
                    </Typography>
                    {order.latestDelivery.lat && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic', mb: 1 }}>
                          Tọa độ: {order.latestDelivery.lat}, {order.latestDelivery.lng}
                        </Typography>

                        {/* Nhúng Google Maps */}
                        <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: '12px', mb: 1 }}>
                          <iframe
                            title="Live Tracking Map"
                            width="100%"
                            height="200"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${order.latestDelivery.lat},${order.latestDelivery.lng}&z=15&output=embed`}
                            allowFullScreen
                          ></iframe>
                        </Paper>
                        <Button
                          size="small"
                          startIcon={<OpenInNewIcon />}
                          href={`https://www.google.com/maps/search/?api=1&query=${order.latestDelivery.lat},${order.latestDelivery.lng}`}
                          target="_blank"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          Xem trên Google Maps
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Nhân viên giao hàng:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {order.latestDelivery.nguoiGiao || "Đang phân bổ"}
                    </Typography>
                  </Box>

                  {order.latestDelivery.ngayGiaoDuKien && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Dự kiến giao:</Typography>
                      <Typography variant="body2">
                        {new Date(order.latestDelivery.ngayGiaoDuKien).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">Cập nhật lúc:</Typography>
                    <Typography variant="body2" fontSize="0.75rem">
                      {new Date(order.latestDelivery.ngayCapNhat || order.ngayCapNhat).toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mt: 2, bgcolor: 'transparent', border: 'none', p: 0 }}>
                  <Typography variant="caption">
                    * Shipper sẽ liên hệ với bạn trước khi giao tới. Vui lòng giữ máy.
                  </Typography>
                </Alert>
              </Paper>
            )}

            {order.yeuCauVat && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #eaeaea', borderLeft: '4px solid #e68c55' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ReceiptIcon sx={{ color: '#e68c55' }} />
                  <Typography variant="subtitle1" fontWeight={700}>Thông tin hóa đơn GTGT</Typography>
                </Box>
                <Stack spacing={1} sx={{ pl: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Loại hóa đơn</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {order.vatType === 'business' ? 'Doanh nghiệp / Tổ chức' : 'Cá nhân'}
                    </Typography>
                  </Box>

                  {order.vatType === 'business' ? (
                    <>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Tên công ty</Typography>
                        <Typography variant="body2" fontWeight={600}>{order.vatCompanyName || 'Chưa cung cấp'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Mã số thuế</Typography>
                        <Typography variant="body2" fontWeight={600}>{order.vatTaxId || 'Chưa cung cấp'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Địa chỉ công ty</Typography>
                        <Typography variant="body2">{order.vatCompanyAddress || 'Chưa cung cấp'}</Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Người mua hàng</Typography>
                        <Typography variant="body2" fontWeight={600}>{order.vatBuyerName || 'Chưa cung cấp'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Địa chỉ</Typography>
                        <Typography variant="body2">{order.vatAddress || 'Chưa cung cấp'}</Typography>
                      </Box>
                    </>
                  )}

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Email nhận hóa đơn</Typography>
                    <Typography variant="body2">{order.vatEmail || 'Chưa cung cấp'}</Typography>
                  </Box>
                </Stack>

                {/* Action Buttons - chỉ hiện khi đơn hoàn thành */}
                {order.trangThai === 'Hoàn thành' && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0c9a6', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PdfIcon />}
                      onClick={handleDownloadVatInvoice}
                      sx={{ bgcolor: '#e53935', color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#c62828' } }}
                    >
                      Tải PDF hóa đơn
                    </Button>

                  </Box>
                )}
              </Paper>
            )}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/my-orders')}
              sx={{ borderRadius: '12px', py: 1 }}
            >
              Quay lại danh sách
            </Button>

            {order.trangThai === 'Hoàn thành' && (
              <Box sx={{ width: '100%' }}>
                {!canRequestReturn(order).can ? (
                  <Alert severity="info" sx={{ borderRadius: '12px' }}>
                    <Typography variant="body2" fontWeight={600}>Hạn đổi trả: 24h</Typography>
                    <Typography variant="caption">{canRequestReturn(order).reason}</Typography>
                  </Alert>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={() => setReturnDialogOpen(true)}
                    sx={{ borderRadius: '12px', py: 1, borderWidth: '2px', '&:hover': { borderWidth: '2px' } }}
                  >
                    Yêu cầu Đổi / Trả hàng
                  </Button>
                )}
              </Box>
            )}

            {(order.trangThai === 'Chờ xử lý' || order.trangThai === 'Chờ xác nhận') && (
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleCancelOrder}
                sx={{ borderRadius: '12px', py: 1, fontWeight: 700 }}
              >
                Hủy đặt đơn hàng
              </Button>
            )}

            {(order.trangThai === 'Đã hủy' || order.trangThai === 'Hoàn thành') && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleReorder}
                sx={{ borderRadius: '12px', py: 1, fontWeight: 700 }}
              >
                Đặt lại đơn hàng này
              </Button>
            )}
          </Stack>
        </Grid>
      </Grid>
      <CustomerReturnDialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        order={order}
        onSaved={() => {
          fetchOrder();
          setReturnDialogOpen(false);
        }}
      />
      <ProductReviewDialog
        open={reviewDialogOpen}
        onClose={() => {
          setReviewDialogOpen(false);
          setEditReviewData(null);
        }}
        product={selectedProduct}
        orderId={order.maHoaDon || order.id}
        editData={editReviewData}
        onReviewSuccess={() => {
          alert(editReviewData ? 'Cập nhật đánh giá thành công!' : 'Cảm ơn bạn đã đánh giá sản phẩm!');
          fetchReviewStatus(order);
        }}
      />
      <Dialog 
        open={confirmDialog.open} 
        onClose={handleCloseConfirm}
        PaperProps={{ sx: { borderRadius: '16px', p: 1, maxWidth: '400px' } }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, color: confirmDialog.isDestructive ? '#d32f2f' : '#1976d2' }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontSize: '0.95rem' }}>
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            variant="outlined" 
            onClick={handleCloseConfirm}
            sx={{ borderRadius: '8px', fontWeight: 600, color: '#777', borderColor: '#ccc' }}
          >
            Hủy Bỏ
          </Button>
          <Button 
            variant="contained" 
            color={confirmDialog.isDestructive ? 'error' : 'primary'}
            onClick={() => {
              if (confirmDialog.onConfirm) confirmDialog.onConfirm();
              handleCloseConfirm();
            }}
            sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
          >
            Xác Nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerOrderDetailPage;
