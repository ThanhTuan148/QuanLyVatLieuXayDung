import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  TextField, MenuItem, Select, FormControl, InputLabel, Chip,
  Alert, Skeleton, Avatar, Tooltip, IconButton,
  ToggleButton, ToggleButtonGroup, Autocomplete
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  Refresh as RefreshIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, Area, AreaChart, LineChart, Line,
} from 'recharts';
import DataTable from '../components/DataTable';

const API = 'http://localhost:5000/api';

const formatVND = (v) =>
  v != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const formatDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';

const formatDateOnly = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const TrendChip = ({ value }) => {
  if (value == null) return <Chip label="Chưa có" size="small" sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', fontSize: '0.7rem' }} />;
  if (value > 0) return (
    <Chip icon={<TrendingUpIcon />} label={`+${value}%`} size="small"
      sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 700, fontSize: '0.7rem', '& .MuiChip-icon': { color: '#e65100', fontSize: 14 } }} />
  );
  if (value < 0) return (
    <Chip icon={<TrendingDownIcon />} label={`${value}%`} size="small"
      sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.7rem', '& .MuiChip-icon': { color: '#2e7d32', fontSize: 14 } }} />
  );
  return <Chip icon={<TrendingFlatIcon />} label="Không đổi" size="small" sx={{ bgcolor: '#f5f5f5', color: '#757575', fontSize: '0.7rem' }} />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={4} sx={{ p: 2, borderRadius: 2, minWidth: 200 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color }} />
          <Typography variant="body2">{p.name}: <strong>{formatVND(p.value)}</strong></Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default function PriceHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(90);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState([]);
  const [productsOverview, setProductsOverview] = useState([]);
  const [summary, setSummary] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [viewMode, setViewMode] = useState('overview');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data || []);
    } catch {}
  }, []);

  const fetchProductsOverview = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/price-history/products-overview`);
      setProductsOverview(res.data || []);
    } catch {}
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/price-history/summary?days=${days}`);
      setSummary(res.data);
    } catch {}
  }, [days]);

  const fetchHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams({ days });
      if (selectedProduct) params.append('productId', selectedProduct);
      const res = await axios.get(`${API}/price-history?${params}`);
      setHistoryData(res.data || []);
    } catch {}
  }, [days, selectedProduct]);

  const fetchChart = useCallback(async () => {
    if (!selectedProduct) { setChartData(null); return; }
    try {
      const res = await axios.get(`${API}/price-history/product/${selectedProduct}/chart?days=${days}`);
      setChartData(res.data);
    } catch {}
  }, [selectedProduct, days]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchProducts(), fetchProductsOverview(), fetchSummary(), fetchHistory()]);
      if (selectedProduct) await fetchChart();
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, fetchProductsOverview, fetchSummary, fetchHistory, fetchChart, selectedProduct]);

  useEffect(() => { loadAll(); }, [days, selectedProduct]);

  const handleSelectProduct = (id) => {
    setSelectedProduct(id);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const overviewColumns = [
    { field: 'maSP', headerName: 'Mã SP', width: 90, renderCell: (p) => <Chip label={p.value} size="small" sx={{ bgcolor: '#f1f5f9', fontSize: '0.72rem', fontWeight: 600 }} /> },
    { field: 'tenSP', headerName: 'Tên sản phẩm', flex: 1.5, minWidth: 200, renderCell: (p) => <Typography variant="body2" fontWeight={600}>{p.value}</Typography> },
    { field: 'tenLoai', headerName: 'Loại', flex: 1, renderCell: (p) => <Typography variant="caption" color="text.secondary">{p.value}</Typography> },
    { 
      field: 'giaBanTruoc', 
      headerName: 'Giá bán trước', 
      width: 130, 
      align: 'right',
      renderCell: (p) => <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatVND(p.value)}</Typography>
    },
    { field: 'giaBanHienTai', headerName: 'Giá bán hiện tại', width: 140, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={700} color="#4f46e5">{formatVND(p.value)}</Typography> },
    { field: 'phanTramGiaBan', headerName: 'Biến động', width: 100, align: 'center', renderCell: (p) => <TrendChip value={p.value} /> },
    { field: 'giaNhapHienTai', headerName: 'Giá nhập hiện tại', width: 140, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={600} color="#0284c7">{formatVND(p.value)}</Typography> },
    { field: 'soLuongTon', headerName: 'Tồn kho', width: 100, align: 'center', renderCell: (p) => <Chip label={p.value} size="small" sx={{ fontWeight: 700, bgcolor: p.value > 0 ? '#dcfce7' : '#fee2e2', color: p.value > 0 ? '#15803d' : '#dc2626' }} /> },
    { field: 'lanThayDoiGanNhat', headerName: 'Cập nhật', width: 120, valueFormatter: (p) => formatDateOnly(p.value) }
  ];

  const historyColumns = [
    { field: 'tenSP', headerName: 'Sản phẩm', flex: 1.5, minWidth: 180, renderCell: (p) => (
      <Box><Typography variant="body2" fontWeight={600}>{p.value}</Typography><Typography variant="caption" color="text.secondary">{p.row.maSP}</Typography></Box>
    )},
    { field: 'giaNhap', headerName: 'Biến động giá nhập', width: 190, renderCell: (p) => {
       const trend = (p.row.giaNhapCu && p.row.giaNhapCu > 0) ? Math.round(((p.row.giaNhapMoi - p.row.giaNhapCu) / p.row.giaNhapCu) * 100) : null;
       return (
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.75rem' }}>{formatVND(p.row.giaNhapCu)}</Typography>
              <Typography variant="body2" fontWeight={700} color="#0284c7">{formatVND(p.row.giaNhapMoi)}</Typography>
           </Box>
           {trend !== null && <TrendChip value={trend} />}
         </Box>
       );
    }},
    { field: 'giaBan', headerName: 'Biến động giá bán', width: 190, renderCell: (p) => {
       return (
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.75rem' }}>{formatVND(p.row.giaBanCu)}</Typography>
              <Typography variant="body2" fontWeight={700} color="#4f46e5">{formatVND(p.row.giaBanMoi)}</Typography>
           </Box>
           <TrendChip value={p.row.phanTramThayDoi} />
         </Box>
       );
    }},
    { field: 'nguonThayDoi', headerName: 'Nguồn', width: 120, renderCell: (p) => <Chip label={p.value || '—'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /> },
    { field: 'ngayThayDoi', headerName: 'Thời gian', width: 160, valueFormatter: (p) => formatDate(p.value) }
  ];

  const chartPoints = chartData?.chartData?.map(p => ({
    ngay: formatDateShort(p.ngay),
    'Giá bán': p.giaBan,
    'Giá nhập': p.giaNhap,
  })) || [];

  const selectedProductName = products.find(p => p.maSanPham === selectedProduct)?.tenSP || '';

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#6366f1', width: 48, height: 48 }}><TimelineIcon /></Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#1e293b">Biến Động Giá</Typography>
            <Typography variant="body2" color="text.secondary">Theo dõi xu hướng giá nhập & giá bán</Typography>
          </Box>
        </Box>
        <IconButton onClick={loadAll} sx={{ bgcolor: '#6366f1', color: '#fff', '&:hover': { bgcolor: '#4f46e5' } }}><RefreshIcon /></IconButton>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <Autocomplete
              fullWidth
              size="small"
              options={products}
              getOptionLabel={(option) => `${option.maSP} - ${option.tenSP}`}
              value={products.find(p => p.maSanPham === selectedProduct) || null}
              onChange={(event, newValue) => {
                const id = newValue ? newValue.maSanPham : '';
                setSelectedProduct(id);
                setViewMode(id ? 'detail' : 'overview');
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Tìm sản phẩm..." 
                  placeholder="Nhập mã hoặc tên sản phẩm"
                />
              )}
              noOptionsText="Không tìm thấy sản phẩm"
              clearOnEscape
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size="small" label="Thời gian" value={days} onChange={e => setDays(Number(e.target.value))}>
              {[{ v: 30, l: '30 ngày' }, { v: 90, l: '90 ngày' }, { v: 365, l: '1 năm' }].map(o => <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small" fullWidth>
              <ToggleButton value="overview">Tổng quan</ToggleButton>
              <ToggleButton value="detail">Biểu đồ</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {loading ? <Skeleton variant="rectangular" height={400} /> : (
        <>
          {summary && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Biến động', value: summary.tongSoSanPhamBienDong, color: '#6366f1', icon: <ShowChartIcon /> },
                { label: 'Tăng giá', value: summary.tangGia, color: '#ef4444', icon: <TrendingUpIcon /> },
                { label: 'Giảm giá', value: summary.giamGia, color: '#22c55e', icon: <TrendingDownIcon /> },
                { label: 'Ổn định', value: summary.khongThayDoi, color: '#94a3b8', icon: <TrendingFlatIcon /> },
              ].map((s, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Card elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
                      <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: s.color, width: 40, height: 40 }}>{s.icon}</Avatar>
                      <Box><Typography variant="h6" fontWeight={700} color={s.color}>{s.value}</Typography><Typography variant="caption" color="text.secondary">{s.label}</Typography></Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', mb: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle1" fontWeight={700}>Bảng Giá Tổng Hợp</Typography>
            </Box>
            <DataTable 
              rows={productsOverview} 
              columns={overviewColumns} 
              getRowId={(r) => r.maSanPham} 
              onRowClick={(p) => handleSelectProduct(p.id)} 
              dateField="lanThayDoiGanNhat"
            />
          </Paper>

          {selectedProduct && chartData && (
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>{chartData.product?.tenSP}</Typography>
                <Typography variant="body2" color="text.secondary">Giá bán hiện tại: <strong style={{ color: '#6366f1' }}>{formatVND(chartData.product?.giaBanHienTai)}</strong></Typography>
              </Box>
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={chartPoints} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="ngay" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={v => formatVND(v).replace(' ₫', '')}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={50} iconType="circle" />
                  
                  <Line 
                    type="linear" 
                    dataKey="Giá bán" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                  />
                  
                  <Line 
                    type="linear" 
                    dataKey="Giá nhập" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          )}

          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle1" fontWeight={700}>Nhật Ký Thay Đổi {selectedProductName && `— ${selectedProductName}`}</Typography>
            </Box>
            <DataTable 
              rows={historyData} 
              columns={historyColumns} 
              getRowId={(r) => r.id || Math.random()} 
              dateField="ngayThayDoi"
            />
          </Paper>
        </>
      )}
    </Box>
  );
}
