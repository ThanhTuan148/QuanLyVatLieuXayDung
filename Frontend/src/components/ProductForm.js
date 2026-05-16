import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  FormControlLabel, Switch, Box, Typography, CircularProgress, IconButton, Divider, Tooltip,
  Autocomplete, Chip
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import api from '../services/api';

function ProductForm({ open, onClose, onSaved, initial = {} }) {
  const [form, setForm] = useState({
    tenSP: '', maSP: '', moTa: '', donViTinh: '', giaBan: '', giaNhap: '',
    maLoaiSP: '', mucTonToiThieu: 0, hinhAnh: '', ghiChu: '', trangThai: true,
    thuongHieu: '', xuatXu: '',
    maNhaCungCaps: [],
    trongLuong: '', donViTrongLuong: 'kg',
    kichThuoc: '',
    isGift: false
  });
  const [suppliers, setSuppliers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Ảnh phụ
  const [anhPhuList, setAnhPhuList] = useState([]); // string[]
  const [uploadingPhu, setUploadingPhu] = useState(false);

  const fileInputRef = useRef(null);
  const fileInputPhuRef = useRef(null);

  useEffect(() => {
    if (open) {
      loadSuppliers();
      if (initial && Object.keys(initial).length) {
        setForm({
          tenSP: initial.tenSP || '', maSP: initial.maSP || '', moTa: initial.moTa || '',
          donViTinh: initial.donViTinh || '', giaBan: initial.giaBan || '', giaNhap: initial.giaNhap || '',
          maLoaiSP: initial.maLoaiSP || '', mucTonToiThieu: initial.mucTonToiThieu || 0,
          hinhAnh: initial.hinhAnh || '', ghiChu: initial.ghiChu || '',
          thuongHieu: initial.thuongHieu || '', xuatXu: initial.xuatXu || '',
          trangThai: initial.trangThai ?? true,
          maNhaCungCaps: initial.nhaCungCaps ? initial.nhaCungCaps.map(n => n.maNCC) : [],
          trongLuong: initial.trongLuong || '',
          donViTrongLuong: initial.donViTrongLuong || 'kg',
          kichThuoc: initial.kichThuoc || '',
          isGift: initial.isGift || false
        });
        setPreviewUrl(initial.hinhAnh || '');
        // Parse anhPhu nếu có
        const raw = initial.anhPhu;
        if (Array.isArray(raw)) setAnhPhuList(raw);
        else if (typeof raw === 'string' && raw) {
          try { setAnhPhuList(JSON.parse(raw)); } catch { setAnhPhuList([]); }
        } else {
          setAnhPhuList([]);
        }
      } else {
        setForm({ tenSP: '', maSP: '', moTa: '', donViTinh: '', giaBan: '', giaNhap: '', maLoaiSP: '', mucTonToiThieu: 0, hinhAnh: '', ghiChu: '', thuongHieu: '', xuatXu: '', trangThai: true, maNhaCungCaps: [], trongLuong: '', donViTrongLuong: 'kg', kichThuoc: '', isGift: false });
        setPreviewUrl('');
        setAnhPhuList([]);
      }
    }
  }, [initial, open]);

  const loadSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (e) { console.error('Error loading suppliers', e); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };

  // Upload ảnh chính
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(s => ({ ...s, hinhAnh: res.data.imageUrl }));
      setPreviewUrl(res.data.imageUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload ảnh thất bại. Kiểm tra lại kết nối backend.');
      setPreviewUrl('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setForm(s => ({ ...s, hinhAnh: '' }));
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload ảnh phụ
  const handleAnhPhuSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (anhPhuList.length + files.length > 4) {
      alert('Tối đa 4 ảnh phụ!');
      return;
    }
    setUploadingPhu(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrls.push(res.data.imageUrl);
      }
      setAnhPhuList(prev => [...prev, ...uploadedUrls].slice(0, 4));
    } catch (err) {
      console.error('Upload ảnh phụ thất bại:', err);
      alert('Upload ảnh phụ thất bại. Kiểm tra lại kết nối backend.');
    } finally {
      setUploadingPhu(false);
      if (fileInputPhuRef.current) fileInputPhuRef.current.value = '';
    }
  };

  const handleRemoveAnhPhu = (idx) => {
    setAnhPhuList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!form.tenSP) { alert('Vui lòng nhập tên sản phẩm'); return; }
    if (!form.giaBan) { alert('Vui lòng nhập giá bán'); return; }
    const payload = {
      MaSP: form.maSP, TenSP: form.tenSP, MoTa: form.moTa, DonViTinh: form.donViTinh,
      GiaBan: parseFloat(form.giaBan) || 0, GiaNhap: parseFloat(form.giaNhap) || 0,
      MaLoaiSP: parseInt(form.maLoaiSP, 10) || 1, MucTonToiThieu: parseInt(form.mucTonToiThieu, 10) || 0,
      ThuongHieu: form.thuongHieu, XuatXu: form.xuatXu,
      HinhAnh: form.hinhAnh,
      AnhPhu: anhPhuList.length > 0 ? JSON.stringify(anhPhuList) : null,
      GhiChu: form.ghiChu, TrangThai: !!form.trangThai,
      MaNhaCungCaps: form.maNhaCungCaps,
      TrongLuong: parseFloat(form.trongLuong) || null,
      DonViTrongLuong: form.donViTrongLuong || 'kg',
      KichThuoc: form.kichThuoc,
      IsGift: !!form.isGift
    };
    onSaved(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {initial && initial.maSanPham ? '✏️ Sửa Sản Phẩm' : '➕ Thêm Sản Phẩm'}
      </DialogTitle>
      <DialogContent dividers>
        {/* Ảnh chính */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
            🖼️ Hình Ảnh Chính
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 100, height: 100, borderRadius: 2, border: '2px dashed #ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', background: '#f9f9f9', position: 'relative', flexShrink: 0,
            }}>
              {uploading ? (
                <CircularProgress size={28} />
              ) : previewUrl ? (
                <>
                  <img src={previewUrl} alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setPreviewUrl('')} />
                  <IconButton size="small" onClick={handleRemoveImage}
                    sx={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white',
                      '&:hover': { background: 'rgba(200,0,0,0.7)' }, p: 0.3 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <PhotoCameraIcon sx={{ color: '#ccc', fontSize: 32 }} />
                  <Typography variant="caption" sx={{ display: 'block', color: '#bbb' }}>Chưa có ảnh</Typography>
                </Box>
              )}
            </Box>
            <Box>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                id="product-image-input" onChange={handleImageSelect} />
              <label htmlFor="product-image-input">
                <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />}
                  disabled={uploading}
                  sx={{ mb: 1, display: 'block', borderColor: '#667eea', color: '#667eea',
                    '&:hover': { borderColor: '#764ba2', color: '#764ba2' } }}>
                  {uploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}
                </Button>
              </label>
              <Typography variant="caption" color="textSecondary">
                Hỗ trợ: JPG, PNG, WebP · Tối đa 5MB
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Ảnh phụ */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#555' }}>
              🖼️ Ảnh Phụ ({anhPhuList.length}/4)
            </Typography>
            {anhPhuList.length < 4 && (
              <>
                <input
                  ref={fileInputPhuRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  id="product-anhphu-input"
                  onChange={handleAnhPhuSelect}
                />
                <label htmlFor="product-anhphu-input">
                  <Tooltip title="Thêm ảnh phụ (tối đa 4 ảnh)">
                    <Button
                      component="span"
                      size="small"
                      variant="outlined"
                      disabled={uploadingPhu}
                      startIcon={uploadingPhu ? <CircularProgress size={14} /> : <AddPhotoAlternateIcon />}
                      sx={{ borderColor: '#e68c55', color: '#e68c55', '&:hover': { borderColor: '#c4783b', color: '#c4783b' } }}
                    >
                      {uploadingPhu ? 'Đang tải...' : 'Thêm ảnh'}
                    </Button>
                  </Tooltip>
                </label>
              </>
            )}
          </Box>

          {anhPhuList.length === 0 ? (
            <Box sx={{
              border: '2px dashed #e0e0e0', borderRadius: 2, p: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              color: '#bbb', bgcolor: '#fafafa',
            }}>
              <AddPhotoAlternateIcon sx={{ fontSize: 36, mb: 0.5 }} />
              <Typography variant="caption">Chưa có ảnh phụ. Bấm "Thêm ảnh" để tải lên.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {anhPhuList.map((url, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 90, height: 90, borderRadius: 2,
                    border: '1px solid #e0e0e0', overflow: 'hidden',
                    position: 'relative', flexShrink: 0, bgcolor: '#f5f5f5',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  }}
                >
                  <img
                    src={url}
                    alt={`Ảnh phụ ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = ''; }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAnhPhu(idx)}
                    sx={{
                      position: 'absolute', top: 2, right: 2,
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      '&:hover': { background: 'rgba(220,0,0,0.75)' },
                      p: 0.3,
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    bgcolor: 'rgba(0,0,0,0.35)', color: '#fff',
                    fontSize: '0.6rem', textAlign: 'center', py: 0.2,
                  }}>
                    Ảnh {idx + 1}
                  </Box>
                </Box>
              ))}

              {/* Placeholder ô trống */}
              {Array.from({ length: Math.max(0, 4 - anhPhuList.length) }).map((_, i) => (
                <Box
                  key={`empty-${i}`}
                  sx={{
                    width: 90, height: 90, borderRadius: 2,
                    border: '2px dashed #e8e8e8', bgcolor: '#fafafa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ddd', fontSize: '1.5rem',
                  }}
                >
                  +
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Form Fields */}
        <TextField fullWidth margin="dense" label="Mã Sản Phẩm" name="maSP" 
          value={initial?.maSP || "Hệ thống tự tạo"} 
          disabled 
          helperText={!initial?.maSP ? "Mã sẽ được tự động tạo sau khi lưu (VD: SP001)" : ""}
        />
        <TextField fullWidth margin="dense" label="Tên Sản Phẩm *" name="tenSP" value={form.tenSP} onChange={handleChange} required />
        <TextField fullWidth margin="dense" label="Đơn Vị Tính" name="donViTinh" value={form.donViTinh}
          onChange={handleChange} placeholder="Bao, Kg, Cái, Cuộn, Thùng..." />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField fullWidth margin="dense" label="Giá Bán (VND) *" name="giaBan" value={form.giaBan} onChange={handleChange} type="number" required />
          <TextField fullWidth margin="dense" label="Giá Nhập (VND)" name="giaNhap" value={form.giaNhap} onChange={handleChange} type="number" 
            disabled 
            helperText="Giá nhập sẽ được tự động cập nhật khi thực hiện Nhập hàng" 
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField fullWidth margin="dense" label="Thương Hiệu" name="thuongHieu" value={form.thuongHieu} onChange={handleChange} />
          <TextField fullWidth margin="dense" label="Xuất Xứ" name="xuatXu" value={form.xuatXu} onChange={handleChange} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField fullWidth margin="dense" label="Mã Loại SP" name="maLoaiSP" value={form.maLoaiSP} onChange={handleChange} type="number" disabled={!!initial?.maSanPham} />
          <TextField fullWidth margin="dense" label="Mức Tồn Tối Thiểu" name="mucTonToiThieu" value={form.mucTonToiThieu} onChange={handleChange} type="number" />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField fullWidth margin="dense" label="Khối lượng" name="trongLuong" value={form.trongLuong} onChange={handleChange} type="number" />
          <TextField fullWidth margin="dense" label="Đơn vị khối lượng" name="donViTrongLuong" value={form.donViTrongLuong} onChange={handleChange} placeholder="kg, tấn, m3..." />
        </Box>
        <TextField fullWidth margin="dense" label="Kích thước (Dài x Rộng x Cao)" name="kichThuoc" value={form.kichThuoc} onChange={handleChange} placeholder="VD: 11.7m hoặc 60x60" />
        <TextField fullWidth margin="dense" label="Mô Tả" name="moTa" value={form.moTa} onChange={handleChange} multiline rows={2} />
        <TextField fullWidth margin="dense" label="Ghi Chú" name="ghiChu" value={form.ghiChu} onChange={handleChange} />
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
            🏢 Các nhà cung cấp sản phẩm này
          </Typography>
          <Autocomplete
            multiple
            options={suppliers}
            getOptionLabel={(option) => option.tenNCC || ''}
            value={suppliers.filter(s => form.maNhaCungCaps.includes(s.maNhaCungCap))}
            onChange={(event, newValue) => {
              setForm(prev => ({ ...prev, maNhaCungCaps: newValue.map(v => v.maNhaCungCap) }));
            }}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Chọn Nhà cung cấp" placeholder="Tags" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option.tenNCC} {...tagProps} color="primary" variant="outlined" size="small" />;
              })
            }
          />
        </Box>

        <FormControlLabel sx={{ mt: 1 }}
          control={<Switch checked={form.trangThai}
            onChange={(e) => setForm((s) => ({ ...s, trangThai: e.target.checked }))} />}
          label="Hoạt động" />
        
        <FormControlLabel sx={{ mt: 1, ml: 2 }}
          control={<Switch checked={form.isGift} color="secondary"
            onChange={(e) => setForm((s) => ({ ...s, isGift: e.target.checked }))} />}
          label={<Typography variant="body2" sx={{ fontWeight: 'bold', color: '#e68c55' }}>Sản phẩm quà tặng</Typography>} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={uploading || uploadingPhu}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          Lưu Sản Phẩm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductForm;
