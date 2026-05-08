import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Button, 
  Skeleton, Alert, Stack, TablePagination
} from '@mui/material';
import { 
  Visibility as ViewIcon, 
  ShoppingBag as BagIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import authService from '../services/authService';
import orderService from '../services/orderService';
import { useNavigate } from 'react-router-dom';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getUser();
      const customerId = user?.maKhachHang || user?.MaKhachHang || user?.maKH;

      if (customerId && customerId !== 'undefined') {
        const res = await orderService.getOrdersByCustomer(customerId);
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setOrders(data);
      } else {
        console.warn('Customer ID not found in user object:', user);
        setError('Không tìm thấy mã khách hàng. Vui lòng đăng xuất và đăng nhập lại.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) {
        setError('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Lỗi khi tải danh sách đơn hàng. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'cho_xac_nhan': case 'chờ xác nhận': return 'warning';
      case 'da_xac_nhan': case 'đã xác nhận': return 'info';
      case 'dang_giao': case 'đang giao': return 'primary';
      case 'hoan_thanh': case 'hoàn thành': return 'success';
      case 'da_huy': case 'đã hủy': return 'error';
      case 'yêu cầu đổi/trả hàng': return 'error';
      case 'đang đổi trả': return 'warning';
      case 'đang giao hàng đổi/trả': return 'primary';
      case 'đã đổi trả': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'cho_xac_nhan': return 'Chờ xác nhận';
      case 'da_xac_nhan': return 'Đã xác nhận';
      case 'dang_giao': return 'Đang giao hàng';
      case 'hoan_thanh': return 'Hoàn thành';
      case 'da_huy': return 'Đã hủy';
      default: return status || 'N/A';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Skeleton variant="text" width="40%" height={60} sx={{ mb: 4 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '16px' }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Đơn hàng của tôi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Xem và quản lý lịch sử mua hàng của bạn
          </Typography>
        </Box>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={fetchOrders}
          variant="outlined"
          sx={{ borderRadius: '30px', textTransform: 'none' }}
        >
          Làm mới
        </Button>
      </Box>

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : orders.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: '16px', border: '1px dashed #ccc' }}>
          <BagIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>Bạn chưa có đơn hàng nào</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/shopping')}
            sx={{ mt: 2, bgcolor: '#e68c55', '&:hover': {bgcolor: '#cc7a4a'} }}
          >
            Mua sắm ngay
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #eaeaea' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f9f9f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã đơn hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày đặt</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tổng tiền</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
                <TableRow key={order.maHD} hover>
                  <TableCell>
                    <Typography fontWeight={600} color="primary.main">#{order.maHD || order.orderId}</Typography>
                  </TableCell>
                  <TableCell>
                    {order.ngayLap ? new Date(order.ngayLap).toLocaleDateString('vi-VN') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="error.main">
                      {order.tongTien?.toLocaleString('vi-VN')} đ
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={getStatusLabel(order.trangThai)} 
                        color={getStatusColor(order.trangThai)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      {order.coYeuCauDoiTra && (
                        <Chip 
                          label="Đổi / Trả" 
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Button 
                      size="small" 
                      startIcon={<ViewIcon />}
                      sx={{ textTransform: 'none' }}
                      onClick={() => navigate(`/order-detail/${order.maHoaDon || order.orderId}`)}
                    >
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={orders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Dòng mỗi trang:"
          />
        </TableContainer>
      )}
    </Container>
  );
};

export default CustomerOrdersPage;
