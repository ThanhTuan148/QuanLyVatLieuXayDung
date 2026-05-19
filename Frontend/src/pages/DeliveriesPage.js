import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import api from '../services/api';
import DeliveryDetailDialog from '../components/DeliveryDetailDialog';
import DeliveryForm from '../components/DeliveryForm';
import BatchSuggestionDialog from '../components/BatchSuggestionDialog';
import DeliveryStatusUpdateDialog from '../components/DeliveryStatusUpdateDialog';
import DataTable from '../components/DataTable';
import { usePermissions } from '../contexts/PermissionContext';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [initialFormOrderId, setInitialFormOrderId] = useState(null);
  const [initialFormBatch, setInitialFormBatch] = useState(null);

  const [aiRouteOpen, setAiRouteOpen] = useState(false);
  const [aiRouteLoading, setAiRouteLoading] = useState(false);
  const [aiRouteData, setAiRouteData] = useState(null);

  const handleRunAiRoute = async () => {
    setAiRouteOpen(true);
    setAiRouteLoading(true);
    try {
      const activeAddresses = deliveries
        .filter(d => d.trangThai?.includes('Chờ giao') || d.trangThai?.includes('Đang giao'))
        .map(d => d.diaChi)
        .filter(Boolean);

      const addressesToSend = activeAddresses.length > 0 ? activeAddresses : [
        "123 Nguyễn Văn Linh, Phường Tân Thuận Tây, Quận 7, TP.HCM",
        "456 Huỳnh Tấn Phát, Thị trấn Nhà Bè, Huyện Nhà Bè, TP.HCM",
        "789 Phạm Hùng, Phường 4, Quận 8, TP.HCM"
      ];

      const res = await api.post('/ai/route-optimization', addressesToSend);
      setAiRouteData(res.data);
    } catch (err) {
      alert('Lỗi khi gọi AI Tối ưu lộ trình: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiRouteLoading(false);
    }
  };

  const handleContinueDelivery = (maHoaDon) => {
    setDetailOpen(false);
    setInitialFormOrderId(maHoaDon);
    setFormOpen(true);
  };

  const handleOpenStatusUpdate = (d) => {
    setSelectedDelivery(d);
    setStatusUpdateOpen(true);
  };

  // Auth checking
  const { permissions } = usePermissions();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const canManageDelivery = permissions?.deliveries?.coTheTao;

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      // Nếu chỉ có quyền xem (không có quyền tạo), chỉ lấy phiếu giao của mình
      const params = !canManageDelivery ? { maNhanVien: user?.maNhanVien || user?.MaNhanVien || user?.employeeId } : {};
      const response = await api.get('/deliveries', { params });
      setDeliveries(response.data || []);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const columns = [
    { field: 'maGH', headerName: 'Mã GH', width: 100, renderCell: (params) => <b style={{ color: '#667eea' }}>{params.value}</b> },
    { field: 'maHD', headerName: 'Mã HĐ', width: 90 },
    { 
      field: 'nguoiGiao', 
      headerName: 'Người Giao / Tài Xế', 
      flex: 1.2, 
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2">{params.value} <span style={{ color: '#888', fontSize: '0.75rem' }}>(Tạo: {params.row.tenNhanVien})</span></Typography>
      )
    },
    { 
      field: 'ngayGiaoThucTe', 
      headerName: 'Ngày Giao Thực Tế', 
      width: 150,
      type: 'date',
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('vi-VN') : '-'
    },
    { field: 'diaChi', headerName: 'Địa Chỉ', flex: 1.5, minWidth: 200 },
    { 
      field: 'trangThai', 
      headerName: 'Trạng Thái', 
      width: 140,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" color={
          params.value === 'Đã giao' ? 'success' : 
          params.value.includes('Đang giao') ? 'primary' : 
          params.value.includes('Giao đổi') ? 'secondary' : 
          'warning'
        } />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => { setSelectedId(params.row.maPhieuGH); setDetailOpen(true); }}>Chi tiết</Button>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>🚚 Giao Hàng</Typography>
          <Typography variant="body2" color="textSecondary">Quản lý phiếu giao hàng</Typography>
        </Box>
        {canManageDelivery && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleRunAiRoute} sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#fff', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(56,239,125,0.3)' }}>
              🗺️ AI Tối Ưu Lộ Trình Giao Hàng
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setBatchOpen(true)}>✨ Gợi Ý Ghép Chuyến</Button>
            <Button variant="contained" onClick={() => { setInitialFormOrderId(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              + Thêm Phiếu Giao
            </Button>
          </Box>
        )}
      </Box>

      <DataTable 
        rows={deliveries}
        columns={columns}
        getRowId={(row) => row.maPhieuGH}
        loading={loading}
      />

      <DeliveryDetailDialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        deliveryId={selectedId} 
        onContinueDelivery={handleContinueDelivery}
        onUpdated={() => { fetchDeliveries(); }}
      />
      <DeliveryForm 
        open={formOpen} 
        onClose={() => { setFormOpen(false); setInitialFormBatch(null); }} 
        onSaved={() => { setFormOpen(false); setInitialFormBatch(null); fetchDeliveries(); }} 
        initialOrderId={initialFormOrderId}
        initialBatch={initialFormBatch}
      />
      <DeliveryStatusUpdateDialog
        open={statusUpdateOpen}
        onClose={() => setStatusUpdateOpen(false)}
        delivery={selectedDelivery}
        onUpdated={() => { setStatusUpdateOpen(false); fetchDeliveries(); }}
      />
      <BatchSuggestionDialog 
        open={batchOpen} 
        onClose={() => setBatchOpen(false)} 
        onSelectBatch={(batch) => {
          setInitialFormBatch(batch);
          setInitialFormOrderId(batch.orders?.[0]?.maHoaDon || '');
          setFormOpen(true);
        }}
      />

      <Dialog open={aiRouteOpen} onClose={() => setAiRouteOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0b486b 0%, #f56217 100%)', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🗺️ AI TỐI ƯU HÓA LỘ TRÌNH GIAO HÀNG (ROUTE OPTIMIZATION)</Typography>
          </Box>
          <Chip label="Google Maps Platform & TSP AI" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold' }} />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          {aiRouteLoading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <LinearProgress color="success" sx={{ mb: 3, height: 8, borderRadius: 4 }} />
              <Typography variant="h6" color="text.secondary" sx={{ animation: 'pulse 1.5s infinite' }}>
                AI đang kết nối Google Maps Platform (Routes Preferred), tính toán ma trận khoảng cách và tìm lộ trình di chuyển ngắn nhất...
              </Typography>
            </Box>
          ) : aiRouteData ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff', borderLeft: '5px solid #38ef7d', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Tổng Quãng Đường</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0b486b', mt: 0.5 }}>{aiRouteData.tongKhoangCachKm} km</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff', borderLeft: '5px solid #f56217', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Tổng Thời Gian Di Chuyển</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0b486b', mt: 0.5 }}>{aiRouteData.tongThoiGian}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff', borderLeft: '5px solid #11998e', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Hiệu Quả Nhiên Liệu</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#11998e', mt: 0.5 }}>{aiRouteData.tieuThuNhienLieuUocTinh}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50' }}>
                📍 Thứ Tự Giao Hàng Tối Ưu (TSP Route)
              </Typography>

              <Paper sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {aiRouteData.loTrinhToiUu?.map((wp, idx) => (
                  <Box key={idx} sx={{ p: 2.5, borderBottom: idx < aiRouteData.loTrinhToiUu.length - 1 ? '1px solid #eee' : 'none', display: 'flex', alignItems: 'center', gap: 2, bgcolor: idx === 0 ? 'rgba(56, 239, 125, 0.1)' : '#fff' }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: idx === 0 ? '#11998e' : '#0b486b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {wp.thuTu}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: idx === 0 ? '#11998e' : '#333' }}>
                        {wp.diaChi}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Cách điểm trước: <b>{wp.khoangCachKm} km</b> ({wp.thoiGianDiChuyen}) • <span style={{ fontStyle: 'italic' }}>{wp.ghiChuLoTrinh}</span>
                      </Typography>
                    </Box>
                    {idx === 0 && <Chip label="Điểm Xuất Phát" color="success" size="small" />}
                  </Box>
                ))}
              </Paper>
            </Box>
          ) : (
            <Typography color="error">Không có dữ liệu lộ trình</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#fff' }}>
          <Button variant="contained" onClick={() => setAiRouteOpen(false)} sx={{ background: 'linear-gradient(135deg, #0b486b 0%, #f56217 100%)' }}>
            Đóng Giao Diện AI
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
