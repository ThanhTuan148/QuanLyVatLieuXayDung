import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, IconButton, TextField, 
  Avatar, Badge
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Send as SendIcon,
  Minimize as MinimizeIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';

const StaffChatWindow = ({ customer, onClose, onMinimize, connection, staffUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = React.useRef(null);

  useEffect(() => {
    fetchHistory();
    if (connection) {
      connection.invoke('JoinChat', customer.maKhachHang.toString());
    }
  }, [customer.maKhachHang]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/Chat/history/${customer.maKhachHang}`);
      setMessages(res.data);
      await api.patch(`/Chat/read/${customer.maKhachHang}?role=Staff`);
    } catch (err) {}
  };

  useEffect(() => {
    if (connection) {
      const handleReceive = (msg) => {
        if (msg.customerId === customer.maKhachHang.toString()) {
          setMessages(prev => {
            if (msg.id && prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      };
      connection.on('ReceiveMessage', handleReceive);
      return () => connection.off('ReceiveMessage', handleReceive);
    }
  }, [connection, customer.maKhachHang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !connection) return;
    try {
      await connection.invoke('SendMessage', customer.maKhachHang.toString(), input, 'Staff', staffUser?.maNhanVien || 1);
      setInput('');
    } catch (err) {}
  };

  return (
    <Paper elevation={10} sx={{ width: 300, height: 400, display: 'flex', flexDirection: 'column', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
      <Box sx={{ p: 1.5, bgcolor: '#e68c55', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar src={customer.anhDaiDien} sx={{ width: 28, height: 28 }} />
          <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: 150 }}>{customer.tenKH}</Typography>
        </Box>
        <Box>
          <IconButton size="small" onClick={onMinimize} sx={{ color: 'white', mr: 0.5 }}><MinimizeIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </Box>
      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5, bgcolor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages
          .filter(m => m.senderRole === 'Customer_Staff' || m.senderRole === 'Staff')
          .map((m, i) => {
            const isStaff = m.senderRole === 'Staff';

            return (
              <Box key={i} sx={{ 
                alignSelf: isStaff ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                bgcolor: isStaff ? '#e68c55' : 'white',
                color: isStaff ? 'white' : '#333',
                p: 1, borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="body2">{m.message}</Typography>
              </Box>
            );
          })}
      </Box>
      <Box sx={{ p: 1, bgcolor: 'white', borderTop: '1px solid #eee', display: 'flex', gap: 1 }}>
        <TextField 
          fullWidth size="small" placeholder="Nhập trả lời..." 
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <IconButton size="small" color="primary" onClick={handleSend} disabled={!input.trim()}><SendIcon fontSize="small" /></IconButton>
      </Box>
    </Paper>
  );
};

const StaffChatManager = () => {
  const [activeChats, setActiveChats] = useState([]);
  const [minimizedIds, setMinimizedIds] = useState([]);
  const [connection, setConnection] = useState(null);
  const [user, setUser] = useState(null);
  const connectionRef = React.useRef(null);

  const isStaffUser = (u) => {
    if (!u) return false;
    const roleStr = (u.role || u.Role || u.roleName || '').toLowerCase();
    if (roleStr === 'khách hàng' || roleStr === 'customer') return false;
    if (u.employeeId || u.maNV || u.MaNV) return true;
    const adminWords = ['admin', 'manager', 'staff', 'nhanvien', 'quanly', 'quản trị', 'quản lý', 'nhân viên', 'kế toán', 'tài xế', 'taixe', 'thủ kho'];
    return adminWords.some(w => roleStr.includes(w));
  };

  useEffect(() => {
    if (connectionRef.current) return;
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (isStaffUser(userData)) {
      setUser(userData);
      setupSignalR();
    }
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, []);

  const setupSignalR = () => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/hubs/chat`)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = newConnection;

    newConnection.start().then(() => {
      newConnection.invoke('JoinStaffGroup');
      setConnection(newConnection);
    }).catch(err => console.log('Staff chat connection pending...'));

    // Remove existing listener if any (safety)
    newConnection.off('NewChatMessage');
    newConnection.on('NewChatMessage', async (msg) => {
      if (msg.senderRole === 'Customer_Staff') {
        try {
          const res = await api.get('/Chat/customers');
          const customerInfo = res.data.find(c => String(c.maKhachHang) === String(msg.customerId));
          if (customerInfo) {
            setActiveChats(prev => {
              if (prev.find(c => String(c.maKhachHang) === String(msg.customerId))) return prev;
              return [...prev, customerInfo];
            });
          }
        } catch (err) {}
      }
    });
  };

  const closeChat = (customerId) => {
    setActiveChats(prev => prev.filter(c => c.maKhachHang !== customerId));
    setMinimizedIds(prev => prev.filter(id => id !== customerId));
  };

  const toggleMinimize = (customerId) => {
    setMinimizedIds(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId) 
        : [...prev, customerId]
    );
  };

  if (!user || !isStaffUser(user)) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', gap: 2, alignItems: 'flex-end', zIndex: 99999, pointerEvents: 'none' }}>
      {activeChats.map(customer => {
        const isMinimized = minimizedIds.includes(customer.maKhachHang);
        
        return (
          <Box key={customer.maKhachHang} sx={{ pointerEvents: 'auto' }}>
            {isMinimized ? (
              <Badge badgeContent="!" color="error" overlap="circular">
                <Avatar 
                  src={customer.anhDaiDien} 
                  onClick={() => toggleMinimize(customer.maKhachHang)}
                  sx={{ 
                    width: 56, height: 56, cursor: 'pointer', 
                    border: '3px solid #e68c55',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.1)' }
                  }}
                />
              </Badge>
            ) : (
              <StaffChatWindow 
                customer={customer} 
                onClose={() => closeChat(customer.maKhachHang)}
                onMinimize={() => toggleMinimize(customer.maKhachHang)}
                connection={connection}
                staffUser={user}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default StaffChatManager;
