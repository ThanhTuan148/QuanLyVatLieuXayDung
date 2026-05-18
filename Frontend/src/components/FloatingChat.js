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
import cartService from '../services/cartService';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [connection, setConnection] = useState(null);
  const [user, setUser] = useState(null);
  const [chatMode, setChatMode] = useState('AI'); // 'AI' or 'Staff'
  const [allProducts, setAllProducts] = useState([]);
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
    
    // Fetch active product catalog for AI material mapping
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setAllProducts(res.data);
      } catch (err) {
        console.error('Error fetching products for chat:', err);
      }
    };
    fetchProducts();
    
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

  const parseMessage = (text) => {
    if (!text) return { cleanText: '', actionData: null };
    const actionRegex = /\[ESTIMATE_ACTION:\s*(\{[\s\S]*\})\s*\]/s;
    const match = text.match(actionRegex);
    if (!match) return { cleanText: text, actionData: null };
    
    try {
      const actionData = JSON.parse(match[1]);
      const cleanText = text.replace(actionRegex, '').trim();
      return { cleanText, actionData };
    } catch (e) {
      console.error('Error parsing ESTIMATE_ACTION:', e);
      return { cleanText: text, actionData: null };
    }
  };

  const handleAddEstimateToCart = async (items) => {
    let addedCount = 0;
    try {
      for (const item of items) {
        // Robust fuzzy matching by code, exact name, or name similarity
        const prod = allProducts.find(p => {
          if (!p || !item.maSP) return false;
          const codeMatch = p.maSP.toLowerCase() === item.maSP.toLowerCase();
          const nameMatch = p.tenSP.toLowerCase() === item.maSP.toLowerCase();
          const partialMatch = p.tenSP.toLowerCase().includes(item.maSP.toLowerCase()) || 
                               item.maSP.toLowerCase().includes(p.tenSP.toLowerCase());
          return codeMatch || nameMatch || partialMatch;
        });

        if (prod) {
          await cartService.addToCart({
            productId: prod.maSanPham,
            productName: prod.tenSP,
            price: prod.giaSauKhuyenMai || prod.giaBan,
            image: prod.hinhAnh,
            unit: prod.donViTinh,
            quantity: item.quantity
          });
          addedCount++;
        }
      }
      alert(`🎉 Đã thêm thành công ${addedCount} loại vật liệu vào giỏ hàng của bạn!`);
    } catch (err) {
      console.error('Error adding estimate to cart:', err);
      alert('Không thể thêm vật tư vào giỏ hàng.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !connection || !user) return;
    const senderRole = chatMode === 'AI' ? 'Customer_AI' : 'Customer_Staff';
    try {
      await connection.invoke('SendMessage', String(user.maKhachHang), input, senderRole, null);
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

          {/* Mode Selector */}
          <Box sx={{ display: 'flex', bgcolor: '#fff', borderBottom: '1px solid #eee', p: 0.5 }}>
            <Box 
              onClick={() => setChatMode('AI')}
              sx={{ 
                flex: 1, 
                py: 1, 
                textAlign: 'center', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                color: chatMode === 'AI' ? '#e68c55' : '#888',
                borderBottom: chatMode === 'AI' ? '2px solid #e68c55' : 'none',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#fff6f0' }
              }}
            >
              🤖 Trợ lý AI
            </Box>
            <Box 
              onClick={() => setChatMode('Staff')}
              sx={{ 
                flex: 1, 
                py: 1, 
                textAlign: 'center', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                color: chatMode === 'Staff' ? '#e68c55' : '#888',
                borderBottom: chatMode === 'Staff' ? '2px solid #e68c55' : 'none',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#fff6f0' }
              }}
            >
              💬 Nhân viên
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
            {messages
              .filter(m => {
                if (chatMode === 'AI') {
                  return m.senderRole === 'Customer_AI' || m.senderRole === 'Customer' || m.senderRole === 'AI Assistant';
                } else {
                  return m.senderRole === 'Customer_Staff' || m.senderRole === 'Staff';
                }
              })
              .map((m, i) => {
                const isCustomer = m.senderRole === 'Customer' || m.senderRole === 'Customer_AI' || m.senderRole === 'Customer_Staff';
                const isAI = m.senderRole === 'AI Assistant';
                
                const { cleanText, actionData } = parseMessage(m.message);

                return (
                  <Box 
                    key={i} 
                    sx={{ 
                      alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      bgcolor: isCustomer ? '#e68c55' : (isAI ? '#e3f2fd' : 'white'),
                      color: isCustomer ? 'white' : '#333',
                      p: 1.5,
                      borderRadius: isCustomer ? '15px 15px 0 15px' : '15px 15px 15px 0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      border: isAI ? '1px solid #bbdefb' : 'none'
                    }}
                  >
                    {isAI && (
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5, display: 'block' }}>
                        🤖 Trợ lý ảo AI
                      </Typography>
                    )}
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{cleanText}</Typography>

                    {actionData && actionData.items && (
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px dashed #e68c55', color: '#333' }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="#e68c55" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          📊 Ước tính từ Thành Đạt:
                        </Typography>
                        {actionData.items.map((item, idx) => {
                          const prod = allProducts.find(p => {
                            if (!p || !item.maSP) return false;
                            const codeMatch = p.maSP.toLowerCase() === item.maSP.toLowerCase();
                            const nameMatch = p.tenSP.toLowerCase() === item.maSP.toLowerCase();
                            const partialMatch = p.tenSP.toLowerCase().includes(item.maSP.toLowerCase()) || 
                                                 item.maSP.toLowerCase().includes(p.tenSP.toLowerCase());
                            return codeMatch || nameMatch || partialMatch;
                          });
                          return (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, fontSize: '12px' }}>
                              <span>• {prod ? prod.tenSP : item.maSP}:</span>
                              <span style={{ fontWeight: 'bold' }}>{item.quantity} {prod ? prod.donViTinh : (item.unit || item.donViTinh || 'Đơn vị')}</span>
                            </Box>
                          );
                        })}
                        <Fab
                          variant="extended"
                          size="small"
                          onClick={() => handleAddEstimateToCart(actionData.items)}
                          sx={{ 
                            mt: 1.5, 
                            width: '100%', 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            bgcolor: '#e68c55',
                            color: 'white',
                            boxShadow: 'none',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#d47b44' }
                          }}
                        >
                          🛒 Thêm tất cả vào giỏ hàng
                        </Fab>
                      </Box>
                    )}

                    <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.5 }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                );
              })}
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
