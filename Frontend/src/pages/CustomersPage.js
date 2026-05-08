import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Chip, LinearProgress, Card, CardContent, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import customerService from '../services/customerService';
import CustomerForm from '../components/CustomerForm';
import DataTable from '../components/DataTable';
import { usePermissions } from '../contexts/PermissionContext';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { permissions } = usePermissions();
  const canCreate = permissions?.customers?.coTheTao ?? false;
  const canEdit = permissions?.customers?.coTheSua ?? false;
  const canDelete = permissions?.customers?.coTheXoa ?? false;

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
      field: 'loaiKH',
      headerName: 'Loại',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value || '—'} size="small" variant="outlined" color={params.value === 'Công ty' ? 'primary' : 'default'} />
      )
    },
    { field: 'maSoThue', headerName: 'MST', width: 120 },
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
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {canEdit && <Button size="small" onClick={() => { setEditing(params.row); setFormOpen(true); }}>Sửa</Button>}
          {canDelete && <Button size="small" color="error" onClick={() => handleDelete(params.row.maKhachHang)}>Xóa</Button>}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>👥 Quản Lý Khách Hàng</Typography>
          <Typography variant="body2" color="textSecondary">Danh sách khách hàng của cửa hàng</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} id="import-excel-customers" onChange={handleImport} />
          <label htmlFor="import-excel-customers">
            <Button variant="outlined" component="span" startIcon={<FileUploadIcon />} color="success">
              Nhập Excel
            </Button>
          </label>
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

      <DataTable 
        rows={customers}
        columns={columns}
        getRowId={(row) => row.maKhachHang}
        loading={loading}
      />

      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSave} initial={editing || {}} />
    </Box>
  );
}

export default CustomersPage;
