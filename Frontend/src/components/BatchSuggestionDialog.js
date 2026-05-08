import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, CircularProgress, Chip, Collapse, IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import api from '../services/api';

function BatchRow({ batch, onCreateDelivery }) {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, bgcolor: open ? '#f4f6f8' : 'inherit' }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{batch.routeName}</TableCell>
        <TableCell align="center">
          <Chip label={`${batch.ordersCount} đơn`} color="primary" size="small" />
        </TableCell>
        <TableCell align="center">{batch.orders.reduce((sum, o) => sum + o.tongSanPham, 0)}</TableCell>
        <TableCell align="right">
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => onCreateDelivery(batch)}
          >
            Tạo Chuyến
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div">
                Danh sách hóa đơn trong chuyến:
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Mã HĐ</TableCell>
                    <TableCell>Khách Hàng</TableCell>
                    <TableCell>Địa Chỉ</TableCell>
                    <TableCell align="right">SL Sản Phẩm</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batch.orders.map((orderRow) => (
                    <TableRow key={orderRow.maHD}>
                      <TableCell>{orderRow.maHD}</TableCell>
                      <TableCell>{orderRow.tenKhachHang}</TableCell>
                      <TableCell>{orderRow.diaChi}</TableCell>
                      <TableCell align="right">{orderRow.tongSanPham}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function BatchSuggestionDialog({ open, onClose, onSelectBatch }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSuggestions();
    }
  }, [open]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deliveries/BatchSuggestions');
      setBatches(res.data);
    } catch (err) {
      console.error('Error fetching batch suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>Gợi Ý Ghép Chuyến (AI Route Batching)</DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : batches.length === 0 ? (
          <Typography align="center" sx={{ py: 4, color: 'text.secondary' }}>
            Không có đơn hàng chờ giao nào để gợi ý.
          </Typography>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              Hệ thống đã tự động gom nhóm các đơn hàng đang chờ giao theo từng khu vực địa lý để tiện cho việc phân bổ xe tải.
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table aria-label="collapsible table">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell />
                    <TableCell>Tuyến Đường / Khu Vực</TableCell>
                    <TableCell align="center">Số Hóa Đơn</TableCell>
                    <TableCell align="center">Tổng SL Sản Phẩm</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batches.map((batch) => (
                    <BatchRow 
                      key={batch.batchId} 
                      batch={batch} 
                      onCreateDelivery={(b) => {
                        onClose();
                        onSelectBatch(b);
                      }} 
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} color="inherit">Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}

export default BatchSuggestionDialog;
