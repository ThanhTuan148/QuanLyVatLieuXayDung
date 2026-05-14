import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Badge, IconButton, Menu, MenuItem, Box, Typography,
  Divider, List, ListItem, ListItemText, ListItemButton,
  Button, CircularProgress, Chip, Tooltip, Snackbar, Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  DoneAll as DoneAllIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';
import authService from '../services/authService';

export default function NotificationCenter() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Real-time toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const connectionRef = useRef(null);

  const user = authService.getUser();
  const userId = user?.id?.toString() || '';

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get(`/notifications?userId=${userId}`);
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.daDoc).length);
    } catch (e) {
      console.error('Lỗi lấy thông báo:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // SignalR Connection
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    fetchNotifications();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/hubs/notifications")
      .withAutomaticReconnect()
      .build();

      connection.on("ReceiveNotification", (notification) => {
      if (!isMounted) return;
      
      // Chỉ nhận nếu MaNguoiNhan khớp với userId hiện tại
      if (notification.maNguoiNhan && notification.maNguoiNhan !== userId) return;

      setNotifications(prev => {
        // Tránh trùng lặp nếu thông báo này đã tồn tại trong danh sách (check theo maThongBao)
        const exists = prev.some(n => n.maThongBao === notification.maThongBao);
        if (exists) return prev;
        
        return [notification, ...prev].slice(0, 50);
      });
      
      setUnreadCount(prev => prev + 1);
      setLastNotification(notification);
      setToastOpen(true);
      
      // Play sound safely
      try {
          const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3');
          audio.volume = 0.5;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => {
                  console.log("Autoplay or source load failed:", error);
              });
          }
      } catch(e) {
          console.error("Audio error:", e);
      }
    });

    const joinGroups = (conn) => {
      if (conn.state === signalR.HubConnectionState.Connected) {
        conn.invoke("JoinGroup", `User_${userId}`).catch(console.error);
        console.log(`Joined notification group: User_${userId}`);
      }
    };

    connection.onreconnected(() => {
      if (isMounted) joinGroups(connection);
    });

    connection.start()
      .then(() => {
        if (!isMounted) {
            connection.stop();
            return;
        }
        connectionRef.current = connection;
        joinGroups(connection);
      })
      .catch(err => {
          if (isMounted) console.error("SignalR Connection Error: ", err);
      });

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop();
      } else {
        connection.stop();
      }
    };
  }, [userId, fetchNotifications]);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleToastClose = () => setToastOpen(false);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.maThongBao === id ? { ...n, daDoc: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put(`/notifications/read-all?userId=${userId}`);
      setNotifications(prev => prev.map(n => ({ ...n, daDoc: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <>
      <Tooltip title="Thông báo">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error" overlap="circular">
            {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { 
            width: 380, maxHeight: 520, mt: 1.5, borderRadius: 3, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.08)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
          <Typography variant="h6" fontWeight="bold" color="primary">Thông báo</Typography>
          <Button size="small" onClick={markAllRead} startIcon={<DoneAllIcon />} disabled={unreadCount === 0} sx={{ borderRadius: 2 }}>
            Đọc tất cả
          </Button>
        </Box>
        <Divider />
        
        <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
              <NotificationsIcon sx={{ fontSize: 64, opacity: 0.1, mb: 1 }} />
              <Typography variant="body2">Chưa có thông báo nào</Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <ListItemButton
                key={n.maThongBao}
                onClick={() => { 
                    if (!n.daDoc) markAsRead(n.maThongBao); 
                    if(n.lienKet) window.location.href = n.lienKet; 
                    handleClose();
                }}
                sx={{ 
                  bgcolor: n.daDoc ? 'transparent' : 'rgba(102, 126, 234, 0.03)',
                  borderLeft: n.daDoc ? '4px solid transparent' : '4px solid #667eea',
                  mb: 0.2,
                  py: 1.5
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body2" fontWeight={n.daDoc ? 500 : 700} sx={{ mr: 1, color: n.daDoc ? 'text.primary' : '#2d3436' }}>
                        {n.tieuDe}
                      </Typography>
                      {!n.daDoc && <CircleIcon sx={{ fontSize: 10, color: '#667eea', mt: 0.5 }} />}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, lineHeight: 1.4 }}>
                        {n.noiDung}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
                        {getTimeAgo(n.ngayTao)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            ))
          )}
        </List>
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button size="small" fullWidth sx={{ color: 'text.secondary', textTransform: 'none' }}>
                Xem tất cả thông báo
            </Button>
        </Box>
      </Menu>

      {/* Real-time Toast Popup */}
      <Snackbar 
        open={toastOpen} 
        autoHideDuration={6000} 
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 7 }}
      >
        <Alert 
            onClose={handleToastClose} 
            severity="info" 
            variant="filled"
            icon={<NotificationsActiveIcon />}
            sx={{ 
                width: '100%', 
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: 2,
                bgcolor: '#4834d4'
            }}
            onClick={() => {
                if(lastNotification?.lienKet) window.location.href = lastNotification.lienKet;
                handleToastClose();
            }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">{lastNotification?.tieuDe}</Typography>
            <Typography variant="caption">{lastNotification?.noiDung}</Typography>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
}

