import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Fab, Paper, Typography, IconButton, TextField,
  Avatar, List, ListItem, ListItemText, Divider, Badge, Button,
  CircularProgress, Chip
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Minimize as MinimizeIcon,
  DragHandle as DragIcon,
  SmartToyOutlined as SmartToyIcon,
  SupportAgentOutlined as SupportAgentIcon,
  ShoppingCartOutlined as ShoppingCartIcon,
  Circle as CircleIcon
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
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);
  const connectionRef = useRef(null); // Prevent duplicate connections

  // Draggable state - Initial position bottom right
  const [position, setPosition] = useState({ x: window.innerWidth - 90, y: window.innerHeight - 90 });
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
      setUser({ tenKH: 'Khách hàng', maKhachHang: guestId });
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
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80)
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
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      console.error('Error adding estimate to cart:', err);
      alert('Không thể thêm vật tư vào giỏ hàng.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !connection || !user || isSending) return;
    const senderRole = chatMode === 'AI' ? 'Customer_AI' : 'Customer_Staff';
    setIsSending(true);
    try {
      await connection.invoke('SendMessage', String(user.maKhachHang), input, senderRole, null);
      setInput('');
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Draggable logic
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    // Don't drag if clicking buttons
    if (e.target.closest('button') || e.target.closest('svg')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - dragOffset.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        // Enforce boundary limits to keep it visible inside viewport
        const newX = Math.max(10, Math.min(e.clientX - dragOffset.x, window.innerWidth - 90));
        const newY = Math.max(10, Math.min(e.clientY - dragOffset.y, window.innerHeight - 90));
        setPosition({ x: newX, y: newY });
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
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              height: 20,
              minWidth: 20,
              borderRadius: '10px',
              boxShadow: '0 0 10px rgba(255,0,0,0.5)',
              fontWeight: 'bold'
            }
          }}
        >
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
              background: 'linear-gradient(135deg, #e68c55 0%, #f79b7f 100%)',
              boxShadow: '0 8px 24px rgba(230,140,85,0.35)',
              color: 'white',
              width: 60,
              height: 60,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'pulseGlow 2s infinite ease-in-out',
              cursor: isDragging ? 'grabbing' : 'pointer',
              '&:hover': {
                background: 'linear-gradient(135deg, #d47b44 0%, #e68c55 100%)',
                transform: 'scale(1.08) rotate(5deg)',
                boxShadow: '0 12px 30px rgba(230,140,85,0.5)'
              }
            }}
          >
            <ChatIcon sx={{ fontSize: 28 }} />
          </Fab>
        </Badge>
      ) : (
        <Paper
          elevation={12}
          sx={{
            width: 360,
            height: 520,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'absolute',
            bottom: 0,
            right: 0,
            border: '1px solid rgba(230, 140, 85, 0.12)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
            background: '#ffffff',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Header */}
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #e68c55 0%, #d47b44 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'move',
              boxShadow: '0 4px 12px rgba(230,140,85,0.15)',
              zIndex: 10
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: 'white', color: '#e68c55', fontWeight: 'bold', fontSize: '1rem', border: '2px solid rgba(255,255,255,0.8)' }}>
                  TD
                </Avatar>
                {/* Active status indicator green dot */}
                <CircleIcon sx={{ position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, color: '#4caf50', border: '2px solid #e68c55', borderRadius: '50%' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="800" sx={{ lineHeight: 1.1 }}>VLXD Thành Đạt</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CircleIcon sx={{ width: 6, height: 6, color: '#4caf50' }} /> Trực tuyến 24/7
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                <MinimizeIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Mode Selector - iOS Segment Control Style */}
          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', bgcolor: '#f0f0f0', borderRadius: '24px', p: 0.5, border: '1px solid #ebebeb' }}>
              <Box
                onClick={() => setChatMode('AI')}
                sx={{
                  flex: 1,
                  py: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '13px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  color: chatMode === 'AI' ? '#e68c55' : '#666',
                  bgcolor: chatMode === 'AI' ? 'white' : 'transparent',
                  boxShadow: chatMode === 'AI' ? '0 4px 10px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { color: chatMode === 'AI' ? '#e68c55' : '#333' }
                }}
              >
                <SmartToyIcon sx={{ fontSize: 16 }} /> Trợ lý AI
              </Box>
              <Box
                onClick={() => setChatMode('Staff')}
                sx={{
                  flex: 1,
                  py: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '13px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  color: chatMode === 'Staff' ? '#e68c55' : '#666',
                  bgcolor: chatMode === 'Staff' ? 'white' : 'transparent',
                  boxShadow: chatMode === 'Staff' ? '0 4px 10px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { color: chatMode === 'Staff' ? '#e68c55' : '#333' }
                }}
              >
                <SupportAgentIcon sx={{ fontSize: 16 }} /> Nhân viên
              </Box>
            </Box>
          </Box>

          {/* Messages List */}
          <Box
            ref={scrollRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: '#fbfaf8',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(230,140,85,0.15)', borderRadius: '10px' },
              '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'rgba(230,140,85,0.3)' }
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.7, p: 3, textAlign: 'center' }}>
                {chatMode === 'AI' ? (
                  <>
                    <SmartToyIcon sx={{ fontSize: 44, color: '#e68c55', mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight="bold">Xin chào quý khách!</Typography>
                    <Typography variant="caption" color="text.secondary">Tôi là Trợ lý ảo AI của Thành Đạt. Tôi có thể tư vấn kỹ thuật xây dựng và ước lượng vật tư xây nhà nhanh chóng cho bạn.</Typography>
                  </>
                ) : (
                  <>
                    <SupportAgentIcon sx={{ fontSize: 44, color: '#e68c55', mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight="bold">Nhân viên trực tuyến</Typography>
                    <Typography variant="caption" color="text.secondary">Vui lòng gửi tin nhắn. Đội ngũ nhân viên bán hàng của Thành Đạt sẽ hỗ trợ báo giá tốt nhất cho bạn ngay.</Typography>
                  </>
                )}
              </Box>
            )}

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
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isCustomer ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: isCustomer ? '#e68c55' : (isAI ? '#ffffff' : '#fff5ee'),
                        background: isCustomer ? 'linear-gradient(135deg, #e68c55 0%, #f79b7f 100%)' : undefined,
                        color: isCustomer ? 'white' : '#2d2d2d',
                        p: 1.8,
                        borderRadius: isCustomer ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        boxShadow: isCustomer
                          ? '0 4px 12px rgba(230,140,85,0.18)'
                          : '0 4px 12px rgba(0,0,0,0.03)',
                        border: isCustomer ? 'none' : '1px solid rgba(230, 140, 85, 0.08)'
                      }}
                    >
                      {isAI && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
                          <Chip
                            icon={<SmartToyIcon style={{ color: '#1976d2', fontSize: '0.85rem' }} />}
                            label="Trợ lý ảo AI"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: '800',
                              bgcolor: 'rgba(25, 118, 210, 0.08)',
                              color: '#1976d2',
                              border: 'none',
                              '& .MuiChip-icon': { marginLeft: '4px', marginRight: '-2px' }
                            }}
                          />
                        </Box>
                      )}

                      {!isCustomer && !isAI && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
                          <Chip
                            icon={<SupportAgentIcon style={{ color: '#e68c55', fontSize: '0.85rem' }} />}
                            label="Nhân viên"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: '800',
                              bgcolor: 'rgba(230, 140, 85, 0.08)',
                              color: '#e68c55',
                              border: 'none',
                              '& .MuiChip-icon': { marginLeft: '4px', marginRight: '-2px' }
                            }}
                          />
                        </Box>
                      )}

                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.5, fontSize: '0.85rem', fontWeight: '500' }}>
                        {cleanText}
                      </Typography>

                      {actionData && actionData.items && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#ffffff', borderRadius: '14px', border: '1px solid rgba(230,140,85,0.25)', color: '#333', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                          <Typography variant="subtitle2" fontWeight="800" color="#e68c55" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                            📊 Bảng ước tính khối lượng vật tư:
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
                              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8, fontSize: '11px', borderBottom: '1px dashed #f0f0f0', pb: 0.5 }}>
                                <span style={{ color: '#555' }}>• {prod ? prod.tenSP : item.maSP}:</span>
                                <span style={{ fontWeight: '800', color: '#2d2d2d' }}>{item.quantity} {prod ? prod.donViTinh : (item.unit || item.donViTinh || 'Đơn vị')}</span>
                              </Box>
                            );
                          })}
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ShoppingCartIcon />}
                            onClick={() => handleAddEstimateToCart(actionData.items)}
                            sx={{
                              mt: 1.5,
                              width: '100%',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              background: 'linear-gradient(135deg, #e68c55 0%, #f79b7f 100%)',
                              color: 'white',
                              boxShadow: '0 4px 10px rgba(230,140,85,0.2)',
                              textTransform: 'none',
                              borderRadius: '8px',
                              py: 0.8,
                              '&:hover': { background: 'linear-gradient(135deg, #d47b44 0%, #e68c55 100%)', boxShadow: '0 6px 14px rgba(230,140,85,0.3)' }
                            }}
                          >
                            Thêm tất cả vào giỏ hàng
                          </Button>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.68rem', mt: 0.5, mx: 0.5 }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                );
              })}
          </Box>

          {/* Input Box */}
          <Box sx={{ p: 1.8, bgcolor: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Nhập tin nhắn tư vấn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  bgcolor: '#f5f5f5',
                  fontSize: '0.85rem',
                  border: 'none',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: 'none' }
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              sx={{
                bgcolor: input.trim() ? '#e68c55' : '#f0f0f0',
                color: input.trim() ? 'white' : '#bbb',
                p: 1.1,
                boxShadow: input.trim() ? '0 4px 10px rgba(230,140,85,0.25)' : 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: input.trim() ? '#d47b44' : '#f0f0f0',
                  transform: input.trim() ? 'scale(1.05)' : 'none'
                },
                '&.Mui-disabled': { bgcolor: '#f0f0f0', color: '#bbb' }
              }}
            >
              {isSending ? <CircularProgress size={18} sx={{ color: '#e68c55' }} /> : <SendIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Dynamic pulse animation style */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(230, 140, 85, 0.4);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(230, 140, 85, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(230, 140, 85, 0);
          }
        }
      `}} />
    </Box>
  );
};

export default FloatingChat;
