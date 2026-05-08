// src/pages/LoginPage.js
import React, { useState } from 'react';
import {
  Box, Container, TextField, Button, Typography, Paper, Alert, Card, CardContent,
  InputAdornment, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Email as EmailIcon, Lock as LockIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import authService from '../services/authService';
import api from '../services/api';

function LoginPage({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // --- States for Forgot Password ---
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '', otpToDemo: '' });
  
  const [resetOpen, setResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ otp: '', newPass: '', confirmPass: '' });
  const [resetMsg, setResetMsg] = useState({ type: '', text: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const ADMIN_ROLES = ['Admin', 'admin', 'Manager', 'manager', 'Staff', 'staff', 'NhanVien', 'QuanLy'];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');

    try {
      const response = await authService.login(username, password);
      const userData = response.data;
      authService.setUser(userData);
      authService.setToken(`token_${userData.id}_${Date.now()}`);

      const role = userData.role || userData.Role || userData.roleName || '';
      setIsAuthenticated(true, role);

      if (ADMIN_ROLES.includes(role)) {
        navigate('/dashboard');
      } else {
        navigate('/shopping');
      }
    } catch (err) {
      setError(err.response?.data?.message || '❌ Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!forgotUser) return setForgotMsg({ type: 'error', text: 'Vui lòng nhập Username/Email' });
    setIsProcessing(true); setForgotMsg({ type: '', text: '', otpToDemo: '' });
    
    try {
      const res = await api.post('/auth/forgot-password', { username: forgotUser });
      
      setForgotMsg({ 
        type: 'success', 
        text: res.data.message || 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!'
      });
      
      // Chuyển sang dialog nhập OTP sau 2s
      setTimeout(() => {
        setForgotOpen(false);
        setResetOpen(true);
        setResetForm({ ...resetForm, otp: '' }); // Đã bỏ phần tự điền OTP
      }, 2000);

    } catch (e) {
      setForgotMsg({ type: 'error', text: e.response?.data?.message || 'Lỗi hệ thống' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetForm.otp || !resetForm.newPass) return setResetMsg({ type: 'error', text: 'Vui lòng nhập đủ thông tin' });
    if (resetForm.newPass !== resetForm.confirmPass) return setResetMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
    
    setIsProcessing(true); setResetMsg({ type: '', text: '' });
    
    try {
      const res = await api.post('/auth/reset-password', {
        username: forgotUser,
        otp: resetForm.otp,
        newPassword: resetForm.newPass
      });
      setSuccessMsg(res.data.message || 'Đổi mật khẩu thành công! Hãy đăng nhập lại.');
      setResetOpen(false);
      setForgotUser(''); setResetForm({ otp: '', newPass: '', confirmPass: '' });
    } catch (e) {
      setResetMsg({ type: 'error', text: e.response?.data?.message || 'Đổi pass thất bại' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
      <Container component="main" maxWidth="sm">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <Box sx={{ mb: 3, textAlign: 'center', color: 'white' }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>🏗️</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Quản Lý Vật Liệu</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Hệ thống bán vật liệu xây dựng</Typography>
          </Box>

          <Card sx={{ width: '100%', borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography component="h1" variant="h5" sx={{ mb: 0.5, textAlign: 'center', fontWeight: 'bold', color: '#333' }}>
                👋 Xin Chào!
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'textSecondary' }}>
                Đăng nhập để tiếp tục quản lý hệ thống
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

              <form onSubmit={handleLogin}>
                <TextField fullWidth label="📧 Username hoặc Email" type="text" value={username} onChange={(e) => setUsername(e.target.value)} margin="normal"
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#667eea', mr: 1 }} /></InputAdornment> }} />

                <TextField fullWidth label="🔒 Mật Khẩu" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#667eea', mr: 1 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button variant="text" size="small" onClick={() => setShowPassword(!showPassword)} sx={{ minWidth: 'auto', p: 0 }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </Button>
                      </InputAdornment>
                    ),
                  }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Link component="button" variant="body2" type="button" onClick={() => { setForgotOpen(true); setForgotMsg({type:'',text:''}); }}
                    sx={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>
                    Quên mật khẩu?
                  </Link>
                </Box>

                <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading || !username || !password}
                  sx={{ mt: 3, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 'bold', py: 1.5 }}>
                  {loading ? <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} /> : '🔓 Đăng Nhập'}
                </Button>

                <Paper sx={{ p: 2, background: '#f5f6fa', borderRadius: 1, mt: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}><strong>💡 Tài khoản Demo:</strong></Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>📧 Username: <strong>admin</strong></Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>🔒 Pass gốc: <strong>admin123</strong></Typography>
                </Paper>
              </form>
            </CardContent>
          </Card>

          <Typography variant="caption" sx={{ mt: 3, color: 'rgba(255,255,255,0.8)' }}>
            © 2026 Quản Lý Vật Liệu Xây Dựng. Bảo mật & An toàn.
          </Typography>
        </Box>
      </Container>

      {/* --- DIALOG QUÊN MẬT KHẨU --- */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>🔑 Quên Mật Khẩu</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Nhập Username hoặc Email của bạn, hệ thống sẽ sinh ra một mã OTP 6 số để bạn đặt lại mật khẩu.
          </Typography>
          {forgotMsg.text && (
            <Alert severity={forgotMsg.type} sx={{ mb: 2 }}>
              {forgotMsg.text}
              {forgotMsg.otpToDemo && (
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', textAlign: 'center', letterSpacing: 5 }}>
                  {forgotMsg.otpToDemo}
                </Typography>
              )}
            </Alert>
          )}
          <TextField 
            autoFocus fullWidth label="Username / Email" value={forgotUser} 
            onChange={(e) => setForgotUser(e.target.value)} disabled={isProcessing}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setForgotOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleRequestOTP} disabled={isProcessing || !forgotUser}>
            {isProcessing ? 'Đang gửi...' : 'Nhận Mã OTP'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG ĐẶT LẠI MẬT KHẨU BẰNG OTP --- */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>🛡️ Đặt Lại Mật Khẩu</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Nhập mã OTP vừa nhận được và thiết lập mật khẩu mới cho tài khoản: <strong>{forgotUser}</strong>
          </Typography>
          {resetMsg.text && <Alert severity={resetMsg.type} sx={{ mb: 2 }}>{resetMsg.text}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Mã OTP 6 số" value={resetForm.otp} onChange={e => setResetForm({...resetForm, otp: e.target.value})} />
            <TextField label="Mật khẩu mới" type="password" value={resetForm.newPass} onChange={e => setResetForm({...resetForm, newPass: e.target.value})} />
            <TextField label="Xác nhận mật khẩu" type="password" value={resetForm.confirmPass} onChange={e => setResetForm({...resetForm, confirmPass: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={isProcessing}>
            {isProcessing ? 'Đang lưu...' : 'Xác Nhận Đổi'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default LoginPage;
