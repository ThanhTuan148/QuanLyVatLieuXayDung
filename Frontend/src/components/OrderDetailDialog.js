import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, Grid, Divider, Chip, CircularProgress
} from '@mui/material';
import ShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import InfoIcon from '@mui/icons-material/Info';
import ReceiptIcon from '@mui/icons-material/Receipt';
import orderService from '../services/orderService';

const formatVND = (v) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '0 ₫';

function OrderDetailDialog({ open, onClose, orderId }) {
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      fetchDetail();
      fetchHistory();
    }
  }, [open, orderId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderById(orderId);
      setOrder(res.data);
    } catch (err) {
      console.error('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await orderService.getOrderHistory(orderId);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const statusColor = (s) => {
    if (!s) return 'default';
    if (s.includes('Hoàn thành')) return 'success';
    if (s.includes('Đang giao')) return 'info';
    if (s.includes('Chờ')) return 'warning';
    return 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Chi Tiết Đơn Hàng: {order?.maHD || '...'}
          </Typography>
          {order && (
            <Chip label={order.trangThai} color={statusColor(order.trangThai)} variant="outlined" size="small" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : order ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, mt: 1, fontSize: '1.1rem', fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ bgcolor: '#e3f2fd', p: 0.5, borderRadius: 1, display: 'flex' }}>👤</Box>
              Thông tin khách hàng & Đặt hàng
            </Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', bgcolor: '#fafafa', p: 2, borderRadius: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">Tài khoản khách</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{order.tenKhachHang}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">Ngày đặt</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{new Date(order.ngayLap).toLocaleString('vi-VN')}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">Nhân viên phụ trách</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{order.tenNhanVien || 'Web Order'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">Phương thức thanh toán</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{order.pttt}</Typography>
                  </Box>
                  {order.pttt?.includes('ATM') && (
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">Ảnh chứng từ</Typography>
                      {order.anhBangChung ? (
                        <Box 
                          component="img" 
                          src={order.anhBangChung} 
                          sx={{ 
                            width: 100, height: 100, borderRadius: 2, cursor: 'pointer', 
                            border: '2px solid #e68c55', objectFit: 'cover',
                            boxShadow: '0 2px 8px rgba(230, 140, 85, 0.3)',
                            '&:hover': { transform: 'scale(1.1)', transition: '0.2s' }
                          }} 
                          onClick={() => window.open(order.anhBangChung, '_blank')}
                        />
                      ) : (
                        <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>Chưa tải ảnh</Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>

              {order.yeuCauVat && (
                <Grid item xs={12}>
                  <Box sx={{ bgcolor: '#f0f7ff', p: 2, borderRadius: 2, border: '1px solid #1976d233' }}>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 'bold' }}>Thông tin Xuất Hóa Đơn (VAT)</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">Họ tên người mua: <strong style={{ color: '#333' }}>{order.vatBuyerName}</strong></Typography>
                        <Typography variant="body2" color="textSecondary">Email: <strong style={{ color: '#333' }}>{order.vatEmail}</strong></Typography>
                      </Grid>
                      {order.vatType === 'business' ? (
                        <Grid item xs={12} md={8}>
                          <Typography variant="body2" color="textSecondary">Đơn vị: <strong style={{ color: '#333' }}>{order.vatCompanyName}</strong></Typography>
                          <Typography variant="body2" color="textSecondary">Mã số thuế: <strong style={{ color: '#333' }}>{order.vatTaxId}</strong></Typography>
                          <Typography variant="body2" color="textSecondary">Địa chỉ ĐV: <strong style={{ color: '#333' }}>{order.vatCompanyAddress}</strong></Typography>
                          {order.vatBudgetCode && <Typography variant="body2" color="textSecondary">Mã CQQH: <strong style={{ color: '#333' }}>{order.vatBudgetCode}</strong></Typography>}
                        </Grid>
                      ) : (
                        <Grid item xs={12} md={8}>
                          <Typography variant="body2" color="textSecondary">Loại/Tư cách: <strong style={{ color: '#333' }}>Cá nhân</strong></Typography>
                          <Typography variant="body2" color="textSecondary">CCCD: <strong style={{ color: '#333' }}>{order.vatIdCard || 'N/A'}</strong> / Hộ chiếu: <strong style={{ color: '#333' }}>{order.vatPassport || 'N/A'}</strong></Typography>
                          <Typography variant="body2" color="textSecondary">Địa chỉ: <strong style={{ color: '#333' }}>{order.vatAddress}</strong></Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Grid>
              )}
            </Grid>


            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ bgcolor: '#e3f2fd', p: 0.5, borderRadius: 1, display: 'flex' }}>📦</Box>
              Chi tiết giao hàng theo địa chỉ
            </Typography>
            
            {(() => {
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
                  phone: item.sdtNguoiNhan || item.SdtNguoiNhan || order.sdtNguoiNhan || order.SdtNguoiNhan 
                };
                acc[addr].items.push(item);
                return acc;
              }, {}) || {};

              const groupEntries = Object.entries(groupedItems);

              return groupEntries.map(([address, data], idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 0, borderRadius: '16px', border: '1px solid #eaeaea', mb: 3, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eaeaea' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ShippingIcon fontSize="small" color="primary" />
                      <Typography variant="subtitle2" fontWeight={700}>
                        Địa chỉ {groupEntries.length > 1 ? idx + 1 : ""}: <span style={{ fontWeight: 400, color: '#666' }}>{address}</span>
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3 }}>
                       <Typography variant="body2" fontWeight={600}>Người nhận: {data.receiver || 'N/A'}</Typography>
                       <Typography variant="body2" color="text.secondary">SĐT: {data.phone || 'N/A'}</Typography>
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
                        {data.items.map((item, iIdx) => (
                          <TableRow key={item.maCTHD || iIdx} sx={item.donGia === 0 ? { bgcolor: '#fffdf9' } : {}}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>{item.tenSanPham}</Typography>
                                {item.donGia === 0 && !(['Xi măng', 'Thép', 'Gạch', 'Cát', 'Đá', 'Sắt'].some(kw => item.tenSanPham?.includes(kw))) && (
                                  <Chip label="Quà tặng" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#e68c55', color: '#fff' }} />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary">SKU: {item.maSanPham}</Typography>
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
                                    label={`${item.soLuongDangGiao} đang đến`}
                                    size="small"
                                    color="primary"
                                    variant="filled"
                                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 'bold', width: '100%' }}
                                  />
                                )}
                                {(item.soLuongChoGiao > 0) && (
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
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatVND(item.thanhTien)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              ));
            })()}

            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Box sx={{ width: 250 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tổng cộng:</Typography>
                  <Typography variant="body2">{formatVND(order.tongTien)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: '#f5576c' }}>
                  <Typography variant="body2">Giảm giá:</Typography>
                  <Typography variant="body2">-{formatVND(order.giamGia)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mb: 1 }}>
                  {order.thanhToan >= order.tongTien ? (
                    <Box sx={{ p: 1, bgcolor: '#e8f5e9', borderRadius: 1, border: '1px solid #2e7d32' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32', textAlign: 'center' }}>
                        ✅ Đã thanh toán thành công {formatVND(order.thanhToan)}
                      </Typography>
                    </Box>
                  ) : order.thanhToan > 0 ? (
                    <Box sx={{ p: 1, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ef6c00' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ef6c00' }}>
                        💰 Đã thanh toán {formatVND(order.thanhToan)}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#d32f2f', display: 'block', mt: 0.5 }}>
                        🔴 Công nợ: {formatVND(order.tongTien - order.thanhToan)}
                      </Typography>
                    </Box>
                  ) : order.pttt?.includes('ATM') ? (
                    <Box sx={{ p: 1, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #c62828' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#c62828', textAlign: 'center' }}>
                        ⌛ Chờ xác nhận thanh toán ATM
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #1976d2' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
                        🚚 Vui lòng thanh toán {formatVND(order.soTienPhaiThu || order.tongTien)} cho Tài xế khi nhận hàng
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Thực thu:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    {formatVND(order.thanhToan)}
                  </Typography>
                </Box>

                {history.some(h => h.noiDungThayDoi?.includes('Đã thu')) && (
                  <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #ccc' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 1, display: 'block' }}>LỊCH SỬ THU TIỀN:</Typography>
                    {history.filter(h => h.noiDungThayDoi?.includes('Đã thu')).map((h, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">{new Date(h.ngayTao).toLocaleString('vi-VN')}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                          +{formatVND(parseFloat(h.noiDungThayDoi.match(/Đã thu\s+([\d.,]+)/)?.[1].replace(/[.,]/g, '') || 0))}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

            {order.ghiChu && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fff9c4', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">Ghi chú:</Typography>
                <Typography variant="body2">{order.ghiChu}</Typography>
              </Box>
            )}

            {/* Order History Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                📜 Lịch sử thay đổi đơn hàng
              </Typography>
              <Box sx={{ borderLeft: '2px solid #e0e0e0', ml: 1, pl: 3, position: 'relative' }}>
                {history.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">Chưa có lịch sử thay đổi.</Typography>
                ) : history.map((h, idx) => (
                  <Box key={h.maLichSu} sx={{ mb: 2, position: 'relative' }}>
                    <Box sx={{ 
                      position: 'absolute', left: -31, top: 4, width: 10, height: 10, 
                      borderRadius: '50%', bgcolor: idx === 0 ? 'primary.main' : '#bdbdbd' 
                    }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {h.trangThaiMoi}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(h.ngayTao).toLocaleString('vi-VN')} • Thực hiện bởi: {h.tenNhanVien}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: '#555' }}>
                      {h.noiDungThayDoi}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <Typography variant="body1" align="center">Không tìm thấy thông tin đơn hàng</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} variant="outlined">Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}

export default OrderDetailDialog;
