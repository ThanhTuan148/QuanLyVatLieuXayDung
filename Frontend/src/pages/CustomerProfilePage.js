import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, TextField, Button, Avatar, 
  Divider, Skeleton, Snackbar, Alert, IconButton, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  LocationOn as LocationOnIcon,
  Cake as CakeIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  PhotoCamera,
  Security as SecurityIcon,
  Badge as BadgeIcon,
  MilitaryTech as VIPBadgeIcon 
} from '@mui/icons-material';
import authService from '../services/authService';
import customerService from '../services/customerService';

const CustomerProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: Profile, 1: Security, 2: Rank History
  const [tierHistory, setTierHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    ngaySinh: '',
    anhDaiDien: '',
    gioiTinh: 'Nam',
    cccd: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = authService.getUser();
        if (currentUser && (currentUser.maKhachHang || currentUser.MaKhachHang)) {
          const id = currentUser.maKhachHang || currentUser.MaKhachHang;
          const res = await customerService.getCustomerById(id);
          const data = res.data || res;
          setUser(data);
          setFormData({
            hoTen: data.tenKH || '',
            email: data.email || currentUser.email || '',
            soDienThoai: data.sdt || '',
            diaChi: data.diaChi || '',
            ngaySinh: data.ngaySinh ? data.ngaySinh.split('T')[0] : '',
            anhDaiDien: data.anhDaiDien || '',
            gioiTinh: data.gioiTinh || 'Nam',
            cccd: data.cccd || ''
          });
          setAvatarPreview(data.anhDaiDien || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const fetchTierHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const id = user.maKhachHang || user.MaKhachHang;
      const res = await customerService.getTierHistory(id);
      setTierHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching tier history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 2) {
      fetchTierHistory();
    }
  }, [activeTab, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({ open: true, message: 'Chỉ chấp nhận file ảnh (jpg, png, gif, webp)', severity: 'warning' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Kích thước file không vượt quá 2MB', severity: 'warning' });
        return;
      }

      setAvatarPreview(URL.createObjectURL(file));
      try {
        setUploadingAvatar(true);
        const res = await customerService.uploadAvatar(file);
        const imageUrl = res.data?.imageUrl || res.imageUrl;
        if (imageUrl) {
          setFormData(prev => ({ ...prev, anhDaiDien: imageUrl }));
          setSnackbar({ open: true, message: 'Tải ảnh lên thành công', severity: 'success' });
        }
      } catch (err) {
        setSnackbar({ open: true, message: 'Lỗi tải ảnh lên!', severity: 'error' });
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const getRankStyle = (rankName) => {
    switch (rankName) {
      case 'Kim Cương': return { 
        gradient: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 50%, #E0F7FA 100%)', 
        glow: '0 0 25px rgba(0, 188, 212, 0.7), 0 0 10px rgba(255, 255, 255, 0.8)', 
        label: 'Kim Cương',
        badgeBg: 'linear-gradient(135deg, #0288D1 0%, #00BCD4 100%)',
        badgeColor: '#fff',
        border: '6px solid #B3E5FC'
      };
      case 'Vàng': return { 
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFE082 50%, #FFA000 100%)', 
        glow: '0 0 18px rgba(255, 215, 0, 0.5)', 
        label: 'Vàng',
        badgeBg: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
        badgeColor: '#fff',
        border: '5px solid #FFD54F'
      };
      case 'Bạc': return { 
        gradient: 'linear-gradient(135deg, #E0E0E0 0%, #FFFFFF 50%, #9E9E9E 100%)', 
        glow: '0 0 12px rgba(158, 158, 158, 0.3)', 
        label: 'Bạc',
        badgeBg: 'linear-gradient(135deg, #757575 0%, #9E9E9E 100%)',
        badgeColor: '#fff',
        border: '4px solid #E0E0E0'
      };
      case 'Đồng': 
      default: return { 
        gradient: 'linear-gradient(135deg, #8D6E63 0%, #D7CCC8 50%, #5D4037 100%)', 
        glow: 'none', 
        label: 'Đồng',
        badgeBg: 'linear-gradient(135deg, #6D4C41 0%, #8D6E63 100%)',
        badgeColor: '#fff',
        border: '4px solid #A1887F'
      };
    }
  };

  const handleSave = async () => {
    try {
      const id = user.maKhachHang || user.MaKhachHang;
      if (!id) {
        setSnackbar({ open: true, message: 'Thiếu mã khách hàng!', severity: 'warning' });
        return;
      }
      const payload = {
        TenKH: formData.hoTen,
        SDT: formData.soDienThoai,
        Email: formData.email,
        DiaChi: formData.diaChi,
        NgaySinh: formData.ngaySinh || null,
        AnhDaiDien: formData.anhDaiDien,
        GioiTinh: formData.gioiTinh,
        CCCD: formData.cccd,
        TrangThai: user.trangThai ?? true,
        LoaiKH: user.loaiKH,
        NguoiLienHe: user.nguoiLienHe,
        MaSoThue: user.maSoThue
      };
      await customerService.updateCustomer(id, payload);
      
      // Cập nhật lại localStorage để Header và các trang khác thấy thay đổi
      const currentUser = authService.getUser();
      const updatedUser = { 
        ...currentUser, 
        FullName: formData.hoTen, 
        tenKH: formData.hoTen,
        sdt: formData.soDienThoai,
        diaChi: formData.diaChi,
        anhDaiDien: formData.anhDaiDien
      };
      authService.setUser(updatedUser);
      
      // Phát sự kiện để Layout.js nhận biết và cập nhật UI
      window.dispatchEvent(new Event('userUpdated'));
      
      setSnackbar({ open: true, message: 'Cập nhật thông tin thành công!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Lỗi cập nhật thông tin!', severity: 'error' });
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setSnackbar({ open: true, message: 'Vui lòng nhập đầy đủ các trường!', severity: 'warning' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: 'Mật khẩu mới và nhập lại mật khẩu không khớp!', severity: 'warning' });
      return;
    }

    if (newPassword.length < 6) {
      setSnackbar({ open: true, message: 'Mật khẩu mới phải từ 6 ký tự trở lên!', severity: 'warning' });
      return;
    }

    try {
      const currentUser = authService.getUser();
      const id = currentUser?.id || currentUser?.Id;
      if (!id) {
        setSnackbar({ open: true, message: 'Không tìm thấy ID tài khoản!', severity: 'error' });
        return;
      }
      await authService.changePassword(id, oldPassword, newPassword);
      setSnackbar({ open: true, message: 'Đổi mật khẩu thành công!', severity: 'success' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi đổi mật khẩu!';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: '16px' }} />
      </Container>
    );
  }

  const rank = getRankStyle(user?.hangThanhVien);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Left Navigation */}
        <Grid item xs={12} md={3.5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper 
              elevation={0} 
              onClick={() => setActiveTab(0)}
              sx={{ 
                p: 2.5, borderRadius: '12px', cursor: 'pointer', border: '1px solid #eee',
                bgcolor: activeTab === 0 ? '#fff' : 'transparent',
                boxShadow: activeTab === 0 ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#fff' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon sx={{ color: activeTab === 0 ? '#e68c55' : '#777', fontSize: 28 }} />
                <Box>
                  <Typography fontWeight={700} color={activeTab === 0 ? '#e68c55' : '#333'}>Thông Tin Cá Nhân</Typography>
                  <Typography variant="caption" color="text.secondary">Cập nhật thông tin cá nhân và ảnh đại diện của bạn.</Typography>
                </Box>
              </Box>
              {activeTab === 0 && (
                 <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f0f0f0' }}>
                   <Typography variant="body2" sx={{ mb: 1 }}><strong>Email:</strong> {formData.email}</Typography>
                   <Typography variant="body2" sx={{ mb: 1 }}><strong>Vai trò:</strong> Khách Hàng</Typography>
                   <Typography variant="body2"><strong>Loại khách hàng:</strong> <span style={{ color: '#e68c55', fontWeight: 600 }}>{rank.label}</span></Typography>
                 </Box>
              )}
            </Paper>

            {/* Membership Progress Card */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5, borderRadius: '12px', border: '1px solid #eee',
                background: 'linear-gradient(135deg, #fff 0%, #f9f9f9 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VIPBadgeIcon sx={{ color: '#e68c55' }} /> Lộ Trình Thăng Hạng
              </Typography>
              
              {(() => {
                const spending = user?.tongChiTieu || 0;
                let nextTier = "";
                let nextThreshold = 0;
                let prevThreshold = 0;
                
                if (spending < 15000000) {
                  nextTier = "Bạc";
                  nextThreshold = 15000000;
                  prevThreshold = 0;
                } else if (spending < 45000000) {
                  nextTier = "Vàng";
                  nextThreshold = 45000000;
                  prevThreshold = 15000000;
                } else if (spending < 60000000) {
                  nextTier = "Kim Cương";
                  nextThreshold = 60000000;
                  prevThreshold = 45000000;
                }
                
                if (!nextTier) return (
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="primary">Chúc mừng! Bạn đã đạt hạng cao nhất.</Typography>
                    <Typography variant="caption" color="text.secondary">Bạn hiện là thành viên Kim Cương.</Typography>
                  </Box>
                );
                
                const progress = ((spending - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
                const remaining = nextThreshold - spending;
                
                return (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" fontWeight={600}>{user?.hangThanhVien}</Typography>
                      <Typography variant="caption" fontWeight={600}>{nextTier}</Typography>
                    </Box>
                    <Box sx={{ height: 8, bgcolor: '#eee', borderRadius: 4, mb: 1.5, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${progress}%`, bgcolor: '#e68c55', borderRadius: 4, transition: 'width 1s ease-in-out' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Bạn cần chi thêm <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remaining)}</strong> để lên hạng <strong>{nextTier}</strong>.
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontStyle: 'italic', color: '#999', mt: 0.5, display: 'block' }}>
                      (Tiến trình: {Math.floor(progress)}%)
                    </Typography>
                  </Box>
                );
              })()}
            </Paper>

            <Paper 
              elevation={0} 
              onClick={() => setActiveTab(1)}
              sx={{ 
                p: 2.5, borderRadius: '12px', cursor: 'pointer', border: '1px solid #eee',
                bgcolor: activeTab === 1 ? '#fff' : 'transparent',
                boxShadow: activeTab === 1 ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#fff' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SecurityIcon sx={{ color: activeTab === 1 ? '#4caf50' : '#777', fontSize: 28 }} />
                <Box>
                  <Typography fontWeight={700} color={activeTab === 1 ? '#4caf50' : '#333'}>Bảo Mật</Typography>
                  <Typography variant="caption" color="text.secondary">Thay đổi mật khẩu tài khoản của bạn.</Typography>
                </Box>
              </Box>
            </Paper>

            <Paper 
              elevation={0} 
              onClick={() => setActiveTab(2)}
              sx={{ 
                p: 2.5, borderRadius: '12px', cursor: 'pointer', border: '1px solid #eee',
                bgcolor: activeTab === 2 ? '#fff' : 'transparent',
                boxShadow: activeTab === 2 ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#fff' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BadgeIcon sx={{ color: activeTab === 2 ? '#2196f3' : '#777', fontSize: 28 }} />
                <Box>
                  <Typography fontWeight={700} color={activeTab === 2 ? '#2196f3' : '#333'}>Lịch Sử Thăng Hạng</Typography>
                  <Typography variant="caption" color="text.secondary">Theo dõi lộ trình thăng hạng của bạn.</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Right Content */}
        <Grid item xs={12} md={8.5}>
          <Paper elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ bgcolor: '#e68c55', p: 2, px: 3 }}>
              <Typography variant="h6" color="#fff" fontWeight={700}>Cập Nhật Hồ Sơ</Typography>
            </Box>
            
            <Box sx={{ p: 4 }}>
              {activeTab === 0 ? (
                <Box>
                  {/* Avatar Section */}
                  <Box sx={{ mb: 5 }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontWeight: 700 }}>
                      <PhotoCamera fontSize="small" color="primary" /> Ảnh Đại Diện
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Box sx={{ position: 'relative' }}>
                        {/* Rank Frame */}
                        <Box sx={{ 
                          width: 140, height: 140, borderRadius: '50%', p: '6px',
                          background: rank.gradient,
                          boxShadow: rank.glow,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <Avatar 
                            src={avatarPreview}
                            sx={{ width: '100%', height: '100%', border: '4px solid #fff', bgcolor: '#f0f0f0', zIndex: 2 }}
                          >
                            {!avatarPreview && <PersonIcon sx={{ fontSize: 60, color: '#ccc' }} />}
                          </Avatar>
                        </Box>
                        
                        {/* Rank Badge */}
                        <Box sx={{ 
                          position: 'absolute', top: 5, right: 0, 
                          background: rank.badgeBg, color: rank.badgeColor, 
                          fontSize: '11px', fontWeight: 900, px: 1.5, py: 0.4, 
                          borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          zIndex: 10, border: '1.5px solid #fff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '60px'
                        }}>
                          {rank.label}
                        </Box>
                      </Box>
                      
                      <Box>
                        <label htmlFor="avatar-upload">
                          <input accept="image/*" id="avatar-upload" type="file" style={{ display: 'none' }} onChange={handleAvatarChange} />
                          <Button 
                            variant="contained" component="span" startIcon={<PhotoCamera />} disabled={uploadingAvatar}
                            sx={{ borderRadius: '8px', textTransform: 'none', px: 3, bgcolor: '#e68c55', '&:hover': { bgcolor: '#cc7a4a' } }}
                          >
                            {uploadingAvatar ? 'Đang tải...' : 'Đổi ảnh'}
                          </Button>
                        </label>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                          JPG, PNG (tối đa 2MB)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Họ và Tên *</Typography>
                      <TextField 
                        fullWidth name="hoTen" value={formData.hoTen} onChange={handleInputChange} 
                        variant="outlined" size="medium" placeholder="Khánh Vy"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Số điện thoại *</Typography>
                      <TextField 
                        fullWidth name="soDienThoai" value={formData.soDienThoai} onChange={handleInputChange} 
                        variant="outlined" size="medium" placeholder="0981212121"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Địa chỉ *</Typography>
                      <TextField 
                        fullWidth name="diaChi" value={formData.diaChi} onChange={handleInputChange} 
                        variant="outlined" size="medium" multiline rows={3} placeholder="Trung Thành, Yên Thành, Nghệ An"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Ngày sinh *</Typography>
                      <TextField 
                        fullWidth name="ngaySinh" type="date" value={formData.ngaySinh} onChange={handleInputChange} 
                        variant="outlined" size="medium" InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Giới tính *</Typography>
                      <FormControl fullWidth variant="outlined" size="medium" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                        <Select name="gioiTinh" value={formData.gioiTinh} onChange={handleInputChange}>
                          <MenuItem value="Nam">Nam</MenuItem>
                          <MenuItem value="Nữ">Nữ</MenuItem>
                          <MenuItem value="Khác">Khác</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>CCCD *</Typography>
                      <TextField 
                        fullWidth name="cccd" value={formData.cccd} onChange={handleInputChange} 
                        variant="outlined" size="medium" placeholder="01281212121"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sx={{ mt: 3 }}>
                      <Button 
                        fullWidth variant="contained" onClick={handleSave}
                        sx={{ 
                          py: 1.5, borderRadius: '8px', bgcolor: '#e68c55', fontWeight: 700,
                          textTransform: 'none', fontSize: '1rem',
                          '&:hover': { bgcolor: '#cc7a4a' }
                        }}
                      >
                        Lưu Thay Đổi
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : activeTab === 1 ? (
                <Box component="form" onSubmit={handlePasswordSubmit}>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 4 }}>Đổi mật khẩu</Typography>
                  <Grid container spacing={3} maxWidth="500px">
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Mật khẩu hiện tại *</Typography>
                      <TextField 
                        fullWidth name="oldPassword" type="password" value={passwordData.oldPassword} onChange={handlePasswordInputChange} 
                        variant="outlined" size="medium" placeholder="••••••••"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Mật khẩu mới *</Typography>
                      <TextField 
                        fullWidth name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordInputChange} 
                        variant="outlined" size="medium" placeholder="••••••••"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Nhập lại mật khẩu mới *</Typography>
                      <TextField 
                        fullWidth name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} 
                        variant="outlined" size="medium" placeholder="••••••••"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sx={{ mt: 3 }}>
                      <Button 
                        fullWidth type="submit" variant="contained"
                        sx={{ 
                          py: 1.5, borderRadius: '8px', bgcolor: '#e68c55', fontWeight: 700,
                          textTransform: 'none', fontSize: '1rem',
                          '&:hover': { bgcolor: '#cc7a4a' }
                        }}
                      >
                        Đổi mật khẩu
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 4 }}>Lịch Sử Thăng Hạng</Typography>
                  
                  {loadingHistory ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: '12px' }} />)}
                    </Box>
                  ) : tierHistory.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {tierHistory.map((item, idx) => (
                        <Paper 
                          key={idx} 
                          elevation={0} 
                          sx={{ 
                            p: 3, borderRadius: '12px', border: '1px solid #eee',
                            display: 'flex', gap: 3, alignItems: 'center',
                            bgcolor: '#fcfcfc',
                            '&:hover': { bgcolor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                          }}
                        >
                          <Box sx={{ 
                            width: 60, height: 60, borderRadius: '50%', 
                            background: getRankStyle(item.hangMoi).gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 900, fontSize: '0.8rem', textAlign: 'center'
                          }}>
                            {item.hangMoi}
                          </Box>
                          
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">{item.hangCu}</Typography>
                              <Typography variant="body2" color="text.secondary">→</Typography>
                              <Typography variant="body1" fontWeight={700} color="primary.main">{item.hangMoi}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>{item.lyDo}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                Ngày: {new Date(item.ngayThayDoi).toLocaleString('vi-VN')}
                              </Typography>
                              <Typography variant="caption" fontWeight={600} color="success.main">
                                Chi tiêu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.tongChiTieuHienTai)}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <BadgeIcon sx={{ fontSize: 60, color: '#eee', mb: 2 }} />
                      <Typography color="text.secondary">Bạn chưa có lịch sử thăng hạng nào.</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '8px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomerProfilePage;
