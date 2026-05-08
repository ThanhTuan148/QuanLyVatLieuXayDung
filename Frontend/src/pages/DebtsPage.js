import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, TextField, InputAdornment, Card, CardContent, Grid, Tabs, Tab, Button, IconButton, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GroupsIcon from '@mui/icons-material/Groups';
import BusinessIcon from '@mui/icons-material/Business';
import debtService from '../services/debtService';
import DebtDetailModal from '../components/DebtDetailModal';
import PaymentModal from '../components/PaymentModal';
import DataTable from '../components/DataTable';

export default function DebtsPage() {
  const [tab, setTab] = useState(0); // 0: Customers, 1: Suppliers
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tongNoPhaiThu: 0,
    soKhachNo: 0,
    tongNoPhaiTra: 0,
    soNCCNo: 0,
    soKhoanQuaHan: 0,
    tienSapToiPhaiTra: 0
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const type = tab === 0 ? 'Phải thu' : 'Phải trả';
      const res = await debtService.getAll({ type });
      setDebts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await debtService.getStatistics();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDebts();
  }, [tab]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã thanh toán': return 'success';
      case 'Quá hạn': return 'error';
      case 'Sắp đến hạn': return 'error';
      case 'Chưa thanh toán': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'maCN', headerName: 'Mã Công Nợ', width: 120, renderCell: (p) => <b style={{ color: '#667eea' }}>{p.value}</b> },
    { 
      field: tab === 0 ? 'tenKhachHang' : 'tenNCC', 
      headerName: tab === 0 ? 'Khách Hàng' : 'Nhà Cung Cấp', 
      flex: 1.5,
      minWidth: 200,
      renderCell: (p) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.value}</Typography>
          <Typography variant="caption" color="textSecondary">{tab === 0 ? `KH: ${p.row.maKhachHang}` : `NCC: ${p.row.maNhaCungCap}`}</Typography>
        </Box>
      )
    },
    { 
      field: tab === 0 ? 'maHD' : 'maPN', 
      headerName: 'Chứng Từ', 
      width: 120,
      renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
    },
    { 
      field: 'soTienNo', 
      headerName: 'Tổng Nợ', 
      width: 150, 
      valueFormatter: (p) => formatCurrency(p.value) 
    },
    { 
      field: 'soTienDaTra', 
      headerName: 'Đã Trả', 
      width: 150, 
      renderCell: (p) => <span style={{ color: '#2e7d32' }}>{formatCurrency(p.value)}</span>
    },
    { 
      field: 'soTienConLai', 
      headerName: 'Còn Lại', 
      width: 150, 
      renderCell: (p) => (
        <b style={{ color: p.value > 0 ? '#d32f2f' : '#2e7d32' }}>{formatCurrency(p.value)}</b>
      )
    },
    { 
      field: 'hanThanhToan', 
      headerName: 'Hạn Trả', 
      width: 130,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('vi-VN') : '—'
    },
    { 
      field: 'trangThai', 
      headerName: 'Trạng Thái', 
      width: 140,
      renderCell: (p) => (
        <Chip label={p.value} size="small" color={getStatusColor(p.value)} variant="contained" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }} />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 120,
      sortable: false,
      align: 'center',
      renderCell: (p) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => { setSelectedDebt(p.row); setDetailOpen(true); }}><VisibilityIcon fontSize="small" /></IconButton>
          {p.row.soTienConLai > 0 && (
            <IconButton size="small" color="success" onClick={() => { setSelectedDebt(p.row); setPaymentOpen(true); }}><PaymentIcon fontSize="small" /></IconButton>
          )}
        </Box>
      )
    }
  ];

  const statCards = [
    { label: 'Tổng Khách Hàng Nợ', value: formatCurrency(stats.tongNoPhaiThu), icon: <TrendingUpIcon />, color: '#43e97b', subtitle: `${stats.soKhachNo} khách hàng` },
    { label: 'Tổng Nợ NCC', value: formatCurrency(stats.tongNoPhaiTra), icon: <TrendingDownIcon />, color: '#f5576c', subtitle: `${stats.soNCCNo} nhà cung cấp` },
    { label: 'Khoản Quá Hạn', value: stats.soKhoanQuaHan, icon: <RefreshIcon />, color: '#d32f2f', subtitle: 'Cần xử lý ngay' },
    { label: 'Dự kiến trả sắp tới', value: formatCurrency(stats.tienSapToiPhaiTra), icon: <PaymentIcon />, color: '#fb8c00', subtitle: 'Theo lịch hẹn' }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWalletIcon fontSize="large" sx={{ color: '#667eea' }} /> Công Nợ
          </Typography>
          <Typography variant="body2" color="textSecondary">Theo dõi công nợ phải thu và phải trả</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchStats(); fetchDebts(); }}>Làm Mới</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ 
              borderLeft: `4px solid ${s.color}`,
              background: `linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)`,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: s.color }}>{s.icon} <Typography variant="caption" fontWeight="bold">{s.label}</Typography></Box>
                <Typography variant="h5" fontWeight="bold">{s.value}</Typography>
                <Typography variant="caption" color="textSecondary">{s.subtitle}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {stats.soKhoanQuaHan > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1, bgcolor: '#feb2b2', borderRadius: '50%' }}>
            <RefreshIcon sx={{ color: '#c53030' }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" color="#c53030">Cảnh báo: Có {stats.soKhoanQuaHan} khoản nợ đã quá hạn!</Typography>
            <Typography variant="body2" color="#742a2a">Vui lòng kiểm tra và thực hiện thanh toán hoặc liên hệ khách hàng để thu hồi nợ.</Typography>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="secondary" indicatorColor="secondary">
            <Tab label="Phải thu (Khách hàng)" icon={<GroupsIcon />} iconPosition="start" />
            <Tab label="Phải trả (Nhà cung cấp)" icon={<BusinessIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <DataTable 
          rows={debts}
          columns={columns}
          getRowId={(row) => row.maCongNo}
          loading={loading}
        />
      </Paper>

      {selectedDebt && (
        <>
          <DebtDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} debt={selectedDebt} />
          <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} debt={selectedDebt} onSuccess={() => { fetchStats(); fetchDebts(); }} />
        </>
      )}
    </Box>
  );
}
