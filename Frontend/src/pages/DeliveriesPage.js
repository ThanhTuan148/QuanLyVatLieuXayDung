import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Chip, LinearProgress
} from '@mui/material';
import api from '../services/api';
import DeliveryDetailDialog from '../components/DeliveryDetailDialog';
import DeliveryForm from '../components/DeliveryForm';
import BatchSuggestionDialog from '../components/BatchSuggestionDialog';
import DeliveryStatusUpdateDialog from '../components/DeliveryStatusUpdateDialog';
import DataTable from '../components/DataTable';

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
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const roleStr = String(user?.role || user?.Role || user?.roleName || '').trim().toLowerCase();
  const isTaiXe = roleStr.includes('tài xế');

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      // Nếu là tài xế, chỉ lấy phiếu giao của mình
      const params = isTaiXe ? { maNhanVien: user?.maNhanVien || user?.MaNhanVien } : {};
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
        {!isTaiXe && (
          <Box sx={{ display: 'flex', gap: 2 }}>
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
        onUpdated={() => { setDetailOpen(false); fetchDeliveries(); }}
      />
      <DeliveryForm 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        onSaved={() => { setFormOpen(false); fetchDeliveries(); }} 
        initialOrderId={initialFormOrderId}
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
          alert(`Chức năng tạo chuyến hàng loạt đang được phát triển.\nTuyến: ${batch.routeName}\nSố đơn: ${batch.ordersCount}`);
        }}
      />
    </Box>
  );
}
