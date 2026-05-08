import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Rating, TextField, Box, Typography,
  IconButton, ImageList, ImageListItem
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Videocam as VideoCamIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import reviewService from '../services/reviewService';

const ProductReviewDialog = ({ open, onClose, product, orderId, onReviewSuccess, editData = null }) => {
  const [rating, setRating] = useState(editData?.soSao || 5);
  const [comment, setComment] = useState(editData?.noiDung || '');
  const [images, setImages] = useState(() => {
    if (editData?.hinhAnh) {
      try {
        return JSON.parse(editData.hinhAnh);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [video, setVideo] = useState(editData?.video || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  // Reset form when editData changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setRating(editData?.soSao || 5);
      setComment(editData?.noiDung || '');
      setVideo(editData?.video || '');
      if (editData?.hinhAnh) {
        try {
          setImages(JSON.parse(editData.hinhAnh));
        } catch (e) {
          setImages([]);
        }
      } else {
        setImages([]);
      }
    }
  }, [open, editData]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Video quá lớn. Vui lòng chọn video dưới 20MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Vui lòng đăng nhập để đánh giá.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const reviewData = {
        maSanPham: product.maSanPham || product.maSP,
        maKhachHang: user.maKhachHang || user.id,
        maHoaDon: orderId,
        soSao: rating,
        noiDung: comment,
        hinhAnh: JSON.stringify(images),
        video: video
      };

      if (editData?.maDanhGia) {
        await reviewService.updateReview(editData.maDanhGia, reviewData);
      } else {
        await reviewService.submitReview(reviewData);
      }
      
      onReviewSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const errorMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : (err.response?.data?.message || 'Thao tác thất bại. Vui lòng kiểm tra lại nội dung.');
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span">Đánh giá sản phẩm</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <img 
            src={product?.hinhAnh || 'https://via.placeholder.com/100'} 
            alt={product?.tenSP} 
            style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8 }} 
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{product?.tenSP}</Typography>
        </Box>

        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>Đánh giá của bạn về sản phẩm này</Typography>
          <Rating 
            value={rating} 
            onChange={(e, newVal) => setRating(newVal)} 
            size="large"
          />
        </Box>

        <TextField
          label="Nội dung đánh giá"
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm (chất lượng, giao hàng...)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mb: 3 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Thêm hình ảnh/video (không bắt buộc)</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              sx={{ textTransform: 'none' }}
            >
              Thêm ảnh
              <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
            </Button>
            <Button
              component="label"
              variant="outlined"
              startIcon={<VideoCamIcon />}
              sx={{ textTransform: 'none' }}
            >
              {video ? 'Thay đổi video' : 'Thêm video'}
              <input type="file" hidden accept="video/*" onChange={handleVideoUpload} />
            </Button>
          </Box>
        </Box>

        {video && (
          <Box sx={{ mt: 2, position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
             <video src={video} controls style={{ width: '100%', maxHeight: 200 }} />
             <IconButton 
               size="small" 
               sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(255,255,255,0.8)' }}
               onClick={() => setVideo('')}
             >
               <DeleteIcon fontSize="small" color="error" />
             </IconButton>
          </Box>
        )}

        {images.length > 0 && (
          <ImageList cols={4} rowHeight={100} sx={{ mt: 2, borderRadius: 1, border: '1px solid #eee', p: 1 }}>
            {images.map((img, idx) => (
              <ImageListItem key={idx} sx={{ position: 'relative' }}>
                <img src={img} alt={`upload-${idx}`} style={{ height: '100%', objectFit: 'cover' }} />
                <IconButton 
                  size="small" 
                  sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)' }}
                  onClick={() => removeImage(idx)}
                >
                  <DeleteIcon fontSize="inherit" color="error" />
                </IconButton>
              </ImageListItem>
            ))}
          </ImageList>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>Hủy bỏ</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={submitting}
          sx={{ bgcolor: '#222', '&:hover': { bgcolor: '#000' } }}
        >
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductReviewDialog;
