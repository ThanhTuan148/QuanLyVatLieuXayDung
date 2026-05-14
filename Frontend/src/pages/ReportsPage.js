import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Tabs, Tab, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Select, MenuItem, FormControl, InputLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButtonGroup, ToggleButton, TextField
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  FileDownload as FileDownloadIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  Group as GroupIcon,
  AccountBalanceWallet as DebtIcon
} from '@mui/icons-material';
import api from '../services/api';
import authService from '../services/authService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#f5576c', '#00f2fe', '#38f9d7'];

const formatVND = (v) => v != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  // Data states
  const [revProfitData, setRevProfitData] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [customerRank, setCustomerRank] = useState([]);
  const [debtAging, setDebtAging] = useState(null);
  const [globalSummary, setGlobalSummary] = useState(null);

  // Filters
  const [chartType, setChartType] = useState('area');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);

  // Drill-down states
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyOrders, setDailyOrders] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

  // PDF & Signature states
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState(null);

  const fetchGlobalSummary = async () => {
    try {
      const res = await api.get('/reports/summary');
      setGlobalSummary(res.data);
    } catch (err) {
      console.error('Fetch summary error:', err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      fetchGlobalSummary(); // Always refresh global summary
      if (activeTab === 0) {
        let url = `/reports/revenue-profit?days=${days}`;
        if (useCustomDate && customStartDate) {
          url += `&startDateStr=${customStartDate}`;
          if (customEndDate) url += `&endDateStr=${customEndDate}`;
        }
        const res = await api.get(url);
        console.log('Revenue Report Data:', res.data);
        setRevProfitData(res.data);
      } else if (activeTab === 1) {
        const res = await api.get('/reports/inventory-aging');
        console.log('Inventory Aging Data:', res.data);
        setAgingData(res.data);
      } else if (activeTab === 2) {
        const res = await api.get('/reports/customer-ranking');
        console.log('Customer Ranking Data:', res.data);
        setCustomerRank(res.data);
      } else if (activeTab === 3) {
        const res = await api.get('/reports/debt-aging');
        console.log('Debt Aging Data:', res.data);
        setDebtAging(res.data);
      }
    } catch (err) {
      console.error('Fetch report error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, days, useCustomDate, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyCustomDate = () => {
    if (!customStartDate) return;
    setUseCustomDate(true);
    fetchData();
  };

  const handleResetDate = () => {
    setUseCustomDate(false);
    setCustomStartDate('');
    setCustomEndDate('');
    fetchData();
  };

  const handleExportPDFClick = () => {
    setOpenSignDialog(true);
  };

  // Helper to convert image URL to base64 to bypass CORS in html2canvas
  const getImageAsBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Failed to convert image to base64:', e);
      return null;
    }
  };

  const generatePDF = async (shouldSign = false) => {
    const user = authService.getUser();
    const reportElement = document.getElementById('report-pdf-template');
    if (!reportElement) return;

    // Show template first
    reportElement.style.display = 'block';

    // Directly inject signature into the DOM img element (bypasses React state timing)
    const sigImg = document.getElementById('pdf-sig-img');
    const sigPlaceholder = document.getElementById('pdf-sig-placeholder');
    
    if (shouldSign && sigImg) {
      const rawChuKy = user?.chuKy || user?.ChuKy;
      if (rawChuKy) {
        let base64 = rawChuKy.startsWith('data:') ? rawChuKy : null;
        if (!base64) {
          const fullPath = rawChuKy.startsWith('http') 
            ? rawChuKy 
            : `${api.defaults.baseURL.replace('/api', '')}${rawChuKy}`;
          base64 = await getImageAsBase64(fullPath);
        }
        if (base64) {
          sigImg.src = base64;
          sigImg.style.display = 'block';
          if (sigPlaceholder) sigPlaceholder.style.display = 'none';
        } else {
          sigImg.style.display = 'none';
          if (sigPlaceholder) sigPlaceholder.style.display = 'block';
        }
      } else {
        sigImg.style.display = 'none';
        if (sigPlaceholder) sigPlaceholder.style.display = 'block';
      }
    } else if (sigImg) {
      sigImg.style.display = 'none';
      if (sigPlaceholder) sigPlaceholder.style.display = 'none';
    }

    // Wait for image to fully render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: false,
        allowTaint: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = pageWidth - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      doc.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      doc.save(`BaoCao_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Lỗi xuất PDF: ' + error.message);
    } finally {
      reportElement.style.display = 'none';
      setOpenSignDialog(false);
    }
  };

  const exportToExcel = (data, fileName) => {
    // Prepare formatted data with Vietnamese headers
    const exportRows = data.map(row => ({
      'Ngày': new Date(row.date).toLocaleDateString('vi-VN'),
      'Số đơn hàng': row.orderCount,
      'Doanh thu (VNĐ)': row.revenue,
      'Đã thu (VNĐ)': row.collected ?? row.revenue,
      'Lợi nhuận (VNĐ)': row.profit,
      'Tỷ suất (%)': row.revenue > 0 ? +((row.profit / row.revenue) * 100).toFixed(1) : 0
    }));

    const totalRevE = data.reduce((s, r) => s + r.revenue, 0);
    const totalProfE = data.reduce((s, r) => s + r.profit, 0);
    const totalOrdE = data.reduce((s, r) => s + r.orderCount, 0);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Chi tiết
    const headerInfo = [
      ['BÁO CÁO DOANH THU & LỢI NHUẬN'],
      ['Cửa hàng Vật Liệu Xây Dựng Thành Đạt'],
      [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
      [`Thời gian: ${useCustomDate ? `Từ ${customStartDate} đến ${customEndDate || 'nay'}` : `${days} ngày qua`}`],
      [],
      ['TỔNG KẾT'],
      ['Tổng doanh thu (VNĐ)', totalRevE],
      ['Lợi nhuận gộp (VNĐ)', totalProfE],
      ['Tổng số đơn hàng', totalOrdE],
      ['Biên lợi nhuận (%)', totalRevE > 0 ? +((totalProfE / totalRevE) * 100).toFixed(1) : 0],
      []
    ];

    const ws = XLSX.utils.aoa_to_sheet(headerInfo);
    XLSX.utils.sheet_add_json(ws, exportRows, { origin: `A${headerInfo.length + 1}` });

    // Column widths
    ws['!cols'] = [
      { wch: 14 }, // Ngày
      { wch: 14 }, // Số đơn
      { wch: 22 }, // Doanh thu
      { wch: 22 }, // Đã thu
      { wch: 22 }, // Lợi nhuận
      { wch: 16 }, // Tỷ suất
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Doanh Thu');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(fileData, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleRowClick = async (date) => {
    setSelectedDate(date);
    setOpenDetail(true);
    setLoadingDaily(true);
    try {
      const res = await api.get(`/reports/daily-orders?date=${date}`);
      setDailyOrders(res.data);
    } catch (err) {
      console.error('Error fetching daily orders:', err);
    } finally {
      setLoadingDaily(false);
    }
  };

  const totalRevenue = revProfitData.reduce((sum, item) => sum + item.revenue, 0);
  const totalProfit = revProfitData.reduce((sum, item) => sum + item.profit, 0);
  const totalOrders = revProfitData.reduce((sum, item) => sum + item.orderCount, 0);

  const renderRevenueTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select value={days} label="Khoảng thời gian" onChange={(e) => { setDays(e.target.value); setUseCustomDate(false); }}>
              <MenuItem value={7}>7 ngày qua</MenuItem>
              <MenuItem value={30}>30 ngày qua</MenuItem>
              <MenuItem value={90}>3 tháng qua</MenuItem>
              <MenuItem value={365}>1 năm qua</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#f8fafc', p: 1, borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <TextField 
              label="Từ ngày" 
              type="date" 
              size="small" 
              InputLabelProps={{ shrink: true }} 
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <TextField 
              label="Đến ngày" 
              type="date" 
              size="small" 
              InputLabelProps={{ shrink: true }}
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
            <Button variant="contained" size="small" onClick={handleApplyCustomDate}>Áp dụng</Button>
            {useCustomDate && <Button size="small" color="inherit" onClick={handleResetDate}>Đặt lại</Button>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportToExcel(revProfitData, 'BaoCaoDoanhThu')}>Xuất Excel</Button>
          <Button variant="contained" color="secondary" startIcon={<FileDownloadIcon />} onClick={handleExportPDFClick}>Xuất PDF</Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 3 }}>
            <CardContent>
              <Typography color="primary.main" variant="subtitle2" fontWeight="bold">TỔNG DOANH THU</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{formatVND(totalRevenue)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {useCustomDate ? `Khoảng: ${new Date(customStartDate).toLocaleDateString('vi-VN')} ${customEndDate ? `- ${new Date(customEndDate).toLocaleDateString('vi-VN')}` : ''}` : `Trong ${days} ngày qua`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3 }}>
            <CardContent>
              <Typography color="success.main" variant="subtitle2" fontWeight="bold">LỢI NHUẬN GỘP (EST.)</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{formatVND(totalProfit)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {useCustomDate ? 'Dữ liệu tùy chỉnh' : `Biên lợi nhuận: ${totalRevenue > 0 ? ((totalProfit/totalRevenue)*100).toFixed(1) : 0}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 3 }}>
            <CardContent>
              <Typography color="warning.main" variant="subtitle2" fontWeight="bold">TỔNG ĐƠN HÀNG</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{totalOrders}</Typography>
              <Typography variant="caption" color="text.secondary">Trung bình: {Math.round(totalRevenue / (totalOrders || 1)).toLocaleString('vi-VN')} đ/đơn</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ p: 2, border: '1px solid #e0e7ff', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="h6" fontWeight="bold">📊 Biểu đồ Doanh thu & Lợi nhuận</Typography>
               <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(e, val) => val && setChartType(val)}
                size="small"
                color="primary"
              >
                <ToggleButton value="area">Vùng</ToggleButton>
                <ToggleButton value="bar">Cột</ToggleButton>
                <ToggleButton value="line">Đường</ToggleButton>
                <ToggleButton value="pie">Tròn</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                {revProfitData.length > 0 ? (
                  chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={revProfitData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                        nameKey="date"
                      >
                        {revProfitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val) => formatVND(val)}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                      />
                      <Legend />
                    </PieChart>
                  ) : (
                    <ComposedChart data={revProfitData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN')} tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(val) => (val / 1000000).toFixed(1) + 'M'} />
                      <Tooltip 
                        formatter={(val) => formatVND(val)}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                      />
                      <Legend />
                      {chartType === 'area' && (
                        <>
                          <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#667eea" fillOpacity={0.3} fill="#667eea" />
                          <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#43e97b" fillOpacity={0.3} fill="#43e97b" />
                        </>
                      )}
                      {chartType === 'bar' && (
                        <>
                          <Bar dataKey="revenue" name="Doanh thu" fill="#667eea" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="profit" name="Lợi nhuận" fill="#43e97b" radius={[4, 4, 0, 0]} />
                        </>
                      )}
                      {chartType === 'line' && (
                        <>
                          <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#667eea" strokeWidth={3} dot={{ r: 6 }} />
                          <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#43e97b" strokeWidth={3} dot={{ r: 6 }} />
                        </>
                      )}
                    </ComposedChart>
                  )
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                    Chưa có dữ liệu đơn hàng hoàn thành trong khoảng thời gian này
                  </Box>
                )}
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e7ff', borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ngày</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Số đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Doanh thu</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Lợi nhuận gộp</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Tỷ suất LN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revProfitData.map((row) => (
                  <TableRow 
                    key={row.date} 
                    hover 
                    onClick={() => handleRowClick(row.date)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' } }}
                  >
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>{new Date(row.date).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{row.orderCount}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatVND(row.revenue)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{formatVND(row.profit)}</TableCell>
                    <TableCell align="right">{row.revenue > 0 ? `${((row.profit / row.revenue) * 100).toFixed(1)}%` : '0%'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Drill-down Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
          Chi tiết đơn hàng ngày {selectedDate ? new Date(selectedDate).toLocaleDateString('vi-VN') : ''}
        </DialogTitle>
        <DialogContent dividers>
          {loadingDaily ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : dailyOrders.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mã HĐ</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Khách hàng</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>PTTT</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Tổng tiền</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Đã thanh toán</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyOrders.map((ord) => (
                    <TableRow key={ord.maHD} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{ord.maHD}</TableCell>
                      <TableCell>{ord.tenKH}</TableCell>
                      <TableCell>{ord.pttt}</TableCell>
                      <TableCell align="right">{formatVND(ord.tongTien)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{formatVND(ord.thanhToan)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 3 }}>Không tìm thấy đơn hàng nào.</Typography>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Signature Confirmation Dialog */}
      <Dialog open={openSignDialog} onClose={() => setOpenSignDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>✍️ Xác nhận ký số báo cáo</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            Bạn có đồng ý sử dụng <strong>chữ ký số cá nhân</strong> để xác nhận báo cáo này không?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            * Chữ ký sẽ được nhúng trực tiếp vào cuối tệp PDF để xác định trách nhiệm của người lập.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setIsSigning(false); setTimeout(() => generatePDF(false), 100); }} color="inherit">Xuất không ký</Button>
          <Button onClick={() => { setIsSigning(true); setTimeout(() => generatePDF(true), 100); }} color="primary" variant="contained" startIcon={<TrendingUpIcon />}>
            Đồng ý và Ký tên
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden PDF Template */}
      <div id="report-pdf-template" style={{ display: 'none', position: 'absolute', left: '-9999px', width: '800px', padding: '40px', background: 'white', color: 'black', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>BÁO CÁO DOANH THU & LỢI NHUẬN</h1>
          <p style={{ margin: '5px 0' }}>Cửa hàng Vật Liệu Xây Dựng Thành Đạt</p>
          <hr style={{ border: '0.5px solid #eee' }} />
        </div>
        
        <div style={{ marginBottom: '20px', fontSize: '14px' }}>
          <p><strong>Ngày xuất:</strong> {new Date().toLocaleString('vi-VN')}</p>
          <p><strong>Thời gian báo cáo:</strong> {useCustomDate ? `Từ ${customStartDate} đến ${customEndDate || 'nay'}` : `${days} ngày qua`}</p>
        </div>

        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#667eea' }}>TÓM TẮT CHỈ SỐ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <p style={{ margin: '0' }}>Tổng doanh thu: <strong>{formatVND(totalRevenue)}</strong></p>
            <p style={{ margin: '0' }}>Lợi nhuận gộp: <strong>{formatVND(totalProfit)}</strong></p>
            <p style={{ margin: '0' }}>Số đơn hàng: <strong>{totalOrders}</strong></p>
            <p style={{ margin: '0' }}>Biên lợi nhuận: <strong>{totalRevenue > 0 ? ((totalProfit/totalRevenue)*100).toFixed(1) : 0}%</strong></p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#667eea', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ngày</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Số đơn</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Doanh thu</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Lợi nhuận</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tỷ suất</th>
            </tr>
          </thead>
          <tbody>
            {revProfitData.map((row, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(row.date).toLocaleDateString('vi-VN')}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{row.orderCount}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatVND(row.revenue)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatVND(row.profit)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  {row.revenue > 0 ? ((row.profit/row.revenue)*100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '50px' }}>
          <div style={{ textAlign: 'center', width: '280px' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Người lập báo cáo</p>
            {isSigning && (
              <div style={{ 
                border: '2px solid #1976d2', 
                borderRadius: '4px', 
                padding: '10px', 
                background: 'rgba(25, 118, 210, 0.02)',
                position: 'relative',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%) rotate(-15deg)', 
                  border: '3px double rgba(25, 118, 210, 0.2)',
                  borderRadius: '50%',
                  width: '90px',
                  height: '90px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'rgba(25, 118, 210, 0.3)',
                  fontWeight: 'bold',
                  zIndex: 0
                }}>
                  DIGITAL SIGNED
                </div>
                
                {/* Signature image - injected directly via DOM in generatePDF */}
                <img 
                  id="pdf-sig-img"
                  alt="Chữ ký"
                  style={{ height: '80px', maxWidth: '200px', zIndex: 1, position: 'relative', objectFit: 'contain', display: 'none' }}
                />
                {/* Fallback text when no image signature */}
                <div id="pdf-sig-placeholder" style={{ zIndex: 1, position: 'relative', textAlign: 'center', display: 'none' }}>
                  <p style={{ fontStyle: 'italic', color: '#1976d2', margin: '0', fontSize: '14px', fontWeight: 'bold' }}>Đã ký số bởi:</p>
                  <p style={{ margin: '2px 0', fontSize: '13px' }}>{authService.getUser()?.fullName || authService.getUser()?.FullName || authService.getUser()?.username}</p>
                </div>

                <p style={{ fontSize: '10px', color: '#666', marginTop: '4px', zIndex: 1 }}>{new Date().toLocaleString('vi-VN')}</p>
              </div>
            )}
            {!isSigning && <div style={{ height: '120px' }}></div>}
            <p style={{ margin: '10px 0 0 0', fontWeight: 'bold', fontSize: '15px' }}>
              {authService.getUser()?.fullName || authService.getUser()?.FullName || authService.getUser()?.username || 'Quản lý'}
            </p>
          </div>
        </div>
      </div>
    </Box>
  );

  const renderAgingTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportToExcel(agingData, 'HangTonDong')}>Xuất Excel</Button>
      </Box>
      {agingData.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e7ff', borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kho</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Số lượng tồn</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cập nhật cuối</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Số ngày tồn đọng</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agingData.map((row) => (
                <TableRow key={row.maSanPham} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.tenSP}</TableCell>
                  <TableCell>{row.tenKho}</TableCell>
                  <TableCell align="center">{row.soLuongTon}</TableCell>
                  <TableCell>{new Date(row.ngayCapNhat).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>{row.daysOld} ngày</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.daysOld > 120 ? 'Rất chậm' : 'Chậm'} 
                      color={row.daysOld > 120 ? 'error' : 'warning'} 
                      size="small" 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ py: 10, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
          <Typography color="textSecondary">Hiện tại không có sản phẩm nào bị tồn kho quá 60 ngày</Typography>
        </Box>
      )}
    </Box>
  );

  const renderRankingTab = () => (
    <Box>
      {customerRank.length > 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ p: 2, border: '1px solid #e0e7ff', borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>🍰 Tỷ lệ doanh thu khách hàng</Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerRank}
                      dataKey="totalSpend"
                      nameKey="tenKH"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) => `${name.substring(0, 8)} ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerRank.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatVND(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e7ff', borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Hạng</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Khách hàng</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Số đơn</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Tổng chi tiêu</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerRank.map((row, index) => (
                    <TableRow key={row.maKH} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{row.tenKH}</TableCell>
                      <TableCell align="center">{row.orderCount}</TableCell>
                      <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{formatVND(row.totalSpend)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ py: 10, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3 }}>
          <Typography color="textSecondary">Chưa có dữ liệu xếp hạng khách hàng</Typography>
        </Box>
      )}
    </Box>
  );

  const renderDebtTab = () => {
    if (!debtAging) return null;
    const pieDebt = [
      { name: 'Trong hạn', value: debtAging.inTerm, color: '#43e97b' },
      { name: 'Quá hạn < 30', value: debtAging.overdue30, color: '#fccb90' },
      { name: 'Quá hạn 30-60', value: debtAging.overdue60, color: '#fda085' },
      { name: 'Quá hạn > 60', value: debtAging.overdueLong, color: '#f5576c' },
    ];
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ p: 2, border: '1px solid #e0e7ff', borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>⏳ Phân tích tuổi nợ</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDebt} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                      {pieDebt.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatVND(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Khách nợ cần chú ý:</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e7ff', borderRadius: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Khách hàng</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Số tiền nợ</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ngày đến hạn</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Quá hạn</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debtAging.details.map((d, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{d.tenKH}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>{formatVND(d.soTien)}</TableCell>
                      <TableCell>{new Date(d.hanTT).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <Chip 
                          label={d.daysOverdue > 0 ? `${d.daysOverdue} ngày` : 'Trong hạn'} 
                          color={d.daysOverdue > 0 ? 'error' : 'success'} 
                          size="small" variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">📈 Báo Cáo & Thống Kê</Typography>
        <Typography color="text.secondary">Phân tích chuyên sâu dữ liệu kinh doanh từ hệ thống</Typography>
      </Box>

      {/* Global Sync Summary */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
           <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#f0f4ff', border: '1px solid #dbeafe' }}>
              <Typography variant="caption" fontWeight="bold" color="primary">TỔNG DOANH THU HỆ THỐNG</Typography>
              <Typography variant="h5" fontWeight="bold">{formatVND(globalSummary?.totalRevenue || 0)}</Typography>
           </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
           <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#fff1f2', border: '1px solid #ffe4e6' }}>
              <Typography variant="caption" fontWeight="bold" color="error">TỔNG CÔNG NỢ KHÁCH</Typography>
              <Typography variant="h5" fontWeight="bold">{formatVND(globalSummary?.totalDebt || 0)}</Typography>
           </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
           <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #dcfce7' }}>
              <Typography variant="caption" fontWeight="bold" color="success.main">TỔNG ĐƠN HOÀN THÀNH</Typography>
              <Typography variant="h5" fontWeight="bold">{globalSummary?.totalOrders || 0} đơn</Typography>
           </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
           <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#fffbeb', border: '1px solid #fef3c7' }}>
              <Typography variant="caption" fontWeight="bold" color="warning.main">GIÁ TRỊ KHO (EST.)</Typography>
              <Typography variant="h5" fontWeight="bold">{formatVND(globalSummary?.inventoryValue || 0)}</Typography>
           </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: '1px solid #ebedf2', bgcolor: '#fff' }}
        >
          <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Doanh thu & Lợi nhuận" />
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Hàng tồn đọng" />
          <Tab icon={<GroupIcon />} iconPosition="start" label="Xếp hạng Khách hàng" />
          <Tab icon={<DebtIcon />} iconPosition="start" label="Phân tích Công nợ" />
        </Tabs>

        <Box sx={{ p: 3, minHeight: 500 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
              <CircularProgress thickness={5} size={60} />
              <Typography sx={{ mt: 2 }} color="textSecondary">Đang tổng hợp dữ liệu báo cáo...</Typography>
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderRevenueTab()}
              {activeTab === 1 && renderAgingTab()}
              {activeTab === 2 && renderRankingTab()}
              {activeTab === 3 && renderDebtTab()}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ReportsPage;
