// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Alert, Divider,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Chip
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import StorageIcon from '@mui/icons-material/Storage';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePermissions } from '../contexts/PermissionContext';

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

  // Schedule State
  const [schedule, setSchedule] = useState({ enabled: true, diffHour: 20, diffMinute: 0, fullHour: 2, fullMinute: 0 });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState({ type: '', text: '' });

  const { user } = usePermissions();
  const isAdmin = user?.role?.toLowerCase().includes('admin') ||
    user?.roleName?.toLowerCase().includes('quản trị');

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

  const loadSchedule = async () => {
    try {
      const res = await api.get('/backup/schedule');
      setSchedule(res.data || { enabled: true, diffHour: 20, diffMinute: 0, fullHour: 2, fullMinute: 0 });
    } catch (e) {
      console.error('Không thể tải lịch sao lưu:', e);
    }
  };

  const handleSaveSchedule = async () => {
    setScheduleLoading(true);
    setScheduleMsg({ type: '', text: '' });
    try {
      await api.put('/backup/schedule', schedule);
      setScheduleMsg({ type: 'success', text: 'Đã lưu lịch sao lưu tự động thành công!' });
    } catch (e) {
      setScheduleMsg({ type: 'error', text: e.response?.data?.message || 'Lỗi khi lưu lịch sao lưu.' });
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 1) { loadBackups(); loadSchedule(); }
  }, [tabValue]);

  const handleCreateBackup = async (type = 'full') => {
    setBackupActionLoading(true);
    try {
      await api.post(`/backup?type=${type}`);
      const label = type === 'differential' ? 'Differential (phần thay đổi)' : 'Full (toàn bộ)';
      alert(`Đã tạo bản sao lưu ${label} thành công!`);
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
          <Tab icon={<LockResetIcon />} iconPosition="start" label="Chữ Ký Số" sx={{ fontWeight: 'bold' }} />
          {isAdmin && <Tab icon={<StorageIcon />} iconPosition="start" label="Sao Lưu & Phục Hồi Dữ Liệu" sx={{ fontWeight: 'bold' }} />}
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
                <TextField label="Mật khẩu hiện tại" type="password" fullWidth value={form.oldPassword} onChange={e => setForm({ ...form, oldPassword: e.target.value })} />
                <TextField label="Mật khẩu mới" type="password" fullWidth value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
                <TextField
                  label="Xác nhận mật khẩu mới" type="password" fullWidth
                  value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
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

      {/* ===== TAB 1: CHỮ KÝ SỐ ===== */}
      {tabValue === 1 && <SignatureTab userId={userId} />}

      {/* ===== TAB 2: SAO LƯU & PHỤC HỒI ===== */}
      {tabValue === 2 && isAdmin && (
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
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<BackupIcon />}
                  onClick={() => handleCreateBackup('full')}
                  disabled={backupActionLoading}
                  sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: '#004d40', fontWeight: 'bold' }}
                >
                  {backupActionLoading ? 'Đang chạy...' : '💾 Sao lưu đầy đủ'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<BackupIcon />}
                  onClick={() => handleCreateBackup('differential')}
                  disabled={backupActionLoading}
                  sx={{ borderColor: '#ff9800', color: '#e65100', fontWeight: 'bold', '&:hover': { borderColor: '#e65100', background: 'rgba(255,152,0,0.08)' } }}
                >
                  {backupActionLoading ? 'Đang chạy...' : '⚡ Sao lưu khác biệt'}
                </Button>
              </Box>
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

          {/* ── PHẦN CẤU HÌNH LỊCH SAO LƯU TỰ ĐỘNG ── */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" /> Lịch Sao Lưu Tự Động
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Hệ thống tự động sao lưu theo lịch cố định hàng tuần.
                </Typography>
              </Box>
              <Chip
                label={schedule.enabled ? 'Đang hoạt động' : 'Đã tắt'}
                color={schedule.enabled ? 'success' : 'default'}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {scheduleMsg.text && <Alert severity={scheduleMsg.type} sx={{ mb: 2 }}>{scheduleMsg.text}</Alert>}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Bật/Tắt */}
              <FormControlLabel
                control={
                  <Switch
                    checked={schedule.enabled}
                    onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                    color="success"
                  />
                }
                label={<Typography sx={{ fontWeight: 600 }}>Bật sao lưu tự động</Typography>}
              />

              {schedule.enabled && (
                <>
                  {/* Lịch mặc định cố định */}
                  <Alert severity="info" icon={false} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                    <Typography sx={{ fontWeight: 'bold', mb: 1.5, fontSize: '0.95rem' }}>📋 Lịch sao lưu mặc định:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="T2 → T7" size="small" sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', color: '#e65100' }} />
                        <Typography variant="body2">⚡ Differential Backup (chỉ sao lưu phần thay đổi)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Chủ Nhật" size="small" sx={{ fontWeight: 'bold', bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                        <Typography variant="body2">💾 Full Backup (sao lưu toàn bộ cơ sở dữ liệu)</Typography>
                      </Box>
                    </Box>
                  </Alert>

                  {/* Giờ Differential (T2 - T6) */}
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 'bold', mb: 1.5, color: '#e65100' }}>
                      ⚡ Giờ sao lưu Differential (Thứ 2 → Thứ 7)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Giờ</InputLabel>
                        <Select
                          value={schedule.diffHour ?? 20}
                          label="Giờ"
                          onChange={(e) => setSchedule({ ...schedule, diffHour: Number(e.target.value) })}
                        >
                          {[...Array(24)].map((_, i) => (
                            <MenuItem key={i} value={i}>{String(i).padStart(2, '0')}h</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel>Phút</InputLabel>
                        <Select
                          value={schedule.diffMinute ?? 0}
                          label="Phút"
                          onChange={(e) => setSchedule({ ...schedule, diffMinute: Number(e.target.value) })}
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                            <MenuItem key={m} value={m}>{String(m).padStart(2, '0')} phút</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Paper>

                  {/* Giờ Full (Chủ Nhật) */}
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 'bold', mb: 1.5, color: '#2e7d32' }}>
                      💾 Giờ sao lưu Full (Chủ Nhật)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Giờ</InputLabel>
                        <Select
                          value={schedule.fullHour ?? 2}
                          label="Giờ"
                          onChange={(e) => setSchedule({ ...schedule, fullHour: Number(e.target.value) })}
                        >
                          {[...Array(24)].map((_, i) => (
                            <MenuItem key={i} value={i}>{String(i).padStart(2, '0')}h</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel>Phút</InputLabel>
                        <Select
                          value={schedule.fullMinute ?? 0}
                          label="Phút"
                          onChange={(e) => setSchedule({ ...schedule, fullMinute: Number(e.target.value) })}
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                            <MenuItem key={m} value={m}>{String(m).padStart(2, '0')} phút</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Paper>

                  {/* Tóm tắt */}
                  <Alert severity="success" sx={{ '& .MuiAlert-message': { fontSize: '0.9rem' } }}>
                    ⏰ <strong>Thứ 2 → Thứ 7:</strong> Diff Backup lúc <strong>{String(schedule.diffHour ?? 20).padStart(2, '0')}:{String(schedule.diffMinute ?? 0).padStart(2, '0')}</strong> &nbsp;|&nbsp; <strong>Chủ Nhật:</strong> Full Backup lúc <strong>{String(schedule.fullHour ?? 2).padStart(2, '0')}:{String(schedule.fullMinute ?? 0).padStart(2, '0')}</strong>
                  </Alert>
                </>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveSchedule}
                  disabled={scheduleLoading}
                  startIcon={<ScheduleIcon />}
                  sx={{ borderRadius: 2, px: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {scheduleLoading ? 'Đang lưu...' : 'Lưu Lịch Sao Lưu'}
                </Button>
              </Box>
            </Box>
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

// ─── COMPONENT: CHỮ KÝ SỐ ─────────────────────────────────────
function SignatureTab({ userId }) {
  const [signature, setSignature] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState(null);
  const userStr = localStorage.getItem('user');
  const employeeId = userStr ? JSON.parse(userStr).employeeId : null;

  useEffect(() => {
    if (employeeId) {
      api.get(`/employees/${employeeId}`).then(res => {
        setEmployee(res.data);
        if (res.data.chuKy) {
          // Nếu là path tương đối, thêm baseURL
          const fullPath = res.data.chuKy.startsWith('http')
            ? res.data.chuKy
            : `${api.defaults.baseURL.replace('/api', '')}${res.data.chuKy}`;
          setPreview(fullPath);
        }
      }).catch(err => console.error("Lỗi tải thông tin NV:", err));
    }
  }, [employeeId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignature(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!signature) return alert("Vui lòng chọn ảnh chữ ký!");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', signature);
      const res = await api.post('/upload/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const signaturePath = res.data.relativePath; // Lưu path tương đối vào DB

      // Cập nhật vào DB Nhân viên
      const updateData = { ...employee, chuKy: signaturePath };
      await api.put(`/employees/${employeeId}`, updateData);

      // CẬP NHẬT PHIÊN LÀM VIỆC (LOCAL SESSION)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      currentUser.chuKy = signaturePath;
      currentUser.ChuKy = signaturePath; // Đồng bộ cả 2 kiểu viết
      localStorage.setItem('user', JSON.stringify(currentUser));

      alert("Đã cập nhật chữ ký số thành công!");
    } catch (e) {
      alert("Lỗi tải lên chữ ký: " + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  if (!employeeId) return <Alert severity="info" sx={{ mt: 2 }}>Chỉ nhân viên mới có thể quản lý chữ ký số.</Alert>;

  return (
    <Box sx={{ maxWidth: 800, mt: 2 }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>🖋️ Quản Lý Chữ Ký Cá Nhân</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Tải lên ảnh chữ ký của bạn (nền trắng hoặc trong suốt). Chữ ký này sẽ được tự động chèn vào các văn bản, đơn đặt hàng mà bạn thực hiện.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, p: 3, border: '2px dashed #ddd', borderRadius: 2 }}>
          {preview ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">Xem trước chữ ký:</Typography>
              <Box sx={{ mt: 1, p: 2, background: '#fff', border: '1px solid #eee', borderRadius: 1 }}>
                <img src={preview} alt="Chữ ký" style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain' }} />
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center', color: '#aaa' }}>
              <LockResetIcon sx={{ fontSize: 60, mb: 1, opacity: 0.3 }} />
              <Typography>Chưa có chữ ký số nào được thiết lập</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" component="label">
              Chọn Ảnh Chữ Ký
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </Button>
            {signature && (
              <Button variant="contained" color="success" onClick={handleUpload} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Xác Nhận Lưu'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default SettingsPage;
