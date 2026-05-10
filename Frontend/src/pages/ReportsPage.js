import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Tabs, Tab, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  FileDownload as FileDownloadIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  Group as GroupIcon,
  AccountBalanceWallet as DebtIcon
} from '@mui/icons-material';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const res = await api.get(`/reports/revenue-profit?days=${days}`);
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
  }, [activeTab, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(fileData, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderRevenueTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Khoảng thời gian</InputLabel>
          <Select value={days} label="Khoảng thời gian" onChange={(e) => setDays(e.target.value)}>
            <MenuItem value={7}>7 ngày qua</MenuItem>
            <MenuItem value={30}>30 ngày qua</MenuItem>
            <MenuItem value={90}>90 ngày qua</MenuItem>
            <MenuItem value={365}>1 năm qua</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportToExcel(revProfitData, 'BaoCaoDoanhThu')}>Xuất Excel</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ p: 2, border: '1px solid #e0e7ff', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>📈 Biểu đồ Doanh thu & Lợi nhuận</Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                {revProfitData.length > 0 ? (
                  <AreaChart data={revProfitData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#43e97b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#43e97b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => formatVND(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#667eea" fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#43e97b" fillOpacity={1} fill="url(#colorProf)" />
                  </AreaChart>
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
                  <TableRow key={row.date} hover>
                    <TableCell>{new Date(row.date).toLocaleDateString('vi-VN')}</TableCell>
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
