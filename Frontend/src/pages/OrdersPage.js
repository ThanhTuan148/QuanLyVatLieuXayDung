import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Chip, LinearProgress, Card, CardContent, Grid,
  Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import orderService from '../services/orderService';
import OrderForm from '../components/OrderForm';
import OrderDetailDialog from '../components/OrderDetailDialog';
import DataTable from '../components/DataTable';
import { usePermissions } from '../contexts/PermissionContext';

const formatVND = (v) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';
const statusColor = (s) => {
  if (!s) return 'default';
  if (s.includes('Hoàn thành')) return 'success';
  if (s.includes('Đang giao')) return 'info';
  if (s.includes('Chờ')) return 'warning';
  if (s.includes('hủy') || s.includes('Hủy')) return 'error';
  return 'default';
};

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainViewMode, setMainViewMode] = useState('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { permissions } = usePermissions();
  const canCreate = permissions?.orders?.coTheTao ?? false;
  const canEdit = permissions?.orders?.coTheSua ?? false;
  const canDelete = permissions?.orders?.coTheXoa ?? false;

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await orderService.getAllOrders(); setOrders(res.data || []); }
    catch (err) { console.error(err); }
    finally { if (!silent) setLoading(false); }
  };

  const handleSave = async (payload) => {
    try {
      if (editing?.maHoaDon) await orderService.updateOrder(editing.maHoaDon, payload);
      else await orderService.createOrder(payload);
      setFormOpen(false); fetchOrders();
    } catch (err) { 
      let msg = err.response?.data?.message || err.message || 'Lưu thất bại';
      if (err.response?.status === 400 && err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join('\n');
      }
      alert('Lưu đơn thất bại: ' + msg); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đơn hàng này?')) return;
    try { await orderService.deleteOrder(id); fetchOrders(); }
    catch { alert('Xóa thất bại'); }
  };

  const handleSendVatInvoice = async (order) => {
    if (!window.confirm(`Gửi hóa đơn GTGT đến email: ${order.vatEmail || '(chưa có email)'}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/vat-invoice/${order.maHoaDon}/send-email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) alert('✅ ' + data.message);
      else alert('❌ ' + data.message);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleApprove = async (order) => {
    const originalOrders = [...orders];
    
    // Optimistic UI Update: Change status instantly
    setOrders(prev => prev.map(o => o.maHoaDon === order.maHoaDon ? { ...o, trangThai: 'Đã xác nhận' } : o));

    try {
      await orderService.updateOrderStatus(order.maHoaDon, 'Đã xác nhận');
      fetchOrders(true); // Silent background refresh
    } catch (err) {
      // Revert if API fails
      setOrders(originalOrders);
      const msg = err.response?.data?.message || err.message;
      alert('Lỗi duyệt đơn: ' + msg);
    }
  };

  const handleEditClick = async (order) => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(order.maHoaDon);
      setEditing(res.data);
      setFormOpen(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert('Không thể tải chi tiết đơn hàng để chỉnh sửa: ' + msg);
    } finally {
      setLoading(false);
    }
  };


  const columns = [
    { 
      field: 'maHD', 
      headerName: 'Mã HĐ', 
      width: 120,
      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>{params.value}</Typography>
    },
    { 
      field: 'ngayLap', 
      headerName: 'Ngày Lập', 
      width: 120,
      type: 'date',
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('vi-VN') : '—'
    },
    { 
      field: 'ngayGiao', 
      headerName: 'Ngày Giao', 
      width: 120,
      type: 'date',
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('vi-VN') : '—'
    },
    { 
      field: 'tongTien', 
      headerName: 'Tổng Tiền', 
      width: 130, 
      type: 'number',
      valueFormatter: (params) => formatVND(params.value)
    },
    { 
      field: 'giamGia', 
      headerName: 'Giảm Giá', 
      width: 120, 
      type: 'number',
      renderCell: (params) => <Typography variant="body2" sx={{ color: '#f5576c' }}>{params.value > 0 ? formatVND(params.value) : '—'}</Typography>
    },
    { 
      field: 'thanhToan', 
      headerName: 'Thanh Toán', 
      width: 140, 
      type: 'number',
      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#43e97b' }}>{formatVND(params.value)}</Typography>
    },
    { field: 'pttt', headerName: 'PTTT', width: 120 },
    {
      field: 'trangThai',
      headerName: 'Trạng Thái',
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={statusColor(params.value)} variant="outlined" />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 350,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
          {canEdit && params.row.trangThai === 'Chờ xử lý' && (
            <Button size="small" color="success" variant="contained" disableElevation onClick={() => handleApprove(params.row)}>Duyệt</Button>
          )}
          <Button size="small" variant="outlined" onClick={() => { setSelectedOrderId(params.row.maHoaDon); setDetailOpen(true); }}>Chi tiết</Button>
          {canEdit && <Button size="small" variant="outlined" color="primary" onClick={() => handleEditClick(params.row)}>Sửa</Button>}
          {canDelete && <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(params.row.maHoaDon)}>Xóa</Button>}
          {params.row.trangThai === 'Hoàn thành' && params.row.vatEmail && (
            <Button
              size="small"
              variant="contained"
              startIcon={<EmailIcon sx={{ fontSize: 14 }} />}
              onClick={() => handleSendVatInvoice(params.row)}
              sx={{ bgcolor: '#e68c55', color: '#fff', fontSize: '0.7rem', px: 1, '&:hover': { bgcolor: '#c97a40' }, whiteSpace: 'nowrap' }}
            >
              HĐ GTGT
            </Button>
          )}
        </Box>
      )
    }
  ];

  const tongDoanhThu = orders.filter(o => o.trangThai === 'Hoàn thành').reduce((s, o) => s + (o.thanhToan || 0), 0);
  const stats = [
    { label: 'Tổng đơn hàng', value: orders.length, color: '#667eea' },
    { label: 'Chờ xử lý', value: orders.filter(o => o.trangThai?.includes('Chờ')).length, color: '#ffa726' },
    { label: 'Đang giao', value: orders.filter(o => o.trangThai?.includes('giao')).length, color: '#4facfe' },
    { label: 'Doanh thu HT', value: formatVND(tongDoanhThu), color: '#43e97b', small: true },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>🛒 Quản Lý Đơn Hàng</Typography>
          <Typography variant="body2" color="textSecondary">Danh sách hóa đơn bán hàng</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={mainViewMode}
            exclusive
            onChange={(e, nextMode) => { if (nextMode) setMainViewMode(nextMode); }}
            size="small"
            sx={{ mr: 1 }}
          >
            <ToggleButton value="table" sx={{ px: 2, fontWeight: 'bold' }}>
              <TableChartIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Bảng
            </ToggleButton>
            <ToggleButton value="card" sx={{ px: 2, fontWeight: 'bold' }}>
              <GridViewIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Card
            </ToggleButton>
          </ToggleButtonGroup>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2 }}>
              Tạo Đơn Hàng
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderRadius: 2, borderLeft: `4px solid ${s.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant={s.small ? 'h6' : 'h5'} sx={{ fontWeight: 'bold', color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="textSecondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {mainViewMode === 'table' ? (
        <DataTable 
          rows={orders}
          columns={columns}
          getRowId={(row) => row.maHoaDon}
          loading={loading}
        />
      ) : (
        <Grid container spacing={3}>
          {orders.map((item, idx) => (
            <Grid item xs={12} sm={6} md={4} key={item.maHoaDon || idx}>
              <Card sx={{
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {item.maHD}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                        📅 {item.ngayLap ? new Date(item.ngayLap).toLocaleDateString('vi-VN') : '—'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={item.trangThai} 
                      size="small" 
                      color={statusColor(item.trangThai)} 
                      variant="outlined"
                      sx={{ fontWeight: 'bold', bgcolor: '#fff' }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">Tổng Tiền</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatVND(item.tongTien)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">Thanh Toán</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#43e97b' }}>
                        {formatVND(item.thanhToan)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">Ngày Giao Dự Kiến</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.ngayGiao ? new Date(item.ngayGiao).toLocaleDateString('vi-VN') : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">PTTT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.pttt || '—'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                    {canEdit && item.trangThai === 'Chờ xử lý' && (
                      <Button size="small" color="success" variant="contained" disableElevation onClick={() => handleApprove(item)}>Duyệt</Button>
                    )}
                    <Button size="small" variant="outlined" onClick={() => { setSelectedOrderId(item.maHoaDon); setDetailOpen(true); }}>Chi tiết</Button>
                    {canEdit && <Button size="small" variant="outlined" color="primary" onClick={() => handleEditClick(item)}>Sửa</Button>}
                    {canDelete && <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(item.maHoaDon)}>Xóa</Button>}
                    {item.trangThai === 'Hoàn thành' && item.vatEmail && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EmailIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleSendVatInvoice(item)}
                        sx={{ bgcolor: '#e68c55', color: '#fff', fontSize: '0.7rem', px: 1, '&:hover': { bgcolor: '#c97a40' }, whiteSpace: 'nowrap' }}
                      >
                        HĐ GTGT
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <OrderForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSave} initial={editing || {}} />
      <OrderDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} orderId={selectedOrderId} />
    </Box>
  );
}

export default OrdersPage;
