import React, { useState, useRef, useMemo } from 'react';
import { Box, Typography, Button, Paper, Fade } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { keyframes } from '@mui/system';

// Pulsing animation for the hotspots
const pulseGlow = keyframes`
  0% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
`;

const LAYOUT_SLOTS = [
  { id: 1, gridArea: { xs: '1 / 1 / 3 / 2', md: '1 / 1 / 3 / 3' }, height: { xs: 110, md: 180 }, x: '45%', y: '50%', popupAlign: 'bottom' },
  { id: 2, gridArea: { xs: '3 / 1 / 5 / 2', md: '1 / 3 / 4 / 5' }, height: { xs: 150, md: 270 }, x: '35%', y: '40%', popupAlign: 'right' },
  { id: 3, gridArea: { xs: '5 / 1 / 7 / 2', md: '1 / 5 / 3 / 7' }, height: { xs: 100, md: 180 }, x: '55%', y: '30%', popupAlign: 'bottom' },
  { id: 4, gridArea: { xs: '7 / 1 / 9 / 2', md: '1 / 7 / 4 / 9' }, height: { xs: 150, md: 270 }, x: '60%', y: '70%', popupAlign: 'left' },
  { id: 5, gridArea: { xs: '9 / 1 / 11 / 2', md: '3 / 1 / 6 / 3' }, height: { xs: 150, md: 270 }, x: '50%', y: '50%', popupAlign: 'right' },
  { id: 6, gridArea: { xs: '11 / 1 / 13 / 2', md: '4 / 3 / 6 / 5' }, height: { xs: 110, md: 180 }, x: '35%', y: '65%', popupAlign: 'right' },
  { id: 7, gridArea: { xs: '13 / 1 / 15 / 2', md: '3 / 5 / 6 / 7' }, height: { xs: 150, md: 270 }, x: '65%', y: '45%', popupAlign: 'left' },
  { id: 8, gridArea: { xs: '15 / 1 / 17 / 2', md: '4 / 7 / 6 / 9' }, height: { xs: 110, md: 180 }, x: '45%', y: '75%', popupAlign: 'left' },
  { id: 9, gridArea: { xs: '17 / 1 / 19 / 2', md: '6 / 1 / 8 / 5' }, height: { xs: 100, md: 150 }, x: '55%', y: '35%', popupAlign: 'top' },
  { id: 10, gridArea: { xs: '19 / 1 / 21 / 2', md: '6 / 5 / 8 / 9' }, height: { xs: 100, md: 150 }, x: '30%', y: '45%', popupAlign: 'top' }
];

const MOCK_FALLBACKS = [
  { title: 'Gạch men Imperial', category: 'GẠCH MEN', desc: 'Men vi tinh siêu bóng kháng khuẩn, vân đá Marble cẩm thạch tự nhiên.', price: '350.000đ/m²', img: 'https://images.unsplash.com/photo-1615529179035-e760f6a2dcee?w=500&q=80' },
  { title: 'Sơn nội thất Dulux Luxury', category: 'SƠN NƯỚC', desc: 'Sơn nước trong nhà siêu cao cấp, lau chùi tối đa, kháng khuẩn.', price: '1.250.000đ/thùng', img: 'https://images.unsplash.com/photo-1562184567-979053c5e26e?w=500&q=80' },
  { title: 'Trần thạch cao Vĩnh Tường', category: 'TRẦN THẠCH CAO', desc: 'Chống nóng, cách âm vượt trội, thiết kế giật cấp sang trọng.', price: '180.000đ/m²', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80' },
  { title: 'Kính cường lực Solar Control', category: 'CỬA & KÍNH', desc: 'Kính cách nhiệt cản 99% tia UV mang lại không gian đẳng cấp.', price: '850.000đ/m²', img: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&q=80' },
  { title: 'Thép xây dựng Hòa Phát', category: 'SẮT THÉP', desc: 'Thép chịu lực cường độ cao đạt chuẩn chất lượng quốc tế ASTM.', price: '15.500đ/kg', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80' },
  { title: 'Ngói tráng men Fujita', category: 'NGÓI LỢP', desc: 'Ngói sóng tráng men siêu nhẹ, chống rêu mốc và bền màu vĩnh cửu.', price: '28.000đ/viên', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80' },
  { title: 'Đá Granite Kim Sa Trung', category: 'ĐÁ TỰ NHIÊN', desc: 'Đá hoa cương tự nhiên siêu cứng, độ bền vĩnh cửu, vân kim sa ánh đồng.', price: '1.450.000đ/m²', img: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=500&q=80' },
  { title: 'Xi măng Insee Đa Dụng', category: 'XI MĂNG', desc: 'Bê tông mác cao cường độ sớm vượt trội, chống rạn nứt tuyệt hảo.', price: '89.000đ/bao', img: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&q=80' },
  { title: 'Cửa nhôm Xingfa Nhập Khẩu', category: 'CỬA & KÍNH', desc: 'Hệ profile nhôm cao cấp kết hợp kính hộp cách âm cách nhiệt tốt.', price: '2.200.000đ/m²', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&q=80' },
  { title: 'Gạch cổ ốp tường nghệ thuật', category: 'GẠCH TRANG TRÍ', desc: 'Gạch thẻ giả cổ mộc mạc, tạo điểm nhấn nghệ thuật độc đáo.', price: '190.000đ/m²', img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&q=80' }
];

const InteractiveLookbook = ({ products = [], onQuickView }) => {
  const [activeId, setActiveId] = useState(null);
  const hideTimeout = useRef(null);

  // Dynamically map real products from the store to the grid slots
  const displayItems = useMemo(() => {
    // Separate products with non-empty main images
    const validProducts = Array.isArray(products)
      ? products.filter(p => p.hinhAnh && p.hinhAnh.trim() !== '')
      : [];

    const activeList = validProducts.length > 0 ? validProducts : products;

    return LAYOUT_SLOTS.map((slot, index) => {
      // If we have a product for this index, use it dynamically
      if (activeList && index < activeList.length) {
        const prod = activeList[index];
        const formattedPrice = prod.giaSauKhuyenMai
          ? prod.giaSauKhuyenMai.toLocaleString('vi-VN') + 'đ'
          : (prod.giaBan ? prod.giaBan.toLocaleString('vi-VN') + 'đ' : 'Liên hệ');

        return {
          id: slot.id,
          title: prod.tenSanPham,
          category: prod.tenLoai || prod.tenDanhMuc || 'SẢN PHẨM',
          desc: prod.moTa || 'Sản phẩm vật liệu xây dựng cao cấp bền bỉ, được ứng dụng rộng rãi trong các công trình hiện đại.',
          price: formattedPrice + (prod.donViTinh ? '/' + prod.donViTinh : ''),
          img: prod.hinhAnh || 'https://via.placeholder.com/600x400?text=Vat+Lieu+Xay+Dung',
          gridArea: slot.gridArea,
          height: slot.height,
          x: slot.x,
          y: slot.y,
          popupAlign: slot.popupAlign,
          isReal: true,
          rawProduct: prod
        };
      }

      // Fallback to static mock items if there aren't enough products in the store
      const fallback = MOCK_FALLBACKS[index % MOCK_FALLBACKS.length];
      return {
        id: slot.id,
        title: fallback.title,
        category: fallback.category,
        desc: fallback.desc,
        price: fallback.price,
        img: fallback.img,
        gridArea: slot.gridArea,
        height: slot.height,
        x: slot.x,
        y: slot.y,
        popupAlign: slot.popupAlign,
        isReal: false
      };
    });
  }, [products]);

  const handleMouseEnterHotspot = (id) => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    setActiveId(id);
  };

  const handleMouseLeaveHotspot = () => {
    hideTimeout.current = setTimeout(() => {
      setActiveId(null);
    }, 250);
  };

  const handleMouseEnterPopover = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
  };

  const handleMouseLeavePopover = () => {
    setActiveId(null);
  };

  const handleAddToCart = (item) => {
    const payload = item.isReal && item.rawProduct ? item.rawProduct : item;
    if (onQuickView) {
      onQuickView(payload);
      return;
    }
    if (window.dispatchEvent) {
      const event = new CustomEvent('showProductQuickView', { detail: payload });
      window.dispatchEvent(event);
    }
  };

  return (
    <Box sx={{ py: 5, bgcolor: '#FAF9F6', borderRadius: '24px', overflow: 'hidden' }}>
      <Box sx={{ textAlign: 'center', mb: 3, px: 3 }}>
        <Typography
          variant="h3"
          sx={{
            color: '#1a1a1a',
            fontWeight: 800,
            mb: 1.5,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Không gian trải nghiệm vật tư thực tế
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#666',
            maxWidth: '750px',
            mx: 'auto',
            fontSize: { xs: '0.9rem', md: '1.05rem' },
            lineHeight: 1.6
          }}
        >
          Khám phá các dòng sản phẩm vật tư chất lượng cao đang sẵn có tại cửa hàng.
          Di chuyển chuột vào các điểm định vị trên hình ảnh để xem chi tiết và mua trực tiếp.
        </Typography>
      </Box>

      {/* Magazine Style Grid Layout */}
      <Box
        sx={{
          maxWidth: '1600px',
          mx: 'auto',
          px: { xs: 2, sm: 4, md: 6, lg: 8 },
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(8, 1fr)'
          },
          gap: 3,
          position: 'relative'
        }}
      >
        {displayItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <Box
              key={item.id}
              sx={{
                gridArea: item.gridArea,
                position: 'relative',
                borderRadius: '16px',
                overflow: isActive ? 'visible' : 'hidden',
                height: item.height,
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: isActive ? 100 : 1,
                '&:hover': {
                  transform: 'scale(1.01)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  '& .image-overlay': { opacity: 0.15 },
                  '& .hotspot-ring': { opacity: 1 }
                }
              }}
            >
              {/* Product Background Image */}
              <Box
                component="img"
                src={item.img}
                alt={item.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  pointerEvents: 'none'
                }}
              />

              {/* Elegant dark overlay */}
              <Box
                className="image-overlay"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: '#000',
                  opacity: 0.05,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none'
                }}
              />

              {/* Title & Tag in corner */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '20px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  pointerEvents: 'none',
                  maxWidth: '85%'
                }}
              >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4d23', letterSpacing: '0.1em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.category}
                </Typography>
              </Box>

              {/* Glowing Interactive Hotspot */}
              <Box
                className="hotspot-ring"
                onMouseEnter={() => handleMouseEnterHotspot(item.id)}
                onMouseLeave={handleMouseLeaveHotspot}
                sx={{
                  position: 'absolute',
                  left: item.x,
                  top: item.y,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.35)',
                  border: '1.5px solid rgba(255, 255, 255, 0.85)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                  transition: 'all 0.3s ease',
                  animation: `${pulseGlow} 2.5s infinite`,
                  '&:hover': {
                    bgcolor: 'rgba(239, 77, 35, 0.8)',
                    borderColor: '#fff',
                    transform: 'translate(-50%, -50%) scale(1.25)',
                    animation: 'none'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#fff'
                  }}
                />
              </Box>

              {/* Hover Floating Product Card */}
              <Fade in={isActive} timeout={250}>
                <Paper
                  elevation={24}
                  onMouseEnter={handleMouseEnterPopover}
                  onMouseLeave={handleMouseLeavePopover}
                  sx={{
                    position: 'absolute',
                    zIndex: 200,
                    width: 280,
                    p: 2,
                    borderRadius: '16px',
                    bgcolor: '#fff',
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 24px 50px rgba(0,0,0,0.18)',
                    pointerEvents: isActive ? 'auto' : 'none',

                    // Positioning logic depending on layout location
                    ...(item.popupAlign === 'bottom' && {
                      top: `calc(${item.y} + 24px)`,
                      left: item.x,
                      transform: 'translateX(-50%)'
                    }),
                    ...(item.popupAlign === 'top' && {
                      bottom: `calc(100% - ${item.y} + 24px)`,
                      left: item.x,
                      transform: 'translateX(-50%)'
                    }),
                    ...(item.popupAlign === 'right' && {
                      top: item.y,
                      left: `calc(${item.x} + 24px)`,
                      transform: 'translateY(-50%)'
                    }),
                    ...(item.popupAlign === 'left' && {
                      top: item.y,
                      right: `calc(100% - ${item.x} + 24px)`,
                      transform: 'translateY(-50%)'
                    })
                  }}
                >
                  <Box sx={{ position: 'relative', height: 140, borderRadius: '8px', overflow: 'hidden', mb: 1.5 }}>
                    <Box
                      component="img"
                      src={item.img}
                      alt={item.title}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'rgba(239, 77, 35, 0.95)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        px: 1,
                        py: 0.25,
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {item.category}
                    </Box>
                  </Box>

                  <Typography sx={{ fontWeight: 800, color: '#333', fontSize: '0.95rem', lineHeight: 1.25, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </Typography>

                  <Typography sx={{ fontSize: '0.75rem', color: '#666', mb: 1.5, height: 36, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                    {item.desc}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ maxWidth: '50%' }}>
                      <Typography sx={{ fontSize: '0.65rem', color: '#999', fontWeight: 600, textTransform: 'uppercase' }}>Đơn Giá</Typography>
                      <Typography sx={{ fontSize: '0.95rem', color: '#ef4d23', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.price}</Typography>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => handleAddToCart(item)}
                      startIcon={<ShoppingCartIcon sx={{ fontSize: '0.8rem !important' }} />}
                      sx={{
                        bgcolor: '#ef4d23',
                        color: '#fff',
                        textTransform: 'none',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        px: 2,
                        py: 0.75,
                        '&:hover': {
                          bgcolor: '#d9431d'
                        }
                      }}
                    >
                      Mua Ngay
                    </Button>
                  </Box>
                </Paper>
              </Fade>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default InteractiveLookbook;
