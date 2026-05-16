import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, TextField, Button, Grid, Alert,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Link, Checkbox, FormControlLabel, InputAdornment, IconButton, Divider, LinearProgress, Stack, Chip
} from '@mui/material';
import { 
  Visibility, VisibilityOff, Google, GitHub, Facebook, 
  CheckCircleOutline, LockReset, EmailOutlined, PersonOutline, 
  PhoneOutlined, ArrowBack, VerifiedUserOutlined, ShieldOutlined,
  SpeedOutlined, AutoGraphOutlined
} from '@mui/icons-material';
import authService from '../services/authService';
import api from '../services/api';
import storageHelper from '../services/storageHelper';

const CustomerAuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('login'); // 'login' hoặc 'register'

  // ---- Login state ----
  const [loginData, setLoginData] = useState({ username: '', password: '', remember: false });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ---- Register state ----
  const [registerData, setRegisterData] = useState({
    username: '', fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: ''
  });
  const [registerMsg, setRegisterMsg] = useState({ type: '', text: '' });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // ---- Forgot Password state ----
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ otp: '', newPass: '', confirmPass: '' });
  const [resetMsg, setResetMsg] = useState({ type: '', text: '' });

  // ---- Password Strength Indicator ----
  const calculateStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#94a3b8' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.match(/[a-z]+/)) score += 25;
    if (pass.match(/[A-Z]+/)) score += 25;
    if (pass.match(/[0-9]+/) || pass.match(/[$@#&!]+/)) score += 25;
    
    if (score <= 25) return { score, label: 'Yếu', color: '#ef4444' };
    if (score <= 50) return { score, label: 'Trung bình', color: '#f59e0b' };
    if (score <= 75) return { score, label: 'Mạnh', color: '#3b82f6' };
    return { score, label: 'Cực mạnh', color: '#10b981' };
  };

  const passStrength = calculateStrength(registerData.password);

  const switchView = (v) => {
    setView(v);
    setLoginError('');
    setRegisterMsg({ type: '', text: '' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) { 
      setLoginError('Vui lòng nhập đầy đủ thông tin.'); 
      return; 
    }
    setLoginLoading(true); 
    setLoginError('');
    try {
      const response = await authService.login(loginData.username, loginData.password);
      const userData = response.data;
      authService.setUser(userData);
      authService.setToken(`token_${userData.id}_${Date.now()}`);
      
      const realId = userData.maKhachHang || userData.MaKhachHang || userData.id;
      if (realId) {
        storageHelper.mergeGuestData(realId);
      }

      setLoginSuccess(true);
      setTimeout(() => {
        const roleStr = (userData.role || userData.Role || userData.roleName || '').toLowerCase();
        const adminWords = ['admin', 'manager', 'staff', 'nhanvien', 'quanly', 'quản trị', 'quản lý', 'nhân viên', 'kế toán'];
        if (userData.employeeId || adminWords.some(w => roleStr.includes(w))) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = location.state?.returnUrl || '/shopping';
        }
      }, 1500);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, fullName, email, phoneNumber, password, confirmPassword } = registerData;
    if (!username || !fullName || !email || !phoneNumber || !password || !confirmPassword) {
      setRegisterMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin.' }); 
      return;
    }
    if (password !== confirmPassword) { 
      setRegisterMsg({ type: 'error', text: 'Mật khẩu không khớp.' }); 
      return; 
    }
    setRegisterLoading(true); 
    setRegisterMsg({ type: '', text: '' });
    try {
      const response = await api.post('/auth/register', registerData);
      setRegisterSuccess(true);
      setRegisterMsg({ type: 'success', text: response.data?.message || 'Đăng ký thành công!' });
      setTimeout(() => { 
        setRegisterSuccess(false);
        setRegisterData({ username: '', fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
        switchView('login'); 
      }, 2000);
    } catch (err) {
      setRegisterMsg({ type: 'error', text: err.response?.data?.message || 'Đăng ký thất bại. Tên đăng nhập hoặc email đã tồn tại.' });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!forgotUser) return setForgotMsg({ type: 'error', text: 'Vui lòng nhập Username hoặc Email' });
    setIsProcessing(true); setForgotMsg({ type: '', text: '' });
    try {
      const res = await api.post('/auth/forgot-password', { username: forgotUser });
      setForgotMsg({ type: 'success', text: res.data.message || 'Mã OTP đã gửi thành công!' });
      setTimeout(() => { setForgotOpen(false); setResetOpen(true); setResetForm({ ...resetForm, otp: '' }); }, 2000);
    } catch (e) {
      setForgotMsg({ type: 'error', text: e.response?.data?.message || 'Lỗi gửi yêu cầu.' });
    } finally { setIsProcessing(false); }
  };

  const handleResetPassword = async () => {
    if (!resetForm.otp || !resetForm.newPass) return setResetMsg({ type: 'error', text: 'Nhập đủ thông tin.' });
    if (resetForm.newPass !== resetForm.confirmPass) return setResetMsg({ type: 'error', text: 'Mật khẩu không khớp.' });
    setIsProcessing(true); setResetMsg({ type: '', text: '' });
    try {
      await api.post('/auth/reset-password', { username: forgotUser, otp: resetForm.otp, newPassword: resetForm.newPass });
      setForgotUser(''); setResetForm({ otp: '', newPass: '', confirmPass: '' });
      setResetOpen(false); setLoginError('');
      alert('Đổi mật khẩu thành công! Hãy đăng nhập lại.');
    } catch (e) {
      setResetMsg({ type: 'error', text: e.response?.data?.message || 'Đặt lại mật khẩu thất bại.' });
    } finally { setIsProcessing(false); }
  };

  // ---- Shared Futuristic Styles (Light Mode Adapted) ----
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#fff',
      borderRadius: '16px',
      color: '#222',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      '& fieldset': { 
        borderColor: '#e0ddd8',
        borderWidth: '1px',
        transition: 'all 0.3s'
      },
      '&:hover fieldset': {
        borderColor: '#b4c4b8',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#f29b46',
        borderWidth: '2px',
      },
      '& fieldset legend': {
        display: 'none',
      },
      '& input:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 1000px #fff inset !important',
        WebkitTextFillColor: '#222 !important',
        borderRadius: '0px',
      },
      '& input': { py: 1.8, px: 2.5, fontSize: '0.95rem', color: '#222' }
    }
  };

  const primaryBtnSx = {
    background: 'linear-gradient(135deg, #f29b46 0%, #e68a35 50%, #f29b46 100%)',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 5s ease infinite',
    color: '#fff',
    py: 2,
    borderRadius: '16px',
    fontWeight: 700,
    fontSize: '1rem',
    textTransform: 'none',
    boxShadow: '0 8px 20px rgba(242, 155, 70, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': {
      transform: 'translateY(-2px) scale(1.01)',
      boxShadow: '0 12px 25px rgba(242, 155, 70, 0.45)',
    },
    '&:active': {
      transform: 'translateY(1px) scale(0.98)',
    }
  };

  const socialBtnSx = {
    bgcolor: '#fff',
    color: '#444',
    py: 1.5,
    borderRadius: '14px',
    border: '1px solid #e0ddd8',
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.3s',
    '&:hover': { 
      bgcolor: '#f8f7f4', 
      borderColor: '#b4c4b8',
      transform: 'translateY(-1px)',
      boxShadow: '0 5px 15px rgba(0,0,0,0.06)'
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f8f7f4', 
      color: '#222',
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: { xs: 4, md: 8 },
      px: { xs: 2, md: 4 }
    }}>
      {/* KEYFRAME ANIMATIONS INJECTED */}
      <style>{`
        @keyframes floatBlob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -60px) scale(1.2); }
        }
        @keyframes floatBlob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-60px, 60px) scale(1.15); }
        }
        @keyframes particleFloat {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes cardEntrance {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08), 0 0 30px rgba(242, 155, 70, 0.2); }
          50% { box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12), 0 0 60px rgba(242, 155, 70, 0.4); }
        }
        @keyframes checkmarkDraw {
          0% { stroke-dashoffset: 100; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes floatIllustration {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }
        @keyframes floatWidget1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-12px) translateX(8px); }
        }
        @keyframes floatWidget2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(15px) translateX(-10px); }
        }
      `}</style>

      {/* BACKGROUND ANIMATED GRADIENT BLOBS */}
      <Box sx={{
        position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(180, 196, 184, 0.4) 0%, rgba(248, 247, 244, 0) 70%)',
        filter: 'blur(80px)', animation: 'floatBlob1 20s ease infinite', zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '60vw', height: '60vw',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(242, 155, 70, 0.25) 0%, rgba(248, 247, 244, 0) 70%)',
        filter: 'blur(80px)', animation: 'floatBlob2 18s ease infinite', zIndex: 0
      }} />

      {/* FLOATING PARTICLES */}
      {[...Array(15)].map((_, i) => (
        <Box key={i} sx={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 4 + 2}px`,
          height: `${Math.random() * 4 + 2}px`,
          bgcolor: i % 2 === 0 ? '#b4c4b8' : '#f29b46',
          borderRadius: '50%',
          boxShadow: `0 0 10px ${i % 2 === 0 ? '#b4c4b8' : '#f29b46'}`,
          animation: `particleFloat ${Math.random() * 15 + 10}s linear infinite`,
          animationDelay: `${Math.random() * 5}s`,
          zIndex: 0
        }} />
      ))}

      {/* MAIN CONTENT CONTAINER */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={8} alignItems="center">
          
          {/* LEFT SIDE: FUTURISTIC ILLUSTRATION (DESKTOP ONLY) */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ pr: 4 }}>
              <Button 
                startIcon={<ArrowBack />} 
                onClick={() => navigate('/shopping')}
                sx={{ 
                  color: '#666', mb: 6, textTransform: 'none', fontSize: '1rem',
                  '&:hover': { color: '#222', bgcolor: 'rgba(0,0,0,0.04)' }
                }}
              >
                Quay lại Trang chủ
              </Button>

              <Typography variant="h1" sx={{ 
                fontWeight: 900, fontSize: '3.5rem', lineHeight: 1.1, mb: 3,
                color: '#222',
                letterSpacing: '-1px'
              }}>
                Nền tảng Vật liệu <br />
                <Typography component="span" sx={{ 
                  fontWeight: 900, fontSize: '3.5rem',
                  background: 'linear-gradient(135deg, #f29b46, #e68a35, #b4c4b8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Thế hệ mới.
                </Typography>
              </Typography>

              <Typography sx={{ color: '#555', fontSize: '1.1rem', lineHeight: 1.7, mb: 6, maxWidth: '480px' }}>
                Trải nghiệm hệ sinh thái quản lý và mua sắm vật liệu xây dựng thông minh với công nghệ tự động hóa và bảo mật tối đa.
              </Typography>

              {/* FLOATING PARALLAX WIDGETS */}
              <Box sx={{ position: 'relative', height: '320px', width: '100%' }}>
                {/* Main Dashboard Mock */}
                <Box sx={{ 
                  position: 'absolute', top: 0, left: 0, width: '85%', height: '240px',
                  bgcolor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(224, 221, 216, 0.8)', borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.06)', p: 3,
                  animation: 'floatIllustration 8s ease-in-out infinite'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
                    </Box>
                    <Chip label="AI Powered" size="small" sx={{ bgcolor: 'rgba(242,155,70,0.15)', color: '#f29b46', fontWeight: 700, border: '1px solid rgba(242,155,70,0.3)' }} />
                  </Box>
                  <Stack spacing={2.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#777' }}>Tổng doanh thu dự kiến</Typography>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#222' }}>2,450,800,000 đ</Typography>
                      </Box>
                      <AutoGraphOutlined sx={{ fontSize: 36, color: '#f29b46' }} />
                    </Box>
                    <LinearProgress variant="determinate" value={78} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(242,155,70,0.15)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #f29b46, #e68a35)' } }} />
                  </Stack>
                </Box>

                {/* Floating Widget 1 */}
                <Box sx={{ 
                  position: 'absolute', top: 160, right: 0, width: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(25px)',
                  border: '1px solid rgba(180, 196, 184, 0.8)', borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.06)', p: 2.5,
                  animation: 'floatWidget1 6s ease-in-out infinite'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(180,196,184,0.25)', borderRadius: '12px', color: '#57735d' }}>
                      <SpeedOutlined sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', color: '#777' }}>Tốc độ xử lý</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#222' }}>99.98% SLA</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Floating Widget 2 */}
                <Box sx={{ 
                  position: 'absolute', bottom: -20, left: 30, width: '55%',
                  bgcolor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(25px)',
                  border: '1px solid rgba(242, 155, 70, 0.4)', borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.06)', p: 2.5,
                  animation: 'floatWidget2 7s ease-in-out infinite'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(242,155,70,0.15)', borderRadius: '12px', color: '#f29b46' }}>
                      <ShieldOutlined sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', color: '#777' }}>Bảo mật dữ liệu</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#222' }}>AES-256 Bit</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* RIGHT SIDE: AUTHENTICATION CARD (GLASSMORPHISM) */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(25px)',
                border: '1px solid rgba(224, 221, 216, 0.9)',
                borderRadius: '28px',
                boxShadow: loginSuccess || registerSuccess 
                  ? '0 20px 50px rgba(34, 197, 94, 0.25), 0 0 60px rgba(34, 197, 94, 0.4)' 
                  : '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 40px rgba(242, 155, 70, 0.15)',
                p: { xs: 3, sm: 5 },
                maxWidth: '480px',
                width: '100%',
                animation: loginError ? 'shake 0.5s' : (loginSuccess || registerSuccess ? 'pulseGlow 1.5s infinite' : 'cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'),
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
              }}>

                {/* SUCCESS OVERLAY */}
                {(loginSuccess || registerSuccess) && (
                  <Box sx={{
                    position: 'absolute', inset: 0, bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)', borderRadius: '28px', zIndex: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.3s forwards'
                  }}>
                    <Box sx={{ mb: 3 }}>
                      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="48" cy="48" r="40" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />
                        <path d="M32 48L44 60L66 36" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" 
                          style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'checkmarkDraw 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} 
                        />
                      </svg>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#222', mb: 1 }}>
                      {loginSuccess ? 'Đăng nhập thành công!' : 'Đăng ký thành công!'}
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: '0.95rem' }}>
                      {loginSuccess ? 'Đang chuyển hướng đến hệ thống...' : 'Đang chuyển sang trang đăng nhập...'}
                    </Typography>
                  </Box>
                )}

                {/* MOBILE BACK BUTTON */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-start', mb: 3 }}>
                  <Button startIcon={<ArrowBack />} onClick={() => navigate('/shopping')} sx={{ color: '#666', textTransform: 'none' }}>
                    Trang chủ
                  </Button>
                </Box>

                {/* ANIMATED TABS */}
                <Box sx={{
                  bgcolor: 'rgba(240, 237, 232, 0.8)', p: 0.75, borderRadius: '20px',
                  display: 'flex', position: 'relative', mb: 4,
                  border: '1px solid #e0ddd8'
                }}>
                  {/* Sliding Indicator */}
                  <Box sx={{
                    position: 'absolute', top: 6, bottom: 6, width: 'calc(50% - 6px)',
                    left: view === 'login' ? 6 : 'calc(50%)',
                    background: 'linear-gradient(135deg, #f29b46, #e68a35)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(242, 155, 70, 0.3)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} />

                  <Button
                    fullWidth onClick={() => switchView('login')}
                    sx={{
                      py: 1.5, fontWeight: 700, fontSize: '0.95rem', textTransform: 'none',
                      color: view === 'login' ? '#fff' : '#777', zIndex: 1,
                      transition: 'color 0.3s'
                    }}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    fullWidth onClick={() => switchView('register')}
                    sx={{
                      py: 1.5, fontWeight: 700, fontSize: '0.95rem', textTransform: 'none',
                      color: view === 'register' ? '#fff' : '#777', zIndex: 1,
                      transition: 'color 0.3s'
                    }}
                  >
                    Đăng ký
                  </Button>
                </Box>

                {/* FORM SLIDING CONTAINER */}
                <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: view === 'login' ? '450px' : '820px', pb: 3, transition: 'min-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  
                  {/* ========== LOGIN FORM ========== */}
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%',
                    transform: view === 'login' ? 'translateX(0)' : 'translateX(-120%)',
                    opacity: view === 'login' ? 1 : 0,
                    pointerEvents: view === 'login' ? 'auto' : 'none',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>
                    <Box component="form" onSubmit={handleLogin}>
                      {loginError && (
                        <Alert severity="error" sx={{ mb: 2.5, bgcolor: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px' }}>
                          {loginError}
                        </Alert>
                      )}

                      <Stack spacing={2} sx={{ mb: 2.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 0.5, ml: 0.5, textAlign: 'left' }}>
                            Tên đăng nhập hoặc Email *
                          </Typography>
                          <TextField fullWidth placeholder="Nhập tên đăng nhập hoặc email..." variant="outlined" sx={inputSx}
                            value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                            InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#888' }} /></InputAdornment> }} 
                          />
                        </Box>

                        <Box>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 0.5, ml: 0.5, textAlign: 'left' }}>
                            Mật khẩu *
                          </Typography>
                          <TextField fullWidth placeholder="Nhập mật khẩu..." type={showLoginPassword ? 'text' : 'password'} variant="outlined" sx={inputSx}
                            value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><ShieldOutlined sx={{ color: '#888' }} /></InputAdornment>,
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => setShowLoginPassword(!showLoginPassword)} edge="end" sx={{ color: '#888', transition: 'transform 0.3s', '&:hover': { transform: 'rotate(15deg)', color: '#222' } }}>
                                    {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }} 
                          />
                        </Box>
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                        <FormControlLabel
                          control={<Checkbox size="small" sx={{ color: '#777', '&.Mui-checked': { color: '#f29b46' } }} checked={loginData.remember} onChange={e => setLoginData({ ...loginData, remember: e.target.checked })} />}
                          label={<Typography sx={{ fontSize: '0.9rem', color: '#777' }}>Ghi nhớ tài khoản</Typography>}
                        />
                        <Link component="button" type="button" sx={{ color: '#f29b46', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.3s', '&:hover': { color: '#e68a35', textDecoration: 'underline' } }} onClick={() => setForgotOpen(true)}>
                          Quên mật khẩu?
                        </Link>
                      </Box>

                      <Button fullWidth type="submit" disabled={loginLoading} sx={{ ...primaryBtnSx, mb: 2.5 }}>
                        {loginLoading ? <CircularProgress size={26} sx={{ color: '#fff' }} /> : 'Đăng nhập vào Hệ thống'}
                      </Button>

                      {/* SOCIAL LOGIN */}
                      <Divider sx={{ my: 2, borderColor: '#e0ddd8', '&::before, &::after': { borderColor: '#e0ddd8' } }}>
                        <Typography sx={{ color: '#777', fontSize: '0.85rem' }}>Hoặc đăng nhập với</Typography>
                      </Divider>

                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Button fullWidth sx={socialBtnSx}>
                            <Google sx={{ color: '#ea4335' }} />
                          </Button>
                        </Grid>
                        <Grid item xs={4}>
                          <Button fullWidth sx={socialBtnSx}>
                            <GitHub sx={{ color: '#333' }} />
                          </Button>
                        </Grid>
                        <Grid item xs={4}>
                          <Button fullWidth sx={socialBtnSx}>
                            <Facebook sx={{ color: '#1877f2' }} />
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  {/* ========== REGISTER FORM ========== */}
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%',
                    transform: view === 'register' ? 'translateX(0)' : 'translateX(120%)',
                    opacity: view === 'register' ? 1 : 0,
                    pointerEvents: view === 'register' ? 'auto' : 'none',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>
                    <Box component="form" onSubmit={handleRegister}>
                      {registerMsg.text && (
                        <Alert severity={registerMsg.type} sx={{ mb: 2.5, bgcolor: registerMsg.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: registerMsg.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${registerMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '16px' }}>
                          {registerMsg.text}
                        </Alert>
                      )}

                      <Grid container spacing={2} sx={{ mb: 2.5 }}>
                        <Grid item xs={12}>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 0.5, ml: 0.5, textAlign: 'left' }}>
                              Tên đăng nhập *
                            </Typography>
                            <TextField fullWidth placeholder="Nhập tên đăng nhập..." variant="outlined" sx={inputSx}
                              value={registerData.username} onChange={e => setRegisterData({ ...registerData, username: e.target.value })}
                              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#888' }} /></InputAdornment> }} 
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 0.5, ml: 0.5, textAlign: 'left' }}>
                              Họ và tên *
                            </Typography>
                            <TextField fullWidth placeholder="Nhập họ và tên..." variant="outlined" sx={inputSx}
                              value={registerData.fullName} onChange={e => setRegisterData({ ...registerData, fullName: e.target.value })}
                              InputProps={{ startAdornment: <InputAdornment position="start"><VerifiedUserOutlined sx={{ color: '#888' }} /></InputAdornment> }} 
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 0.5, ml: 0.5, textAlign: 'left' }}>
                              Email *
                            </Typography>
                            <TextField fullWidth placeholder="Nhập email..." variant="outlined" sx={inputSx}
                              value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                              InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: '#888' }} /></InputAdornment> }} 
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 0.5, ml: 0.5, textAlign: 'left' }}>
                              Số điện thoại *
                            </Typography>
                            <TextField fullWidth placeholder="Nhập số điện thoại..." variant="outlined" sx={inputSx}
                              value={registerData.phoneNumber} onChange={e => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ color: '#888' }} /></InputAdornment> }} 
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 0.5, ml: 0.5, textAlign: 'left' }}>
                              Mật khẩu *
                            </Typography>
                            <TextField fullWidth placeholder="Nhập mật khẩu..." type={showRegPassword ? 'text' : 'password'} variant="outlined" sx={inputSx}
                              value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                              InputProps={{
                                startAdornment: <InputAdornment position="start"><ShieldOutlined sx={{ color: '#888' }} /></InputAdornment>,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowRegPassword(!showRegPassword)} edge="end" sx={{ color: '#888' }}>
                                      {showRegPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </InputAdornment>
                                )
                              }} 
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 0.5, ml: 0.5, textAlign: 'left' }}>
                              Xác nhận mật khẩu *
                            </Typography>
                            <TextField fullWidth placeholder="Nhập lại mật khẩu..." type={showRegConfirm ? 'text' : 'password'} variant="outlined" sx={inputSx}
                              value={registerData.confirmPassword} onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                              InputProps={{
                                startAdornment: <InputAdornment position="start"><ShieldOutlined sx={{ color: '#888' }} /></InputAdornment>,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowRegConfirm(!showRegConfirm)} edge="end" sx={{ color: '#888' }}>
                                      {showRegConfirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </InputAdornment>
                                )
                              }} 
                            />
                          </Box>
                        </Grid>
                        {/* PASSWORD STRENGTH METER */}
                        {registerData.password && (
                          <Grid item xs={12}>
                            <Box sx={{ mt: 0.5, px: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography sx={{ fontSize: '0.8rem', color: '#777' }}>Độ bảo mật mật khẩu:</Typography>
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: passStrength.color }}>{passStrength.label}</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={passStrength.score} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { bgcolor: passStrength.color, transition: 'all 0.3s' } }} />
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      <Button fullWidth type="submit" disabled={registerLoading} sx={primaryBtnSx}>
                        {registerLoading ? <CircularProgress size={26} sx={{ color: '#fff' }} /> : 'Tạo Tài khoản mới'}
                      </Button>
                    </Box>
                  </Box>

                </Box>
              </Box>
            </Box>
          </Grid>

        </Grid>
      </Container>

      {/* ---- Forgot Password Dialog ---- */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#fff', color: '#222', border: '1px solid #e0ddd8', borderRadius: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' } }}>
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pb: 1 }}>KHÔI PHỤC MẬT KHẨU</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#666', fontSize: '0.9rem', textAlign: 'center', mb: 3 }}>
            Nhập tên đăng nhập hoặc email của bạn để nhận mã xác thực OTP.
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 1, ml: 0.5, textAlign: 'left' }}>
              Username hoặc Email *
            </Typography>
            <TextField fullWidth placeholder="Nhập username hoặc email..." variant="outlined" sx={inputSx}
              value={forgotUser} onChange={(e) => setForgotUser(e.target.value)} />
          </Box>
          {forgotMsg.text && <Alert severity={forgotMsg.type} sx={{ mt: 3, bgcolor: forgotMsg.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: forgotMsg.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${forgotMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '16px' }}>{forgotMsg.text}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 4, pt: 0, justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setForgotOpen(false)} sx={{ color: '#777', fontWeight: 600, textTransform: 'none' }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleRequestOTP} disabled={isProcessing} sx={{ background: 'linear-gradient(135deg, #f29b46, #e68a35)', fontWeight: 700, px: 4, py: 1.5, borderRadius: '14px', textTransform: 'none', boxShadow: '0 10px 20px rgba(242,155,70,0.3)' }}>
            Gửi Mã Xác Nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Reset Password Dialog ---- */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#fff', color: '#222', border: '1px solid #e0ddd8', borderRadius: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' } }}>
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pb: 1 }}>ĐẶT LẠI MẬT KHẨU</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 1, ml: 0.5, textAlign: 'left' }}>
                Mã OTP 6 số *
              </Typography>
              <TextField fullWidth placeholder="Nhập mã OTP..." variant="outlined" sx={inputSx} value={resetForm.otp} onChange={e => setResetForm({ ...resetForm, otp: e.target.value })} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 1, ml: 0.5, textAlign: 'left' }}>
                Mật khẩu mới *
              </Typography>
              <TextField fullWidth placeholder="Nhập mật khẩu mới..." type="password" variant="outlined" sx={inputSx} value={resetForm.newPass} onChange={e => setResetForm({ ...resetForm, newPass: e.target.value })} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', mb: 1, ml: 0.5, textAlign: 'left' }}>
                Xác nhận mật khẩu *
              </Typography>
              <TextField fullWidth placeholder="Nhập lại mật khẩu mới..." type="password" variant="outlined" sx={inputSx} value={resetForm.confirmPass} onChange={e => setResetForm({ ...resetForm, confirmPass: e.target.value })} />
            </Box>
          </Stack>
          {resetMsg.text && <Alert severity={resetMsg.type} sx={{ mt: 3, bgcolor: resetMsg.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: resetMsg.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${resetMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '16px' }}>{resetMsg.text}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 4, pt: 0, justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setResetOpen(false)} sx={{ color: '#777', fontWeight: 600, textTransform: 'none' }}>Hủy bỏ</Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={isProcessing} sx={{ background: 'linear-gradient(135deg, #f29b46, #e68a35)', fontWeight: 700, px: 4, py: 1.5, borderRadius: '14px', textTransform: 'none', boxShadow: '0 10px 20px rgba(242,155,70,0.3)' }}>
            Xác Nhận Đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerAuthPage;
