import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Grid, Card, CardContent, Button, Typography, Box, Chip, Skeleton, IconButton, Dialog, Snackbar, Alert
} from '@mui/material';
import { Close as CloseIcon, FlashOn as FlashIcon, ArrowBackIosNew as ArrowBackIosNewIcon, ArrowForwardIos as ArrowForwardIosIcon } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import cartService from '../services/cartService';
import flashSaleService from '../services/flashSaleService';
import FavoriteIcon from '@mui/icons-material/Favorite';
import bannerService from '../services/bannerService';
import storageHelper from '../services/storageHelper';
import ProductCard from '../components/ProductCard';

const slideInLeft = keyframes`
  0% { opacity: 0; transform: translateX(-50px); }
  100% { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  0% { opacity: 0; transform: translateX(50px); }
  100% { opacity: 1; transform: translateX(0); }
`;

const scrollMarquee = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;



const defaultBanners = [
  {
    tag: "Khám phá các sản phẩm trong danh mục vật liệu",
    title: (
      <>Sắt thép & <br /><span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>Xi măng 🏗️</span> xây dựng</>
    ),
    btnText: "Mua ngay",
    subText: "Giá tốt nhất",
    bgColor: "#aebdb5",
    rightImg: "/images/banner-right-1.png" // User will supply this later
  },
  {
    tag: "Đa dạng lựa chọn cho mọi công trình",
    title: (
      <>Gạch ốp lát & <br /><span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>Trang trí 🎨</span> cao cấp</>
    ),
    btnText: "Khám phá",
    subText: "Nhiều ưu đãi lớn",
    bgColor: "#d1c2ab",
    rightImg: "/images/banner-right-2.png"
  },
  {
    tag: "Chất lượng đảm bảo, chứng nhận quốc tế",
    title: (
      <>Thiết bị điện & <br /><span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>Chiếu sáng 💡</span> an toàn</>
    ),
    btnText: "Xem ngay",
    subText: "Bảo hành dài hạn",
    bgColor: "#aab8c2",
    rightImg: "/images/banner-right-3.png"
  }
];

const CustomerShoppingPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeFlashSale, setActiveFlashSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [bestSellerTab, setBestSellerTab] = useState('Tất cả');
  const navigate = useNavigate();

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isHoveredRef = useRef(false);
  const dragDistanceRef = useRef(0);

  useEffect(() => {
    let animationFrameId;

    const scroll = () => {
      const scrollContainer = scrollRef.current;
      if (scrollContainer && !isDragging && !isHoveredRef.current) {
        scrollContainer.scrollLeft += 1;
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft -= scrollContainer.scrollWidth / 2;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragDistanceRef.current = 0;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    isHoveredRef.current = false;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    dragDistanceRef.current = Math.abs(walk);

    let newScrollLeft = scrollLeftRef.current - walk;

    const maxScroll = scrollRef.current.scrollWidth / 2;
    if (newScrollLeft <= 0) {
      newScrollLeft += maxScroll;
    } else if (newScrollLeft > maxScroll) {
      newScrollLeft -= maxScroll;
    }

    scrollRef.current.scrollLeft = newScrollLeft;
  };

  const handleCategoryClick = (catId, e) => {
    if (dragDistanceRef.current > 5) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    navigate(`/category/${catId || ''}`);
  };

  const [favorites, setFavorites] = useState(() => storageHelper.getFavorites());

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleToggleFavorite = (product, e) => {
    if (e) e.stopPropagation();
    const productId = product.maSanPham || product.maSP;
    if (!productId) return;

    setFavorites(prev => {
      let newFavs;
      let isAdded = false;
      if (prev.includes(productId)) {
        newFavs = prev.filter(id => id !== productId);
      } else {
        newFavs = [...prev, productId];
        isAdded = true;
      }
      storageHelper.saveFavorites(newFavs);
      setSnackbar({ open: true, message: isAdded ? 'Đã thêm vào mục yêu thích!' : 'Đã bỏ khỏi mục yêu thích!', severity: isAdded ? 'success' : 'info' });
      return newFavs;
    });
  };

  const handleAddToCart = async (product, e, quantity = 1) => {
    if (e) e.stopPropagation();
    if (!product) return;
    try {
      await cartService.addToCart({
        userId: parseInt(localStorage.getItem('userId') || 1),
        productId: product.maSanPham || product.maSP,
        price: product.giaSauKhuyenMai || product.giaBan || 0,
        quantity: quantity
      });
      setSnackbar({ open: true, message: 'Đã thêm vào giỏ hàng!', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Lỗi khi thêm vào giỏ hàng!', severity: 'error' });
    }
  };

  const handleBuyNow = async (product, e) => {
    await handleAddToCart(product, e, 1);
    navigate('/shopping-cart');
  };

  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % defaultBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNextBanner = () => setBannerIndex((prev) => (prev + 1) % defaultBanners.length);
  const handlePrevBanner = () => setBannerIndex((prev) => (prev - 1 + defaultBanners.length) % defaultBanners.length);


  const handleOpenQuickView = (prod) => {
    setSelectedProduct(prod);
    setQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setQuickViewOpen(false);
  };

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch products, categories, and flash sales from real API
        const [productsRes, categoriesRes, flashSalesRes] = await Promise.all([
          productService.getAllProducts(null, false),
          fetch('http://localhost:5000/api/categories').then(r => r.json()).catch(() => []),
          flashSaleService.getActiveSales().catch(() => [])
        ]);

        // Backend response is the array directly for both of these
        const prods = Array.isArray(productsRes?.data) ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []);
        const cats = Array.isArray(categoriesRes) ? categoriesRes : (Array.isArray(categoriesRes?.data) ? categoriesRes.data : []);
        const sales = Array.isArray(flashSalesRes) ? flashSalesRes : [];

        setProducts(prods);
        setCategories(cats);
        if (sales.length > 0) {
          setActiveFlashSale(sales[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!activeFlashSale) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(activeFlashSale.thoiGianKetThuc).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeFlashSale]);

  const brandList = useMemo(() => {
    const brandMap = new Map();
    const colors = ['#607d8b', '#8d8276', '#7b9071', '#727382', '#867676', '#5c6bc0', '#8d6e63', '#a1887f'];
    let colorIndex = 0;

    products.forEach(p => {
      const name = p.thuongHieu;
      if (name && name.trim() !== '' && !brandMap.has(name)) {
        brandMap.set(name, {
          name: name,
          loc: p.xuatXu || 'Việt Nam',
          bg: colors[colorIndex % colors.length],
          logo: name.substring(0, 3).toUpperCase()
        });
        colorIndex++;
      }
    });
    
    return Array.from(brandMap.values()).slice(0, 5);
  }, [products]);

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>

      {/* Hero Section Carousel Replicating the Screenshot with Animation */}
      <Box sx={{
        bgcolor: defaultBanners[bannerIndex].bgColor,
        position: 'relative',
        minHeight: '450px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        transition: 'background-color 0.8s ease'
      }}>
        {/* Abstract Background Shapes */}
        <Box sx={{ position: 'absolute', right: '10%', top: '5%', width: '30%', height: '80%', bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', right: '5%', top: '20%', width: '300px', height: '300px', borderRadius: '50%', border: '15px solid rgba(255,255,255,0.1)', zIndex: 0 }} />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, px: { xs: 4, md: 8, lg: 12 } }}>
          <Grid container spacing={4} alignItems="center">

            {/* Left Content with Slide In Left Animation */}
            <Grid item xs={12} md={6}>
              <Box key={`text-${bannerIndex}`} sx={{ animation: `${slideInLeft} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both` }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, border: '2px solid rgba(0,0,0,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {bannerIndex === 0 ? '🏗️' : bannerIndex === 1 ? '🎨' : '💡'}
                  </Box>
                  <Typography variant="body1" sx={{ color: '#333', fontWeight: 600 }}>
                    {defaultBanners[bannerIndex].tag.split('vật liệu')[0]}
                    {defaultBanners[bannerIndex].tag.includes('vật liệu') && <span style={{ borderBottom: '2px solid #e68c55' }}>vật liệu</span>}
                    {defaultBanners[bannerIndex].tag.split('vật liệu')[1]}
                  </Typography>
                </Box>

                <Typography variant="h1" sx={{ fontSize: '3rem', color: '#333', lineHeight: 1.1, mb: 1 }}>
                  {defaultBanners[bannerIndex].title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 4 }}>
                  <Button variant="contained" sx={{ bgcolor: '#fff', color: '#000', px: 4, py: 1.5, fontSize: '1rem', '&:hover': { bgcolor: '#f4f4f4' }, borderRadius: 8, fontWeight: 'bold' }}>
                    {defaultBanners[bannerIndex].btnText}
                  </Button>
                  <Typography variant="h3" sx={{ color: '#333' }}>
                    {defaultBanners[bannerIndex].subText}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right Content with Slide In Right Animation */}
            <Grid item xs={12} md={6}>
              <Box key={`img-${bannerIndex}`} sx={{ position: 'relative', height: '333px', width: '100%', animation: `${slideInRight} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both` }}>
                <Box
                  component="img"
                  src={defaultBanners[bannerIndex].rightImg}
                  alt="Banner Decor"
                  sx={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(-10px 10px 15px rgba(0,0,0,0.2))',
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    zIndex: 2
                  }}
                  onError={(e) => {
                    // Fallback to fake blocks if image is not found
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />

                {/* Fake blocks placeholder if image not loaded yet */}
                <Box className="fallback-blocks" sx={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '250px', bgcolor: 'rgba(0,0,0,0.15)', borderRadius: '8px 8px 0 0', display: 'flex', p: 4 }}>
                  <Box sx={{ width: '40px', height: '120px', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '40px 40px 10px 10px', mr: 2, alignSelf: 'flex-end' }}></Box>
                  <Box sx={{ width: '60px', height: '100px', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '40px 40px 10px 10px', mr: 2, alignSelf: 'flex-end' }}></Box>
                  <Box sx={{ width: '80px', height: '70px', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '40px 40px 10px 10px', alignSelf: 'flex-end' }}></Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Navigation Arrows */}
        <IconButton
          onClick={handlePrevBanner}
          sx={{
            position: 'absolute',
            left: { xs: 8, md: 32 },
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.4)',
            color: '#333',
            zIndex: 10,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.8)',
              transform: 'translateY(-50%) scale(1.1)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>

        <IconButton
          onClick={handleNextBanner}
          sx={{
            position: 'absolute',
            right: { xs: 8, md: 32 },
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.4)',
            color: '#333',
            zIndex: 10,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.8)',
              transform: 'translateY(-50%) scale(1.1)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton>

        {/* Carousel Indicators */}
        <Box sx={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1, p: 1, borderRadius: '20px', zIndex: 10 }}>
          {defaultBanners.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => setBannerIndex(idx)}
              sx={{
                width: bannerIndex === idx ? 24 : 10,
                height: 10,
                borderRadius: '5px',
                bgcolor: bannerIndex === idx ? '#000' : 'rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Fahasa-style Flash Sale Section */}
      {!loading && activeFlashSale && (
        <Box sx={{ bgcolor: '#f4f3ef', pt: 6, pb: 4 }}>
          <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
            <Box sx={{
              bgcolor: '#ef4444',
              borderRadius: '12px',
              p: { xs: 2, md: 3 },
              mb: 4,
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
            }}>
              {/* Header */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, borderBottom: '1px solid rgba(255,255,255,0.2)', pb: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, md: 0 } }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, fontStyle: 'italic', color: '#fff', display: 'flex', alignItems: 'center' }}>
                    FLA<FlashIcon sx={{ color: '#fef08a', fontSize: '2.5rem' }} />H SALE
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#fff', ml: 2, display: { xs: 'none', sm: 'block' } }}>Kết thúc trong:</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ bgcolor: '#000', color: '#fff', px: 1, py: 0.5, borderRadius: '4px', fontWeight: 'bold' }}>{timeLeft.hours}</Box>
                    <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>:</Typography>
                    <Box sx={{ bgcolor: '#000', color: '#fff', px: 1, py: 0.5, borderRadius: '4px', fontWeight: 'bold' }}>{timeLeft.minutes}</Box>
                    <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>:</Typography>
                    <Box sx={{ bgcolor: '#000', color: '#fff', px: 1, py: 0.5, borderRadius: '4px', fontWeight: 'bold' }}>{timeLeft.seconds}</Box>
                  </Box>
                </Box>
                <Button
                  onClick={() => navigate('/flashsale')}
                  sx={{ color: '#fff', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                  endIcon={<Typography>&gt;</Typography>}
                >
                  Xem tất cả
                </Button>
              </Box>

              {/* Products Horizontal Scroll */}
              <Box sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 2,
                '&::-webkit-scrollbar': { height: '8px' },
                '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.4)', borderRadius: '4px' },
              }}>
                {activeFlashSale.targets?.slice(0, 8).map((prod, idx) => {
                  const total = 100; // Mock total for progress bar
                  const sold = 15; // Mock sold count
                  const percentSold = Math.min(100, Math.round((sold / total) * 100));
                  const discountPercent = prod.giaBan > 0 ? Math.round((prod.giaBan - prod.giaKhuyenMai) / prod.giaBan * 100) : 0;

                  return (
                    <Card key={idx} sx={{ minWidth: 200, maxWidth: 200, flexShrink: 0, borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }} onClick={() => navigate(`/product/${prod.maSanPham}`)}>
                      <Box sx={{ position: 'relative', height: 160, bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                        {discountPercent > 0 && (
                          <Box sx={{ position: 'absolute', top: 0, right: 0, bgcolor: '#ef4444', color: '#fff', fontWeight: 700, px: 1, py: 0.5, borderRadius: '0 0 0 8px', zIndex: 1, fontSize: '0.8rem' }}>
                            -{discountPercent}%
                          </Box>
                        )}
                        {prod.hinhAnh ? <img src={prod.hinhAnh} alt={prod.tenSanPham} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Box sx={{ fontSize: '3rem' }}>🏗️</Box>}
                      </Box>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 1, height: '40px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {prod.tenSanPham}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: '#ef4444', fontSize: '1rem' }}>
                            {prod.giaKhuyenMai?.toLocaleString('vi-VN')}đ
                          </Typography>
                        </Box>
                        {/* Progress Bar Mini */}
                        <Box sx={{ width: '100%', height: '16px', bgcolor: '#fecaca', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                          <Box sx={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentSold}%`, bgcolor: '#ef4444', borderRadius: '8px' }} />
                          <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 600, fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                            Đã bán {sold}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}

              </Box>
            </Box>
          </Container>
        </Box>
      )}

      {/* Danh mục - Grid card style (giống webbansach) */}
      <Box sx={{ bgcolor: '#f8f7f4', py: 8 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Typography variant="h3" sx={{ color: '#333', fontWeight: 700, mb: 1 }}>Danh mục vật liệu</Typography>
          <Typography variant="body1" sx={{ color: '#888', mb: 6 }}>Khám phá đa dạng vật liệu xây dựng chất lượng cao</Typography>

          <Box sx={{
            display: 'flex',
            gap: 3,
            overflowX: 'auto',
            pb: 4, // More padding for the scrollbar
            px: 1, // Slight padding to not cut off box shadows
            '&::-webkit-scrollbar': { height: '8px' },
            '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.05)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'rgba(0,0,0,0.3)' },
            scrollbarWidth: 'thin'
          }}>
            {(loading ? Array(8).fill(null) : categories).map((cat, index) => (
              <Box key={cat?.maLoaiSanPham ?? index} sx={{ minWidth: { xs: 160, sm: 220, md: 280 }, flexShrink: 0 }}>
                {loading ? (
                  <Skeleton variant="rectangular" height={170} sx={{ borderRadius: '12px' }} />
                ) : (
                  <Box
                    onClick={(e) => handleCategoryClick(cat.maLoaiSanPham, e)}
                    className="hover-orange"
                    sx={{
                      height: 170,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      perspective: '1000px',
                      transformStyle: 'preserve-3d',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                      '&:hover': {
                        transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg) translateY(-5px) scale(1.03)',
                        boxShadow: '12px 20px 40px rgba(0,0,0,0.25)',
                      },
                      // Ensure the image inside ONLY this box reacts
                      '&:hover .category-image': {
                        filter: 'brightness(1)',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    {/* Background Image with brightness control */}
                    <Box
                      className="category-image"
                      component="img"
                      src={cat.hinhAnh || 'https://via.placeholder.com/400x300?text=Vat+Lieu'}
                      alt={cat.tenLoai}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.65)',
                        transition: 'filter 0.4s ease, transform 0.4s ease',
                      }}
                    />

                    {/* Content Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 2,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: { xs: '0.9rem', md: '1.1rem' },
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                          mb: 0.2,
                        }}
                      >
                        {cat.tenLoai}
                      </Typography>
                      {cat.soSanPham !== undefined && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255,255,255,0.85)',
                            display: 'block',
                            fontSize: '0.75rem'
                          }}
                        >
                          {cat.soSanPham} sản phẩm
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Bán Chạy Nhất Tuần */}
      <Box sx={{ bgcolor: '#f4f3ef', py: 8 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          {/* Best seller tabs */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h3" sx={{ color: '#333', fontWeight: 700 }}>Bán Chạy Nhất Tuần</Typography>
            <Box sx={{ display: 'flex', gap: 3, borderBottom: '1px solid #ddd', pb: 1 }}>
              {['Tất cả', 'Xi măng', 'Sắt thép', 'Gạch đá', 'Khác'].map((tab) => (
                <Typography
                  key={tab}
                  variant="body1"
                  onClick={() => setBestSellerTab(tab)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: bestSellerTab === tab ? 700 : 400,
                    color: bestSellerTab === tab ? '#e68c55' : '#777',
                    position: 'relative',
                    pb: 0.5,
                    transition: 'color 0.2s',
                    '&:hover': { color: '#e68c55' },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: '-9px',
                      left: 0,
                      width: bestSellerTab === tab ? '100%' : '0%',
                      height: '2px',
                      bgcolor: '#e68c55',
                      transition: 'width 0.25s ease',
                    }
                  }}
                >
                  {tab}
                </Typography>
              ))}
            </Box>
          </Box>

          <Grid container spacing={3}>
            {(loading
              ? Array(5).fill(null).map((_, i) => ({ maSanPham: i, _skeleton: true }))
              : (() => {
                const keyMap = { 'Xi măng': ['xi măng', 'ximang', 'xi mang'], 'Sắt thép': ['sắt', 'thép', 'sat thep', 'sat', 'thep'], 'Gạch đá': ['gạch', 'đá', 'gach', 'da'], 'Khác': [] };
                let filtered = products;
                if (bestSellerTab !== 'Tất cả') {
                  const keywords = keyMap[bestSellerTab] || [];
                  filtered = products.filter(p => {
                    const cat = (p.tenLoai || p.tenDanhMuc || '').toLowerCase();
                    if (bestSellerTab === 'Khác') {
                      const allKeywords = Object.values(keyMap).flat();
                      return !allKeywords.some(k => cat.includes(k));
                    }
                    return keywords.some(k => cat.includes(k));
                  });
                }
                return filtered.slice(0, 5);
              })()
            ).map((prod, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={prod.maSanPham || idx}>
                {prod._skeleton ? (
                  <Skeleton variant="rectangular" height={340} sx={{ borderRadius: '12px' }} />
                ) : (
                  <ProductCard
                    product={prod}
                    isFavorite={favorites.includes(prod.maSanPham || prod.maSP)}
                    onToggleFav={handleToggleFavorite}
                    onAddToCart={handleAddToCart}
                    onQuickView={handleOpenQuickView}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Quick View Dialog */}
      <Dialog
        open={quickViewOpen}
        onClose={handleCloseQuickView}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', overflow: 'visible', position: 'relative', m: 2 } }}
      >
        <IconButton onClick={handleCloseQuickView} sx={{ position: 'absolute', top: -40, right: -40, color: '#fff' }}>
          <CloseIcon />
        </IconButton>
        {selectedProduct && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: 3 }}>
            {/* Left Image Area */}
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: 2, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, position: 'relative' }}>
                <IconButton sx={{ position: 'absolute', left: -10 }}><Typography sx={{ fontSize: '1.5rem', color: '#999' }}>{'<'}</Typography></IconButton>
                {selectedProduct.hinhAnh
                  ? <img src={selectedProduct.hinhAnh} alt={selectedProduct.tenSP} style={{ maxWidth: '90%', maxHeight: '300px', objectFit: 'contain' }} />
                  : <Box sx={{ fontSize: '8rem' }}>🏗️</Box>
                }
                <IconButton sx={{ position: 'absolute', right: -10 }}><Typography sx={{ fontSize: '1.5rem', color: '#999' }}>{'>'}</Typography></IconButton>
              </Box>
              <Button variant="contained" fullWidth disableElevation sx={{ mt: 3, bgcolor: '#f0a06c', color: '#fff', borderRadius: '4px', textTransform: 'none', '&:hover': { bgcolor: '#cc7a4a' } }}>
                Xem chi tiết
              </Button>
            </Box>

            {/* Right Info Area */}
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>{selectedProduct.tenSP}</Typography>
              <Typography variant="h6" sx={{ color: '#555', mb: 1.5, letterSpacing: 2 }}>{selectedProduct.tenLoai || 'CATEGORY'}</Typography>

              <Box sx={{ display: 'flex', mb: 2 }}>
                {[1, 2, 3, 4, 5].map(star => <Typography key={star} sx={{ color: '#f5b041', fontSize: '1.2rem' }}>★</Typography>)}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {selectedProduct.phanTramGiam > 0 && (
                  <Typography variant="h6" sx={{ color: '#aaa', textDecoration: 'line-through' }}>
                    {selectedProduct.giaBan?.toLocaleString('vi-VN')}đ
                  </Typography>
                )}
                <Typography variant="h5" sx={{ color: '#e68c55', fontWeight: 700 }}>
                  {(selectedProduct.giaSauKhuyenMai || selectedProduct.giaBan)?.toLocaleString('vi-VN')}đ
                </Typography>
                {selectedProduct.phanTramGiam > 0 && (
                  <Chip label={`-${selectedProduct.phanTramGiam}%`} size="small" sx={{ bgcolor: '#ff4d4f', color: '#fff', fontWeight: 700 }} />
                )}
              </Box>

              <Typography variant="body2" sx={{ color: '#777', mb: 3, lineHeight: 1.6 }}>
                {selectedProduct.moTa || 'Thông tin mô tả sản phẩm đang được cập nhật.'}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, pt: 2, borderTop: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #eee', borderRadius: '20px', px: 1 }}>
                  <IconButton size="small"><Typography>-</Typography></IconButton>
                  <Typography sx={{ px: 2 }}>1</Typography>
                  <IconButton size="small"><Typography>+</Typography></IconButton>
                </Box>
                <Button variant="contained" disableElevation onClick={(e) => handleAddToCart(selectedProduct, e)} sx={{ bgcolor: '#f0a06c', color: '#fff', borderRadius: '20px', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#cc7a4a' } }}>Thêm vào giỏ</Button>
                <Button variant="contained" disableElevation onClick={(e) => handleBuyNow(selectedProduct, e)} sx={{ bgcolor: '#222', color: '#fff', borderRadius: '20px', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#000' } }}>Mua ngay</Button>
              </Box>

              <Box sx={{ borderTop: '1px solid #eee', pt: 3 }}>
                <Typography variant="body2" sx={{ color: '#555', mb: 1 }}><strong>Mã SP:</strong> {selectedProduct.maSP || 'N/A'}</Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}><strong>Đơn vị tính:</strong> {selectedProduct.donViTinh || 'K/N'}</Typography>
              </Box>

            </Box>
          </Box>
        )}
      </Dialog>

      {/* Rất nhiều sản phẩm mới */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="body1" sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 2, mb: 1 }}>Danh mục</Typography>
            <Typography variant="h3" sx={{ color: '#333', fontWeight: 700 }}>Rất nhiều sản phẩm mới</Typography>
          </Box>

          <Grid container spacing={3}>
            {(loading ? Array(8).fill({}) : products.slice(0, 8)).map((prod, i) => (
              <Grid item xs={12} sm={6} md={3} key={prod.maSanPham || i}>
                {loading ? (
                  <Skeleton variant="rectangular" height={360} sx={{ borderRadius: '12px' }} />
                ) : (
                  <ProductCard
                    product={prod}
                    isFavorite={favorites.includes(prod.maSanPham || prod.maSP)}
                    onToggleFav={handleToggleFavorite}
                    onAddToCart={handleAddToCart}
                    onQuickView={handleOpenQuickView}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Mua sắm theo thương hiệu */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Typography variant="h3" sx={{ color: '#333', fontWeight: 700, mb: 1 }}>Mua sắm theo thương hiệu</Typography>
          <Typography variant="body1" sx={{ color: '#888', mb: 4 }}>Khám phá nhiều sản phẩm từ các thương hiệu nổi tiếng</Typography>

          {brandList.length > 0 ? (
            <Grid container spacing={3}>
              {brandList.map((brand, i) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
                  <Box 
                    onClick={() => navigate(`/shopping?keyword=${encodeURIComponent(brand.name)}`)}
                    sx={{
                    height: 350,
                    borderRadius: '12px',
                    bgcolor: brand.bg,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { '& > .overlay': { bgcolor: 'rgba(0,0,0,0.5)' } }
                  }}>
                    <Box className="overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.3)', transition: 'background-color 0.3s' }} />
                    <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem', color: '#000' }}>
                        {brand.logo}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>{brand.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#eee' }}>{brand.loc}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography sx={{ color: '#888' }}>Hệ thống chưa có dữ liệu thương hiệu nào.</Typography>
          )}
        </Container>
      </Box>

      {/* Bộ sưu tập (Split Layout) */}
      <Box sx={{ bgcolor: '#f4f3ef', py: 8 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Typography variant="h3" sx={{ color: '#333', fontWeight: 700, mb: 1 }}>Bộ sưu tập</Typography>
          <Typography variant="body1" sx={{ color: '#888', mb: 4 }}>Các sản phẩm phổ biến nhất từ bộ sưu tập</Typography>

          <Grid container spacing={3}>
            {/* Products Left */}
            <Grid item xs={12} md={7}>
              <Grid container spacing={3}>
                {(loading ? Array(3).fill({}) : products.slice(0, 3)).map((prod, i) => (
                  <Grid item xs={12} sm={4} key={prod.maSanPham || i}>
                    {loading ? (
                      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '12px' }} />
                    ) : (
                      <ProductCard
                        product={prod}
                        isFavorite={favorites.includes(prod.maSanPham || prod.maSP)}
                        onToggleFav={handleToggleFavorite}
                        onAddToCart={handleAddToCart}
                        onQuickView={handleOpenQuickView}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Showcase Image Right */}
            <Grid item xs={12} md={5}>
              <Box sx={{
                height: '100%',
                minHeight: 400,
                borderRadius: '12px',
                bgcolor: '#444',
                backgroundImage: 'url(https://via.placeholder.com/600x400.png?text=Room+Interior)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                {/* Hotspot indicator (Hover tooltips like the image) */}
                <Box sx={{ position: 'absolute', top: '40%', left: '30%', width: 20, height: 20, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 0 5px rgba(255,255,255,0.2)' }}>
                  <Box sx={{ width: 6, height: 6, bgcolor: '#000', borderRadius: '50%' }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerShoppingPage;
