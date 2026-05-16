import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, Badge, Grid
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  MarkEmailRead as ReadIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import api from '../services/api';

const ContactMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [replyText, setReplyText] = useState('');

  const fetchMessages = async () => {
    try {
      const res = await api.get('/Contact');
      setMessages(res.data);
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleView = async (msg) => {
    setSelectedMsg(msg);
    setReplyText(msg.replyMessage || '');
    setOpenDetail(true);
    if (!msg.isRead) {
      try {
        await api.patch(`/Contact/${msg.id}/read`);
        fetchMessages();
      } catch (err) {}
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/Contact/${selectedMsg.id}/reply`, JSON.stringify(replyText), {
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Đã lưu phản hồi thành công!');
      fetchMessages();
      return true; // Return true to indicate success
    } catch (err) {
      alert('Lỗi khi lưu phản hồi');
      return false;
    }
  };

  const handleSendEmail = async () => {
    if (!replyText.trim()) {
      alert('Vui lòng nhập nội dung phản hồi trước!');
      return;
    }
    
    setLoading(true);
    try {
      // First save the reply
      const saved = await handleReply();
      if (!saved) return;

      // Then send the email
      await api.post(`/Contact/${selectedMsg.id}/send-email`);
      alert('Đã gửi email phản hồi thành công!');
      setOpenDetail(false);
    } catch (err) {
      alert(err.response?.data || 'Lỗi khi gửi email');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
      try {
        await api.delete(`/Contact/${id}`);
        fetchMessages();
      } catch (err) {}
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333', mb: 0.5 }}>
          📧 Tin nhắn liên hệ
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Quản lý các yêu cầu hỗ trợ và đóng góp ý kiến từ khách hàng
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ngày gửi</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Người gửi</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tiêu đề</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">Chưa có tin nhắn nào</Typography>
                </TableCell>
              </TableRow>
            )}
            {messages.map((msg) => (
              <TableRow key={msg.id} hover sx={{ bgcolor: msg.isRead ? 'transparent' : 'rgba(102, 126, 234, 0.05)' }}>
                <TableCell>
                  {msg.replyMessage ? (
                    <Chip label="Đã phản hồi" size="small" color="success" variant="outlined" />
                  ) : msg.isRead ? (
                    <Chip label="Đã đọc" size="small" variant="outlined" />
                  ) : (
                    <Chip label="Mới" size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                  )}
                </TableCell>
                <TableCell>{new Date(msg.createdAt).toLocaleString('vi-VN')}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{msg.name}</Typography>
                  <Typography variant="caption" color="textSecondary">{msg.email}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {msg.subject}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Xem chi tiết">
                    <IconButton size="small" color="primary" onClick={() => handleView(msg)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" color="error" onClick={() => handleDelete(msg.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          Chi tiết lời nhắn
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedMsg && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Từ:</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedMsg.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Email:</Typography>
                  <Typography variant="body1">{selectedMsg.email}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Tiêu đề:</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {selectedMsg.subject}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Nội dung khách gửi:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', minHeight: 100, whiteSpace: 'pre-wrap', mb: 2 }}>
                    {selectedMsg.message}
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#e68c55', fontWeight: 'bold' }}>
                    ✍️ Nội dung phản hồi của hệ thống:
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Nhập nội dung phản hồi tại đây..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    variant="outlined"
                    sx={{ bgcolor: '#fff' }}
                  />
                  {selectedMsg.repliedAt && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                      Đã phản hồi lúc: {new Date(selectedMsg.repliedAt).toLocaleString('vi-VN')}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button variant="outlined" onClick={() => setOpenDetail(false)}>Đóng</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" color="success" onClick={handleReply}>Lưu phản hồi</Button>
          <Button variant="contained" color="primary" onClick={handleSendEmail} disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi Email phản hồi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactMessagesPage;
