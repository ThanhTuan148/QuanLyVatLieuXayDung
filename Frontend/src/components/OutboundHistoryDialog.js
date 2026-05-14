import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Button,
  Typography, Box, CircularProgress, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Divider
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import api from '../services/api';

export default function OutboundHistoryDialog({ open, onClose, outboundId, outboundCode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && outboundId) {
      fetchHistory();
    }
  }, [open, outboundId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory/${outboundId}/history`);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Fetch history err:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee', bgcolor: '#f8f9fa' }}>
        Lịch sử xử lý {outboundCode}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : history.length === 0 ? (
          <Typography align="center" color="textSecondary" sx={{ py: 3 }}>Chưa có dữ liệu lịch sử.</Typography>
        ) : (
          <List sx={{ py: 0 }}>
            {history.map((h, idx) => (
              <React.Fragment key={h.maLichSu}>
                <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: idx === 0 ? 'primary.main' : 'grey.400' }}>
                      <HistoryIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: idx === 0 ? 'primary.main' : 'text.primary' }}>
                          {h.trangThaiMoi || 'Cập nhật'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(h.ngayTao).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                          {h.noiDungThayDoi}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                          Người thực hiện: {h.tenNhanVien}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {idx < history.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} variant="contained" color="primary">Đóng</Button>
      </Box>
    </Dialog>
  );
}
