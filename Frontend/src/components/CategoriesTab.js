import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Typography, Paper, LinearProgress, Card, CardContent, Grid, Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import categoryService from '../services/categoryService';
import CategoryForm from './CategoryForm';
import DataTable from './DataTable';
import { usePermissions } from '../contexts/PermissionContext';

let cachedCategories = null;

function CategoriesTab() {
  const [categories, setCategories] = useState(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedCategories);
  const [mainViewMode, setMainViewMode] = useState('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileInputRef = useRef(null);

  const { permissions } = usePermissions();
  const canCreate = permissions?.categories?.coTheTao ?? false;
  const canEdit = permissions?.categories?.coTheSua ?? false;
  const canDelete = permissions?.categories?.coTheXoa ?? false;

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try { 
      if (!cachedCategories) setLoading(true);
      const res = await categoryService.getAllCategories(); 
      cachedCategories = res.data || [];
      setCategories(cachedCategories); 
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Danh mục này?')) return;
    try { 
      await categoryService.deleteCategory(id); 
      fetchCategories(); 
    }
    catch { alert('Xóa thất bại (Có thể do đang có sản phẩm thuộc danh mục này)'); }
  };

  const handleSave = async (payload) => {
    try {
      if (editing?.maLoaiSanPham) await categoryService.updateCategory(editing.maLoaiSanPham, payload);
      else await categoryService.createCategory(payload);
      setFormOpen(false); 
      fetchCategories();
    } catch { alert('Lưu thất bại'); }
  };

  const handleExport = async () => {
    try {
      const res = await categoryService.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LoaiSanPham_${new Date().getTime()}.xlsx`);
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
      const res = await categoryService.importExcel(file);
      alert(res.data?.message || 'Nhập dữ liệu thành công!');
      fetchCategories();
    } catch (err) {
      alert('Lỗi nhập dữ liệu');
      setLoading(false);
    }
    e.target.value = null;
  };

  const columns = [
    { 
      field: 'maLoai', 
      headerName: 'Hệ Thống ID', 
      width: 150,
      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#11998e' }}>{params.value}</Typography>
    },
    { 
      field: 'tenLoai', 
      headerName: 'Tên Loại / Danh Mục', 
      flex: 1,
      minWidth: 200,
      renderCell: (params) => <Box sx={{ fontWeight: 500 }}>{params.value}</Box>
    },
    {
      field: 'hinhAnh',
      headerName: 'Hình Ảnh',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        params.value ? (
          <img src={params.value} alt={params.row.tenLoai}
            style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8, border: '1px solid #efefef', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          />
        ) : (
          <Box sx={{ width: 42, height: 42, borderRadius: 2, background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid #eee', color: '#ccc' }}>🖼️</Box>
        )
      )
    },
    { field: 'moTa', headerName: 'Mô Tả', flex: 1.5, minWidth: 250 },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {canEdit && <Button size="small" variant="text" onClick={() => { setEditing(params.row); setFormOpen(true); }}>Sửa</Button>}
          {canDelete && <Button size="small" color="error" variant="text" onClick={() => handleDelete(params.row.maLoaiSanPham)}>Xóa</Button>}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Quản Lý Danh Mục (Loại Sản Phẩm)</Typography>
          <Typography variant="body2" color="textSecondary">Phân loại các nhóm vật liệu xây dựng</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: 2 }}>
              Thêm Phân Loại
            </Button>
          )}
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {mainViewMode === 'table' ? (
        <DataTable 
          rows={categories}
          columns={columns}
          getRowId={(row) => row.maLoai}
          loading={loading}
          showDateFilter={false}
        />
      ) : (
        <Grid container spacing={3}>
          {categories.map((item, idx) => (
            <Grid item xs={12} sm={6} md={4} key={item.maLoai || idx}>
              <Card sx={{
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    {item.hinhAnh ? (
                      <img src={item.hinhAnh} alt={item.tenLoai}
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #efefef', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                      />
                    ) : (
                      <Box sx={{ width: 60, height: 60, borderRadius: 2, background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #eee' }}>🖼️</Box>
                    )}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        {item.tenLoai}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#11998e', fontWeight: 'bold' }}>
                        ID: {item.maLoai}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="body2" sx={{ color: '#555', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 60 }}>
                    {item.moTa || 'Chưa có mô tả'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                    {canEdit && <Button size="small" variant="outlined" onClick={() => { setEditing(item); setFormOpen(true); }}>Sửa</Button>}
                    {canDelete && <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(item.maLoaiSanPham)}>Xóa</Button>}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CategoryForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSave} initial={editing || {}} />
    </Box>
  );
}

export default CategoriesTab;
