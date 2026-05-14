import React, { useState } from 'react';
import { Box, Container, Grid, Typography, TextField, Button, Paper, Divider, Snackbar, Alert } from '@mui/material';
import { LocationOn, Phone, Email, AccessTime, Send } from '@mui/icons-material';

const CustomerContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSnackbar({ open: true, message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.', severity: 'success' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', pb: 8 }}>
      {/* Hero Section */}
      <Box sx={{ bgcolor: '#222', color: '#fff', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontFamily: '"Inter", "Roboto", sans-serif' }}>Liên hệ với chúng tôi</Typography>
        <Typography variant="body1" sx={{ color: '#aaa', maxWidth: 600, mx: 'auto' }}>
          Bạn có câu hỏi, đóng góp hay cần hỗ trợ? Đừng ngần ngại liên hệ với VLXD Thành Đạt. Chúng tôi luôn sẵn lòng lắng nghe và phục vụ bạn.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -6 }}>
        <Grid container spacing={4}>
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: '16px', height: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#333', fontFamily: '"Inter", "Roboto", sans-serif' }}>Thông tin liên hệ</Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(230, 140, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LocationOn sx={{ color: '#e68c55' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Địa chỉ</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: '"Inter", "Roboto", sans-serif' }}>829 Lạc Long Quân, Phường Bảy Hiền, Quận Tân Bình, Thành phố Hồ Chí Minh</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(230, 140, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone sx={{ color: '#e68c55' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Điện thoại</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>1900 1234 - 0909 123 456</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(230, 140, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Email sx={{ color: '#e68c55' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Email</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>support@vlxdthanhdat.com</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(230, 140, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AccessTime sx={{ color: '#e68c55' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Giờ làm việc</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Thứ 2 - Thứ 7: 08:00 - 18:00<br/>Chủ nhật: Đóng cửa</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: '16px', height: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#333', fontFamily: '"Inter", "Roboto", sans-serif' }}>Gửi tin nhắn cho chúng tôi</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>Vui lòng điền thông tin bên dưới, đội ngũ tư vấn sẽ liên hệ lại với bạn sớm nhất.</Typography>
              
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Họ và tên" name="name" value={formData.name} onChange={handleChange} required variant="outlined" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required variant="outlined" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Tiêu đề" name="subject" value={formData.subject} onChange={handleChange} required variant="outlined" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Nội dung lời nhắn" name="message" value={formData.message} onChange={handleChange} required multiline rows={5} variant="outlined" />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" size="large" endIcon={<Send />} sx={{ bgcolor: '#e68c55', '&:hover': { bgcolor: '#cc7a4a' }, borderRadius: '8px', px: 4, py: 1.5, fontWeight: 'bold' }}>
                      Gửi Tin Nhắn
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerContactPage;
