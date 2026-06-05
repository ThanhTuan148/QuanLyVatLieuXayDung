import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Fab, Paper, Typography, IconButton, TextField,
  Avatar, CircularProgress, Chip, Button
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Minimize as MinimizeIcon,
  SmartToy as SmartToyIcon,
  Circle as CircleIcon,
  DeleteOutline as DeleteIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import api from '../services/api';
import authService from '../services/authService';

const StaffAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);
  const [user, setUser] = useState(null);

  // Draggable state
  const [position, setPosition] = useState({ x: window.innerWidth - 90, y: window.innerHeight - 180 }); // Position slightly above customer chat
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isStaffUser = (u) => {
    return !!u; // Cho phép TẤT CẢ các vai trò đã đăng nhập sử dụng
  };

  useEffect(() => {
    const userData = authService.getUser();
    if (isStaffUser(userData)) {
      setUser(userData);
      // Load local history if any
      const history = localStorage.getItem(`ai_assistant_history_${userData.employeeId || 'staff'}`);
      if (history) {
        setMessages(JSON.parse(history));
      }
    }

    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const saveHistory = (newMessages) => {
    if (user) {
      localStorage.setItem(`ai_assistant_history_${user.employeeId || 'staff'}`, JSON.stringify(newMessages));
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    if (user) {
      localStorage.removeItem(`ai_assistant_history_${user.employeeId || 'staff'}`);
    }
  };

  const parseMessage = (text) => {
    if (!text) return '';
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) return <strong key={i}>{part}</strong>;
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {line}
          {j !== part.split('\n').length - 1 && <br />}
        </span>
      ));
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveHistory(newMessages);
    setInput('');
    setIsSending(true);

    try {
      // Create chat history to send context to backend
      const historyToSend = newMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/AIAssistant/chat', { 
        messages: historyToSend,
        EmployeeId: user.employeeId || 0,
        RoleName: user.roleName || user.role || user.Role || ""
      });
      
      const aiMsg = { 
        role: 'assistant', 
        content: res.data.reply || res.data.message || 'Lỗi phản hồi từ AI.', 
        timestamp: new Date().toISOString() 
      };
      
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
      
    } catch (err) {
      console.error('AI chat error:', err);
      const errorMsg = { 
        role: 'assistant', 
        content: err.response?.data?.message || 'Có lỗi xảy ra khi kết nối tới Trợ lý AI. Vui lòng thử lại sau.', 
        timestamp: new Date().toISOString(),
        isError: true
      };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
    } finally {
      setIsSending(false);
    }
  };

  // Use ref to track dragging like in FloatingChat
  const dragState = useRef({ hasMoved: false });
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; 
    if (e.target.closest('.no-drag')) return;
    setIsDragging(true);
    dragState.current.hasMoved = false;
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        dragState.current.hasMoved = true;
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

  if (!user) return null;

  return (
    <Box sx={{ 
      position: 'fixed', 
      zIndex: 9999,
      ...(isFullScreen && isOpen
        ? { left: 0, top: 0, width: '100vw', height: '100vh' }
        : { left: position.x, top: position.y })
    }}>
      {!isOpen ? (
        <Fab
          color="primary"
          onMouseDown={handleMouseDown}
          onClick={() => { if (!dragState.current.hasMoved) setIsOpen(true); }}
          sx={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            boxShadow: '0 8px 24px rgba(30,60,114,0.35)',
            color: 'white',
            width: 56,
            height: 56,
            transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: isDragging ? 'grabbing' : 'pointer',
            '&:hover': {
              background: 'linear-gradient(135deg, #15294f 0%, #1e3c72 100%)',
              transform: isDragging ? 'none' : 'scale(1.08)',
              boxShadow: '0 12px 30px rgba(30,60,114,0.5)'
            }
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 26 }} />
        </Fab>
      ) : (
        <Paper
          elevation={12}
          sx={{
            width: isFullScreen ? '100%' : 380,
            height: isFullScreen ? '100%' : 560,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: isFullScreen ? 0 : '16px',
            overflow: 'hidden',
            position: isFullScreen ? 'relative' : 'absolute',
            bottom: isFullScreen ? 'auto' : 0,
            right: isFullScreen ? 'auto' : 0,
            border: '1px solid rgba(30,60,114, 0.12)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
            background: '#ffffff',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Header */}
          <Box
            onMouseDown={isFullScreen ? undefined : handleMouseDown}
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isFullScreen ? 'default' : 'move',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 10
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <SmartToyIcon fontSize="small" />
                </Avatar>
                <CircleIcon sx={{ position: 'absolute', right: -2, bottom: -2, width: 12, height: 12, color: '#4caf50', border: '2px solid #1e3c72', borderRadius: '50%' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.1 }}>Trợ lý AI Nội bộ</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.72rem' }}>Hỗ trợ công việc cho nhân viên</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton className="no-drag" size="small" onClick={handleClearHistory} title="Xóa lịch sử trò chuyện" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                <DeleteIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton className="no-drag" size="small" onClick={() => setIsFullScreen(!isFullScreen)} sx={{ color: 'white', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                {isFullScreen ? <FullscreenExitIcon sx={{ fontSize: 20 }} /> : <FullscreenIcon sx={{ fontSize: 20 }} />}
              </IconButton>
              <IconButton className="no-drag" size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                <MinimizeIcon sx={{ fontSize: 20 }} />
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
              bgcolor: '#f4f6f8',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.7, p: 3, textAlign: 'center' }}>
                <AutoAwesomeIcon sx={{ fontSize: 48, color: '#1e3c72', mb: 2, opacity: 0.8 }} />
                <Typography variant="subtitle2" fontWeight="bold" color="#1e3c72">Trợ lý AI sẵn sàng!</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Bạn có thể hỏi tôi về:
                </Typography>
                <ul style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '20px', color: '#666', fontSize: '0.85rem' }}>
                  <li>Tra cứu tồn kho, giá bán sản phẩm</li>
                  <li>Thông tin chi tiết đơn hàng</li>
                  <li>Báo cáo thống kê (tuỳ theo quyền hạn)</li>
                  <li>Tư vấn, gợi ý công việc chung</li>
                </ul>
              </Box>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <Box
                  key={i}
                  sx={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: isUser ? '#1e3c72' : (m.isError ? '#ffebee' : '#ffffff'),
                      color: isUser ? 'white' : (m.isError ? '#d32f2f' : '#2d2d2d'),
                      p: 1.5,
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: isUser ? 'none' : (m.isError ? '1px solid #ffcdd2' : '1px solid #e0e0e0'),
                      fontSize: '0.88rem',
                      lineHeight: 1.5
                    }}
                  >
                    {!isUser && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, opacity: 0.8 }}>
                        <AutoAwesomeIcon sx={{ fontSize: 14, color: m.isError ? '#d32f2f' : '#1e3c72' }} />
                        <Typography variant="caption" fontWeight="bold" color={m.isError ? '#d32f2f' : '#1e3c72'}>AI</Typography>
                      </Box>
                    )}
                    {parseMessage(m.content)}
                  </Box>
                </Box>
              );
            })}
            
            {isSending && (
               <Box sx={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                 <Box sx={{ bgcolor: '#ffffff', p: 1.5, borderRadius: '16px 16px 16px 4px', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: '#1e3c72' }} />
                    <Typography variant="body2" color="text.secondary">AI đang suy nghĩ...</Typography>
                 </Box>
               </Box>
            )}
          </Box>

          {/* Input Box */}
          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Nhập câu hỏi cho AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: '#f5f7fa',
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: '#1e3c72' },
                  '&.Mui-focused fieldset': { borderColor: '#1e3c72', borderWidth: '1px' }
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              sx={{
                bgcolor: input.trim() ? '#1e3c72' : '#f0f0f0',
                color: input.trim() ? 'white' : '#bbb',
                p: 1.2,
                borderRadius: '12px',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: input.trim() ? '#15294f' : '#f0f0f0',
                },
                '&.Mui-disabled': { bgcolor: '#f0f0f0', color: '#bbb' }
              }}
            >
              <SendIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default StaffAIAssistant;
