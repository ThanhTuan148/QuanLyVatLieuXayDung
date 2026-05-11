import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Chip, LinearProgress, Card, CardContent, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  FormControl, InputLabel, Select, MenuItem, Avatar, Tooltip, IconButton, Alert,
  Checkbox, Badge, Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { usePermissions } from '../contexts/PermissionContext';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// ─── Dialog Phân Quyền (Module CRUD) ──────────────────────────
const MODULES = [
  { key: 'products', label: '📦 Sản Phẩm' },
  { key: 'categories', label: '🗂️ Loại Sản Phẩm' },
  { key: 'inventory', label: '🏭 Kho Hàng' },
  { key: 'orders', label: '🛒 Đơn Hàng' },
  { key: 'customers', label: '👤 Khách Hàng' },
  { key: 'suppliers', label: '🏢 Nhà Cung Cấp' },
  { key: 'flashsales', label: '⚡ Flash Sales' },
  { key: 'promotions', label: '🏷️ Khuyến Mãi' },
  { key: 'deliveries', label: '🚚 Giao Hàng' },
  { key: 'reports', label: '📊 Báo Cáo' },
  { key: 'employees', label: '👥 Nhân Viên' },
];

const autoMapGeneralToModule = (generalPerms) => {
  const map = {};
  const hasQ = (code) => generalPerms.some(p => p.maQ === code);
  const createMod = (view, create, update, del) => ({ coTheXem: view, coTheTao: create, coTheSua: update, coTheXoa: del });
  if (hasQ('Q01')) map['employees'] = createMod(true, true, true, true);
  if (hasQ('Q02')) {
    map['products'] = createMod(true, true, true, true);
    map['categories'] = createMod(true, true, true, true);
    map['promotions'] = createMod(true, true, true, true);
    map['flashsales'] = createMod(true, true, true, true);
  } else if (hasQ('Q10')) {
    map['products'] = createMod(true, false, false, false);
    map['categories'] = createMod(true, false, false, false);
  }
  if (hasQ('Q03')) map['orders'] = createMod(true, true, true, true);
  else if (hasQ('Q11')) map['orders'] = createMod(true, true, false, false);
  if (hasQ('Q04')) {
    map['inventory'] = createMod(true, true, true, true);
    map['suppliers'] = createMod(true, true, true, true);
  }
  if (hasQ('Q05')) map['deliveries'] = createMod(true, true, true, true);
  if (hasQ('Q06')) map['customers'] = createMod(true, true, true, true);
  if (hasQ('Q07') || hasQ('Q08')) map['reports'] = createMod(true, hasQ('Q08'), false, false);
  return map;
};

function PermissionDialog({ open, onClose, employee, onSaved }) {
  const [moduleQuyens, setModuleQuyens] = useState({});
  const [generalQuyens, setGeneralQuyens] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open && employee) {
      Promise.all([
        api.get(`/employees/${employee.maNhanVien}/permissions`),
        api.get(`/employees/${employee.maNhanVien}/module-permissions`)
      ]).then(([resGen, resMod]) => {
        const genPerms = resGen.data || [];
        setGeneralQuyens(genPerms);
        const modPerms = resMod.data || [];
        if (modPerms.length === 0 && genPerms.length > 0) {
          setModuleQuyens(autoMapGeneralToModule(genPerms));
        } else {
          const map = {};
          modPerms.forEach(mq => {
            map[mq.module] = {
              coTheXem: mq.coTheXem,
              coTheTao: mq.coTheTao,
              coTheSua: mq.coTheSua,
              coTheXoa: mq.coTheXoa
            };
          });
          setModuleQuyens(map);
        }
      }).catch(() => {
        setModuleQuyens({});
        setGeneralQuyens([]);
      });
    }
  }, [open, employee]);

  const handleToggle = (modKey, action) => {
    setModuleQuyens(prev => {
      const current = prev[modKey] || { coTheXem: false, coTheTao: false, coTheSua: false, coTheXoa: false };
      return { ...prev, [modKey]: { ...current, [action]: !current[action] } };
    });
  };

  const setAllRow = (modKey, val) => {
    setModuleQuyens(prev => ({ ...prev, [modKey]: { coTheXem: val, coTheTao: val, coTheSua: val, coTheXoa: val } }));
  };

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const payload = MODULES.map(m => {
        const q = moduleQuyens[m.key] || { coTheXem: false, coTheTao: false, coTheSua: false, coTheXoa: false };
        return {
          module: m.key,
          tenModule: m.label,
          coTheXem: q.coTheXem,
          coTheTao: q.coTheTao,
          coTheSua: q.coTheSua,
          coTheXoa: q.coTheXoa
        };
      });
      await api.put(`/employees/${employee.maNhanVien}/module-permissions`, payload);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SecurityIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Phân Quyền Module (CRUD)</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>{employee.tenNV} · Vai trò: {employee.tenVaiTro}</Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {err && <Alert severity="error" sx={{ m: 2 }}>{err}</Alert>}
        <Box sx={{ p: 2, background: '#f8fafc' }}>
          <Typography variant="subtitle2" fontWeight="bold">Quyền hiện tại:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {generalQuyens.map(q => <Chip key={q.maQ} label={q.tenQ} size="small" variant="outlined" />)}
          </Box>
        </Box>
        <DataTable
          rows={MODULES.map(m => ({ ...m, id: m.key }))}
          hideFooter
          columns={[
            { field: 'label', headerName: 'Danh Mục', flex: 1.5 },
            { field: 'coTheXem', headerName: 'Xem', width: 80, align: 'center', renderCell: (p) => <Checkbox checked={moduleQuyens[p.row.key]?.coTheXem} onChange={() => handleToggle(p.row.key, 'coTheXem')} /> },
            { field: 'coTheTao', headerName: 'Thêm', width: 80, align: 'center', renderCell: (p) => <Checkbox checked={moduleQuyens[p.row.key]?.coTheTao} onChange={() => handleToggle(p.row.key, 'coTheTao')} /> },
            { field: 'coTheSua', headerName: 'Sửa', width: 80, align: 'center', renderCell: (p) => <Checkbox checked={moduleQuyens[p.row.key]?.coTheSua} onChange={() => handleToggle(p.row.key, 'coTheSua')} /> },
            { field: 'coTheXoa', headerName: 'Xóa', width: 80, align: 'center', renderCell: (p) => <Checkbox checked={moduleQuyens[p.row.key]?.coTheXoa} onChange={() => handleToggle(p.row.key, 'coTheXoa')} /> },
            {
              field: 'all', headerName: 'Tất Cả', width: 80, align: 'center', renderCell: (p) => {
                const q = moduleQuyens[p.row.key] || {};
                const all = q.coTheXem && q.coTheTao && q.coTheSua && q.coTheXoa;
                return <Checkbox checked={!!all} color="secondary" onChange={(e) => setAllRow(p.row.key, e.target.checked)} />;
              }
            }
          ]}
        />
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Hủy</Button><Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button></DialogActions>
    </Dialog>
  );
}

// ─── Dialog Đổi Vai Trò ──────────────────────────────────────
function ChangeRoleDialog({ open, onClose, employee, roles, onSaved }) {
  const [maVaiTro, setMaVaiTro] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open && employee) setMaVaiTro(employee.maVaiTro || ''); }, [open, employee]);
  const handleSave = async () => {
    if (!maVaiTro) return;
    setSaving(true);
    try {
      await api.put(`/employees/${employee.maNhanVien}/role`, { MaVaiTro: parseInt(maVaiTro) });
      onSaved(); onClose();
    } catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };
  if (!employee) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>👑 Vai Trò</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>Nhân viên: <strong>{employee.tenNV}</strong></Typography>
        <FormControl fullWidth><InputLabel>Vai Trò Mới</InputLabel>
          <Select value={maVaiTro} label="Vai Trò Mới" onChange={e => setMaVaiTro(e.target.value)}>
            {roles.map(r => <MenuItem key={r.maVaiTro} value={r.maVaiTro}>{r.tenVT}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Hủy</Button><Button variant="contained" onClick={handleSave} disabled={saving}>Lưu</Button></DialogActions>
    </Dialog>
  );
}

// ─── Dialog Tạo Tài Khoản ────────────────────────────────────
function CreateAccountDialog({ open, onClose, employee, roles, onSaved }) {
  const [form, setForm] = useState({ tenTK: '', matKhau: '123456', email: '', maVaiTro: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open && employee) setForm({ tenTK: employee.maNV || '', matKhau: '123456', email: employee.email || '', maVaiTro: '' }); }, [open, employee]);
  const handleSave = async () => {
    if (!form.tenTK) return alert('Nhập tên tài khoản');
    setSaving(true);
    try {
      await api.post(`/employees/${employee.maNhanVien}/create-account`, { TenTK: form.tenTK, MatKhau: form.matKhau, Email: form.email, MaVaiTro: parseInt(form.maVaiTro) || 2 });
      onSaved(); onClose();
    } catch (e) { alert(e.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };
  if (!employee) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>🔑 Cấp Tài Khoản</DialogTitle>
      <DialogContent dividers>
        <TextField fullWidth margin="dense" label="Tên Đăng Nhập" value={form.tenTK} onChange={e => setForm({ ...form, tenTK: e.target.value })} />
        <TextField fullWidth margin="dense" label="Mật Khẩu" value={form.matKhau} onChange={e => setForm({ ...form, matKhau: e.target.value })} />
        <TextField fullWidth margin="dense" label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <FormControl fullWidth margin="dense"><InputLabel>Vai Trò</InputLabel>
          <Select value={form.maVaiTro} label="Vai Trò" onChange={e => setForm({ ...form, maVaiTro: e.target.value })}>
            {roles.map(r => <MenuItem key={r.maVaiTro} value={r.maVaiTro}>{r.tenVT}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Hủy</Button><Button variant="contained" onClick={handleSave} disabled={saving}>Tạo</Button></DialogActions>
    </Dialog>
  );
}

// ─── Dialog Thêm/Sửa Nhân Viên ──────────────────────────────
function EmployeeFormDialog({ open, onClose, editing, onSaved }) {
  const [form, setForm] = useState({ maNV: '', tenNV: '', sdt: '', email: '', diaChi: '', trangThai: true, sucChuaToiDa: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      if (editing) setForm({ maNV: editing.maNV || '', tenNV: editing.tenNV || '', sdt: editing.sdt || '', email: editing.email || '', diaChi: editing.diaChi || '', trangThai: editing.trangThai ?? true, sucChuaToiDa: editing.sucChuaToiDa || '' });
      else setForm({ maNV: '', tenNV: '', sdt: '', email: '', diaChi: '', trangThai: true, sucChuaToiDa: '' });
    }
  }, [open, editing]);
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, MaNV: form.maNV, TenNV: form.tenNV };
      if (editing) await api.put(`/employees/${editing.maNhanVien}`, payload);
      else await api.post('/employees', payload);
      onSaved(); onClose();
    } catch { alert('Lỗi'); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>{editing ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên'}</DialogTitle>
      <DialogContent dividers>
        <TextField fullWidth margin="dense" label="Tên Nhân Viên" value={form.tenNV} onChange={e => setForm({ ...form, tenNV: e.target.value })} />
        <TextField fullWidth margin="dense" label="Số Điện Thoại" value={form.sdt} onChange={e => setForm({ ...form, sdt: e.target.value })} />
        <TextField fullWidth margin="dense" label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <TextField fullWidth margin="dense" label="Địa Chỉ" value={form.diaChi} onChange={e => setForm({ ...form, diaChi: e.target.value })} />
        <TextField fullWidth margin="dense" label="Sức chứa xe" value={form.sucChuaToiDa} onChange={e => setForm({ ...form, sucChuaToiDa: e.target.value })} />
        <FormControlLabel control={<Switch checked={form.trangThai} onChange={e => setForm({ ...form, trangThai: e.target.checked })} />} label="Đang làm việc" />
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Hủy</Button><Button variant="contained" onClick={handleSave} disabled={saving}>Lưu</Button></DialogActions>
    </Dialog>
  );
}

// ─── Main EmployeesPage ───────────────────────────────────────
export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [permDialog, setPermDialog] = useState(null);
  const [roleDialog, setRoleDialog] = useState(null);
  const [createAccDialog, setCreateAccDialog] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { user } = usePermissions();
  const isAdmin = user?.role?.toLowerCase().includes('admin') || 
                  user?.roleName?.toLowerCase().includes('quản trị');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, roleRes] = await Promise.all([api.get('/employees'), api.get('/employees/roles')]);
      setEmployees(empRes.data || []);
      setRoles(roleRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try { await api.delete(`/employees/${id}`); load(); setDeleteConfirm(null); }
    catch { alert('Lỗi xóa. Có thể nhân viên đang gắn với dữ liệu khác.'); }
  };

  const handleToggleStatus = async (id) => {
    try { await api.put(`/employees/${id}/toggle-status`); load(); }
    catch { alert('Lỗi'); }
  };

  const handleExport = async () => {
    const res = await api.get('/employees/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NhanVien.xlsx`);
    link.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/employees/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    load();
  };

  const columns = [
    {
      field: 'tenNV', headerName: 'Nhân Viên', flex: 1.5, minWidth: 200, renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: '0.8rem' }}>{p.value?.[0]}</Avatar>
          <Box><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.value}</Typography><Typography variant="caption" color="textSecondary">{p.row.maNV}</Typography></Box>
        </Box>
      )
    },
    { field: 'sdt', headerName: 'Liên Hệ', flex: 1, renderCell: (p) => <Box><Typography variant="body2">{p.value || '—'}</Typography><Typography variant="caption">{p.row.email || '—'}</Typography></Box> },
    {
      field: 'tenTK', headerName: 'Tài Khoản', width: 140, renderCell: (p) => p.value ? (
        <Box><Typography variant="body2" fontWeight={500}>{p.value}</Typography><Chip label={p.row.trangThaiTK ? 'Bình thường' : 'Khóa'} size="small" color={p.row.trangThaiTK ? 'success' : 'error'} variant="outlined" /></Box>
      ) : (
        <Button size="small" startIcon={<PersonAddIcon />} onClick={() => setCreateAccDialog(p.row)}>Tạo TK</Button>
      )
    },
    { field: 'tenVaiTro', headerName: 'Vai Trò', width: 130, renderCell: (p) => <Chip label={p.value || '—'} size="small" color="primary" variant="outlined" /> },
    {
      field: 'trangThai', headerName: 'Trạng Thái', width: 120, renderCell: (p) => (
        <Chip label={p.value ? 'Đang làm' : 'Nghỉ việc'} size="small" color={p.value ? 'success' : 'default'} onClick={() => handleToggleStatus(p.row.maNhanVien)} sx={{ cursor: 'pointer' }} />
      )
    },
    {
      field: 'actions', headerName: 'Thao Tác', width: 180, sortable: false, renderCell: (p) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => { setEditing(p.row); setFormOpen(true); }}><EditIcon fontSize="small" /></IconButton>
          
          <Tooltip title={isAdmin ? "Thay đổi vai trò" : "Chỉ Admin mới có quyền đổi vai trò"}>
            <span>
              <IconButton size="small" sx={{ color: '#f5a623' }} onClick={() => setRoleDialog(p.row)} disabled={!p.row.maTaiKhoan || !isAdmin}>
                <AdminPanelSettingsIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={isAdmin ? "Phân quyền" : "Chỉ Admin mới có quyền phân quyền"}>
            <span>
              <IconButton size="small" sx={{ color: '#43b89c' }} onClick={() => setPermDialog(p.row)} disabled={!p.row.maTaiKhoan || !isAdmin}>
                <SecurityIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <IconButton size="small" color="error" onClick={() => setDeleteConfirm(p.row)} disabled={!isAdmin}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      )
    }
  ];

  const stats = [
    { label: 'Tổng Nhân Viên', value: employees.length, color: '#667eea' },
    { label: 'Đang Làm Việc', value: employees.filter(e => e.trangThai).length, color: '#43e97b' },
    { label: 'Có Tài Khoản', value: employees.filter(e => e.maTaiKhoan).length, color: '#f5a623' },
    { label: 'Chưa Có TK', value: employees.filter(e => !e.maTaiKhoan).length, color: '#f5576c' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box><Typography variant="h4" sx={{ fontWeight: 'bold' }}>👥 Nhân Viên</Typography><Typography variant="body2" color="textSecondary">Quản lý nhân sự và phân quyền</Typography></Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} id="import-emp" onChange={handleImport} />
          <label htmlFor="import-emp"><Button variant="outlined" component="span" startIcon={<FileUploadIcon />} color="success">Nhập Excel</Button></label>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>Xuất Excel</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Thêm</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderLeft: `4px solid ${s.color}` }}><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}><Typography variant="h5" fontWeight="bold" color={s.color}>{s.value}</Typography><Typography variant="caption" color="textSecondary">{s.label}</Typography></CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <DataTable rows={employees} columns={columns} getRowId={(row) => row.maNhanVien} loading={loading} />

      <EmployeeFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} onSaved={load} />
      <PermissionDialog open={!!permDialog} onClose={() => setPermDialog(null)} employee={permDialog} onSaved={load} />
      <ChangeRoleDialog open={!!roleDialog} onClose={() => setRoleDialog(null)} employee={roleDialog} roles={roles} onSaved={load} />
      <CreateAccountDialog open={!!createAccDialog} onClose={() => setCreateAccDialog(null)} employee={createAccDialog} roles={roles} onSaved={load} />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}><DialogTitle>Xác nhận xóa</DialogTitle><DialogContent>Xóa nhân viên <b>{deleteConfirm?.tenNV}</b>? Thao tác này không thể hoàn tác.</DialogContent><DialogActions><Button onClick={() => setDeleteConfirm(null)}>Hủy</Button><Button variant="contained" color="error" onClick={() => handleDelete(deleteConfirm.maNhanVien)}>Xóa</Button></DialogActions></Dialog>
    </Box>
  );
}
