import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Chip, Card, CardContent, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import supplierService from '../services/supplierService';
import SupplierForm from '../components/SupplierForm';
import DataTable from '../components/DataTable';
import { usePermissions } from '../contexts/PermissionContext';

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { permissions } = usePermissions();
  const canCreate = permissions?.suppliers?.coTheTao ?? false;
  const canEdit = permissions?.suppliers?.coTheSua ?? false;
  const canDelete = permissions?.suppliers?.coTheXoa ?? false;

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try { const res = await supplierService.getAllSuppliers(); setSuppliers(res.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (payload) => {
    try {
      if (editing?.maNhaCungCap) await supplierService.updateSupplier(editing.maNhaCungCap, payload);
      else await supplierService.createSupplier(payload);
      setFormOpen(false); fetchSuppliers();
    } catch { alert('Lưu thất bại'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa nhà cung cấp này?')) return;
    try { await supplierService.deleteSupplier(id); fetchSuppliers(); }
    catch { alert('Xóa thất bại'); }
  };

  const handleExport = async () => {
    try {
      const res = await supplierService.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NhaCungCap_${new Date().getTime()}.xlsx`);
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
      await supplierService.importExcel(file);
      alert('Nhập dữ liệu thành công!');
      fetchSuppliers();
    } catch (err) {
      alert('Lỗi nhập dữ liệu');
      setLoading(false);
    }
    e.target.value = null;
  };

  const columns = [
    { 
      field: 'maNCC', 
      headerName: 'Mã NCC', 
      width: 120,
      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>{params.value}</Typography>
    },
    { 
      field: 'tenNCC', 
      headerName: 'Tên Nhà Cung Cấp', 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => <Box sx={{ fontWeight: 500 }}>{params.value}</Box>
    },
    { field: 'nguoiLienHe', headerName: 'Người Liên Hệ', width: 150 },
    { field: 'sdt', headerName: 'SĐT', width: 130 },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'diaChi', headerName: 'Địa Chỉ', width: 200 },
    { field: 'thanhPho', headerName: 'Thành Phố', width: 120 },
    { field: 'maSoThue', headerName: 'MST', width: 120 },
    {
      field: 'trangThai',
      headerName: 'Trạng Thái',
      width: 130,
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
          {canDelete && <Button size="small" color="error" onClick={() => handleDelete(params.row.maNhaCungCap)}>Xóa</Button>}
        </Box>
      )
    }
  ];

  const stats = [
    { label: 'Tổng NCC', value: suppliers.length, color: '#667eea' },
    { label: 'Đang hợp tác', value: suppliers.filter(s => s.trangThai).length, color: '#43e97b' },
    { label: 'Ngừng hợp tác', value: suppliers.filter(s => !s.trangThai).length, color: '#f5576c' },
    { label: 'TP.HCM', value: suppliers.filter(s => (s.thanhPho || '').includes('HCM') || (s.thanhPho || '').includes('Hồ Chí Minh')).length, color: '#ffa726' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>🏭 Quản Lý Nhà Cung Cấp</Typography>
          <Typography variant="body2" color="textSecondary">Danh sách các nhà cung cấp vật liệu xây dựng</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} id="import-excel-suppliers" onChange={handleImport} />
          <label htmlFor="import-excel-suppliers">
            <Button variant="outlined" component="span" startIcon={<FileUploadIcon />} color="success">
              Nhập Excel
            </Button>
          </label>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} color="primary" onClick={handleExport}>
            Xuất Excel
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2 }}>
              Thêm Nhà Cung Cấp
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
        rows={suppliers}
        columns={columns}
        getRowId={(row) => row.maNhaCungCap}
        loading={loading}
        showDateFilter={false}
      />

      <SupplierForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSave} initial={editing || {}} />
    </Box>
  );
}

export default SuppliersPage;
