import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Card, CardContent, Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableChartIcon from '@mui/icons-material/TableChart';
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
  const [mainViewMode, setMainViewMode] = useState('table');
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [initialFormOrderId, setInitialFormOrderId] = useState(null);
  const [initialFormBatch, setInitialFormBatch] = useState(null);



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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={mainViewMode}
            exclusive
            onChange={(e, nextMode) => { if (nextMode) setMainViewMode(nextMode); }}
            size="small"
            sx={{ mr: 2 }}
          >
            <ToggleButton value="table" sx={{ px: 2, fontWeight: 'bold' }}>
              <TableChartIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Bảng
            </ToggleButton>
            <ToggleButton value="card" sx={{ px: 2, fontWeight: 'bold' }}>
              <GridViewIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Card
            </ToggleButton>
          </ToggleButtonGroup>
          {canManageDelivery && (
            <Box sx={{ display: 'flex', gap: 2 }}>

              <Button variant="outlined" color="secondary" onClick={() => setBatchOpen(true)}>✨ Gợi Ý Ghép Chuyến</Button>
              <Button variant="contained" onClick={() => { setInitialFormOrderId(null); setFormOpen(true); }}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                + Thêm Phiếu Giao
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {mainViewMode === 'table' ? (
        <DataTable 
          rows={deliveries}
          columns={columns}
          getRowId={(row) => row.maPhieuGH}
          loading={loading}
        />
      ) : (
        <Grid container spacing={3}>
          {deliveries.map((item, idx) => (
            <Grid item xs={12} sm={6} md={4} key={item.maPhieuGH || idx}>
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
                        {item.maGH}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                        Mã HĐ: {item.maHD}
                      </Typography>
                    </Box>
                    <Chip 
                      label={item.trangThai} 
                      size="small" 
                      color={
                        item.trangThai === 'Đã giao' ? 'success' : 
                        item.trangThai.includes('Đang giao') ? 'primary' : 
                        item.trangThai.includes('Giao đổi') ? 'secondary' : 
                        'warning'
                      } 
                      variant="filled"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary" display="block">Người Giao / Tài Xế</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        👤 {item.nguoiGiao} <span style={{ color: '#888', fontWeight: 'normal', fontSize: '0.75rem' }}>(Tạo: {item.tenNhanVien})</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary" display="block">Ngày Giao Thực Tế</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        📅 {item.ngayGiaoThucTe ? new Date(item.ngayGiaoThucTe).toLocaleDateString('vi-VN') : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary" display="block">Địa Chỉ</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        📍 {item.diaChi}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                    <Button size="small" variant="outlined" onClick={() => { setSelectedId(item.maPhieuGH); setDetailOpen(true); }}>
                      Chi tiết
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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


    </Box>
  );
}
