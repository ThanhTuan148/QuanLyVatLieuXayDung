import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, TextField, Button, Grid, Alert,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Link, Checkbox, FormControlLabel, InputAdornment, IconButton, Divider
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import authService from '../services/authService';
import api from '../services/api';
import storageHelper from '../services/storageHelper';

const CustomerAuthPage = () => {
  const navigate = useNavigate();
  // 'login' hoặc 'register'
  const [view, setView] = useState('login');

  // ---- Login state ----
  const [loginData, setLoginData] = useState({ username: '', password: '', remember: false });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ---- Register state ----
  const [registerData, setRegisterData] = useState({
    username: '', fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: ''
  });
  const [registerMsg, setRegisterMsg] = useState({ type: '', text: '' });
  const [registerLoading, setRegisterLoading] = useState(false);
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

  const switchView = (v) => {
    setView(v);
    setLoginError('');
    setRegisterMsg({ type: '', text: '' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) { setLoginError('Vui lòng nhập đầy đủ thông tin.'); return; }
    setLoginLoading(true); setLoginError('');
    try {
      const response = await authService.login(loginData.username, loginData.password);
      const userData = response.data;
      authService.setUser(userData);
      authService.setToken(`token_${userData.id}_${Date.now()}`);
      
      const realId = userData.maKhachHang || userData.MaKhachHang || userData.id;
      if (realId) {
        storageHelper.mergeGuestData(realId);
      }

      const roleStr = (userData.role || userData.Role || userData.roleName || '').toLowerCase();
      const adminWords = ['admin', 'manager', 'staff', 'nhanvien', 'quanly', 'quản trị', 'quản lý', 'nhân viên', 'kế toán'];
      if (userData.employeeId || adminWords.some(w => roleStr.includes(w))) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/shopping';
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, fullName, email, phoneNumber, password, confirmPassword } = registerData;
    if (!username || !fullName || !email || !phoneNumber || !password || !confirmPassword) {
      setRegisterMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin.' }); return;
    }
    if (password !== confirmPassword) { setRegisterMsg({ type: 'error', text: 'Mật khẩu không khớp.' }); return; }
    setRegisterLoading(true); setRegisterMsg({ type: '', text: '' });
    try {
      const response = await api.post('/auth/register', registerData);
      setRegisterMsg({ type: 'success', text: response.data?.message || 'Đăng ký thành công!' });
      setRegisterData({ username: '', fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
      setTimeout(() => { switchView('login'); }, 2000);
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

  // ---- Shared styles ----
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#fff',
      borderRadius: '30px',
      '& fieldset': { border: '1px solid #e0ddd8' },
      '&:hover fieldset': { borderColor: '#ccc' },
      '&.Mui-focused fieldset': { borderColor: '#f29b46', borderWidth: '1px' },
      '& input': { py: 1.6, px: 3, fontSize: '0.95rem' }
    }
  };
  const labelSx = { fontWeight: 600, fontSize: '0.88rem', color: '#333', mb: 0.8, ml: 1, display: 'inline-block' };
  const asteriskSx = { color: 'red', ml: 0.3 };

  const orangeBtn = {
    bgcolor: '#f29b46', color: '#fff', py: 1.8, borderRadius: '30px',
    fontWeight: 700, fontSize: '1rem', textTransform: 'none',
    boxShadow: '0 4px 12px rgba(242,155,70,0.3)',
    '&:hover': { bgcolor: '#e68a35' }
  };

  const ghostBtn = {
    bgcolor: 'transparent', color: '#333', py: 1.3, px: 5, borderRadius: '30px',
    fontWeight: 600, fontSize: '0.95rem', textTransform: 'none',
    border: '1px solid #ccc',
    '&:hover': { bgcolor: '#f0ede8', borderColor: '#bbb' }
  };

  // ---- Side panel description ----
  const SidePanel = ({ title, description, btnLabel, onBtnClick }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', pt: { md: 4 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#222', mb: 3, letterSpacing: '0.5px' }}>
        {title}
      </Typography>
      <Typography sx={{ color: '#888', fontSize: '0.92rem', lineHeight: 1.85, mb: 5, maxWidth: 320 }}>
        {description}
      </Typography>
      <Button onClick={onBtnClick} sx={ghostBtn}>{btnLabel}</Button>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f7f4', pb: 10 }}>
      {/* HERO BANNER */}
      <Box sx={{
        bgcolor: '#b4c4b8',
        position: 'relative',
        minHeight: '280px',
        display: 'flex',
        alignItems: 'flex-end',
        pb: 4,
        mb: 8,
        backgroundImage: 'url("/assets/images/my-account-banner.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.08)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: 4 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800, mb: 0.5, fontSize: { xs: '2.5rem', md: '4.5rem' }, letterSpacing: '-1px', lineHeight: 1 }}>
            Tài khoản của tôi
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
            <Typography component="span" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => navigate('/shopping')}>
              Trang chủ
            </Typography>
            <Typography component="span" sx={{ color: 'rgba(255,255,255,0.6)', mx: 1, fontSize: '0.9rem' }}>/</Typography>
            <Typography component="span" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              Tài khoản của tôi
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* MAIN FORM AREA */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
        <Grid container>

          {/* LEFT: Form */}
          <Grid item xs={12} md={6} sx={{ pr: { md: 8 }, borderRight: { md: '1px solid #e0ddd8' } }}>
            {view === 'login' ? (
              /* ========== LOGIN FORM ========== */
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#222', mb: 4, letterSpacing: '0.5px' }}>
                  ĐĂNG NHẬP
                </Typography>
                <Box component="form" onSubmit={handleLogin}>
                  {loginError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{loginError}</Alert>}

                  <Box sx={{ mb: 3 }}>
                    <Typography sx={labelSx}>Tên đăng nhập hoặc địa chỉ email <Box component="span" sx={asteriskSx}>*</Box></Typography>
                    <TextField fullWidth variant="outlined" sx={inputSx}
                      value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} />
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography sx={labelSx}>Mật khẩu <Box component="span" sx={asteriskSx}>*</Box></Typography>
                    <TextField fullWidth type={showLoginPassword ? 'text' : 'password'} variant="outlined" sx={inputSx}
                      value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end" sx={{ mr: 1 }}>
                            <IconButton onClick={() => setShowLoginPassword(!showLoginPassword)} edge="end" size="small">
                              {showLoginPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }} />
                  </Box>

                  <Button fullWidth type="submit" disabled={loginLoading} sx={{ ...orangeBtn, mb: 3 }}>
                    {loginLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Đăng nhập'}
                  </Button>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={<Checkbox size="small" sx={{ '&.Mui-checked': { color: '#f29b46' } }} checked={loginData.remember} onChange={e => setLoginData({ ...loginData, remember: e.target.checked })} />}
                      label={<Typography variant="body2" sx={{ color: '#555' }}>Ghi nhớ đăng nhập</Typography>}
                    />
                    <Link component="button" type="button" variant="body2"
                      sx={{ color: '#f29b46', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => setForgotOpen(true)}>
                      Quên mật khẩu?
                    </Link>
                  </Box>
                </Box>
              </Box>
            ) : (
              /* ========== REGISTER FORM ========== */
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#222', mb: 4, letterSpacing: '0.5px' }}>
                  ĐĂNG KÝ
                </Typography>
                <Box component="form" onSubmit={handleRegister}>
                  {registerMsg.text && <Alert severity={registerMsg.type} sx={{ mb: 3, borderRadius: 2 }}>{registerMsg.text}</Alert>}

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography sx={labelSx}>Tên đăng nhập <Box component="span" sx={asteriskSx}>*</Box></Typography>
                        <TextField fullWidth variant="outlined" sx={inputSx}
                          value={registerData.username} onChange={e => setRegisterData({ ...registerData, username: e.target.value })} />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography sx={labelSx}>Họ và tên <Box component="span" sx={asteriskSx}>*</Box></Typography>
                        <TextField fullWidth variant="outlined" sx={inputSx}
                          value={registerData.fullName} onChange={e => setRegisterData({ ...registerData, fullName: e.target.value })} />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography sx={labelSx}>Email <Box component="span" sx={asteriskSx}>*</Box></Typography>
                        <TextField fullWidth variant="outlined" sx={inputSx}
                          value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography sx={labelSx}>Số điện thoại <Box component="span" sx={asteriskSx}>*</Box></Typography>
                        <TextField fullWidth variant="outlined" sx={inputSx}
                          value={registerData.phoneNumber} onChange={e => setRegisterData({ ...registerData, phoneNumber: e.target.value })} />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ mb: 1 }}>
                        <Typography sx={labelSx}>Mật khẩu <Box component="span" sx={asteriskSx}>*</Box></Typography>
                        <TextField fullWidth type={showRegPassword ? 'text' : 'password'} variant="outlined" sx={inputSx}
                          value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                          InputProps={{ endAdornment: (<InputAdornment position="end" sx={{ mr: 1 }}><IconButton onClick={() => setShowRegPassword(!showRegPassword)} edge="end" size="small">{showRegPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>) }} />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ mb: 3 }}>
                        <Typography sx={labelSx}>Xác nhận mật khẩu <Box component="span" sx={asteriskSx}>*</Box></Typography>
                        <TextField fullWidth type={showRegConfirm ? 'text' : 'password'} variant="outlined" sx={inputSx}
                          value={registerData.confirmPassword} onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          InputProps={{ endAdornment: (<InputAdornment position="end" sx={{ mr: 1 }}><IconButton onClick={() => setShowRegConfirm(!showRegConfirm)} edge="end" size="small">{showRegConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>) }} />
                      </Box>
                    </Grid>
                  </Grid>

                  <Button fullWidth type="submit" disabled={registerLoading} sx={orangeBtn}>
                    {registerLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Đăng ký'}
                  </Button>
                </Box>
              </Box>
            )}
          </Grid>

          {/* RIGHT: Side panel */}
          <Grid item xs={12} md={6} sx={{ pl: { md: 8 }, mt: { xs: 6, md: 0 } }}>
            {view === 'login' ? (
              <SidePanel
                title="ĐĂNG KÝ"
                description="Đăng ký trang web này cho phép bạn truy cập trạng thái và lịch sử đơn hàng. Chỉ cần điền các ô dưới đây, chúng tôi sẽ thiết lập tài khoản mới cho bạn ngay lập tức. Chúng tôi chỉ yêu cầu thông tin cần thiết để quá trình mua hàng nhanh chóng và dễ dàng hơn."
                btnLabel="Đăng ký"
                onBtnClick={() => switchView('register')}
              />
            ) : (
              <SidePanel
                title="ĐĂNG NHẬP"
                description="Nếu bạn đã có tài khoản, hãy đăng nhập để truy cập thông tin đơn hàng, lịch sử mua hàng và nhiều tính năng khác một cách nhanh chóng và tiện lợi."
                btnLabel="Đăng nhập"
                onBtnClick={() => switchView('login')}
              />
            )}
          </Grid>

        </Grid>
      </Container>

      {/* ---- Forgot Password Dialog ---- */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', pb: 1 }}>KHÔI PHỤC MẬT KHẨU</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Username hoặc Email" margin="normal" variant="outlined"
            value={forgotUser} onChange={(e) => setForgotUser(e.target.value)} />
          {forgotMsg.text && <Alert severity={forgotMsg.type} sx={{ mt: 2 }}>{forgotMsg.text}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setForgotOpen(false)} sx={{ color: '#666', fontWeight: 600 }}>Hủy</Button>
          <Button variant="contained" onClick={handleRequestOTP} disabled={isProcessing} sx={{ bgcolor: '#f29b46', fontWeight: 600, px: 3, '&:hover': { bgcolor: '#e68a35' } }}>
            Gửi Mã Xác Nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Reset Password Dialog ---- */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', pb: 1 }}>ĐẶT LẠI MẬT KHẨU</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Mã OTP 6 số" margin="normal" variant="outlined" value={resetForm.otp} onChange={e => setResetForm({ ...resetForm, otp: e.target.value })} />
          <TextField fullWidth type="password" label="Mật khẩu mới" margin="normal" variant="outlined" value={resetForm.newPass} onChange={e => setResetForm({ ...resetForm, newPass: e.target.value })} />
          <TextField fullWidth type="password" label="Xác nhận mật khẩu" margin="normal" variant="outlined" value={resetForm.confirmPass} onChange={e => setResetForm({ ...resetForm, confirmPass: e.target.value })} />
          {resetMsg.text && <Alert severity={resetMsg.type} sx={{ mt: 2 }}>{resetMsg.text}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setResetOpen(false)} sx={{ color: '#666', fontWeight: 600 }}>Hủy</Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={isProcessing} sx={{ bgcolor: '#f29b46', fontWeight: 600, px: 3, '&:hover': { bgcolor: '#e68a35' } }}>
            Xác Nhận Đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerAuthPage;
