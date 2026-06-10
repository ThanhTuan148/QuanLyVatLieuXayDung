import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Divider, Chip, CircularProgress, Paper, IconButton, Button, Grid, TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import debtService from '../services/debtService';

function DebtDetailModal({ open, onClose, debt }) {
  const [history, setHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAppt, setNewAppt] = useState({ date: '', amount: '', note: '' });
  const [showApptForm, setShowApptForm] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (open && debt?.maCongNo) {
      fetchHistory();
      fetchAppointments();
    }
  }, [open, debt]);

  const fetchAppointments = async () => {
    try {
      const res = await debtService.getAppointments(debt.maCongNo);
      setAppointments(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleAddAppointment = async () => {
    if (!newAppt.date || !newAppt.amount) return;

    const amount = parseFloat(newAppt.amount);
    if (amount <= 0) {
      alert('Số tiền dự kiến phải lớn hơn 0.');
      return;
    }
    if (amount > (debt?.soTienConLai || 0)) {
      alert('Số tiền dự kiến không được lớn hơn số nợ còn lại.');
      return;
    }
    try {
      await debtService.createAppointment({
        maCongNo: debt.maCongNo,
        ngayHen: newAppt.date,
        soTienDuKien: parseFloat(newAppt.amount),
        ghiChu: newAppt.note
      });
      setNewAppt({ date: '', amount: '', note: '' });
      setShowApptForm(false);
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  const handleCompleteAppt = async (id) => {
    try {
      await debtService.completeAppointment(id);
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await debtService.getHistory(debt.maCongNo);
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Chi Tiết Công Nợ & Lịch Sử</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Đối Tượng</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{debt?.tenKhachHang || debt?.tenNhaCungCap}</Typography>
            <Typography variant="caption" color="textSecondary">{debt?.loaiCongNo}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Chứng Từ</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{debt?.maHD || debt?.maPN}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Tổng Nợ Gốc</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#667eea' }}>{formatCurrency(debt?.soTienNo)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Đã Thanh Toán</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{formatCurrency(debt?.soTienDaTra)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Còn Lại</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>{formatCurrency(debt?.soTienConLai)}</Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            📅 Lịch Hẹn Trả Nợ
          </Typography>
          <Button size="small" variant="contained" color="secondary" onClick={() => setShowApptForm(!showApptForm)}>
            {showApptForm ? 'Hủy' : '+ Thêm Hẹn'}
          </Button>
        </Box>

        {showApptForm && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#f0f4ff' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="date" label="Ngày hẹn" InputLabelProps={{ shrink: true }} value={newAppt.date} onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="number" label="Số tiền dự kiến" value={newAppt.amount} onChange={(e) => setNewAppt({ ...newAppt, amount: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Ghi chú" value={newAppt.note} onChange={(e) => setNewAppt({ ...newAppt, note: e.target.value })} />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small" onClick={handleAddAppointment}>Lưu Lịch Hẹn</Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Ngày Hẹn</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Số Tiền Dự Kiến</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ghi Chú</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Trạng Thái</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" color="textSecondary">Chưa có lịch hẹn nào</TableCell></TableRow>
              ) : appointments.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(a.ngayHen).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(a.soTienDuKien)}</TableCell>
                  <TableCell>{a.ghiChu || '—'}</TableCell>
                  <TableCell>
                    <Chip label={a.trangThai} size="small" color={a.trangThai === 'Đã hoàn thành' ? 'success' : 'warning'} />
                  </TableCell>
                  <TableCell>
                    {a.trangThai !== 'Đã hoàn thành' && (
                      <Button size="small" color="primary" onClick={() => handleCompleteAppt(a.maHen)}>Xong</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          💳 Lịch Sử Thanh Toán (Từng Đợt)
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={30} /></Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 300 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Mã Giao Dịch</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Ngày TT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Số Tiền Trả</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Phương Thức</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Chứng từ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Ghi Chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#aaa' }}>Chưa có giao dịch thanh toán nào</TableCell>
                  </TableRow>
                ) : history.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{h.maTT}</TableCell>
                    <TableCell>{new Date(h.ngayTT).toLocaleString('vi-VN')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{formatCurrency(h.soTien)}</TableCell>
                    <TableCell>
                      <Chip label={h.pttt || 'Tiền mặt'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      {h.anhBangChung ? (
                        <Button 
                          size="small" 
                          variant="text" 
                          onClick={() => setPreviewImage(h.anhBangChung)}
                          sx={{ fontSize: '0.7rem', p: 0 }}
                        >
                          Xem ảnh
                        </Button>
                      ) : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#666' }}>{h.ghiChu || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Ảnh minh chứng thanh toán
          <IconButton onClick={() => setPreviewImage(null)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
           {previewImage && <img src={previewImage} alt="Receipt" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} />}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default DebtDetailModal;
