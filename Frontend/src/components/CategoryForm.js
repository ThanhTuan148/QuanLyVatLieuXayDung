import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, CircularProgress, IconButton } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

function CategoryForm({ open, onClose, onSaved, initial }) {
  const [formData, setFormData] = useState({
    tenLoai: '',
    moTa: '',
    hinhAnh: ''
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setFormData({
        tenLoai: initial.tenLoai || '',
        moTa: initial.moTa || '',
        hinhAnh: initial.hinhAnh || ''
      });
      setPreviewUrl(initial.hinhAnh || '');
    } else {
      setFormData({ tenLoai: '', moTa: '', hinhAnh: '' });
      setPreviewUrl('');
    }
  }, [initial, open]);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(s => ({ ...s, hinhAnh: res.data.imageUrl }));
      setPreviewUrl(res.data.imageUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload ảnh thất bại.');
      setPreviewUrl('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setFormData(s => ({ ...s, hinhAnh: '' }));
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaved(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initial?.maLoaiSanPham ? 'Cập Nhật Loại Sản Phẩm' : 'Thêm Mới Loại Sản Phẩm'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Hình Ảnh</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 100, height: 100, borderRadius: 2, border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f9f9f9', position: 'relative', flexShrink: 0 }}>
                  {uploading ? <CircularProgress size={28} /> : previewUrl ? (
                    <>
                      <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPreviewUrl('')} />
                      <IconButton size="small" onClick={handleRemoveImage} sx={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { background: 'rgba(200,0,0,0.7)' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <PhotoCameraIcon sx={{ color: '#ccc', fontSize: 32 }} />
                    </Box>
                  )}
                </Box>
                <Box>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} id="category-image-input" onChange={handleImageSelect} />
                  <label htmlFor="category-image-input">
                    <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} disabled={uploading} sx={{ mb: 1 }}>
                      {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                    </Button>
                  </label>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Hỗ trợ: JPG, PNG, WebP</Typography>
                </Box>
              </Box>
            </Box>
            <TextField
              label="Tên Loại Sản Phẩm"
              required
              fullWidth
              value={formData.tenLoai}
              onChange={(e) => setFormData({ ...formData, tenLoai: e.target.value })}
            />
            <TextField
              label="Mô Tả"
              fullWidth
              multiline
              rows={3}
              value={formData.moTa}
              onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Hủy</Button>
          <Button type="submit" variant="contained">Lưu Lại</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CategoryForm;
