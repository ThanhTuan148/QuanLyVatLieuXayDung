import React, { useState } from 'react';
import {
  AppBar, Toolbar, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Typography,
  Avatar, Divider, Button, Menu, MenuItem, IconButton, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import Email from '@mui/icons-material/Email';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import authService from '../services/authService';
import { usePermissions } from '../contexts/PermissionContext';
import NotificationCenter from './NotificationCenter';

const drawerWidth = 280;

function Layout({ children }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const { permissions, loading } = usePermissions();
  const [user, setUser] = useState(authService.getUser() || {});

  // Lắng nghe sự kiện cập nhật thông tin người dùng
  React.useEffect(() => {
    const handleUserUpdate = () => {
      setUser(authService.getUser() || {});
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  const menuItems = [
    { text: '📊 Tổng quan', icon: <DashboardIcon />, path: '/dashboard', moduleKey: 'dashboard' },
    { text: '📦 Sản Phẩm', icon: <CategoryIcon />, path: '/products', moduleKey: 'products' },
    { text: '🛒 Đơn Hàng', icon: <ShoppingCartIcon />, path: '/orders', moduleKey: 'orders' },

    { text: '👥 Khách Hàng', icon: <PeopleIcon />, path: '/customers', moduleKey: 'customers' },
    { text: '🏪 Nhà Cung Cấp', icon: <ManageAccountsIcon />, path: '/suppliers', moduleKey: 'suppliers' },
    { text: '🏷️ Khuyến Mãi', icon: <LocalOfferIcon />, path: '/promotions', moduleKey: 'promotions' },
    { text: '📥 Nhập Hàng', icon: <AddShoppingCartIcon />, path: '/procurement', moduleKey: 'inventory' },
    { text: '🔄 Đổi / Trả', icon: <CompareArrowsIcon />, path: '/returns', moduleKey: 'inventory' },
    { text: '📊 Kho Hàng', icon: <StorageIcon />, path: '/inventory', moduleKey: 'inventory' },
    { text: '📈 Lịch Sử Giá', icon: <StorageIcon />, path: '/price-history', moduleKey: 'inventory' },
    { text: '🚚 Giao Hàng', icon: <LocalShippingIcon />, path: '/deliveries', moduleKey: 'orders' },
    { text: '💳 Công Nợ', icon: <AccountBalanceWalletIcon />, path: '/debts', moduleKey: 'dashboard' },
    { text: '📈 Báo Cáo', icon: <BarChartIcon />, path: '/reports', moduleKey: 'dashboard' },
    { text: '📧 Tin nhắn', icon: <Email />, path: '/contact-messages', moduleKey: 'dashboard' },
    { text: '💬 Chat trực tuyến', icon: <Email />, path: '/admin-chat', moduleKey: 'dashboard' },

    { text: '👨‍💼 Nhân Viên', icon: <ManageAccountsIcon />, path: '/employees', moduleKey: 'employees' },
    { text: '⚙️ Cài Đặt', icon: <SettingsIcon />, path: '/settings', moduleKey: 'settings' },
  ];

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/shopping';
  };

  const roleStr = String(user?.role || user?.Role || user?.roleName || '').trim().toLowerCase();
  const isTaiXe = roleStr.includes('tài xế');
  const isSysAdmin = roleStr.includes('admin') || roleStr.includes('quản trị');
  const isHighManager = roleStr.includes('quản lý') || roleStr.includes('giám đốc');
  const isQuanLy = isHighManager || isSysAdmin;

  const filteredMenuItems = menuItems.filter(item => {
    // === Admin hệ thống: chỉ được 3 mục cố định, KHÔNG được xem gì khác ===
    if (isSysAdmin) {
      return ['/customers', '/employees', '/settings'].includes(item.path);
    }

    // Chỉ Quản Lý/Giám Đốc mới xem được Tổng quan và Báo cáo
    if (['/dashboard', '/reports'].includes(item.path) && !isHighManager) return false;

    if (isTaiXe) {
      return ['/deliveries', '/inventory', '/settings'].includes(item.path);
    }

    // Dashboard và Reports luôn hiển thị nếu đã vượt qua check isHighManager ở trên
    if (['/dashboard', '/reports'].includes(item.path)) return true;

    // Cài đặt: Kiểm tra quyền 'settings' hoặc là Quản lý/Giám đốc
    if (item.path === '/settings') return permissions?.['settings']?.coTheXem || isHighManager;

    if (!permissions) return false;

    let mKey = item.moduleKey;
    if (item.path === '/debts') mKey = 'customers';

    return permissions[mKey] ? permissions[mKey].coTheXem : false;
  });




  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box sx={{ fontSize: '1.5rem', mr: 2 }}>🏗️</Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 'bold',
                letterSpacing: 0.5,
              }}
            >
              Quản Lý Vật Liệu Xây Dựng
            </Typography>
          </Box>
          <NotificationCenter />
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Đăng Xuất
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            marginTop: '64px',
            height: 'calc(100% - 64px)',
            background: '#ffffff',
            borderRight: '1px solid #ebedf2',
            display: 'flex',
            flexDirection: 'column'
          },
        }}
      >
        {/* Sidebar Header */}
        <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid #dee2e6', flexShrink: 0 }}>
          <Avatar
            sx={{
              width: 60, height: 60, margin: '0 auto', mb: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: '1.5rem',
            }}
          >
            {user?.FullName ? user.FullName.charAt(0).toUpperCase() : '👨‍💼'}
          </Avatar>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {user?.FullName || user?.username || 'Nhân Viên'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {user?.roleName || user?.role || 'Quản trị viên'}
          </Typography>
        </Box>

        {/* Menu Items */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, pt: 1 }}>
          <List disablePadding>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              filteredMenuItems.map((item, index) => (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mb: 0.5,
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#667eea' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>

        {/* Sidebar Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid #dee2e6', flexShrink: 0, background: '#fff' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderColor: '#764ba2',
              color: '#764ba2',
              '&:hover': {
                background: 'rgba(118, 75, 162, 0.1)',
              },
            }}
          >
            Đăng Xuất
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginTop: '64px',
          p: 3,
          background: '#f5f6fa',
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
