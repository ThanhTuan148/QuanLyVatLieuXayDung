import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Typography, Paper, Chip, LinearProgress, TextField, InputAdornment, Card, CardContent, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import productService from '../services/productService';
import ProductForm from '../components/ProductForm';
import DataTable from './DataTable';
import { usePermissions } from '../contexts/PermissionContext';

const formatVND = (v) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

let cachedProducts = null;

function ProductsTab({ showGiftsOnly = false }) {
  const [products, setProducts] = useState(cachedProducts || []);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(!cachedProducts);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewImages, setViewImages] = useState(null);
  const fileInputRef = useRef(null);

  const { permissions } = usePermissions();
  const canCreate = permissions?.products?.coTheTao ?? false;
  const canEdit = permissions?.products?.coTheSua ?? false;
  const canDelete = permissions?.products?.coTheXoa ?? false;

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    // Lọc theo IsGift: nếu p.isGift null/undefined thì coi như false
    const baseList = products.filter(p => {
      const giftStatus = !!p.isGift;
      return showGiftsOnly ? giftStatus : !giftStatus;
    });
    setFiltered(baseList);
  }, [products, showGiftsOnly]);

  const fetchProducts = async () => {
    setLoading(true);
    try { 
      if (!cachedProducts) setLoading(true);
      const res = await productService.getAllProducts(); 
      cachedProducts = res.data || [];
      setProducts(cachedProducts); 
    }
    catch (err) { 
      console.error('Fetch products error:', err);
      alert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Backend.');
    }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    try { await productService.deleteProduct(id); fetchProducts(); }
    catch { alert('Xóa thất bại'); }
  };

  const handleSave = async (payload) => {
    try {
      if (editing?.maSanPham) await productService.updateProduct(editing.maSanPham, payload);
      else await productService.createProduct(payload);
      setFormOpen(false); fetchProducts();
    } catch { alert('Lưu thất bại'); }
  };

  const handleExport = async () => {
    try {
      const res = await productService.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SanPham_${new Date().getTime()}.xlsx`);
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
      const res = await productService.importExcel(file);
      alert(res.data?.message || 'Nhập dữ liệu thành công!');
      fetchProducts();
    } catch (err) {
      alert('Lỗi nhập dữ liệu');
      setLoading(false);
    }
    e.target.value = null;
  };

  const columns = [
    { 
      field: 'maSP', 
      headerName: 'Mã SP', 
      width: 100,
      renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>{params.value}</Typography>
    },
    { 
      field: 'tenSP', 
      headerName: 'Tên Sản Phẩm', 
      minWidth: 250,
      flex: 2,
      renderCell: (params) => (
        <Box>
          <Box sx={{ fontWeight: 500, whiteSpace: 'normal', lineHeight: '1.2' }}>{params.value}</Box>
          <Box sx={{ fontSize: '0.72rem', color: '#aaa', mt: 0.3 }}>
            {params.row.moTa ? (params.row.moTa.length > 40 ? params.row.moTa.substring(0, 40) + '...' : params.row.moTa) : ''}
          </Box>
        </Box>
      )
    },
    {
      field: 'hinhAnh',
      headerName: 'Hình Ảnh',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        params.value ? (
          <img src={params.value} alt={params.row.tenSP}
            style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8, border: '1px solid #efefef', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          />
        ) : (
          <Box sx={{ width: 42, height: 42, borderRadius: 2, background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid #eee' }}>📦</Box>
        )
      )
    },
    {
      field: 'anhPhu',
      headerName: 'Ảnh Phụ',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        let imgs = [];
        if (Array.isArray(params.value)) imgs = params.value.filter(Boolean);
        else if (typeof params.value === 'string' && params.value) {
          try { imgs = JSON.parse(params.value).filter(Boolean); } catch { imgs = []; }
        }
        if (imgs.length === 0) return <Typography variant="caption" color="textDisabled">—</Typography>;
        return (
          <Button
            size="small"
            startIcon={<ImageIcon />}
            variant="outlined"
            onClick={() => setViewImages({ images: imgs, name: params.row.tenSP })}
            sx={{ fontSize: '0.65rem', py: 0, px: 1, borderRadius: 4, textTransform: 'none', height: 24 }}
          >
            {imgs.length} ảnh
          </Button>
        );
      }
    },
    {
      field: 'nhaCungCaps',
      headerName: 'Nhà cung cấp',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {params.value && params.value.length > 0 ? (
            <>
              {params.value.slice(0, 1).map((ncc, idx) => (
                <Chip key={idx} label={ncc.tenNCC} size="small" variant="outlined" 
                  sx={{ fontSize: '0.65rem', height: 18, borderColor: '#667eea', color: '#667eea' }} />
              ))}
              {params.value.length > 1 && (
                <Tooltip title={params.value.slice(1).map(n => n.tenNCC).join(', ')}>
                  <Chip label={`+${params.value.length - 1}`} size="small" 
                    sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#f0f0f0' }} />
                </Tooltip>
              )}
            </>
          ) : (
            <Typography variant="caption" color="textDisabled">Chưa gán</Typography>
          )}
        </Box>
      )
    },
    { field: 'thuongHieu', headerName: 'Thương Hiệu', width: 120 },
    { field: 'xuatXu', headerName: 'Xuất Xứ', width: 100 },
    { field: 'maLoaiSP', headerName: 'Loại SP', width: 100 },
    { field: 'donViTinh', headerName: 'ĐVT', width: 80 },
    { field: 'giaNhap', headerName: 'Giá Nhập', width: 120, valueFormatter: (params) => formatVND(params.value) },
    { field: 'giaBan', headerName: 'Giá Bán', width: 120, renderCell: (params) => <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatVND(params.value)}</Typography> },
    { field: 'mucTonToiThieu', headerName: 'Tồn Thiểu', width: 100, type: 'number' },
    {
      field: 'trangThai',
      headerName: 'Trạng Thái',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value ? 'Hoạt động' : 'Ngừng'} size="small"
          color={params.value ? 'success' : 'error'} variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
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
          {canEdit && <Button size="small" sx={{ minWidth: 40, fontSize: '0.7rem' }} onClick={() => { setEditing(params.row); setFormOpen(true); }}>Sửa</Button>}
          {canDelete && <Button size="small" color="error" sx={{ minWidth: 40, fontSize: '0.7rem' }} onClick={() => handleDelete(params.row.maSanPham)}>Xóa</Button>}
        </Box>
      )
    }
  ];

  const stats = [
    { label: showGiftsOnly ? 'Tổng quà tặng' : 'Tổng sản phẩm', value: filtered.length, color: '#667eea' },
    { label: 'Đang hoạt động', value: filtered.filter(p => p.trangThai).length, color: '#43e97b' },
    { label: 'Ngừng hoạt động', value: filtered.filter(p => !p.trangThai).length, color: '#f5576c' },
    { label: showGiftsOnly ? 'Quà tặng hết hàng' : 'Cần nhập hàng', value: filtered.filter(p => p.mucTonToiThieu > 0).length, color: '#ffa726' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{showGiftsOnly ? '🎁 Quản Lý Quà Tặng' : '📦 Quản Lý Sản Phẩm'}</Typography>
          <Typography variant="body2" color="textSecondary">{showGiftsOnly ? 'Danh sách sản phẩm quà tặng cho khách hàng' : 'Cơ sở dữ liệu vật liệu xây dựng'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {canCreate && (
            <>
              <input type="file" ref={fileInputRef} accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleImport} />
              <Button variant="outlined" startIcon={<FileUploadIcon />} color="success" onClick={() => fileInputRef.current.click()}>
                Nhập Excel
              </Button>
            </>
          )}
          <Button variant="outlined" startIcon={<FileDownloadIcon />} color="primary" onClick={handleExport}>
            Xuất Excel
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2 }}>
              {showGiftsOnly ? 'Thêm Quà Tặng' : 'Thêm Sản Phẩm'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats */}
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
        rows={filtered} 
        columns={columns} 
        getRowId={(row) => row.maSanPham} 
        loading={loading}
        showDateFilter={false}
      />

      <ProductForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSave} initial={editing || {}} />

      {/* Dialog xem ảnh phụ */}
      <Dialog open={!!viewImages} onClose={() => setViewImages(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🖼️ Ảnh phụ: {viewImages?.name}</Typography>
          <IconButton onClick={() => setViewImages(null)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {viewImages?.images.map((url, i) => (
              <Grid item xs={6} key={i}>
                <Box sx={{
                  width: '100%', height: 200, borderRadius: 2, overflow: 'hidden',
                  border: '1px solid #eee', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <img src={url} alt={`ảnh phụ ${i}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewImages(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProductsTab;
