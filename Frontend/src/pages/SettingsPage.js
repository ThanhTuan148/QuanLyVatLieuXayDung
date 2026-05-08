// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Alert, Divider,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import StorageIcon from '@mui/icons-material/Storage';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Backup State
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupActionLoading, setBackupActionLoading] = useState(false);
  
  // Dialog States
  const [restoreDialog, setRestoreDialog] = useState(null);
  const [deleteBackupDialog, setDeleteBackupDialog] = useState(null);

  // Retrieve user ID from localStorage
  const userStr = localStorage.getItem('user');
  const userId = userStr ? JSON.parse(userStr).id : null;

  // ===== Handlers for Password Change =====
  const handleSavePassword = async () => {
    if (!form.oldPassword) return setMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu cũ' });
    if (!form.newPassword) return setMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
    if (form.newPassword !== form.confirmPassword) return setMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });

    setSaving(true);
    setMsg({ type: '', text: '' });
    
    try {
      await api.put(`/auth/${userId}/change-password`, { oldPassword: form.oldPassword, newPassword: form.newPassword });
      setMsg({ type: 'success', text: 'Đổi mật khẩu thành công! Bạn sẽ được đăng xuất sau 2 giây...' });
      setTimeout(() => {
        localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/auth');
      }, 2000);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Lỗi không thể kết nối server' });
    } finally {
      if (!msg.text.includes('thành công')) setSaving(false);
    }
  };

  // ===== Handlers for Backup & Restore =====
  const loadBackups = async () => {
    setBackupLoading(true);
    try {
      const res = await api.get('/backup');
      setBackups(res.data || []);
    } catch (e) {
      alert('Không thể tải danh sách bản sao lưu');
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 1) { loadBackups(); }
  }, [tabValue]);

  const handleCreateBackup = async () => {
    setBackupActionLoading(true);
    try {
      await api.post('/backup');
      alert('Đã tạo bản sao lưu dữ liệu thành công!');
      loadBackups();
    } catch (e) {
      alert('Lỗi tạo sao lưu: ' + (e.response?.data?.message || e.message));
    } finally {
      setBackupActionLoading(false);
    }
  };

  const executeRestore = async () => {
    if (!restoreDialog) return;
    setBackupActionLoading(true);
    try {
      await api.post(`/backup/${restoreDialog}/restore`);
      alert('🎉 Phục hồi dữ liệu thành công! Trình duyệt sẽ tự động tải lại để cập nhật.');
      window.location.reload();
    } catch (e) {
      alert('❌ Lỗi phục hồi: ' + (e.response?.data?.message || e.message));
    } finally {
      setBackupActionLoading(false);
      setRestoreDialog(null);
    }
  };

  const executeDeleteBackup = async () => {
    if (!deleteBackupDialog) return;
    setBackupActionLoading(true);
    try {
      await api.delete(`/backup/${deleteBackupDialog}`);
      loadBackups();
    } catch (e) {
      alert('Lỗi xóa sao lưu: ' + (e.response?.data?.message || e.message));
    } finally {
      setBackupActionLoading(false);
      setDeleteBackupDialog(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>⚙️ Cài Đặt & Hệ Thống</Typography>
        <Typography variant="body2" color="textSecondary">Quản lý bảo mật tài khoản và kiểm soát dữ liệu</Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab icon={<LockResetIcon />} iconPosition="start" label="Bảo Mật (Đổi Mật Khẩu)" sx={{ fontWeight: 'bold' }} />
          <Tab icon={<StorageIcon />} iconPosition="start" label="Sao Lưu & Phục Hồi Dữ Liệu" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* ===== TAB 0: ĐỔI MẬT KHẨU ===== */}
      {tabValue === 0 && (
        <Box sx={{ maxWidth: 600, mt: 2 }}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <LockResetIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Đổi Mật Khẩu Cá Nhân</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {msg.text && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}

            {userId ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField label="Mật khẩu hiện tại" type="password" fullWidth value={form.oldPassword} onChange={e => setForm({...form, oldPassword: e.target.value})} />
                <TextField label="Mật khẩu mới" type="password" fullWidth value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} />
                <TextField 
                  label="Xác nhận mật khẩu mới" type="password" fullWidth 
                  value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  error={Boolean(form.confirmPassword && form.confirmPassword !== form.newPassword)}
                  helperText={form.confirmPassword && form.confirmPassword !== form.newPassword ? "Mật khẩu xác nhận không khớp" : ""}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button variant="contained" size="large" onClick={handleSavePassword} disabled={saving}
                    sx={{ borderRadius: 2, px: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    {saving ? 'Đang xử lý...' : 'Lưu Thay Đổi'}
                  </Button>
                </Box>
              </Box>
            ) : <Alert severity="error">Không tìm thấy thông tin phiên đăng nhập lúc này.</Alert>}
          </Paper>
        </Box>
      )}

      {/* ===== TAB 1: SAO LƯU & PHỤC HỒI ===== */}
      {tabValue === 1 && (
        <Box sx={{ mt: 2 }}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon color="secondary" /> Quản Lý Bản Sao Lưu
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Các tệp sao lưu được lưu trữ trên Server dưới định dạng chuẩn SQL Server (.bak).
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                startIcon={<BackupIcon />} 
                onClick={handleCreateBackup}
                disabled={backupActionLoading}
                sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: '#004d40', fontWeight: 'bold' }}
              >
                {backupActionLoading ? 'Đang chạy...' : 'Tạo Sao Lưu Mới'}
              </Button>
            </Box>
            
            <Divider sx={{ mb: 3 }} />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tên File Sao Lưu (.bak)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dung Lượng</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ngày Tạo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Tác Vụ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backupLoading ? (
                    <TableRow><TableCell colSpan={4} align="center">Đang tải danh sách...</TableCell></TableRow>
                  ) : backups.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ color: '#aaa' }}>Chưa có bản sao lưu nào được tạo</TableCell></TableRow>
                  ) : (
                    backups.map((b, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 500, color: '#1976d2' }}>{b.fileName}</TableCell>
                        <TableCell>{b.fileSize}</TableCell>
                        <TableCell>{new Date(b.createdAt).toLocaleString('vi-VN')}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Phục Hồi Dữ Liệu">
                              <IconButton size="small" color="warning" onClick={() => setRestoreDialog(b.fileName)} disabled={backupActionLoading}>
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa Tệp">
                              <IconButton size="small" color="error" onClick={() => setDeleteBackupDialog(b.fileName)} disabled={backupActionLoading}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="warning" sx={{ mt: 3, '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
              <strong>Lưu ý quan trọng:</strong> Quá trình phục hồi dữ liệu sẽ xóa sạch toàn bộ các hóa đơn và nhân viên được tạo sau thời điểm tệp sao lưu. Vui lòng đảm bảo không có ai đang sử dụng hệ thống khi thực hiện phục hồi.
            </Alert>
          </Paper>
        </Box>
      )}

      {/* DIALOG XÁC NHẬN PHỤC HỒI */}
      <Dialog open={!!restoreDialog} onClose={() => setRestoreDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ed6c02', fontWeight: 'bold' }}>
          <WarningAmberIcon /> CẢNH BÁO NGUY HIỂM: PHỤC HỒI DỮ LIỆU
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            Bạn sắp <strong>PHỤC HỒI</strong> lại toàn bộ cơ sở dữ liệu từ tệp:
          </Typography>
          <Typography sx={{ mb: 2, p: 2, background: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace', color: '#d32f2f', fontWeight: 'bold' }}>
            {restoreDialog}
          </Typography>
          <Typography color="error">
            Mọi dữ liệu hệ thống (Hóa đơn, Nhân viên, Sản phẩm) được tạo ra <strong>từ sau thời điểm sao lưu này sẽ BỊ XÓA DỌN SẠCH và GHI ĐÈ hoàn toàn</strong> mà không có bất kỳ cách nào lấy lại!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRestoreDialog(null)} color="inherit" disabled={backupActionLoading}>Hủy Bỏ</Button>
          <Button onClick={executeRestore} variant="contained" color="warning" disabled={backupActionLoading}>
            {backupActionLoading ? 'Đang Phục Hồi...' : 'TIẾP TỤC PHỤC HỒI'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG XÁC NHẬN XÓA BACKUP */}
      <Dialog open={!!deleteBackupDialog} onClose={() => setDeleteBackupDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f', fontWeight: 'bold' }}>
          <DeleteIcon /> Xác Xóa Tệp Sao Lưu
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa vĩnh viễn tệp sao lưu <strong>{deleteBackupDialog}</strong> không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteBackupDialog(null)} color="inherit" disabled={backupActionLoading}>Hủy</Button>
          <Button onClick={executeDeleteBackup} variant="contained" color="error" disabled={backupActionLoading}>
            {backupActionLoading ? 'Đang Xóa...' : 'Xóa File'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default SettingsPage;
