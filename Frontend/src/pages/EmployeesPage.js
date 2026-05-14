import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Chip, Card, CardContent, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  FormControl, InputLabel, Select, MenuItem, Avatar, Tooltip, IconButton, Alert,
  Tabs, Tab
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

// const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// ─── Cấu trúc phân quyền theo Danh mục → Tab → Thao tác ──────
const ALL_MODULE_KEYS = [
  'products','categories','inventory','orders','customers',
  'suppliers','flashsales','promotions','deliveries','reports','employees'
];

const PERMISSION_CATEGORIES = [
  {
    key: 'products', label: '📦 Sản Phẩm', color: '#667eea',
    tabs: [
      { moduleKey: 'products', label: 'Sản Phẩm', ops: [
        { field: 'coTheXem', label: 'Xem danh sách sản phẩm' },
        { field: 'coTheTao', label: 'Thêm sản phẩm / Nhập Excel' },
        { field: 'coTheSua', label: 'Sửa thông tin sản phẩm' },
        { field: 'coTheXoa', label: 'Xóa sản phẩm' },
      ]},
      { moduleKey: 'categories', label: 'Loại Sản Phẩm', ops: [
        { field: 'coTheXem', label: 'Xem danh mục sản phẩm' },
        { field: 'coTheTao', label: 'Thêm danh mục mới' },
        { field: 'coTheSua', label: 'Sửa tên danh mục' },
        { field: 'coTheXoa', label: 'Xóa danh mục' },
      ]},
    ]
  },
  {
    key: 'orders', label: '🛒 Đơn Hàng', color: '#43e97b',
    tabs: [
      { moduleKey: 'orders', label: 'Đơn Hàng', ops: [
        { field: 'coTheXem', label: 'Xem danh sách đơn hàng' },
        { field: 'coTheTao', label: 'Tạo đơn hàng mới' },
        { field: 'coTheSua', label: 'Cập nhật trạng thái đơn' },
        { field: 'coTheXoa', label: 'Hủy / Xóa đơn hàng' },
      ]},
      { moduleKey: 'deliveries', label: 'Giao Hàng', ops: [
        { field: 'coTheXem', label: 'Xem lịch giao hàng' },
        { field: 'coTheTao', label: 'Tạo phiếu giao hàng' },
        { field: 'coTheSua', label: 'Cập nhật trạng thái giao' },
        { field: 'coTheXoa', label: 'Hủy phiếu giao hàng' },
      ]},
    ]
  },
  {
    key: 'customers', label: '👥 Khách Hàng', color: '#f5a623',
    tabs: [
      { moduleKey: 'customers', label: 'Khách Hàng', ops: [
        { field: 'coTheXem', label: 'Xem danh sách khách hàng' },
        { field: 'coTheTao', label: 'Thêm khách hàng mới' },
        { field: 'coTheSua', label: 'Sửa thông tin khách hàng' },
        { field: 'coTheXoa', label: 'Xóa tài khoản khách hàng' },
      ]},
    ]
  },
  {
    key: 'inventory', label: '🏭 Kho & Nhập Hàng', color: '#f5576c',
    tabs: [
      { moduleKey: 'inventory', label: 'Kho Hàng', ops: [
        { field: 'coTheXem', label: 'Xem tồn kho & phiếu kho' },
        { field: 'coTheTao', label: 'Tạo phiếu xuất / nhập kho' },
        { field: 'coTheSua', label: 'Điều chỉnh số lượng tồn' },
        { field: 'coTheXoa', label: 'Xóa phiếu kho' },
      ]},
      { moduleKey: 'inventory', label: 'Nhập Hàng', ops: [
        { field: 'coTheXem', label: 'Xem đơn đặt hàng nhà cung cấp' },
        { field: 'coTheTao', label: 'Tạo đơn nhập hàng mới' },
        { field: 'coTheSua', label: 'Duyệt & cập nhật đơn nhập' },
        { field: 'coTheXoa', label: 'Hủy đơn nhập hàng' },
      ]},
      { moduleKey: 'inventory', label: 'Đổi / Trả', ops: [
        { field: 'coTheXem', label: 'Xem yêu cầu đổi trả' },
        { field: 'coTheTao', label: 'Tạo phiếu đổi trả' },
        { field: 'coTheSua', label: 'Duyệt / Từ chối yêu cầu' },
        { field: 'coTheXoa', label: 'Xóa yêu cầu đổi trả' },
      ]},
      { moduleKey: 'suppliers', label: 'Nhà Cung Cấp', ops: [
        { field: 'coTheXem', label: 'Xem danh sách nhà cung cấp' },
        { field: 'coTheTao', label: 'Thêm nhà cung cấp mới' },
        { field: 'coTheSua', label: 'Sửa thông tin nhà cung cấp' },
        { field: 'coTheXoa', label: 'Xóa nhà cung cấp' },
      ]},
    ]
  },
  {
    key: 'promotions', label: '🏷️ Khuyến Mãi', color: '#fa709a',
    tabs: [
      { moduleKey: 'promotions', label: 'Khuyến Mãi SP', ops: [
        { field: 'coTheXem', label: 'Xem chương trình khuyến mãi' },
        { field: 'coTheTao', label: 'Tạo khuyến mãi sản phẩm' },
        { field: 'coTheSua', label: 'Sửa thông tin khuyến mãi' },
        { field: 'coTheXoa', label: 'Xóa khuyến mãi' },
      ]},
      { moduleKey: 'flashsales', label: 'Flash Sales', ops: [
        { field: 'coTheXem', label: 'Xem chiến dịch Flash Sale' },
        { field: 'coTheTao', label: 'Tạo Flash Sale mới' },
        { field: 'coTheSua', label: 'Sửa Flash Sale' },
        { field: 'coTheXoa', label: 'Xóa Flash Sale' },
      ]},
      { moduleKey: 'flashsales', label: 'Ưu Đãi Hệ Thống', ops: [
        { field: 'coTheXem', label: 'Xem chương trình ưu đãi' },
        { field: 'coTheTao', label: 'Tạo ưu đãi hệ thống' },
        { field: 'coTheSua', label: 'Sửa ưu đãi' },
        { field: 'coTheXoa', label: 'Xóa ưu đãi' },
      ]},
      { moduleKey: 'promotions', label: 'Coupon', ops: [
        { field: 'coTheXem', label: 'Xem danh sách coupon' },
        { field: 'coTheTao', label: 'Tạo mã coupon mới' },
        { field: 'coTheSua', label: 'Sửa coupon' },
        { field: 'coTheXoa', label: 'Xóa coupon' },
      ]},
    ]
  },
  {
    key: 'reports', label: '📊 Báo Cáo', color: '#4facfe',
    tabs: [
      { moduleKey: 'reports', label: 'Báo Cáo & Thống Kê', ops: [
        { field: 'coTheXem', label: 'Xem báo cáo & biểu đồ' },
        { field: 'coTheTao', label: 'Xuất báo cáo ra file' },
      ]},
    ]
  },
  {
    key: 'employees', label: '👨‍💼 Nhân Viên', color: '#a18cd1',
    tabs: [
      { moduleKey: 'employees', label: 'Nhân Viên', ops: [
        { field: 'coTheXem', label: 'Xem danh sách nhân viên' },
        { field: 'coTheTao', label: 'Thêm NV / Cấp tài khoản' },
        { field: 'coTheSua', label: 'Sửa thông tin / Đổi vai trò' },
        { field: 'coTheXoa', label: 'Xóa nhân viên' },
      ]},
    ]
  },
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
  const [selectedCat, setSelectedCat] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (open && employee) {
      setSelectedCat(0); setSelectedTab(0);
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
            map[mq.module] = { coTheXem: mq.coTheXem, coTheTao: mq.coTheTao, coTheSua: mq.coTheSua, coTheXoa: mq.coTheXoa };
          });
          setModuleQuyens(map);
        }
      }).catch(() => { setModuleQuyens({}); setGeneralQuyens([]); });
    }
  }, [open, employee]);

  const handleToggle = (modKey, field) => {
    setModuleQuyens(prev => {
      const cur = prev[modKey] || { coTheXem: false, coTheTao: false, coTheSua: false, coTheXoa: false };
      return { ...prev, [modKey]: { ...cur, [field]: !cur[field] } };
    });
  };

  const setAllForModule = (modKey, val) =>
    setModuleQuyens(prev => ({ ...prev, [modKey]: { coTheXem: val, coTheTao: val, coTheSua: val, coTheXoa: val } }));

  const setAllForCategory = (cat, val) =>
    [...new Set(cat.tabs.map(t => t.moduleKey))].forEach(k => setAllForModule(k, val));

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const payload = ALL_MODULE_KEYS.map(k => {
        const q = moduleQuyens[k] || { coTheXem: false, coTheTao: false, coTheSua: false, coTheXoa: false };
        return { module: k, tenModule: k, coTheXem: q.coTheXem, coTheTao: q.coTheTao, coTheSua: q.coTheSua, coTheXoa: q.coTheXoa };
      });
      await api.put(`/employees/${employee.maNhanVien}/module-permissions`, payload);
      onSaved(); onClose();
    } catch (e) { setErr(e.response?.data?.message || 'Lưu thất bại'); }
    finally { setSaving(false); }
  };

  if (!employee) return null;

  const cat = PERMISSION_CATEGORIES[selectedCat];
  const currentTab = cat?.tabs[selectedTab] || cat?.tabs[0];

  const countGranted = (c) => {
    let granted = 0, total = 0;
    c.tabs.forEach(tab => tab.ops.forEach(op => { total++; if (moduleQuyens[tab.moduleKey]?.[op.field]) granted++; }));
    return { granted, total };
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg"
      PaperProps={{ sx: { height: '85vh', display: 'flex', flexDirection: 'column' } }}>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SecurityIcon sx={{ fontSize: 28 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">🔐 Phân Quyền Chi Tiết</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>{employee.tenNV} · Vai trò: {employee.tenVaiTro}</Typography>
          </Box>
          {generalQuyens.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 280 }}>
              {generalQuyens.map(q => <Chip key={q.maQ} label={q.tenQ} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.65rem' }} />)}
            </Box>
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        {err && <Alert severity="error" sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 10 }}>{err}</Alert>}

        {/* LEFT: Danh mục */}
        <Box sx={{ width: 215, flexShrink: 0, borderRight: '1px solid #ebedf2', overflowY: 'auto', background: '#f8fafc' }}>
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Danh Mục</Typography>
          </Box>
          {PERMISSION_CATEGORIES.map((c, ci) => {
            const { granted, total } = countGranted(c);
            const sel = selectedCat === ci;
            return (
              <Box key={c.key} onClick={() => { setSelectedCat(ci); setSelectedTab(0); }}
                sx={{ mx: 1, mb: 0.5, p: 1.5, borderRadius: 2, cursor: 'pointer',
                  background: sel ? `${c.color}18` : 'transparent',
                  border: `2px solid ${sel ? c.color : 'transparent'}`,
                  transition: 'all 0.2s', '&:hover': { background: `${c.color}12` } }}>
                <Typography variant="body2" sx={{ fontWeight: sel ? 'bold' : 500, color: sel ? c.color : 'inherit', fontSize: '0.85rem' }}>{c.label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Box sx={{ flexGrow: 1, height: 4, borderRadius: 2, bgcolor: '#e0e0e0', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${total ? (granted / total) * 100 : 0}%`, bgcolor: c.color, borderRadius: 2, transition: 'width 0.3s' }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: c.color, fontWeight: 'bold', fontSize: '0.65rem', minWidth: 30 }}>{granted}/{total}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* RIGHT: Tab + Thao tác */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {cat && (
            <>
              <Box sx={{ px: 3, pt: 2, pb: 1, borderBottom: '1px solid #ebedf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: cat.color }}>{cat.label}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" sx={{ borderColor: cat.color, color: cat.color, fontSize: '0.75rem' }}
                    onClick={() => setAllForCategory(cat, true)}>✅ Cấp Tất Cả</Button>
                  <Button size="small" variant="outlined" color="error" sx={{ fontSize: '0.75rem' }}
                    onClick={() => setAllForCategory(cat, false)}>❌ Thu Hồi Tất Cả</Button>
                </Box>
              </Box>
              <Box sx={{ borderBottom: '1px solid #ebedf2', flexShrink: 0 }}>
                <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ px: 2, minHeight: 44 }}
                  TabIndicatorProps={{ style: { background: cat.color } }}>
                  {cat.tabs.map((tab, ti) => {
                    const q = moduleQuyens[tab.moduleKey] || {};
                    const cnt = tab.ops.filter(op => q[op.field]).length;
                    return (
                      <Tab key={ti} sx={{ minHeight: 44, textTransform: 'none', fontSize: '0.85rem', fontWeight: selectedTab === ti ? 'bold' : 400, color: selectedTab === ti ? cat.color : 'text.secondary' }}
                        label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><span>{tab.label}</span>
                          <Chip label={`${cnt}/${tab.ops.length}`} size="small"
                            sx={{ height: 17, fontSize: '0.6rem', bgcolor: cnt > 0 ? `${cat.color}22` : '#f0f0f0', color: cnt > 0 ? cat.color : '#aaa' }} />
                        </Box>}
                      />
                    );
                  })}
                </Tabs>
              </Box>
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
                {currentTab && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Thao tác cho tab <strong>{currentTab.label}</strong>:</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" sx={{ fontSize: '0.72rem', color: cat.color }} onClick={() => setAllForModule(currentTab.moduleKey, true)}>Cấp hết</Button>
                        <Button size="small" color="error" sx={{ fontSize: '0.72rem' }} onClick={() => setAllForModule(currentTab.moduleKey, false)}>Thu hồi</Button>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {currentTab.ops.map((op) => {
                        const checked = !!moduleQuyens[currentTab.moduleKey]?.[op.field];
                        return (
                          <Box key={op.field} onClick={() => handleToggle(currentTab.moduleKey, op.field)}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, cursor: 'pointer',
                              border: `1.5px solid ${checked ? cat.color : '#e0e0e0'}`,
                              background: checked ? `${cat.color}0d` : '#fafafa',
                              transition: 'all 0.2s', '&:hover': { borderColor: cat.color, background: `${cat.color}10` } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: checked ? cat.color : '#ccc', flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ fontWeight: checked ? 600 : 400, color: checked ? cat.color : 'text.primary' }}>{op.label}</Typography>
                            </Box>
                            <Switch checked={checked} size="small"
                              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: cat.color }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: cat.color } }}
                              onClick={e => e.stopPropagation()} onChange={() => handleToggle(currentTab.moduleKey, op.field)} />
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                )}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 4 }}>
          {saving ? 'Đang lưu...' : '💾 Lưu Phân Quyền'}
        </Button>
      </DialogActions>
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
