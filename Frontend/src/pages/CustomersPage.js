import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Typography, Chip, LinearProgress, Card, CardContent, Grid, Tabs, Tab,
  Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import customerService from '../services/customerService';
import CustomerForm from '../components/CustomerForm';
import DataTable from '../components/DataTable';
import { usePermissions } from '../contexts/PermissionContext';
import ContactMessagesPage from './ContactMessagesPage';
import AdminChatPage from './AdminChatPage';

function CustomersPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainViewMode, setMainViewMode] = useState('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileInputRef = useRef(null);

  const { permissions } = usePermissions();
  const canCreate = permissions?.customers?.coTheTao ?? false;
  const canEdit = permissions?.customers?.coTheSua ?? false;
  const canDelete = permissions?.customers?.coTheXoa ?? false;
  const canViewContact = permissions?.contact?.coTheXem ?? false;
  const canViewChat = permissions?.chat?.coTheXem ?? false;

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try { const res = await customerService.getAllCustomers(); setCustomers(res.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (payload) => {
    try {
      if (editing?.maKhachHang) await customerService.updateCustomer(editing.maKhachHang, payload);
      else await customerService.createCustomer(payload);
      setFormOpen(false); fetchCustomers();
    } catch { alert('Lưu thất bại'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa khách hàng này?')) return;
    try { await customerService.deleteCustomer(id); fetchCustomers(); }
    catch { alert('Xóa thất bại'); }
  };

  const handleExport = async () => {
    try {
      const res = await customerService.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KhachHang_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      alert('Lỗi xuất file Excel');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      await customerService.importExcel(file);
      alert('Nhập dữ liệu thành công!');
      fetchCustomers();
    } catch (err) {
      alert('Lỗi nhập dữ liệu');
      setLoading(false);
    }
    e.target.value = null;
  };
  
  const handleRecalculate = async () => {
    try {
      await customerService.recalculateAllTiers();
      alert('Đã cập nhật lại chi tiêu và hạng cho tất cả khách hàng!');
      fetchCustomers();
    } catch {
      alert('Cập nhật thất bại');
    }
  };

  const columns = [
    { 
      field: 'maKH', 
      headerName: 'Mã KH', 
      width: 120,
      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>{params.value}</Typography>
    },
    { 
      field: 'tenKH', 
      headerName: 'Tên Khách Hàng', 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => <Box sx={{ fontWeight: 500 }}>{params.value}</Box>
    },
    {
      field: 'sdt',
      headerName: 'Liên Hệ',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.row.sdt || '—'}</Typography>
          <Typography variant="caption" color="textSecondary">{params.row.email || ''}</Typography>
        </Box>
      )
    },
    {
      field: 'hangThanhVien',
      headerName: 'Hạng',
      width: 140,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Đồng'} 
          size="small" 
          sx={{ 
            bgcolor: params.row.mauHang || '#CD7F32', 
            color: '#fff', 
            fontWeight: 'bold',
            minWidth: 90,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }} 
        />
      )
    },
    {
      field: 'tongChiTieu',
      headerName: 'Tổng Chi Tiêu',
      width: 150,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(params.value || 0)}
        </Typography>
      )
    },
    {
      field: 'trangThai',
      headerName: 'Trạng Thái',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value ? 'Hoạt động' : 'Ngừng'} size="small"
          color={params.value ? 'success' : 'error'} variant="outlined" />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
          {canEdit && <Button size="small" variant="outlined" onClick={() => { setEditing(params.row); setFormOpen(true); }}>Sửa</Button>}
          {canDelete && <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(params.row.maKhachHang)}>Xóa</Button>}
        </Box>
      )
    }
  ];

  const stats = [
    { label: 'Tổng KH', value: customers.length, color: '#667eea' },
    { label: 'Cá nhân', value: customers.filter(c => c.loaiKH === 'Cá nhân').length, color: '#43e97b' },
    { label: 'Công ty', value: customers.filter(c => c.loaiKH === 'Công ty').length, color: '#4facfe' },
    { label: 'Đang HĐ', value: customers.filter(c => c.trangThai).length, color: '#ffa726' },
  ];

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} textColor="primary" indicatorColor="primary">
          <Tab label="Quản lý khách hàng" value={0} sx={{ fontWeight: 'bold' }} />
          {canViewContact && <Tab label="Tư vấn" value={1} sx={{ fontWeight: 'bold' }} />}
          {canViewChat && <Tab label="Chat trực tuyến" value={2} sx={{ fontWeight: 'bold' }} />}
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>👥 Quản Lý Khách Hàng</Typography>
          <Typography variant="body2" color="textSecondary">Danh sách khách hàng của cửa hàng</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <ToggleButtonGroup
            value={mainViewMode}
            exclusive
            onChange={(e, nextMode) => { if (nextMode) setMainViewMode(nextMode); }}
            size="small"
            sx={{ mr: 1 }}
          >
            <ToggleButton value="table" sx={{ px: 2, fontWeight: 'bold' }}>
              <TableChartIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Bảng
            </ToggleButton>
            <ToggleButton value="card" sx={{ px: 2, fontWeight: 'bold' }}>
              <GridViewIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> Card
            </ToggleButton>
          </ToggleButtonGroup>
          <input type="file" ref={fileInputRef} accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleImport} />
          <Button variant="outlined" startIcon={<FileUploadIcon />} color="success" onClick={() => fileInputRef.current.click()}>
            Nhập Excel
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} color="primary" onClick={handleExport}>
            Xuất Excel
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRecalculate} sx={{ borderRadius: 2 }}>
            Tính Lại Chi Tiêu
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2 }}>
              Thêm Khách Hàng
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderRadius: 2, borderLeft: `4px solid ${s.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="textSecondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {mainViewMode === 'table' ? (
        <DataTable 
          rows={customers}
          columns={columns}
          getRowId={(row) => row.maKhachHang}
          loading={loading}
          showDateFilter={false}
        />
      ) : (
        <Grid container spacing={3}>
          {customers.map((item, idx) => (
            <Grid item xs={12} sm={6} md={4} key={item.maKhachHang || idx}>
              <Card sx={{
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {item.tenKH}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                        Mã KH: {item.maKH}
                      </Typography>
                    </Box>
                    <Chip 
                      label={item.trangThai ? 'Hoạt động' : 'Ngừng'} 
                      size="small" 
                      color={item.trangThai ? 'success' : 'error'} 
                      variant="outlined"
                      sx={{ fontWeight: 'bold', bgcolor: '#fff' }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">Liên Hệ</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        📞 {item.sdt || '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">Hạng Thành Viên</Typography>
                      <Chip 
                        label={item.hangThanhVien || 'Đồng'} 
                        size="small" 
                        sx={{ 
                          bgcolor: item.mauHang || '#CD7F32', 
                          color: '#fff', 
                          fontWeight: 'bold',
                          minWidth: 70
                        }} 
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary" display="block">Tổng Chi Tiêu</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                        💰 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.tongChiTieu || 0)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                    {canEdit && <Button size="small" variant="outlined" onClick={() => { setEditing(item); setFormOpen(true); }}>Sửa</Button>}
                    {canDelete && <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(item.maKhachHang)}>Xóa</Button>}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSave} initial={editing || {}} />
        </Box>
      )}

      {tabIndex === 1 && canViewContact && (
        <ContactMessagesPage />
      )}

      {tabIndex === 2 && canViewChat && (
        <AdminChatPage />
      )}
    </Box>
  );
}

export default CustomersPage;
