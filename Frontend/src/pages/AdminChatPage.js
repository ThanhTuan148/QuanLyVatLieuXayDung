import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Paper, List, ListItem, ListItemAvatar, 
  Avatar, ListItemText, Divider, TextField, IconButton, Badge,
  Grid, Tooltip
} from '@mui/material';
import { 
  Send as SendIcon, 
  Chat as ChatIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';
import { usePermissions } from '../contexts/PermissionContext';

const AdminChatPage = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connection, setConnection] = useState(null);
  const scrollRef = useRef(null);

  const { permissions } = usePermissions();
  const canDelete = permissions?.chat?.coTheXoa ?? false;

  useEffect(() => {
    fetchCustomers();
    setupSignalR();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/Chat/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Fetch chat customers error:', err);
    }
  };

  const setupSignalR = () => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/hubs/chat`)
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        console.log('Admin connected to ChatHub');
        newConnection.invoke('JoinStaffGroup');
        setConnection(newConnection);
      })
      .catch(err => console.error('SignalR Connection Error: ', err));

    newConnection.on('ReceiveMessage', (msg) => {
      // If the message is for the currently selected customer, add it to list
      if (selectedCustomer && msg.customerId === selectedCustomer.maKhachHang) {
        setMessages(prev => [...prev, msg]);
      }
      // Refresh customer list to show latest message/unread status
      fetchCustomers();
    });

    newConnection.on('NewChatMessage', (msg) => {
      fetchCustomers();
    });
  };

  const fetchHistory = async (customerId) => {
    try {
      const res = await api.get(`/Chat/history/${customerId}`);
      setMessages(res.data);
      // Mark as read
      await api.patch(`/Chat/read/${customerId}?role=Staff`);
      fetchCustomers();
    } catch (err) {
      console.error('Chat history error:', err);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchHistory(selectedCustomer.maKhachHang);
      if (connection) {
        connection.invoke('JoinChat', selectedCustomer.maKhachHang.toString());
      }
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !connection || !selectedCustomer) return;

    try {
      // Assuming staffId is 1 for now or get from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      await connection.invoke('SendMessage', selectedCustomer.maKhachHang, input, 'Staff', user?.maNhanVien || 1);
      setInput('');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedCustomer) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ cuộc hội thoại với khách hàng này? Không thể hoàn tác!')) {
      try {
        await api.delete(`/Chat/${selectedCustomer.maKhachHang}`);
        setSelectedCustomer(null);
        setMessages([]);
        fetchCustomers();
      } catch (err) {
        alert('Xóa cuộc hội thoại thất bại');
      }
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
        💬 Tư vấn trực tuyến
      </Typography>

      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Customer List */}
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" fontWeight="bold">Khách hàng</Typography>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {customers.map((c) => (
                <React.Fragment key={c.maKhachHang}>
                  <ListItem 
                    button 
                    selected={selectedCustomer?.maKhachHang === c.maKhachHang}
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <ListItemAvatar>
                      <Badge color="error" variant="dot" invisible={c.lastMessage?.isRead || c.lastMessage?.senderRole === 'Staff'}>
                        <Avatar src={c.anhDaiDien}><PersonIcon /></Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={c.tenKH} 
                      secondary={c.lastMessage?.message}
                      secondaryTypographyProps={{ 
                        noWrap: true, 
                        fontWeight: (c.lastMessage?.isRead || c.lastMessage?.senderRole === 'Staff') ? 'normal' : 'bold'
                      }}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {customers.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">Chưa có cuộc hội thoại nào</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedCustomer ? (
              <>
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={selectedCustomer.anhDaiDien} />
                  <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>{selectedCustomer.tenKH}</Typography>
                  {canDelete && (
                    <Tooltip title="Xóa toàn bộ cuộc hội thoại">
                      <IconButton color="error" onClick={handleDeleteConversation}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Divider />
                <Box 
                  ref={scrollRef}
                  sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    p: 3, 
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  {messages
                    .filter(m => m.senderRole === 'Customer_Staff' || m.senderRole === 'Staff')
                    .map((m, i) => (
                      <Box 
                        key={i} 
                        sx={{ 
                          alignSelf: m.senderRole === 'Staff' ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                          bgcolor: m.senderRole === 'Staff' ? '#e68c55' : 'white',
                          color: m.senderRole === 'Staff' ? 'white' : '#333',
                          p: 2,
                          borderRadius: m.senderRole === 'Staff' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                      >
                        <Typography variant="body1">{m.message}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.5 }}>
                          {new Date(m.timestamp).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    ))}
                </Box>
                <Divider />
                <Box sx={{ p: 2, bgcolor: 'white', display: 'flex', gap: 2 }}>
                  <TextField 
                    fullWidth 
                    placeholder="Nhập nội dung phản hồi..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <IconButton color="primary" onClick={handleSend} disabled={!input.trim()} sx={{ bgcolor: '#e68c55', color: 'white', '&:hover': { bgcolor: '#d47b44' } }}>
                    <SendIcon />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#ccc' }}>
                <ChatIcon sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h6">Chọn một khách hàng để bắt đầu tư vấn</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminChatPage;
