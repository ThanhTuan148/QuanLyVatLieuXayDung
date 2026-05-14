// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, Chip, LinearProgress, TablePagination,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { TrendingUp, Warning, Inventory } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../services/api';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#f5576c', '#00f2fe', '#38f9d7'];

const formatVND = (value) => {
  if (!value) return '₫0';
  if (value >= 1000000) return `₫${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `₫${(value / 1000).toFixed(0)}K`;
  return `₫${value.toLocaleString('vi-VN')}`;
};

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Pagination for inventory alerts
  const [alertPage, setAlertPage] = useState(0);
  const [alertRowsPerPage, setAlertRowsPerPage] = useState(5);

  // Pagination for debts
  const [debtPage, setDebtPage] = useState(0);
  const [debtRowsPerPage, setDebtRowsPerPage] = useState(5);
  
  const [topProductsChart, setTopProductsChart] = useState('bar'); // bar, line, area
  const [salesRatioChart, setSalesRatioChart] = useState('pie'); // pie, bar

  const handleChangeAlertPage = (event, newPage) => setAlertPage(newPage);
  const handleChangeAlertRowsPerPage = (event) => {
    setAlertRowsPerPage(parseInt(event.target.value, 10));
    setAlertPage(0);
  };

  const handleChangeDebtPage = (event, newPage) => setDebtPage(newPage);
  const handleChangeDebtRowsPerPage = (event) => {
    setDebtRowsPerPage(parseInt(event.target.value, 10));
    setDebtPage(0);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, ordersRes, productsRes, alertsRes, debtsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-orders'),
          api.get('/dashboard/top-products'),
          api.get('/dashboard/inventory-alerts'),
          api.get('/dashboard/debt-summary'),
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data);
        setTopProducts(productsRes.data);
        setInventoryAlerts(alertsRes.data);
        setDebts(debtsRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Box sx={{ p: 4 }}><LinearProgress /><Typography sx={{ mt: 2, textAlign: 'center' }}>Đang tải dữ liệu...</Typography></Box>;

  const statCards = [
    { title: '📦 Tổng Sản Phẩm', value: stats?.tongSanPham || 0, bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '📦', path: '/products' },
    { title: '🛒 Tổng Đơn Hàng', value: stats?.tongDonHang || 0, bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🛒', path: '/orders' },
    { title: '👥 Khách Hàng', value: stats?.tongKhachHang || 0, bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '👥', path: '/customers' },
    { title: '💰 Doanh Thu', value: formatVND(stats?.doanhThu), bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '💰', path: '/reports' },
    { title: '🏭 Nhà Cung Cấp', value: stats?.tongNhaCungCap || 0, bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '🏭', path: '/suppliers' },
    { title: '👷 Nhân Viên', value: stats?.tongNhanVien || 0, bgColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', icon: '👷', path: '/employees' },
    { title: '📋 Phiếu Nhập', value: stats?.tongPhieuNhap || 0, bgColor: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', icon: '📋', path: '/procurement' },
    { title: '💳 Công Nợ', value: formatVND(stats?.tongCongNo), bgColor: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', icon: '💳', path: '/debts' },
  ];

  // Pie data from top products
  const pieData = topProducts.map(p => ({ name: p.tenSP, value: p.soLuongBan }));

  // Bar data from top products
  const barData = topProducts.map(p => ({ name: p.tenSP?.substring(0, 15) + '...', soLuong: p.soLuongBan, doanhThu: p.doanhThu / 1000 }));

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333', mb: 0.5 }}>
          📊 Tổng quan
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Tổng quan quản lý hệ thống bán vật liệu xây dựng — Dữ liệu thực từ Database
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              onClick={() => navigate(stat.path)}
              sx={{
                background: stat.bgColor, color: 'white', borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' },
              cursor: 'pointer',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: '0.75rem' }}>{stat.title}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stat.value}</Typography>
                  </Box>
                  <Typography variant="h3">{stat.icon}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Bar Chart - Top Products */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>📈 Sản Phẩm Bán Chạy</Typography>
                <ToggleButtonGroup
                  size="small"
                  value={topProductsChart}
                  exclusive
                  onChange={(e, v) => v && setTopProductsChart(v)}
                >
                  <ToggleButton value="bar">Cột</ToggleButton>
                  <ToggleButton value="line">Đường</ToggleButton>
                  <ToggleButton value="area">Vùng</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ height: 350 }}>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {topProductsChart === 'bar' ? (
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [name === 'doanhThu' ? `₫${value}K` : value, name === 'doanhThu' ? 'Doanh thu' : 'Số lượng']} />
                        <Legend />
                        <Bar dataKey="soLuong" fill="#667eea" name="Số lượng bán" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="doanhThu" fill="#f093fb" name="Doanh thu (K)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : topProductsChart === 'line' ? (
                      <LineChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [name === 'doanhThu' ? `₫${value}K` : value, name === 'doanhThu' ? 'Doanh thu' : 'Số lượng']} />
                        <Legend />
                        <Line type="monotone" dataKey="soLuong" stroke="#667eea" strokeWidth={3} name="Số lượng bán" dot={{ r: 6 }} />
                        <Line type="monotone" dataKey="doanhThu" stroke="#f093fb" strokeWidth={3} name="Doanh thu (K)" dot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [name === 'doanhThu' ? `₫${value}K` : value, name === 'doanhThu' ? 'Doanh thu' : 'Số lượng']} />
                        <Legend />
                        <Area type="monotone" dataKey="soLuong" fill="#667eea" stroke="#667eea" fillOpacity={0.2} name="Số lượng bán" />
                        <Area type="monotone" dataKey="doanhThu" fill="#f093fb" stroke="#f093fb" fillOpacity={0.2} name="Doanh thu (K)" />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                ) : <Typography sx={{ textAlign: 'center', py: 5 }}>Chưa có dữ liệu bán hàng</Typography>}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🍰 Tỷ lệ bán hàng</Typography>
                <ToggleButtonGroup
                  size="small"
                  value={salesRatioChart}
                  exclusive
                  onChange={(e, v) => v && setSalesRatioChart(v)}
                >
                  <ToggleButton value="pie">Tròn</ToggleButton>
                  <ToggleButton value="bar">Cột</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ height: 350, display: 'flex', justifyContent: 'center' }}>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {salesRatioChart === 'pie' ? (
                      <PieChart>
                        <Pie 
                          data={pieData} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false}
                          outerRadius={100} 
                          innerRadius={60}
                          paddingAngle={3}
                          fill="#8884d8" 
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, `Số lượng (${name})`]} />
                        <Legend 
                          verticalAlign="bottom" 
                          formatter={(value, entry) => {
                            const total = pieData.reduce((sum, item) => sum + item.value, 0);
                            const item = pieData.find(d => d.name === value);
                            const percent = item ? ((item.value / total) * 100).toFixed(0) : 0;
                            return <span style={{ color: '#333', fontSize: '0.85rem' }}>{value} ({percent}%)</span>;
                          }}
                        />
                      </PieChart>
                    ) : (
                      <BarChart data={pieData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="value" name="Số lượng" radius={[0, 4, 4, 0]}>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : <Typography sx={{ textAlign: 'center', py: 5 }}>Chưa có dữ liệu</Typography>}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders & Inventory Alerts */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>📋 Đơn Hàng Gần Đây</Typography>
                <Button size="small" color="primary" href="/orders">Xem Tất Cả</Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: '#f5f6fa' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mã HĐ</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Khách Hàng</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tổng Tiền</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>PTTT</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Trạng Thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.maHD} hover>
                        <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>{order.maHD}</TableCell>
                        <TableCell>{order.tenKhachHang}</TableCell>
                        <TableCell sx={{ color: '#43e97b', fontWeight: 'bold' }}>{formatVND(order.tongTien)}</TableCell>
                        <TableCell>{order.pttt}</TableCell>
                        <TableCell>
                          <Chip label={order.trangThai} size="small" color={
                            order.trangThai === 'Hoàn thành' ? 'success' :
                            order.trangThai === 'Đang giao' ? 'primary' :
                            order.trangThai === 'Chờ xử lý' ? 'warning' : 'default'
                          } variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Alerts */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>⚠️ Cảnh Báo Tồn Kho</Typography>
                <Button size="small" color="primary" href="/inventory">Xem Kho</Button>
              </Box>
              {inventoryAlerts.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="success.main">✅ Tất cả sản phẩm đủ tồn kho</Typography>
                </Box>
              ) : (
                inventoryAlerts.slice(alertPage * alertRowsPerPage, alertPage * alertRowsPerPage + alertRowsPerPage).map((alert, idx) => (
                  <Box key={idx} sx={{
                    p: 1.5, mb: 1, background: alert.soLuongTon <= 0 ? '#fff5f5' : '#fffbee',
                    borderRadius: 1, borderLeft: `4px solid ${alert.soLuongTon <= 0 ? '#f5576c' : '#ffa726'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{alert.tenSP}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Mã: {alert.maSP} | Kho: {alert.tenKho}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: alert.soLuongTon <= 0 ? '#f5576c' : '#ffa726' }}>
                        Tồn: {alert.soLuongTon} / {alert.mucToiThieu}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
              {inventoryAlerts.length > 5 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20]}
                  component="div"
                  count={inventoryAlerts.length}
                  rowsPerPage={alertRowsPerPage}
                  page={alertPage}
                  onPageChange={handleChangeAlertPage}
                  onRowsPerPageChange={handleChangeAlertRowsPerPage}
                  labelRowsPerPage="Dòng:"
                  size="small"
                  sx={{ mt: -1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Products & Debt Summary */}
      <Grid container spacing={2.5}>
        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>⭐ Top Sản Phẩm Bán Chạy</Typography>
              {topProducts.map((product, index) => (
                <Box key={index} sx={{
                  p: 1.5, mb: 1, background: '#f5f6fa', borderRadius: 1,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.3s ease', '&:hover': { background: '#ededf0' },
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3 }}>
                      {index + 1}. {product.tenSP}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Bán: {product.soLuongBan} | Doanh thu: {formatVND(product.doanhThu)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label={`#${index + 1}`} size="small" color="primary" variant="outlined" />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Debt Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>💳 Công Nợ Hiện Tại</Typography>
              {debts.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: 'success.main' }}>✅ Không có công nợ</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#f5f6fa' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Mã CN</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Đối Tác</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Còn Lại</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Hạn TT</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {debts.slice(debtPage * debtRowsPerPage, debtPage * debtRowsPerPage + debtRowsPerPage).map((d) => (
                        <TableRow key={d.maCN} hover>
                          <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>{d.maCN}</TableCell>
                          <TableCell>{d.tenDoiTac}</TableCell>
                          <TableCell sx={{ color: '#f5576c', fontWeight: 'bold' }}>{formatVND(d.soTienConLai)}</TableCell>
                          <TableCell>{d.hanThanhToan ? new Date(d.hanThanhToan).toLocaleDateString('vi-VN') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {debts.length > 5 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20]}
                  component="div"
                  count={debts.length}
                  rowsPerPage={debtRowsPerPage}
                  page={debtPage}
                  onPageChange={handleChangeDebtPage}
                  onRowsPerPageChange={handleChangeDebtRowsPerPage}
                  labelRowsPerPage="Dòng:"
                  size="small"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
