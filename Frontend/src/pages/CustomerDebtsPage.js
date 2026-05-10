import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Card, CardContent, 
  Button, IconButton, Chip, Divider, Skeleton, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tab, Tabs, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  AccountBalanceWallet as WalletIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  Info as InfoIcon,
  ArrowForwardIos as ArrowIcon,
  CheckCircle as CheckIcon,
  AccessTime as PendingIcon,
  ErrorOutline as OverdueIcon
} from '@mui/icons-material';
import debtService from '../services/debtService';
import PaymentModal from '../components/PaymentModal';

const formatVND = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const CustomerDebtsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState(0);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const customerId = user.maKhachHang || user.MaKhachHang;

  const fetchDebts = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await debtService.getByCustomer(customerId);
      setDebts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch debts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (debtId) => {
    setLoadingHistory(true);
    try {
      const res = await debtService.getHistory(debtId);
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch debt history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [customerId]);

  const getStatusChip = (status) => {
    switch (status) {
      case 'Đã thanh toán':
        return <Chip icon={<CheckIcon />} label="Đã hoàn tất" color="success" size="small" />;
      case 'Quá hạn':
        return <Chip icon={<OverdueIcon />} label="Quá hạn" color="error" size="small" />;
      case 'Sắp đến hạn':
        return <Chip icon={<PendingIcon />} label="Sắp đến hạn" color="warning" size="small" />;
      default:
        return <Chip icon={<PendingIcon />} label="Chưa thanh toán" color="info" size="small" />;
    }
  };

  const totalDebt = debts.reduce((sum, d) => sum + (d.soTienConLai || 0), 0);
  const overdueDebts = debts.filter(d => d.trangThai === 'Quá hạn').length;

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 10 }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a237e', mb: 1 }}>
              Quản Lý Công Nợ
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Theo dõi và tất toán các khoản nợ đơn hàng của bạn
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Tổng dư nợ hiện tại</Typography>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {formatVND(totalDebt)}
            </Typography>
          </Box>
        </Box>

        {debts.filter(d => d.trangThai === 'Quá hạn' || d.trangThai === 'Sắp đến hạn').length > 0 && (
          <Paper sx={{ p: 2, mb: 4, bgcolor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <OverdueIcon color="error" />
              <Typography variant="h6" fontWeight="bold" color="error.main">
                Cảnh báo thanh toán ({debts.filter(d => d.trangThai === 'Quá hạn' || d.trangThai === 'Sắp đến hạn').length})
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {debts.filter(d => d.trangThai === 'Quá hạn' || d.trangThai === 'Sắp đến hạn').map((w, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card variant="outlined" sx={{ borderColor: w.trangThai === 'Quá hạn' ? '#feb2b2' : '#fbd38d', bgcolor: '#fff' }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={w.trangThai === 'Quá hạn' ? 'QUÁ HẠN' : 'SẮP ĐẾN HẠN'} 
                          size="small" 
                          color={w.trangThai === 'Quá hạn' ? 'error' : 'warning'} 
                          sx={{ fontSize: '0.6rem', height: 20 }} 
                        />
                        <Typography variant="caption" color="textSecondary">{w.maHD}</Typography>
                      </Box>
                      <Typography variant="body2" color="error" fontWeight="bold">Còn nợ: {formatVND(w.soTienConLai)}</Typography>
                      {w.laiPhat > 0 && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                          ⚠️ Đã phát sinh lãi phạt: +{formatVND(w.laiPhat)}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        Hạn thanh toán: {new Date(w.hanThanhToan).toLocaleDateString('vi-VN')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tab} 
            onChange={(e, v) => {
              setTab(v);
              if (v === 1 && selectedDebt) fetchHistory(selectedDebt.maCongNo);
            }} 
            textColor="primary" 
            indicatorColor="primary"
          >
            <Tab icon={<WalletIcon />} iconPosition="start" label="Danh sách nợ" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="Lịch sử thanh toán" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column: Debt List */}
          <Grid item xs={12} md={tab === 0 ? 12 : 7}>
            {loading ? (
              <Box>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />)}
              </Box>
            ) : debts.length === 0 ? (
              <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4 }}>
                <CheckIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold">Bạn không có khoản nợ nào!</Typography>
                <Typography variant="body2" color="text.secondary">Mọi giao dịch đều đã được thanh toán đầy đủ.</Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {debts.map((debt) => (
                  <Card 
                    key={debt.maCongNo} 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 3, 
                      border: selectedDebt?.maCongNo === debt.maCongNo ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)', bgcolor: '#fff' },
                      cursor: 'pointer',
                      bgcolor: selectedDebt?.maCongNo === debt.maCongNo ? '#fff' : '#fff'
                    }}
                    onClick={() => {
                      setSelectedDebt(debt);
                      if (tab === 1) fetchHistory(debt.maCongNo);
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 2, color: '#1976d2' }}>
                              <WalletIcon />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">{debt.maHD}</Typography>
                              <Typography variant="caption" color="text.secondary">Ngày tạo: {new Date(debt.ngayTao).toLocaleDateString('vi-VN')}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">Số tiền nợ</Typography>
                            <Typography variant="body2" fontWeight="bold">{formatVND(debt.soTienNo)}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                               <Typography variant="caption" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', px: 1, borderRadius: 1 }}>Đã trả: {formatVND(debt.soTienDaTra)}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={6} sm={2}>
                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Còn lại</Typography>
                           <Typography variant="subtitle1" fontWeight="bold" color="error.main">{formatVND(debt.soTienConLai)}</Typography>
                        </Grid>

                        <Grid item xs={6} sm={2} sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                            {getStatusChip(debt.trangThai)}
                            {debt.soTienConLai > 0 && (
                              <Button 
                                variant="contained" 
                                size="small" 
                                startIcon={<PaymentIcon />}
                                sx={{ bgcolor: '#1a237e', borderRadius: '10px', textTransform: 'none' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDebt(debt);
                                  setPaymentOpen(true);
                                }}
                              >
                                Trả nợ
                              </Button>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>

          {tab === 1 && (
            <Grid item xs={12} md={selectedDebt ? 5 : 12}>
              <Paper sx={{ p: 3, borderRadius: 4, position: 'sticky', top: 100, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: selectedDebt ? 'flex-start' : 'center', alignItems: selectedDebt ? 'stretch' : 'center' }}>
                {!selectedDebt ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <InfoIcon sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Vui lòng chọn một khoản nợ ở danh sách bên trái để xem lịch sử thanh toán</Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Chi tiết thanh toán cho {selectedDebt.maHD}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {loadingHistory ? (
                      <Skeleton variant="rectangular" height={200} />
                    ) : history.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <InfoIcon color="disabled" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography color="text.secondary">Chưa có giao dịch thanh toán nào</Typography>
                      </Box>
                    ) : (
                      <Box>
                        {history.map((item, idx) => (
                          <Box key={item.maChiTietTN} sx={{ mb: 3, position: 'relative' }}>
                            {idx !== history.length - 1 && (
                              <Box sx={{ position: 'absolute', left: 15, top: 40, bottom: -20, width: 2, bgcolor: '#eee' }} />
                            )}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 1 }}>
                                <CheckIcon sx={{ fontSize: 18 }} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2" fontWeight="bold">+{formatVND(item.soTien)}</Typography>
                                  <Typography variant="caption" color="text.secondary">{new Date(item.ngayTT).toLocaleDateString('vi-VN')}</Typography>
                                </Box>
                                <Typography variant="caption" display="block" color="text.secondary">{item.pttt} {item.soGiaoDich ? ` - ${item.soGiaoDich}` : ''}</Typography>
                                {item.ghiChu && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                    {item.ghiChu}
                                  </Typography>
                                )}
                                {item.anhBangChung && (
                                  <Button 
                                    size="small" 
                                    variant="text" 
                                    startIcon={<span>📷</span>}
                                    onClick={() => setPreviewImage(item.anhBangChung)}
                                    sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.75rem' }}
                                  >
                                    Xem ảnh minh chứng
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>

      {selectedDebt && (
        <PaymentModal 
          open={paymentOpen} 
          onClose={() => setPaymentOpen(false)} 
          debt={selectedDebt} 
          onSuccess={() => {
            fetchDebts();
            if (selectedDebt) fetchHistory(selectedDebt.maCongNo);
          }} 
        />
      )}

      {/* Preview Image Dialog */}
      <Dialog 
        open={!!previewImage} 
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Minh chứng thanh toán
          <IconButton onClick={() => setPreviewImage(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          {previewImage && (
            <Box 
              component="img" 
              src={previewImage} 
              alt="Receipt" 
              sx={{ maxWidth: '100%', height: 'auto', borderRadius: 2, border: '1px solid #eee' }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CustomerDebtsPage;
