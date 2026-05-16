import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Container, Grid, Card, CardContent, Button, Typography, Box, Chip, Skeleton, IconButton, Dialog, Snackbar, Alert
} from '@mui/material';
import { Close as CloseIcon, FlashOn as FlashIcon, ArrowBackIosNew as ArrowBackIosNewIcon, ArrowForwardIos as ArrowForwardIosIcon, LocationOn as LocationOnIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import cartService from '../services/cartService';
import flashSaleService from '../services/flashSaleService';
import FavoriteIcon from '@mui/icons-material/Favorite';
import bannerService from '../services/bannerService';
import storageHelper from '../services/storageHelper';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';

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



const DEFAULT_SHOPPING_BANNERS = [
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png', bg: '#F4845F', panel: '#F79B7F', title: 'TOONHUB FIGURINES', desc: 'The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png', bg: '#6BBF7A', panel: '#85CC92', title: 'TOONHUB FIGURINES', desc: 'The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.' },
  { src: 'https://i.ibb.co/5hHx2KNM/Chat-GPT-Image-21-19-31-16-thg-5-2026-removebg-preview.png', bg: '#5A9BD5', panel: '#7CB3E5', title: 'TOONHUB FIGURINES', desc: 'The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.' }
];

let cachedData = null;

const CustomerShoppingPage = () => {
  const [shoppingBanners, setShoppingBanners] = useState(DEFAULT_SHOPPING_BANNERS);
  const [products, setProducts] = useState(cachedData ? cachedData.products : []);
  const [loading, setLoading] = useState(!cachedData);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [activeFlashSale, setActiveFlashSale] = useState(cachedData ? cachedData.activeFlashSale : null);
  const [timeLeft, setTimeLeft] = useState({ hours: '02', minutes: '00', seconds: '00' });
  const [bestSellerTab, setBestSellerTab] = useState('Tất cả');
  const navigate = useNavigate();

  const flashSaleScrollRef = useRef(null);
  const [flashSalePaused, setFlashSalePaused] = useState(false);

  useEffect(() => {
    if (flashSalePaused || !activeFlashSale) return;
    let animationFrameId;

    const scroll = () => {
      const el = flashSaleScrollRef.current;
      if (el) {
        el.scrollLeft += 1;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft -= el.scrollWidth / 2;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [flashSalePaused, activeFlashSale]);

  const handleFlashSaleScroll = (dir) => {
    const el = flashSaleScrollRef.current;
    if (el) {
      const scrollAmount = 220 * 2;
      if (dir === 'left') {
        el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const categoryScrollRef = useRef(null);

  const handleCategoryScroll = (dir) => {
    const el = categoryScrollRef.current;
    if (el) {
      const scrollAmount = 280 + 24;
      if (dir === 'left') {
        if (el.scrollLeft <= 10) {
          el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      } else {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }
  };

  const bestSellerScrollRef = useRef(null);
  const newArrivalScrollRef = useRef(null);
  const brandScrollRef = useRef(null);
  const collectionScrollRef = useRef(null);

  const handleCarouselScroll = (ref, dir, itemWidth) => {
    const el = ref.current;
    if (el) {
      const scrollAmount = itemWidth + 24;
      if (dir === 'left') {
        if (el.scrollLeft <= 10) {
          el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      } else {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }
  };

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

  const handleBuyNow = async (product, e, quantity = 1) => {
    await handleAddToCart(product, e, quantity);
    navigate('/shopping-cart');
  };

  const [bannerActive, setBannerActive] = useState(0);
  const [bannerAnimating, setBannerAnimating] = useState(false);
  const [bannerMobile, setBannerMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const active = await bannerService.getActiveBanners();
        if (active && active.length > 0) {
          setShoppingBanners(active);
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    shoppingBanners.forEach(s => { const i = new Image(); i.src = s.src; });
    const onResize = () => setBannerMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [shoppingBanners]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!bannerAnimating) {
        setBannerAnimating(true);
        setBannerActive(p => (p + 1) % shoppingBanners.length);
        setTimeout(() => setBannerAnimating(false), 650);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerAnimating, shoppingBanners.length]);

  const goBanner = useCallback((dir) => {
    if (bannerAnimating) return;
    setBannerAnimating(true);
    setBannerActive(p => dir === 'next' ? (p + 1) % shoppingBanners.length : (p + shoppingBanners.length - 1) % shoppingBanners.length);
    setTimeout(() => setBannerAnimating(false), 650);
  }, [bannerAnimating, shoppingBanners.length]);

  const len = shoppingBanners.length || 4;
  const bannerCenter = bannerActive % len;
  const bannerLeft = (bannerActive + len - 1) % len;
  const bannerRight = (bannerActive + 1) % len;
  const bannerBack = (bannerActive + 2) % len;


  const getBannerRole = (i) => i === bannerCenter ? 'center' : i === bannerLeft ? 'left' : i === bannerRight ? 'right' : 'back';

  const bannerRoleStyle = (role) => {
    const T = 'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1), bottom 650ms cubic-bezier(0.4,0,0.2,1), height 650ms cubic-bezier(0.4,0,0.2,1)';
    const base = { position: 'absolute', aspectRatio: '0.6/1', transition: T, willChange: 'transform,filter,opacity' };
    if (role === 'center') return { ...base, left: '50%', height: bannerMobile ? '60%' : '92%', bottom: bannerMobile ? '22%' : 0, transform: `translateX(-50%) scale(${bannerMobile ? 1.25 : 1.68})`, filter: 'none', opacity: 1, zIndex: 20 };
    if (role === 'left') return { ...base, left: bannerMobile ? '20%' : '30%', height: bannerMobile ? '16%' : '28%', bottom: bannerMobile ? '32%' : '12%', transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.85, zIndex: 10 };
    if (role === 'right') return { ...base, left: bannerMobile ? '80%' : '70%', height: bannerMobile ? '16%' : '28%', bottom: bannerMobile ? '32%' : '12%', transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.85, zIndex: 10 };
    if (role === 'back') return { ...base, left: '50%', height: bannerMobile ? '13%' : '22%', bottom: bannerMobile ? '32%' : '12%', transform: 'translateX(-50%) scale(1)', filter: 'blur(4px)', opacity: 1, zIndex: 5 };
    return base;
  };

  const handleOpenQuickView = (prod) => {
    setSelectedProduct(prod);
    setQuickViewQty(1);
    setQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setQuickViewOpen(false);
  };

  const [categories, setCategories] = useState(cachedData ? cachedData.categories : []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!cachedData) setLoading(true);

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

        cachedData = { products: prods, categories: cats, activeFlashSale: sales.length > 0 ? sales[0] : null };

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

  const flashSaleEndTimeRef = useRef(null);

  useEffect(() => {
    if (!activeFlashSale) return;
    if (!flashSaleEndTimeRef.current) {
      flashSaleEndTimeRef.current = new Date().getTime() + 2 * 60 * 60 * 1000;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = flashSaleEndTimeRef.current - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        setActiveFlashSale(null);
        return;
      }

      const h = Math.floor(distance / (1000 * 60 * 60));
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
          logo: name.substring(0, 3).toUpperCase(),
          image: p.hinhAnh
        });
        colorIndex++;
      }
    });

    return Array.from(brandMap.values()).slice(0, 5);
  }, [products]);

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', bgcolor: '#f8f7f4' }}>

      {/* Hero Section Carousel Replicating the Screenshot with Animation */}
      <HeroCarousel ctaLink="#products" ctaLabel="SẢN PHẨM →" mode="shopping" />


      {/* Fahasa-style Flash Sale Section */}
      {!loading && activeFlashSale && (
        <Box sx={{ pt: 6, pb: 4 }}>
          <Container maxWidth={false} sx={{ px: { xs: 2, md: 4, lg: 6 } }}>
            <Box
              onMouseEnter={() => setFlashSalePaused(true)}
              onMouseLeave={() => setFlashSalePaused(false)}
              sx={{
                position: 'relative',
                bgcolor: '#ef4444',
                borderRadius: '16px',
                p: { xs: 2, md: 4 },
                mb: 4,
                boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
                '& .flash-arrow': {
                  opacity: 0,
                  transition: 'all 0.3s ease-in-out',
                },
                '&:hover .flash-arrow': {
                  opacity: 1,
                }
              }}
            >
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

              {/* Left Arrow Floating */}
              <IconButton
                className="flash-arrow"
                onClick={() => handleFlashSaleScroll('left')}
                sx={{
                  position: 'absolute',
                  left: { xs: 8, md: 16 },
                  top: '58%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: '#ef4444',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  zIndex: 10,
                  width: { xs: 38, md: 48 },
                  height: { xs: 38, md: 48 },
                  '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
                }}
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>

              {/* Right Arrow Floating */}
              <IconButton
                className="flash-arrow"
                onClick={() => handleFlashSaleScroll('right')}
                sx={{
                  position: 'absolute',
                  right: { xs: 8, md: 16 },
                  top: '58%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: '#ef4444',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  zIndex: 10,
                  width: { xs: 38, md: 48 },
                  height: { xs: 38, md: 48 },
                  '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
                }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>

              {/* Products Horizontal Scroll */}
              <Box
                ref={flashSaleScrollRef}
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  pb: 1,
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {[...(activeFlashSale.targets?.slice(0, 8) || []), ...(activeFlashSale.targets?.slice(0, 8) || [])].map((prod, idx) => {
                  const currentStock = prod.soLuongTon !== undefined ? prod.soLuongTon : 0;
                  const sold = prod.daBan !== undefined ? prod.daBan : Math.floor((prod.maSanPham || 1) % 50); // Mock sold count
                  const total = prod.soLuongBanDau || (currentStock + sold) || 100; // Mock total for progress bar
                  const percentSold = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
                  const discountPercent = prod.giaBan > 0 ? Math.round((prod.giaBan - prod.giaKhuyenMai) / prod.giaBan * 100) : 0;
                  const isFlashSaleEmpty = currentStock <= 0 || sold >= total;

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
                        <Box sx={{ width: '100%', height: '18px', bgcolor: '#fecaca', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                          {isFlashSaleEmpty ? (
                            <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444', fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                              Đã hết số lượng flashsales
                            </Typography>
                          ) : (
                            <>
                              <Box sx={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentSold}%`, bgcolor: '#ef4444', borderRadius: '8px', transition: 'width 0.5s' }} />
                              <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 600, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                Đã bán {sold}/{total}
                              </Typography>
                            </>
                          )}
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

      {/* Danh mục - Giao diện trượt ngang với hiệu ứng trôi nổi (Floating Animation) giống trang About */}
      <Box sx={{ py: 8, position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes float0{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
          @keyframes float1{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
          @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          @keyframes float3{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
          .cat-card-about { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
          .cat-card-about:hover { transform: translateY(-8px) scale(1.03) !important; box-shadow: 0 20px 40px rgba(230,140,85,0.25) !important; border-color: #e68c55 !important; }
          .cat-card-about:hover .cat-img { transform: scale(1.1); filter: brightness(0.9); }
        `}</style>

        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 }, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              position: 'relative',
              '& .cat-arrow': { opacity: 0, transition: 'all 0.3s ease-in-out' },
              '&:hover .cat-arrow': { opacity: 1 }
            }}
          >
            <Typography variant="h3" sx={{ color: '#333', fontWeight: 700, mb: 1 }}>Danh mục vật liệu</Typography>
            <Typography variant="body1" sx={{ color: '#888', mb: 6 }}>Khám phá đa dạng vật liệu xây dựng chất lượng cao</Typography>

            {/* Left Arrow Floating */}
            <IconButton
              className="cat-arrow"
              onClick={() => handleCategoryScroll('left')}
              sx={{
                position: 'absolute',
                left: { xs: -10, md: -20 },
                top: '60%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#e68c55',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                zIndex: 10,
                width: { xs: 38, md: 48 },
                height: { xs: 38, md: 48 },
                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>

            {/* Right Arrow Floating */}
            <IconButton
              className="cat-arrow"
              onClick={() => handleCategoryScroll('right')}
              sx={{
                position: 'absolute',
                right: { xs: -10, md: -20 },
                top: '60%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#e68c55',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                zIndex: 10,
                width: { xs: 38, md: 48 },
                height: { xs: 38, md: 48 },
                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>

            {/* Scroll Container */}
            <Box
              ref={categoryScrollRef}
              sx={{
                display: 'flex',
                gap: 3,
                overflowX: 'auto',
                pb: 4, // More padding for the floating animation
                px: 1, // Slight padding to not cut off box shadows
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {(loading ? Array(8).fill(null) : categories).map((cat, index) => (
                <Box key={cat?.maLoaiSanPham ?? index} sx={{ minWidth: { xs: 160, sm: 220, md: 280 }, flexShrink: 0, pt: 3 }}>
                  {loading ? (
                    <Skeleton variant="rectangular" height={190} sx={{ borderRadius: '16px' }} />
                  ) : (
                    <Box
                      onClick={(e) => handleCategoryClick(cat.maLoaiSanPham, e)}
                      className="cat-card-about"
                      sx={{
                        height: 190, // Slightly taller for more elegance
                        borderRadius: '16px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid rgba(230,140,85,0.25)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        animation: `float${index % 4} ${5 + (index % 4) * 0.7}s ${index * 0.25}s ease-in-out infinite`,
                        bgcolor: '#fff',
                      }}
                    >
                      {/* Background Image */}
                      <Box
                        className="cat-img"
                        component="img"
                        src={cat.hinhAnh || 'https://via.placeholder.com/400x300?text=Vat+Lieu'}
                        alt={cat.tenLoai}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'brightness(0.7)',
                          transition: 'all 0.5s ease',
                        }}
                      />

                      {/* Content Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(44,24,16,0.85) 0%, rgba(44,24,16,0.2) 50%, transparent 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          p: 2.5,
                          pointerEvents: 'none',
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: { xs: '0.95rem', md: '1.15rem' },
                            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                            mb: 0.3,
                          }}
                        >
                          {cat.tenLoai}
                        </Typography>
                        {cat.soSanPham !== undefined && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#f0c080',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                              display: 'block',
                              fontSize: '0.75rem'
                            }}
                          >
                            {cat.soSanPham} SẢN PHẨM ✦
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Bán Chạy Nhất Tuần */}
      <Box sx={{ py: 8 }}>
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

          <Box
            sx={{
              position: 'relative',
              '& .carousel-arrow': { opacity: 0, transition: 'all 0.3s ease-in-out' },
              '&:hover .carousel-arrow': { opacity: 1 }
            }}
          >
            {/* Left Arrow Floating */}
            <IconButton
              className="carousel-arrow"
              onClick={() => handleCarouselScroll(bestSellerScrollRef, 'left', 260)}
              sx={{
                position: 'absolute',
                left: { xs: -10, md: -20 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#e68c55',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                zIndex: 10,
                width: { xs: 38, md: 48 },
                height: { xs: 38, md: 48 },
                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>

            {/* Right Arrow Floating */}
            <IconButton
              className="carousel-arrow"
              onClick={() => handleCarouselScroll(bestSellerScrollRef, 'right', 260)}
              sx={{
                position: 'absolute',
                right: { xs: -10, md: -20 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#e68c55',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                zIndex: 10,
                width: { xs: 38, md: 48 },
                height: { xs: 38, md: 48 },
                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>

            <Box
              ref={bestSellerScrollRef}
              sx={{
                display: 'flex',
                gap: 3,
                overflowX: 'auto',
                pb: 2,
                px: 1,
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
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
                  return filtered;
                })()
              ).map((prod, idx) => (
                <Box key={prod.maSanPham || idx} sx={{ minWidth: { xs: 200, sm: 240, md: 260 }, maxWidth: { xs: 200, sm: 240, md: 260 }, flexShrink: 0 }}>
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
                </Box>
              ))}
            </Box>
          </Box>
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
              <Button
                variant="contained"
                fullWidth
                disableElevation
                onClick={() => navigate(`/product/${selectedProduct.maSanPham || selectedProduct.maSP}`)}
                sx={{ mt: 3, bgcolor: '#f0a06c', color: '#fff', borderRadius: '4px', textTransform: 'none', '&:hover': { bgcolor: '#cc7a4a' } }}
              >
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
                  <IconButton size="small" onClick={() => setQuickViewQty(prev => Math.max(1, prev - 1))}><Typography>-</Typography></IconButton>
                  <Typography sx={{ px: 2 }}>{quickViewQty}</Typography>
                  <IconButton size="small" onClick={() => setQuickViewQty(prev => prev + 1)}><Typography>+</Typography></IconButton>
                </Box>
                <Button variant="contained" disableElevation onClick={(e) => handleAddToCart(selectedProduct, e, quickViewQty)} sx={{ bgcolor: '#f0a06c', color: '#fff', borderRadius: '20px', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#cc7a4a' } }}>Thêm vào giỏ</Button>
                <Button variant="contained" disableElevation onClick={(e) => handleBuyNow(selectedProduct, e, quickViewQty)} sx={{ bgcolor: '#222', color: '#fff', borderRadius: '20px', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#000' } }}>Mua ngay</Button>
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

          <Box
            sx={{
              position: 'relative',
              '& .carousel-arrow': { opacity: 0, transition: 'all 0.3s ease-in-out' },
              '&:hover .carousel-arrow': { opacity: 1 }
            }}
          >
            {/* Left Arrow Floating */}
            <IconButton
              className="carousel-arrow"
              onClick={() => handleCarouselScroll(newArrivalScrollRef, 'left', 260)}
              sx={{
                position: 'absolute',
                left: { xs: -10, md: -20 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#e68c55',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                zIndex: 10,
                width: { xs: 38, md: 48 },
                height: { xs: 38, md: 48 },
                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>

            {/* Right Arrow Floating */}
            <IconButton
              className="carousel-arrow"
              onClick={() => handleCarouselScroll(newArrivalScrollRef, 'right', 260)}
              sx={{
                position: 'absolute',
                right: { xs: -10, md: -20 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#e68c55',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                zIndex: 10,
                width: { xs: 38, md: 48 },
                height: { xs: 38, md: 48 },
                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>

            <Box
              ref={newArrivalScrollRef}
              sx={{
                display: 'flex',
                gap: 3,
                overflowX: 'auto',
                pb: 2,
                px: 1,
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {(loading ? Array(8).fill({}) : products).map((prod, i) => (
                <Box key={prod.maSanPham || i} sx={{ minWidth: { xs: 200, sm: 240, md: 260 }, maxWidth: { xs: 200, sm: 240, md: 260 }, flexShrink: 0 }}>
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
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Mua sắm theo thương hiệu */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Typography variant="h3" sx={{ color: '#333', fontWeight: 700, mb: 1 }}>Mua sắm theo thương hiệu</Typography>
          <Typography variant="body1" sx={{ color: '#888', mb: 4 }}>Khám phá nhiều sản phẩm từ các thương hiệu nổi tiếng</Typography>

          {brandList.length > 0 ? (
            <Box
              sx={{
                position: 'relative',
                '& .carousel-arrow': { opacity: 0, transition: 'all 0.3s ease-in-out' },
                '&:hover .carousel-arrow': { opacity: 1 }
              }}
            >
              {/* Left Arrow Floating */}
              <IconButton
                className="carousel-arrow"
                onClick={() => handleCarouselScroll(brandScrollRef, 'left', 280)}
                sx={{
                  position: 'absolute',
                  left: { xs: -10, md: -20 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  color: '#e68c55',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  zIndex: 10,
                  width: { xs: 38, md: 48 },
                  height: { xs: 38, md: 48 },
                  '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
                }}
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>

              {/* Right Arrow Floating */}
              <IconButton
                className="carousel-arrow"
                onClick={() => handleCarouselScroll(brandScrollRef, 'right', 280)}
                sx={{
                  position: 'absolute',
                  right: { xs: -10, md: -20 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  color: '#e68c55',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  zIndex: 10,
                  width: { xs: 38, md: 48 },
                  height: { xs: 38, md: 48 },
                  '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
                }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>

              <Box
                ref={brandScrollRef}
                sx={{
                  display: 'flex',
                  gap: 3,
                  overflowX: 'auto',
                  pb: 2,
                  px: 1,
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {brandList.map((brand, i) => (
                  <Box key={i} sx={{ minWidth: { xs: 220, sm: 260, md: 280 }, maxWidth: { xs: 220, sm: 260, md: 280 }, flexShrink: 0 }}>
                    <Box
                      onClick={() => navigate(`/search?brand=${encodeURIComponent(brand.name)}`)}
                      sx={{
                        height: 350,
                        borderRadius: '12px',
                        bgcolor: brand.bg,
                        backgroundImage: brand.image ? `url(${brand.image})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          '& .overlay': { bgcolor: 'rgba(0,0,0,0.6)' }
                        }
                      }}>
                      <Box className="overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', transition: 'background-color 0.3s', zIndex: 0 }} />
                      <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}>
                        <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem', color: '#000' }}>
                          {brand.logo}
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>{brand.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#eee' }}>{brand.loc}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography sx={{ color: '#888' }}>Hệ thống chưa có dữ liệu thương hiệu nào.</Typography>
          )}
        </Container>
      </Box>

      {/* Bộ sưu tập (Split Layout) */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Typography variant="h3" sx={{ color: '#333', fontWeight: 700, mb: 1 }}>Bộ sưu tập</Typography>
          <Typography variant="body1" sx={{ color: '#888', mb: 4 }}>Các sản phẩm phổ biến nhất từ bộ sưu tập</Typography>

          <Grid container spacing={3}>
            {/* Products Carousel Left */}
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  position: 'relative',
                  '& .carousel-arrow': { opacity: 0, transition: 'all 0.3s ease-in-out' },
                  '&:hover .carousel-arrow': { opacity: 1 }
                }}
              >
                {/* Left Arrow Floating */}
                <IconButton
                  className="carousel-arrow"
                  onClick={() => handleCarouselScroll(collectionScrollRef, 'left', 240)}
                  sx={{
                    position: 'absolute',
                    left: { xs: -10, md: -20 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    color: '#e68c55',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    zIndex: 10,
                    width: { xs: 38, md: 48 },
                    height: { xs: 38, md: 48 },
                    '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>

                {/* Right Arrow Floating */}
                <IconButton
                  className="carousel-arrow"
                  onClick={() => handleCarouselScroll(collectionScrollRef, 'right', 240)}
                  sx={{
                    position: 'absolute',
                    right: { xs: -10, md: -20 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    color: '#e68c55',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    zIndex: 10,
                    width: { xs: 38, md: 48 },
                    height: { xs: 38, md: 48 },
                    '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }
                  }}
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>

                <Box
                  ref={collectionScrollRef}
                  sx={{
                    display: 'flex',
                    gap: 3,
                    overflowX: 'auto',
                    pb: 2,
                    px: 1,
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                  }}
                >
                  {(loading ? Array(5).fill({}) : products).map((prod, i) => (
                    <Box key={prod.maSanPham || i} sx={{ minWidth: { xs: 180, sm: 220, md: 240 }, maxWidth: { xs: 180, sm: 220, md: 240 }, flexShrink: 0 }}>
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
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Showroom Map Right */}
            <Grid item xs={12} md={5}>
              <Box sx={{
                height: '100%',
                minHeight: 400,
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                border: '1px solid rgba(230,140,85,0.2)',
                bgcolor: '#fff',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Map Header Overlay */}
                <Box sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  right: 16,
                  zIndex: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  p: 2,
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: '#e68c55',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(230,140,85,0.4)'
                  }}>
                    <LocationOnIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#222', lineHeight: 1.2 }}>
                      Showroom VLXD Thành Đạt
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                      829 Lạc Long Quân, P. Bảy Hiền, Q. Tân Bình, TP. HCM
                    </Typography>
                  </Box>
                </Box>

                {/* Google Maps Embed */}
                <Box sx={{ flexGrow: 1, width: '100%', height: '100%', minHeight: 400 }}>
                  <iframe
                    title="Showroom Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, minHeight: '400px', width: '100%', height: '100%' }}
                    src="https://maps.google.com/maps?q=829%20Lạc%20Long%20Quân,%20Phường%208,%20Tân%20Bình,%20Thành%20phố%20Hồ%20Chí%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    allowFullScreen
                  ></iframe>
                </Box>

                {/* Open in Google Maps Button */}
                <Button
                  variant="contained"
                  startIcon={<OpenInNewIcon />}
                  href="https://maps.google.com/maps?q=829+Lạc+Long+Quân,+Tân+Bình,+TP.HCM"
                  target="_blank"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    zIndex: 1,
                    bgcolor: '#222',
                    color: '#fff',
                    borderRadius: '24px',
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    '&:hover': { bgcolor: '#e68c55' }
                  }}
                >
                  Xem bản đồ lớn
                </Button>
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
