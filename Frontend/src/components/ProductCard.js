import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, IconButton, Button, Chip } from '@mui/material';
import {
  FavoriteBorder as FavoriteIcon,
  Favorite as FavoriteFilledIcon,
  ZoomOutMap as ZoomIcon,
  ShoppingCart as CartIcon,
  ArrowBackIosNew as PrevIcon,
  ArrowForwardIos as NextIcon,
} from '@mui/icons-material';

/**
 * ProductCard – reusable card with hover‑reveal action bar + image carousel.
 *
 * Props:
 *  product        – product object (may have hinhAnh + anhPhu[])
 *  isFavorite     – boolean
 *  onToggleFav    – (product, e) => void
 *  onAddToCart    – (product, e) => void
 *  onQuickView    – (product, e) => void   (optional)
 *  compact        – boolean (smaller layout)
 *  horizontal     – boolean (list view style)
 *  showProgressBar– boolean (flash sale style)
 */
const ProductCard = ({
  product,
  isFavorite = false,
  onToggleFav,
  onAddToCart,
  onQuickView,
  compact = false,
  horizontal = false,
  showProgressBar = false,
}) => {
  const navigate = useNavigate();

  // Support various price field names from different endpoints (FlashSale uses giaKhuyenMai)
  const price = product ? (product.giaSauKhuyenMai || product.giaKhuyenMai || product.giaBan || 0) : 0;
  const originalPrice = product ? product.giaBan : 0;
  const hasDiscount = product && (product.giaSauKhuyenMai || product.giaKhuyenMai) && product.giaBan && (product.giaSauKhuyenMai || product.giaKhuyenMai) < product.giaBan;
  const discountPercent = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;
  
  const isOutOfStock = product && (product.soLuongTon <= 0 || product.soLuongTon === undefined);

  // Flash Sale progress
  const soldCount = product?.daBan || 0;
  const currentStock = product?.soLuongTon !== undefined ? product.soLuongTon : 0;
  const totalCount = product?.soLuongBanDau || 100;
  const percentSold = totalCount > 0 ? Math.min(100, Math.round((soldCount / totalCount) * 100)) : 0;
  
  const isFlashSaleEmpty = showProgressBar && (currentStock <= 0 || soldCount >= totalCount);

  const buildImages = () => {
    if (!product) return [];
    const main = product.hinhAnh || null;
    let extras = [];
    if (Array.isArray(product.anhPhu)) {
      extras = product.anhPhu;
    } else if (typeof product.anhPhu === 'string' && product.anhPhu) {
      try { extras = JSON.parse(product.anhPhu); } catch { extras = []; }
    }
    extras = extras.filter(Boolean);
    if (main) return [main, ...extras].slice(0, 4);
    return [];
  };

  const images = buildImages();
  const hasMultiple = images.length > 1;

  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const goPrev = useCallback((e) => {
    e.stopPropagation();
    setImgIdx(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback((e) => {
    e.stopPropagation();
    setImgIdx(i => (i + 1) % images.length);
  }, [images.length]);

  if (!product) return null;

  return (
    <Card
      onClick={() => navigate(`/product/${product.maSanPham || product.maSP}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        height: '100%',
        position: 'relative',
        bgcolor: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.3s, transform 0.2s',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        alignItems: horizontal ? 'center' : 'stretch',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
          transform: horizontal ? 'none' : 'translateY(-2px)',
        },
      }}
    >
      {/* Discount badge */}
      {hasDiscount && (
        <Box sx={{
          position: 'absolute', top: 12, left: 12, zIndex: 3,
          bgcolor: '#ef4444', color: '#fff', fontSize: '0.7rem',
          fontWeight: 700, px: 1, py: 0.3, borderRadius: '6px',
        }}>
          -{Math.round((1 - price / originalPrice) * 100)}%
        </Box>
      )}

      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          bgcolor: 'rgba(255,255,255,0.6)', zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <Chip 
            label="HẾT HÀNG" 
            color="error" 
            sx={{ 
              fontWeight: 800, 
              fontSize: '1rem', 
              px: 2, py: 2, 
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
              transform: 'rotate(-10deg)'
            }} 
          />
        </Box>
      )}

      {/* Image area */}
      <Box sx={{
        position: 'relative',
        height: horizontal ? '100%' : (compact ? 160 : 280),
        width: horizontal ? (compact ? 180 : 240) : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f7f7f7',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Current image */}
        <Box
          sx={{
            maxWidth: '80%',
            maxHeight: '80%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
          }}
        >
          {images.length > 0 ? (
            <img
              src={images[imgIdx]}
              alt={product.tenSP || ''}
              style={{
                maxWidth: '100%',
                maxHeight: compact ? '130px' : '220px',
                objectFit: 'contain',
                transition: 'opacity 0.25s ease',
              }}
            />
          ) : (
            <Box sx={{ fontSize: compact ? '3rem' : '4rem', color: '#c4823b', lineHeight: 1 }}>🏗️</Box>
          )}
        </Box>

        {/* Dot indicators */}
        {hasMultiple && (
          <Box sx={{
            position: 'absolute', bottom: 40, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 0.5, zIndex: 2,
            opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
          }}>
            {images.map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: i === imgIdx ? 14 : 6,
                  height: 6,
                  borderRadius: '3px',
                  bgcolor: i === imgIdx ? '#e68c55' : 'rgba(255,255,255,0.8)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
              />
            ))}
          </Box>
        )}

        {/* Prev / Next arrows */}
        {hasMultiple && hovered && (
          <>
            <IconButton
              size="small"
              onClick={goPrev}
              sx={{
                position: 'absolute', left: 8, top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 3,
                bgcolor: 'rgba(255,255,255,0.9)',
                border: '1px solid #e0e0e0',
                width: 30, height: 30,
                '&:hover': { bgcolor: '#e68c55', color: '#fff', borderColor: '#e68c55' },
              }}
            >
              <PrevIcon sx={{ fontSize: 13 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={goNext}
              sx={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 3,
                bgcolor: 'rgba(255,255,255,0.9)',
                border: '1px solid #e0e0e0',
                width: 30, height: 30,
                '&:hover': { bgcolor: '#e68c55', color: '#fff', borderColor: '#e68c55' },
              }}
            >
              <NextIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </>
        )}

        {/* Action bar */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            zIndex: 2,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
        >
          {/* Zoom */}
          {onQuickView && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onQuickView(product, e); }}
              sx={{
                bgcolor: '#fff', border: '1px solid #e0e0e0',
                borderRadius: '50%', width: 38, height: 38,
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
            >
              <ZoomIcon fontSize="small" />
            </IconButton>
          )}

          {/* Favorite */}
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onToggleFav && onToggleFav(product, e); }}
            sx={{
              bgcolor: isFavorite ? '#fff1f1' : '#fff',
              border: `1px solid ${isFavorite ? '#fca5a5' : '#e0e0e0'}`,
              borderRadius: '50%', width: 38, height: 38,
              '&:hover': { bgcolor: '#fff1f1' },
            }}
          >
            {isFavorite
              ? <FavoriteFilledIcon fontSize="small" sx={{ color: '#ef4444' }} />
              : <FavoriteIcon fontSize="small" />}
          </IconButton>

          {/* Add to cart */}
          <Button
            size="small"
            variant="contained"
            disabled={isOutOfStock}
            onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(product, e); }}
            startIcon={<CartIcon sx={{ fontSize: '14px !important', mr: -0.5 }} />}
            sx={{
              bgcolor: isOutOfStock ? '#eee' : '#fff', color: isOutOfStock ? '#999' : '#333',
              border: '1px solid #e0e0e0', borderRadius: '20px',
              textTransform: 'none', fontWeight: 600,
              px: 1.5, py: 0.6, fontSize: '0.75rem', boxShadow: 'none',
              '&:hover': { bgcolor: isOutOfStock ? '#eee' : '#e68c55', color: isOutOfStock ? '#999' : '#fff', borderColor: '#e68c55', boxShadow: 'none' },
            }}
          >
            {isOutOfStock ? 'Hết hàng' : 'Giỏ hàng'}
          </Button>

          {/* Buy Now */}
          {!isOutOfStock && (
            <Button
              size="small"
              variant="contained"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (onAddToCart) {
                  onAddToCart(product, e);
                  navigate('/shopping-cart'); // Optional: usually handled by parent, but we can do it here or let parent pass a onBuyNow prop.
                }
              }}
              sx={{
                bgcolor: '#e68c55', color: '#fff',
                border: '1px solid #e68c55', borderRadius: '20px',
                textTransform: 'none', fontWeight: 600,
                px: 1.5, py: 0.6, fontSize: '0.75rem', boxShadow: 'none',
                '&:hover': { bgcolor: '#d47a46', borderColor: '#d47a46', boxShadow: 'none' },
              }}
            >
              Mua ngay
            </Button>
          )}
        </Box>
      </Box>

      {/* Content */}
      <CardContent sx={{ 
        textAlign: horizontal ? 'left' : 'center', 
        px: horizontal ? 3 : 2, 
        pt: horizontal ? 2 : 2, 
        pb: '16px !important', 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: horizontal ? 'flex-start' : 'center' 
      }}>
        <Typography variant="caption" sx={{ color: '#aaa', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {product.tenLoai || 'Vật liệu'}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 700, color: '#222', mb: 1,
            fontSize: (compact || horizontal) ? '0.85rem' : '0.95rem',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            width: '100%'
          }}
        >
          {product.tenSP}
        </Typography>

        {horizontal && product.moTa && (
          <Typography variant="body2" sx={{ color: '#666', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.moTa}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: horizontal ? 'flex-start' : 'center', gap: 1, mt: 'auto' }}>
          <Typography variant="body1" sx={{ color: '#e68c55', fontWeight: 700 }}>
            {price.toLocaleString('vi-VN')}đ
          </Typography>
          {hasDiscount && (
            <Typography variant="caption" sx={{ color: '#bbb', textDecoration: 'line-through' }}>
              {originalPrice.toLocaleString('vi-VN')}đ
            </Typography>
          )}
        </Box>

        {/* Flash Sale Progress Bar */}
        {showProgressBar && (
          <Box sx={{ 
            width: '100%', maxWidth: '200px', height: '20px', bgcolor: '#fecaca', 
            borderRadius: '10px', position: 'relative', mt: 1.5, overflow: 'hidden'
          }}>
            {isFlashSaleEmpty ? (
               <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444', fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                 Đã hết số lượng flashsales
               </Typography>
            ) : (
               <>
                 <Box sx={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentSold}%`, bgcolor: '#ef4444', borderRadius: '10px', transition: 'width 0.5s' }} />
                 <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap', textShadow: '0px 0px 3px rgba(0,0,0,0.5)' }}>
                   Đã bán {soldCount}/{totalCount}
                 </Typography>
                 <Box sx={{ position: 'absolute', left: 4, top: 0, fontSize: '0.8rem' }}>🔥</Box>
               </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
