import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardMedia,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import { keyframes } from '@mui/system';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import bannerService from '../services/bannerService';

const slideInLeft = keyframes`
  0% { opacity: 0; transform: translateX(-50px); }
  100% { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  0% { opacity: 0; transform: translateX(50px); }
  100% { opacity: 1; transform: translateX(0); }
`;

const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        handleNext();
      }, 5000); // Tăng thời gian chuyển slide để kịp xem animation
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await bannerService.getActiveBanners();
      setBanners(data || []);
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <Card sx={{ mb: 4, position: 'relative', overflow: 'hidden', borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <Box sx={{ position: 'relative', height: { xs: 233, md: 300 } }}>
        <CardMedia
          key={`bg-${currentIndex}`} // Trigger background fade
          component="img"
          image={currentBanner.imageUrl}
          alt={currentBanner.title}
          sx={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            animation: `${fadeIn} 1s ease-in-out`
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 4, md: 10 },
            py: 4
          }}
        >
          {/* Nửa bên trái: Chứa Text */}
          <Box
            key={`text-${currentIndex}`} // Force re-animation
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              maxWidth: { xs: '80%', md: '50%' },
              animation: `${slideInLeft} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both`, // Animation cho text 
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: 'white',
                fontWeight: 800,
                mb: 2,
                textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              {currentBanner.title}
            </Typography>

            {currentBanner.description && (
              <Typography
                variant="h6"
                sx={{
                  color: '#f5f5f5',
                  mb: 4,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 400,
                  lineHeight: 1.6
                }}
              >
                {currentBanner.description}
              </Typography>
            )}

            {currentBanner.linkUrl && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 8px 16px rgba(25, 118, 210, 0.4)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 20px rgba(25, 118, 210, 0.6)',
                    backgroundColor: '#1565c0'
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={() => window.location.href = currentBanner.linkUrl}
              >
                Xem Chi Tiết
              </Button>
            )}
          </Box>

          {/* Nửa bên phải: Chứa hình ảnh no background (Placeholder hiện tại) */}
          <Box
            key={`img-${currentIndex}`}
            sx={{
              height: '100%',
              width: { xs: '0%', md: '45%' }, // Ẩn trên mobile để text không bị che
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'flex-end',
              animation: `${slideInRight} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both` // Animation chậm hơn text 1 chút
            }}
          >
            {/* CHÚ Ý: Đường dẫn ảnh để tạm là /images/banner-right.png 
                 Vui lòng cop ảnh nobackground (ví dụ từ Database) vào Frontend/public/images/ và đặt tên banner-right.png, 
                 hoặc lấy đường dẫn từ database nếu API hỗ trợ (vd: currentBanner.rightImageUrl) */}
            <Box
              component="img"
              src={currentBanner.rightImageUrl || '\Database\images\skate.png'}
              alt="Banner Decor"
              sx={{
                maxHeight: '110%', // Cho to lên một xíu để nhìn cho đã
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(-10px 10px 15px rgba(0,0,0,0.4))'
              }}
              onError={(e) => {
                // Nếu không tìm thấy ảnh, ẩn đi để không bị lỗi UI tạm thời
                e.target.style.display = 'none';
              }}
            />
          </Box>

        </Box>

        {/* Nút điều hướng (Mũi tên) */}
        <IconButton
          onClick={handlePrev}
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: 'translateY(-50%) scale(1.1)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        <IconButton
          onClick={handleNext}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: 'translateY(-50%) scale(1.1)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Dấu chấm điều hướng (Navigation Dots) */}
      {banners.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1.5 }}>
          {banners.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: index === currentIndex ? 32 : 12,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentIndex ? '#1976d2' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
          ))}
        </Box>
      )}
    </Card>
  );
}

export default BannerCarousel;
