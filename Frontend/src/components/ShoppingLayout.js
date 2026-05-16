import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, InputBase, IconButton, Badge, Divider, CssBaseline, Paper, ClickAwayListener, Menu, MenuItem, Avatar } from '@mui/material';
import { Search as SearchIcon, FavoriteBorder as FavoriteIcon, ShoppingCartOutlined as CartIcon, Person as PersonIcon, CompareArrowsOutlined as CompareIcon, PhoneOutlined, CardGiftcardOutlined, AccountCircleOutlined, ListAltOutlined, LogoutOutlined, AccountBalanceWalletOutlined as AccountBalanceWalletIcon } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import shoppingTheme from '../theme/shoppingTheme';
import authService from '../services/authService';
import productService from '../services/productService';
import customerService from '../services/customerService';
import cartService from '../services/cartService';
import NotificationCenter from './NotificationCenter';

const ShoppingLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popupResults, setPopupResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const openCategoryMenu = Boolean(categoryAnchorEl);
  const openMenu = Boolean(anchorEl);

  const getRankStyle = (rankName) => {
    switch (rankName) {
      case 'Kim Cương': return {
        gradient: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
        label: 'Kim Cương',
        badgeBg: '#00BCD4'
      };
      case 'Vàng': return {
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        label: 'Vàng',
        badgeBg: '#FFA500'
      };
      case 'Bạc': return {
        gradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
        label: 'Bạc',
        badgeBg: '#9E9E9E'
      };
      case 'Đồng':
      default: return {
        gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
        label: 'Đồng',
        badgeBg: '#CD7F32'
      };
    }
  };

  const fetchCartInfo = async () => {
    try {
      const cart = await cartService.getUserCart();
      const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      setCartCount(count);
      setCartTotal(total);
    } catch (err) {
      console.error('Header cart fetch error:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getAllProducts(),
          fetch('http://localhost:5000/api/categories').then(r => r.json()).catch(() => [])
        ]);
        const prods = Array.isArray(productsRes?.data) ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []);
        const cats = Array.isArray(categoriesRes) ? categoriesRes : (Array.isArray(categoriesRes?.data) ? categoriesRes.data : []);

        setAllProducts(prods);
        setCategories(cats);

        // Fetch customer data if authenticated
        const currentUser = authService.getUser();
        if (currentUser && (currentUser.maKhachHang || currentUser.MaKhachHang)) {
          const id = currentUser.maKhachHang || currentUser.MaKhachHang;
          const res = await customerService.getCustomerById(id);
          setCustomer(res.data || res);
        }
      } catch (err) { }
    };
    fetchData();
    fetchCartInfo();

    // Listen for cart changes
    window.addEventListener('cart-updated', fetchCartInfo);
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('cart_')) {
        fetchCartInfo();
      }
    });

    return () => {
      window.removeEventListener('cart-updated', fetchCartInfo);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = allProducts.filter(p =>
        p.tenSP?.toLowerCase().includes(lowerSearch) ||
        p.moTa?.toLowerCase().includes(lowerSearch) ||
        p.tenLoai?.toLowerCase().includes(lowerSearch)
      ).slice(0, 8);
      setPopupResults(filtered);
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [searchTerm, allProducts]);

  const handleSearchCommit = (q) => {
    setShowPopup(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <ThemeProvider theme={shoppingTheme}>
      <CssBaseline />
      <Box className="customer-portal" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'transparent' }}>

        {/* Top Bar */}
        <Box sx={{ bgcolor: '#f4f4f4', py: 0.75, borderBottom: '1px solid #eaeaea' }}>
          <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 4, md: 8, lg: 12 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" onClick={() => navigate('/customer-promotions')} sx={{ cursor: 'pointer', color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}>Mã ưu đãi</Typography>
              <Typography variant="body2" onClick={() => { navigate('/shopping'); window.scrollTo(0, 0); }} sx={{ cursor: 'pointer', color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}>Hệ thống cửa hàng</Typography>
              <Typography variant="body2" onClick={() => navigate('/about')} sx={{ cursor: 'pointer', color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}>Về chúng tôi</Typography>
              <Typography variant="body2" onClick={() => navigate('/contact')} sx={{ cursor: 'pointer', color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}>Liên hệ với chúng tôi</Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, bgcolor: '#e68c55', color: '#fff', px: 2.5, py: 0.5, borderRadius: 999, boxShadow: '0 2px 8px rgba(230,140,85,0.3)' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 1 }}>
                🚚 Miễn phí vận chuyển cho đơn hàng từ 500.000đ
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontWeight: 600 }}>
                <PhoneOutlined sx={{ fontSize: 16, mr: 0.5, color: '#e68c55' }} /> (Hotline) 0934186354
              </Typography>
            </Box>
          </Container>
        </Box>

        {/* Sticky Header Wrapper */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100, // Higher than carousel/banners but lower than Dialog/Menu/Tooltip
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Main Header */}
          <Container maxWidth="xl" sx={{ py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: { xs: 2, md: 3 }, px: { xs: 4, md: 8, lg: 12 } }}>
            {/* Logo */}
            <Box sx={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/shopping')}>
              <Typography variant="h5" sx={{ fontFamily: '"Inter", "Roboto", sans-serif', fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                🏗️ VLXD Thành Đạt
              </Typography>
            </Box>

            {/* Search Bar */}
            <ClickAwayListener onClickAway={() => setShowPopup(false)}>
              <Box sx={{ position: 'relative', width: { xs: '100%', md: '40%', lg: '45%' }, flexGrow: 1, maxWidth: { md: '500px', lg: '650px' }, mx: { xs: 1, md: 3, lg: 4 } }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: '#f1f1f1',
                  borderRadius: '50px',
                  px: 2,
                  py: 0.5,
                  width: '100%',
                  border: '2px solid transparent',
                  transition: 'border 0.2s',
                  '&:hover': { border: '2px solid #e1e1e1' }
                }}>
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  <InputBase
                    placeholder="Tìm kiếm sản phẩm (Nhấn Enter)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { if (searchTerm.trim()) setShowPopup(true); }}
                    sx={{ flex: 1, fontSize: '0.95rem' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchTerm.trim()) {
                        handleSearchCommit(searchTerm.trim());
                      }
                    }}
                  />
                </Box>

                {/* Popup Results */}
                {showPopup && popupResults.length > 0 && (
                  <Paper
                    elevation={6}
                    sx={{
                      position: 'absolute', top: '110%', left: 0, width: '100%',
                      borderRadius: '12px', zIndex: 9999, maxHeight: '400px', overflowY: 'auto',
                      border: '1px solid #eaeaea', bgcolor: '#fff',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                    }}
                  >
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                      {popupResults.map((prod, idx) => (
                        <Box
                          key={idx}
                          onClick={() => {
                            handleSearchCommit(prod.tenSP);
                            setSearchTerm(prod.tenSP);
                          }}
                          sx={{
                            display: 'flex', alignItems: 'center', p: 2, cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0', borderRight: idx % 2 === 0 ? '1px solid #f0f0f0' : 'none',
                            '&:hover': { bgcolor: '#fafafa' }
                          }}
                        >
                          <Box sx={{ width: 60, height: 60, bgcolor: '#f4f4f4', borderRadius: '8px', mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {prod.hinhAnh ? <img src={prod.hinhAnh} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="" /> : <Typography fontSize="10px">No Img</Typography>}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.tenSP}</Typography>
                            <Typography variant="body2" sx={{ color: '#e68c55', fontWeight: 700 }}>
                              ₫{(prod.giaSauKhuyenMai || prod.giaBan || 0).toLocaleString('vi-VN')}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>

            {/* Icons Context */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <IconButton sx={{ bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#eee' } }} onClick={() => navigate('/favorites')}><FavoriteIcon /></IconButton>

              {authService.isAuthenticated() && <NotificationCenter />}

              {authService.isAuthenticated() ? (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', ml: 1, position: 'relative' }}
                  onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
                  onMouseLeave={() => setAnchorEl(null)}
                >
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                      px: 1.5, py: 0.5, borderRadius: '50px', border: '1px solid #eee',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: '#f9f9f9', borderColor: '#e68c55' }
                    }}
                    onClick={() => {
                      const userObj = authService.getUser() || {};
                      const roleStr = (userObj.role || userObj.Role || userObj.roleName || '').toLowerCase();
                      const adminWords = ['admin', 'manager', 'staff', 'nhanvien', 'quanly', 'quản trị', 'quản lý', 'nhân viên', 'kế toán'];
                      if (userObj.employeeId || adminWords.some(w => roleStr.includes(w))) {
                        navigate('/dashboard');
                      } else {
                        navigate('/profile');
                      }
                    }}
                  >
                    {/* Header Avatar with Rank Frame */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', pb: customer?.hangThanhVien ? 0.5 : 0 }}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: '50%', p: '2px',
                        background: getRankStyle(customer?.hangThanhVien).gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Avatar
                          src={customer?.anhDaiDien}
                          sx={{ width: '100%', height: '100%', border: '2px solid #fff', bgcolor: '#f0f0f0' }}
                        >
                          {!customer?.anhDaiDien && <PersonIcon sx={{ fontSize: 20, color: '#e68c55' }} />}
                        </Avatar>
                      </Box>
                      {customer?.hangThanhVien && (
                        <Box sx={{
                          position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                          background: getRankStyle(customer?.hangThanhVien).badgeBg,
                          color: '#fff', fontSize: '9px', fontWeight: 900, px: 1, py: 0.2,
                          borderRadius: '10px', border: '1px solid #fff', zIndex: 10,
                          textTransform: 'uppercase',
                          minWidth: '45px',
                          textAlign: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {getRankStyle(customer?.hangThanhVien).label}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0, whiteSpace: 'nowrap' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1, fontSize: '10px' }}>
                        Xin chào,
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#333', lineHeight: 1.2, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customer?.tenKH || authService.getUser()?.fullName || authService.getUser()?.FullName || authService.getUser()?.username || 'Khách'}
                      </Typography>
                    </Box>
                  </Box>

                  <Menu
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={() => setAnchorEl(null)}
                    MenuListProps={{ onMouseLeave: () => setAnchorEl(null) }}
                    elevation={3}
                    disableScrollLock={true}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{
                      '& .MuiPaper-root': {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: '12px',
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.12))',
                        '&:before': {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          top: 0,
                          right: 28,
                          width: 10,
                          height: 10,
                          bgcolor: 'background.paper',
                          transform: 'translateY(-50%) rotate(45deg)',
                          zIndex: 0,
                        },
                      },
                    }}
                  >
                    <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }} sx={{ py: 1.5, px: 2.5, gap: 1.5 }}>
                      <AccountCircleOutlined fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={500}>Thông tin cá nhân</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/my-orders'); setAnchorEl(null); }} sx={{ py: 1.5, px: 2.5, gap: 1.5 }}>
                      <ListAltOutlined fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={500}>Đơn hàng của tôi</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/my-debts'); setAnchorEl(null); }} sx={{ py: 1.5, px: 2.5, gap: 1.5 }}>
                      <AccountBalanceWalletIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={500}>Quản lý nợ</Typography>
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem
                      onClick={() => {
                        authService.logout();
                        window.location.reload();
                      }}
                      sx={{ py: 1.5, px: 2.5, gap: 1.5, color: 'error.main' }}
                    >
                      <LogoutOutlined fontSize="small" color="error" />
                      <Typography variant="body2" fontWeight={600}>Đăng xuất</Typography>
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', ml: 1, px: 2, py: 1, borderRadius: '50px', '&:hover': { bgcolor: '#f9f9f9' } }}
                  onClick={() => navigate('/auth')}
                >
                  <PersonIcon />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Đăng Ký / Đăng Nhập</Typography>
                </Box>
              )}

              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', ml: 1, bgcolor: '#111', color: '#fff', px: 2, py: 1, borderRadius: '50px', '&:hover': { bgcolor: '#333' } }}
                onClick={() => navigate('/shopping-cart')}
              >
                <Badge badgeContent={cartCount} color="error">
                  <CartIcon sx={{ color: '#fff' }} />
                </Badge>
                <Typography variant="body2" sx={{ fontWeight: 600, ml: 1 }}>₫{cartTotal.toLocaleString('vi-VN')}</Typography>
              </Box>
            </Box>
          </Container>

          <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)' }} />

          {/* Lower Navigation Menu */}
          <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', py: 1.5, px: { xs: 4, md: 8, lg: 12 } }}>
            <Box sx={{ display: 'flex', gap: { xs: 2.5, md: 3.5 }, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography
                variant="body2"
                onClick={() => navigate('/shopping')}
                sx={{
                  fontWeight: location.pathname === '/shopping' ? 700 : 600,
                  color: location.pathname === '/shopping' ? 'primary.main' : 'text.primary',
                  borderBottom: location.pathname === '/shopping' ? '2px solid' : '2px solid transparent',
                  borderColor: location.pathname === '/shopping' ? 'primary.main' : 'transparent',
                  pb: 0.5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  '&:hover': { color: 'primary.main' },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Trang chủ
              </Typography>
              {categories.map((cat, index) => {
                const isCatActive = location.pathname === `/category/${cat.maLoaiSanPham || ''}`;
                return (
                  <Typography
                    key={index}
                    variant="body2"
                    onClick={() => navigate(`/category/${cat.maLoaiSanPham || ''}`)}
                    sx={{
                      fontWeight: isCatActive ? 700 : 600,
                      color: isCatActive ? 'primary.main' : 'text.primary',
                      borderBottom: isCatActive ? '2px solid' : '2px solid transparent',
                      borderColor: isCatActive ? 'primary.main' : 'transparent',
                      pb: 0.5,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      '&:hover': { color: 'primary.main', transform: 'translateY(-1px)' },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {cat.tenLoai}
                  </Typography>
                );
              })}
            </Box>
          </Container>

          <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)' }} />
        </Box>

        {/* Dynamic Content */}
        <Box sx={{ flexGrow: 1 }}>
          {children}
        </Box>

        {/* Footer */}
        <Box sx={{ bgcolor: '#222', color: '#fff', py: 6, mt: 6 }}>
          <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: '"Inter", "Roboto", sans-serif', fontWeight: 700, mb: 2 }}>VLXD Thành Đạt</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                  Chúng tôi cung cấp sự lựa chọn tốt nhất về vật liệu xây dựng và trang trí nội thất với tiêu chuẩn chất lượng cao.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Liên kết hữu ích</Typography>
                <Typography variant="body2" onClick={() => { navigate('/about'); window.scrollTo(0, 0); }} sx={{ color: '#aaa', mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>Về chúng tôi</Typography>
                <Typography variant="body2" onClick={() => { navigate('/contact'); window.scrollTo(0, 0); }} sx={{ color: '#aaa', mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>Liên hệ</Typography>
                <Typography variant="body2" onClick={() => { navigate('/shopping'); window.scrollTo(0, 0); }} sx={{ color: '#aaa', mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>Hệ thống cửa hàng</Typography>
                <Typography variant="body2" onClick={() => { navigate('/news'); window.scrollTo(0, 0); }} sx={{ color: '#aaa', mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>Tin tức</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, fontFamily: '"Inter", "Roboto", sans-serif' }}>Các danh mục</Typography>
                {categories.map((cat, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    onClick={() => navigate(`/category/${cat.maLoaiSanPham || ''}`)}
                    sx={{ color: '#aaa', mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}
                  >
                    {cat.tenLoai}
                  </Typography>
                ))}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Freeship</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                  Miễn phí vận chuyển cho đơn hàng từ 500.000đ
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ShoppingLayout;
