import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Fab, Paper, Typography, IconButton, TextField, 
  Avatar, List, ListItem, ListItemText, Divider, Badge 
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Close as CloseIcon, 
  Send as SendIcon,
  Minimize as MinimizeIcon,
  DragHandle as DragIcon
} from '@mui/icons-material';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [connection, setConnection] = useState(null);
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);
  const connectionRef = useRef(null); // Prevent duplicate connections

  // Draggable state - Initial position bottom right
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isStaffUser = (u) => {
    if (!u) return false;
    const roleStr = (u.role || u.Role || u.roleName || '').toLowerCase();
    if (roleStr === 'khách hàng' || roleStr === 'customer') return false;
    if (u.employeeId || u.maNV || u.MaNV) return true;
    const adminWords = ['admin', 'manager', 'staff', 'nhanvien', 'quanly', 'quản trị', 'quản lý', 'nhân viên', 'kế toán', 'tài xế', 'taixe', 'thủ kho'];
    return adminWords.some(w => roleStr.includes(w));
  };

  useEffect(() => {
    if (connectionRef.current) return; // Already connected, skip

    const userData = JSON.parse(localStorage.getItem('user'));
    let customerId = '';
    
    // Only show for customers or guests, NOT for staff/admin
    if (isStaffUser(userData)) {
      return;
    }

    if (userData) {
      setUser(userData);
      customerId = String(userData.maKhachHang || userData.maTaiKhoan || 'User_' + userData.maNV);
    } else {
      let guestId = localStorage.getItem('guestChatId');
      if (!guestId) {
        guestId = 'Guest_' + Math.floor(Math.random() * 1000000);
        localStorage.setItem('guestChatId', guestId);
      }
      setUser({ tenKH: 'Khách', maKhachHang: guestId });
      customerId = guestId;
    }

    fetchHistory(customerId);
    setupSignalR(customerId);
    
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, []);

  const fetchHistory = async (customerId) => {
    try {
      const res = await api.get(`/Chat/history/${customerId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Chat history error:', err);
    }
  };

  const setupSignalR = (customerId) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/hubs/chat`)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = newConnection;

    newConnection.start()
      .then(() => {
        newConnection.invoke('JoinChat', customerId.toString());
        setConnection(newConnection);
      })
      .catch(err => console.error('SignalR Connection Error: ', err));

    newConnection.off('ReceiveMessage');
    newConnection.on('ReceiveMessage', (msg) => {
      setMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (!isOpen) setUnreadCount(prev => prev + 1);
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !connection || !user) return;
    try {
      await connection.invoke('SendMessage', String(user.maKhachHang), input, 'Customer', null);
      setInput('');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  // Draggable logic
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const userData = JSON.parse(localStorage.getItem('user'));
  if (isStaffUser(userData)) return null;
  if (!user) return null;

  return (
    <Box sx={{ position: 'fixed', left: position.x, top: position.y, zIndex: 9999 }}>
      {!isOpen ? (
        <Badge badgeContent={unreadCount} color="error">
          <Fab 
            color="primary" 
            onMouseDown={handleMouseDown}
            onClick={() => {
              if (!isDragging) {
                setIsOpen(true);
                setUnreadCount(0);
              }
            }}
            sx={{ 
              bgcolor: '#e68c55', 
              '&:hover': { bgcolor: '#d47b44' },
              cursor: isDragging ? 'grabbing' : 'pointer'
            }}
          >
            <ChatIcon />
          </Fab>
        </Badge>
      ) : (
        <Paper 
          elevation={6} 
          sx={{ 
            width: 320, 
            height: 450, 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'absolute',
            bottom: 0,
            right: 0
          }}
        >
          {/* Header */}
          <Box 
            onMouseDown={handleMouseDown}
            sx={{ 
              p: 2, 
              bgcolor: '#e68c55', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'move'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: '#e68c55' }}>H</Avatar>
              <Typography variant="subtitle1" fontWeight="bold">Hỗ trợ trực tuyến</Typography>
            </Box>
            <Box>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                <MinimizeIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Messages List */}
          <Box 
            ref={scrollRef}
            sx={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              p: 2, 
              bgcolor: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            {messages.map((m, i) => (
              <Box 
                key={i} 
                sx={{ 
                  alignSelf: m.senderRole === 'Customer' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  bgcolor: m.senderRole === 'Customer' ? '#e68c55' : 'white',
                  color: m.senderRole === 'Customer' ? 'white' : '#333',
                  p: 1.5,
                  borderRadius: m.senderRole === 'Customer' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <Typography variant="body2">{m.message}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.5 }}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Input */}
          <Box sx={{ p: 1.5, bgcolor: 'white', borderTop: '1px solid #eee', display: 'flex', gap: 1 }}>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="Nhập tin nhắn..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default FloatingChat;
