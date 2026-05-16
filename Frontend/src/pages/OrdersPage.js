import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Chip, LinearProgress, Card, CardContent, Grid
} from '@mui/material';
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
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { permissions } = usePermissions();
  const canCreate = permissions?.orders?.coTheTao ?? false;
  const canEdit = permissions?.orders?.coTheSua ?? false;
  const canDelete = permissions?.orders?.coTheXoa ?? false;

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try { const res = await orderService.getAllOrders(); setOrders(res.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    try {
      const detailRes = await orderService.getOrderById(order.maHoaDon);
      const fullOrder = detailRes.data;
      
      const fullPayload = {
        NgayLap: fullOrder.ngayLap,
        NgayGiao: fullOrder.ngayGiao,
        TongTien: fullOrder.tongTien,
        ThanhToan: fullOrder.thanhToan,
        GiamGia: fullOrder.giamGia,
        PTTT: fullOrder.pttt,
        TrangThai: 'Đã xác nhận',
        GhiChu: fullOrder.ghiChu,
        MaKhachHang: fullOrder.maKhachHang,
        MaNhanVien: JSON.parse(localStorage.getItem('user'))?.maNhanVien || fullOrder.maNhanVien,
        MaKhuyenMai: fullOrder.maKhuyenMai,

        TenNguoiNhan: fullOrder.tenNguoiNhan,
        SdtNguoiNhan: fullOrder.sdtNguoiNhan,
        EmailNguoiNhan: fullOrder.emailNguoiNhan,
        DiaChiGiaoHang: fullOrder.diaChiGiaoHang,
        PhiVanChuyen: fullOrder.phiVanChuyen,
        YeuCauVat: fullOrder.yeuCauVat,
        VatType: fullOrder.vatType,
        VatBuyerName: fullOrder.vatBuyerName,
        VatEmail: fullOrder.vatEmail,
        VatAddress: fullOrder.vatAddress,
        VatIdCard: fullOrder.vatIdCard,
        VatPassport: fullOrder.vatPassport,
        VatCompanyName: fullOrder.vatCompanyName,
        VatCompanyAddress: fullOrder.vatCompanyAddress,
        VatTaxId: fullOrder.vatTaxId,
        VatBudgetCode: fullOrder.vatBudgetCode,

        Items: fullOrder.chiTiet.map(i => ({
          MaSanPham: i.maSanPham,
          SoLuong: i.soLuong,
          DonGia: i.donGia,
          GiamGia: 0,
          DiaChiGiaoHang: i.diaChiGiaoHang || i.DiaChiGiaoHang,
          TenNguoiNhan: i.tenNguoiNhan || i.TenNguoiNhan,
          SdtNguoiNhan: i.sdtNguoiNhan || i.SdtNguoiNhan
        }))
      };
      
      await orderService.updateOrder(order.maHoaDon, fullPayload);
      fetchOrders();
    } catch (err) {
      alert('Lỗi duyệt đơn: ' + err.message);
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
          {canEdit && <Button size="small" variant="outlined" color="primary" onClick={() => { setEditing(params.row); setFormOpen(true); }}>Sửa</Button>}
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
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2 }}>
            Tạo Đơn Hàng
          </Button>
        )}
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

      <DataTable 
        rows={orders}
        columns={columns}
        getRowId={(row) => row.maHoaDon}
        loading={loading}
      />

      <OrderForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSave} initial={editing || {}} />
      <OrderDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} orderId={selectedOrderId} />
    </Box>
  );
}

export default OrdersPage;
