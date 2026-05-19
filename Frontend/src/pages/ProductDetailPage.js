import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Grid, Box, Typography, Button, IconButton, Breadcrumbs, Link, Divider, Skeleton, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Badge, Autocomplete, TextField, Stack, Rating, Avatar
} from '@mui/material';
import {
  FavoriteBorder as FavoriteIcon,
  Favorite as FavoriteFilledIcon,
  CompareArrows as CompareIcon,
  Straighten as RulerIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  LocalOffer as TagIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Pinterest as PinterestIcon,
  LinkedIn as LinkedInIcon,
  EventSeat as ChairIcon,
  TableRestaurant as TableIcon,
  Weekend as SofaIcon,
  Inventory2 as StorageIcon,
  Videocam as VideoCamIcon
} from '@mui/icons-material';
import productService from '../services/productService';
import cartService from '../services/cartService';
import storageHelper from '../services/storageHelper';
import reviewService from '../services/reviewService';
import ProductCard from '../components/ProductCard';

let cachedAllProducts = null;
let cachedProductDetails = {};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(cachedProductDetails[id] || null);
  const [loading, setLoading] = useState(!cachedProductDetails[id]);
  const [relatedProducts, setRelatedProducts] = useState(() => {
     if (cachedAllProducts) return cachedAllProducts.filter(p => (p.maSanPham || p.maSP) != id).slice(0, 4);
     return [];
  });
  const [allProductsState, setAllProductsState] = useState(cachedAllProducts || []);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // Review state
  const [reviewsData, setReviewsData] = useState({ averageRating: 0, totalCount: 0, reviews: [] });

  // Compare state
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showAddCompare, setShowAddCompare] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [previewType, setPreviewType] = useState('image'); // 'image' or 'video'

  // Favorites state
  const [favorites, setFavorites] = useState(() => storageHelper.getFavorites());

  useEffect(() => {
    const fetchProduct = async () => {
      if (!cachedProductDetails[id]) setLoading(true);
      try {
        // Fetch raw product
        const res = await productService.getProductById(id);
        let data = res.data || res; // depending on interceptor
        
        // Fetch reviews
        try {
          const revRes = await reviewService.getProductReviews(id);
          setReviewsData(revRes.data || revRes);
        } catch (err) {
          console.error("Failed to fetch reviews:", err);
        }

        // Fetch related products and fully hydrated products with promos
        const allRes = await productService.getAllProducts(null, false);
        const allProducts = Array.isArray(allRes.data) ? allRes.data : (Array.isArray(allRes) ? allRes : []);
        setAllProductsState(allProducts);
        
        // Hydrate data with promo info ('giaSauKhuyenMai', 'phanTramGiam' etc)
        const hydratedProduct = allProducts.find(p => (p.maSanPham == id) || (p.maSP == id));
        if (hydratedProduct) {
             data = { ...data, ...hydratedProduct };
        }
        
        setProduct(data);
        cachedAllProducts = allProducts;
        cachedProductDetails[id] = data;
        setRelatedProducts(allProducts.filter(p => (p.maSanPham || p.maSP) != id).slice(0, 4));
        
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (delta) => {
    const maxStock = product?.soLuongTon || 0;
    const newQty = quantity + delta;
    if (newQty < 1) return;
    if (newQty > maxStock) {
      alert(`Sản phẩm này chỉ còn ${maxStock} sản phẩm trong kho.`);
      return;
    }
    setQuantity(newQty);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.soLuongTon <= 0) {
      alert('Sản phẩm đã hết hàng!');
      return;
    }
    if (quantity > product.soLuongTon) {
      alert(`Không thể thêm vào giỏ hàng. Chỉ còn ${product.soLuongTon} sản phẩm.`);
      return;
    }
    try {
      await cartService.addToCart({
        productId: product.maSanPham || product.maSP,
        price: product.giaSauKhuyenMai || product.giaBan || 0,
        quantity: quantity,
        maxStock: product.soLuongTon // Track max stock for early warnings
      });
      alert('Đã thêm vào giỏ hàng!');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi thêm vào giỏ hàng!');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/shopping-cart');
  };

  const handleToggleFavorite = (prodId) => {
    setFavorites(prev => {
      let newFavs;
      if (prev.includes(prodId)) {
         newFavs = prev.filter(vid => vid !== prodId);
      } else {
         newFavs = [...prev, prodId];
      }
      storageHelper.saveFavorites(newFavs);
      return newFavs;
    });
  };

  const handleCompare = () => {
    let list = JSON.parse(localStorage.getItem('compareList') || '[]');
    const idToCompare = product.maSanPham || product.maSP;
    if (!list.includes(idToCompare)) {
      list.push(idToCompare);
      if (list.length > 3) list.shift(); // Max 3 items
      localStorage.setItem('compareList', JSON.stringify(list));
    }
    
    const toCompareData = list.map(cmpId => allProductsState.find(p => (p.maSanPham == cmpId) || (p.maSP == cmpId))).filter(Boolean);
    setCompareList(toCompareData);
    setCompareOpen(true);
  };

  const handleRemoveCompare = (idToRemove) => {
    let list = JSON.parse(localStorage.getItem('compareList') || '[]');
    list = list.filter(id => id != idToRemove);
    localStorage.setItem('compareList', JSON.stringify(list));
    const toCompareData = list.map(cmpId => allProductsState.find(p => (p.maSanPham == cmpId) || (p.maSP == cmpId))).filter(Boolean);
    setCompareList(toCompareData);
    if (toCompareData.length === 0) {
      setCompareOpen(false);
    }
  };

  const handleAddCompareItem = (newProduct) => {
    if (!newProduct) return;
    let list = JSON.parse(localStorage.getItem('compareList') || '[]');
    const newId = newProduct.maSanPham || newProduct.maSP;
    if (!list.includes(newId)) {
      list.push(newId);
      if (list.length > 3) list.shift();
      localStorage.setItem('compareList', JSON.stringify(list));
      
      const toCompareData = list.map(cmpId => allProductsState.find(p => (p.maSanPham == cmpId) || (p.maSP == cmpId))).filter(Boolean);
      setCompareList(toCompareData);
    }
    setShowAddCompare(false);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
             <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={6}>
             <Skeleton variant="text" height={80} />
             <Skeleton variant="text" height={40} width="60%" />
             <Skeleton variant="rectangular" height={100} sx={{ my: 3 }} />
             <Skeleton variant="text" height={200} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4">Không tìm thấy sản phẩm</Typography>
        <Button onClick={() => navigate('/shopping')} sx={{ mt: 3 }} variant="contained">Quay lại cửa hàng</Button>
      </Container>
    );
  }

  // Fallback / Format logic
  const price = product.giaSauKhuyenMai || product.giaKhuyenMai || product.giaBan || 0;
  const originalPrice = product.giaBan || 0;
  const hasDiscount = product && (product.giaSauKhuyenMai || product.giaKhuyenMai) && product.giaBan && price < originalPrice;
  const discountPercent = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;
  const isFav = favorites.includes(product.maSanPham || product.maSP);
  
  const isOutOfStock = product.soLuongTon <= 0 || product.soLuongTon === undefined;

  const isFlashSale = product.loaiGia === 'FlashSale';
  const currentStock = product?.soLuongTon !== undefined ? product.soLuongTon : 0;
  const soldCount = product?.daBan || 0;
  const totalCount = product?.soLuongBanDau || 100;
  const percentSold = totalCount > 0 ? Math.min(100, Math.round((soldCount / totalCount) * 100)) : 0;
  const isFlashSaleEmpty = isFlashSale && currentStock <= 0;

  // Images setup
  let extras = [];
  if (Array.isArray(product.anhPhu)) {
    extras = product.anhPhu;
  } else if (typeof product.anhPhu === 'string' && product.anhPhu) {
    try { extras = JSON.parse(product.anhPhu); } catch { extras = []; }
  }
  extras = extras.filter(Boolean);
  const images = product.hinhAnh ? [product.hinhAnh, ...extras] : (extras.length > 0 ? extras : ['https://via.placeholder.com/600']);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user && (user.maVaiTro === 1 || user.maVaiTro === 2);

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Bạn có chắc chắn muốn ẩn đánh giá này không?')) {
      try {
        await reviewService.deleteReview(reviewId);
        // Refresh reviews
        const revRes = await reviewService.getProductReviews(id);
        setReviewsData(revRes.data || revRes);
      } catch (err) {
        console.error(err);
        alert('Lỗi khi xóa đánh giá.');
      }
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: '#fafafa', pb: 10 }}>
      {/* Breadcrumb Area */}
      <Container maxWidth="xl" sx={{ pt: 4, pb: 2, px: { xs: 4, md: 8, lg: 12 } }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem' }}>
          <Link underline="hover" color="inherit" onClick={() => navigate('/shopping')} sx={{ cursor: 'pointer' }}>
            Trang chủ
          </Link>
          <Link underline="hover" color="inherit" onClick={() => navigate(`/category/${product.maLoaiSanPham || ''}`)} sx={{ cursor: 'pointer' }}>
            {product.tenLoai || 'Danh mục'}
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>{product.tenSP}</Typography>
        </Breadcrumbs>
      </Container>

      {/* Main Hero Section */}
      <Container maxWidth="xl" sx={{ mb: 8, px: { xs: 4, md: 8, lg: 12 } }}>
        <Grid container spacing={6}>
          {/* Left: Images */}
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative', display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
              {/* Thumbnails */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, gap: 2, overflowX: 'auto', flexShrink: 0 }}>
                {images.map((img, idx) => (
                  <Box 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    sx={{
                      width: 80, height: 80, borderRadius: '8px', cursor: 'pointer',
                      border: activeImage === idx ? '2px solid #333' : '1px solid #ddd',
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff'
                    }}
                  >
                    <img src={img} alt={`thumb-${idx}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </Box>
                ))}
              </Box>
              {/* Main Image */}
              <Box sx={{ position: 'relative', flexGrow: 1, height: { xs: 350, sm: 550 }, bgcolor: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {hasDiscount && (
                  <Box sx={{
                    position: 'absolute', top: 20, left: 20, zIndex: 3,
                    bgcolor: '#ef4444', color: '#fff', fontSize: '1.2rem',
                    fontWeight: 700, px: 2, py: 0.5, borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                  }}>
                    -{discountPercent}%
                  </Box>
                )}
                <img src={images[activeImage]} alt={product.tenSP} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </Box>
            </Box>
          </Grid>

          {/* Right: Info */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <Box>
                 <Typography variant="h3" sx={{ fontWeight: 600, color: '#222', mb: 1 }}>{product.tenSP}</Typography>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Rating value={reviewsData.averageRating} readOnly precision={0.5} size="small" />
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                      {reviewsData.averageRating} ({reviewsData.totalCount} đánh giá)
                    </Typography>
                 </Box>
               </Box>
               <Typography variant="h4" sx={{ fontWeight: 900, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>
                 {product.thuongHieu || ''}
               </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
               <Typography variant="body2" sx={{ color: '#777' }}>
                 <strong>Mã SP:</strong> {product.maSP || product.maSanPham}
               </Typography>
                <Typography variant="body2" sx={{ color: !isOutOfStock ? '#4caf50' : '#f44336', fontWeight: 600 }}>
                  {!isOutOfStock ? '✓ Còn hàng' : '✗ Hết hàng'}
                </Typography>
            </Box>

            {/* Event Box (Dynamic) */}
            {hasDiscount && (
              <Paper elevation={0} sx={{ bgcolor: '#fff5f5', p: 3, borderRadius: '12px', mb: 4, display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #fecaca' }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                   <Box sx={{ color: '#ef4444' }}>
                     <TagIcon fontSize="large" sx={{ transform: 'rotate(90deg)' }} />
                   </Box>
                   <Box>
                     <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ef4444' }}>
                       {isFlashSale ? '⚡ FLASH SALE' : 'Đang Khuyến Mãi'}
                     </Typography>
                     <Typography variant="body2" sx={{ color: '#666' }}>Tiết kiệm ngay {discountPercent}% khi mua sản phẩm này</Typography>
                   </Box>
                 </Box>

                 {isFlashSale && (
                   <Box sx={{ 
                     width: '100%', height: '24px', bgcolor: '#fecaca', 
                     borderRadius: '12px', position: 'relative', mt: 1, overflow: 'hidden'
                   }}>
                     {isFlashSaleEmpty ? (
                        <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          Đã hết số lượng flashsales
                        </Typography>
                     ) : (
                        <>
                          <Box sx={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentSold}%`, bgcolor: '#ef4444', borderRadius: '12px', transition: 'width 0.5s' }} />
                          <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', textShadow: '0px 0px 3px rgba(0,0,0,0.5)' }}>
                            Đã bán {soldCount}/{totalCount}
                          </Typography>
                          <Box sx={{ position: 'absolute', left: 8, top: 1, fontSize: '0.9rem' }}>🔥</Box>
                        </>
                     )}
                   </Box>
                 )}
              </Paper>
            )}

            {/* Description Excerpt */}
            <Typography variant="body1" sx={{ color: '#555', mb: 4, lineHeight: 1.8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product.moTa || 'Chưa có mô tả ngắn cho sản phẩm này.'}
            </Typography>

            {/* Price display */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 4 }}>
              {hasDiscount ? (
                <>
                  <Typography variant="body1" sx={{ color: '#999', textDecoration: 'line-through' }}>
                    Giá gốc: {originalPrice.toLocaleString('vi-VN')}đ
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#ef4444' }}>
                      {price.toLocaleString('vi-VN')}đ
                    </Typography>
                    <Box sx={{ bgcolor: '#fee2e2', color: '#ef4444', px: 1, py: 0.5, borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      Giảm {(originalPrice - price).toLocaleString('vi-VN')}đ
                    </Box>
                  </Box>
                </>
              ) : (
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#222' }}>
                  {price.toLocaleString('vi-VN')}đ
                </Typography>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              {!product.isGift ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '30px', px: 2, py: 1, bgcolor: '#fff', opacity: isOutOfStock ? 0.5 : 1 }}>
                    <IconButton size="small" onClick={() => handleQuantityChange(-1)} disabled={isOutOfStock}><RemoveIcon fontSize="small" /></IconButton>
                    <Typography sx={{ px: 2, fontWeight: 600, minWidth: '40px', textAlign: 'center' }}>{quantity}</Typography>
                    <IconButton size="small" onClick={() => handleQuantityChange(1)} disabled={isOutOfStock}><AddIcon fontSize="small" /></IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleAddToCart} 
                      disabled={isOutOfStock}
                      sx={{ flex: 1, borderRadius: '30px', py: 1.5, fontSize: '1rem', fontWeight: 600, textTransform: 'none', border: '2px solid #222', color: '#222', '&:hover': { border: '2px solid #000', bgcolor: '#f0f0f0' } }}
                    >
                      Thêm vào giỏ
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleBuyNow} 
                      disabled={isOutOfStock}
                      sx={{ flex: 1, bgcolor: '#222', color: '#fff', borderRadius: '30px', py: 1.5, fontSize: '1rem', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#000' } }}
                    >
                      {isOutOfStock ? 'Đã hết hàng' : 'Mua ngay'}
                    </Button>
                  </Box>
                </>
              ) : (
                <Button 
                  disabled 
                  fullWidth 
                  variant="contained" 
                  sx={{ borderRadius: '30px', py: 1.5, fontSize: '1rem', fontWeight: 600, bgcolor: '#999 !important', color: '#fff !important' }}
                >
                  Sản phẩm quà tặng - Không bán lẻ
                </Button>
              )}
            </Box>

            {/* Utility Links */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: '1px solid #eee', pt: 3 }}>
               <Button onClick={handleCompare} startIcon={<CompareIcon />} variant="text" sx={{ color: '#555', textTransform: 'none', fontWeight: 600 }}>So sánh sản phẩm</Button>
               <Button 
                 startIcon={isFav ? <FavoriteFilledIcon sx={{ color: '#ef4444' }} /> : <FavoriteIcon />} 
                 onClick={() => handleToggleFavorite(product.maSanPham || product.maSP)}
                 variant="text" 
                 sx={{ color: '#555', textTransform: 'none', fontWeight: 600 }}
               >
                 Thêm vào yêu thích
               </Button>
            </Box>

          </Grid>
        </Grid>
      </Container>


      {/* Details & Description Section */}
      <Container maxWidth="xl" sx={{ mb: 8, px: { xs: 4, md: 8, lg: 12 } }}>
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: '16px', bgcolor: '#fff', border: '1px solid #eee' }}>
          <Grid container spacing={8}>
            {/* Left: Product details */}
            <Grid item xs={12} md={5}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#222' }}>Thông tin chi tiết</Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8, mb: 4 }}>
                Dưới đây là các thông số kỹ thuật và thông tin chi tiết về sản phẩm được cung cấp bởi nhà sản xuất.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 600, color: '#333' }}>Tên sản phẩm</Typography>
                <Typography sx={{ color: '#777', textAlign: 'right', flex: 1, ml: 4 }}>{product.tenSP}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 600, color: '#333' }}>Thương hiệu</Typography>
                <Typography sx={{ color: '#777' }}>{product.thuongHieu || 'Đang cập nhật'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 600, color: '#333' }}>Xuất xứ</Typography>
                <Typography sx={{ color: '#777' }}>{product.xuatXu || 'Đang cập nhật'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 600, color: '#333' }}>Danh mục</Typography>
                <Typography sx={{ color: '#777' }}>{product.tenLoai || 'Vật liệu'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 600, color: '#333' }}>Đơn vị tính</Typography>
                <Typography sx={{ color: '#777' }}>{product.donViTinh || 'Đang cập nhật'}</Typography>
              </Box>
            </Grid>
            
            {/* Right: Description */}
            <Grid item xs={12} md={7}>
               <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#222' }}>Mô tả sản phẩm</Typography>
               {images.length > 1 && (
                 <Box sx={{ width: '100%', height: 260, borderRadius: '12px', overflow: 'hidden', mb: 3, bgcolor: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <img src={images[1]} alt="Description visual" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                 </Box>
               )}
               <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8, mb: 3, whiteSpace: 'pre-wrap' }}>
                 {product.moTa || 'Chưa có bài viết mô tả chi tiết cho sản phẩm này.'}
               </Typography>
               
               {product.ghiChu && (
                 <>
                   <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Ghi chú thêm:</Typography>
                   <Typography variant="body2" sx={{ color: '#666', p: 2, bgcolor: '#f9f9f9', borderRadius: '8px', fontStyle: 'italic' }}>
                     {product.ghiChu}
                   </Typography>
                 </>
               )}
            </Grid>
          </Grid>
        </Paper>
      </Container>


      {/* About Brand Section */}
      <Container maxWidth="xl" sx={{ mb: 8, px: { xs: 4, md: 8, lg: 12 } }}>
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: '16px', bgcolor: '#fff', border: '1px solid #eee' }}>
           <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#222' }}>Về thương hiệu / Nhà cung cấp</Typography>
           
           <Grid container spacing={6}>
             {/* Full Width Brand Info */}
             <Grid item xs={12} md={12}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#222', textTransform: 'uppercase' }}>
                    {product.thuongHieu || 'Sản phẩm tiêu chuẩn'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/contact')}
                      sx={{ bgcolor: '#f0a06c', color: '#fff', borderRadius: '20px', textTransform: 'none', px: 3, '&:hover':{ bgcolor: '#cc7a4a'} }}
                    >
                      Liên hệ ngay
                    </Button>
                  </Box>
               </Box>
               <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
                 Xuất xứ: {product.xuatXu || 'Đang cập nhật'}
               </Typography>

               <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8, mb: 4, maxWidth: '800px' }}>
                 Chúng tôi luôn mang đến các sản phẩm Vật Liệu Xây Dựng và trang trí nội thất chính hãng từ các thương hiệu uy tín, đảm bảo tiêu chuẩn chất lượng cao nhất cho mọi công trình. 
                 Mọi quy trình sản xuất và phân phối đều được kiểm tra khắt khe, giúp tối ưu hóa độ bền bỉ và độ an toàn cho người dùng cuối.
               </Typography>

               <Grid container spacing={2} sx={{ maxWidth: '800px' }}>
                 {[
                   { icon: <StorageIcon color="disabled"/>, label: 'Đảm bảo chất lượng' },
                   { icon: <CompareIcon color="disabled"/>, label: 'Chuẩn quy cách' },
                   { icon: <TagIcon color="disabled"/>, label: 'Giá cả cạnh tranh' },
                   { icon: <FavoriteIcon color="disabled"/>, label: 'Bảo hành uy tín' }
                 ].map((item, i) => (
                   <Grid item xs={6} sm={3} key={i}>
                     <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                       <Box sx={{ width: 50, height: 50, borderRadius: '50%', border: '1px solid #f0eadf', bgcolor: '#fbfaf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {item.icon}
                       </Box>
                       <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>{item.label}</Typography>
                     </Box>
                   </Grid>
                 ))}
               </Grid>
             </Grid>
           </Grid>
        </Paper>
      </Container>


      {/* Customer Reviews Section */}
      <Container maxWidth="xl" sx={{ mb: 8, px: { xs: 4, md: 8, lg: 12 } }}>
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: '16px', bgcolor: '#fff', border: '1px solid #eee' }}>
           <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#222' }}>Đánh giá từ khách hàng</Typography>
           
           {reviewsData.reviews.length === 0 ? (
             <Box sx={{ textAlign: 'center', py: 4 }}>
               <Typography sx={{ color: '#777' }}>Chưa có đánh giá nào cho sản phẩm này.</Typography>
             </Box>
           ) : (
             <Stack spacing={4}>
               {reviewsData.reviews.map((rev) => (
                 <Box key={rev.maDanhGia} sx={{ borderBottom: '1px solid #eee', pb: 4, lastChild: { borderBottom: 0 } }}>
                   <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                     <Avatar src={rev.anhDaiDien} alt={rev.tenKhachHang}>{rev.tenKhachHang?.charAt(0)}</Avatar>
                     <Box>
                       <Typography variant="subtitle1" fontWeight={700}>{rev.tenKhachHang}</Typography>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Rating value={rev.soSao} readOnly size="small" />
                         <Typography variant="caption" color="text.secondary">
                           {new Date(rev.ngayTao).toLocaleDateString('vi-VN')}
                         </Typography>
                       </Box>
                     </Box>
                   </Box>
                   
                   <Typography variant="body1" sx={{ color: '#444', mb: 2, lineHeight: 1.6 }}>
                     {rev.noiDung}
                   </Typography>

                   {rev.hinhAnh && JSON.parse(rev.hinhAnh).length > 0 && (
                     <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                       {JSON.parse(rev.hinhAnh).map((img, i) => (
                         <Box 
                            key={i} 
                            component="img" 
                            src={img} onClick={() => { setPreviewMedia(img); setPreviewType('image'); }} style={{ cursor: 'pointer' }} 
                            sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover', border: '1px solid #eee' }} 
                         />
                       ))}
                     </Box>
                   )}

                   {rev.video && (
                     <Box sx={{ mt: 2 }}>
                       <Button 
                         onClick={() => { setPreviewMedia(rev.video); setPreviewType('video'); }} 
                         sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: '#e68c55', textTransform: 'none', fontWeight: 600, p: 0, minWidth: 0 }}
                       >
                         <VideoCamIcon size="small" /> Xem video đánh giá
                       </Button>
                     </Box>
                   )}

                   {isAdmin && (
                     <Button 
                       size="small" 
                       color="error" 
                       onClick={() => handleDeleteReview(rev.maDanhGia)}
                       sx={{ mt: 2, textTransform: 'none' }}
                     >
                       Gỡ bỏ đánh giá này
                     </Button>
                   )}
                 </Box>
               ))}
             </Stack>
           )}
        </Paper>
      </Container>


      {/* Related Products Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
         <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#222' }}>Sản phẩm tương tự</Typography>
         <Grid container spacing={3}>
           {relatedProducts.map((prod, idx) => (
             <Grid item xs={12} sm={6} md={3} key={idx}>
               <ProductCard
                  product={prod}
                  isFavorite={favorites.includes(prod.maSanPham || prod.maSP)}
                  onToggleFav={() => handleToggleFavorite(prod.maSanPham || prod.maSP)}
                  onAddToCart={async () => {
                    await cartService.addToCart({
                      productId: prod.maSanPham || prod.maSP,
                      price: prod.giaSauKhuyenMai || prod.giaBan || 0,
                      quantity: 1
                    });
                    alert('Đã thêm sản phẩm liên quan vào giỏ hàng');
                  }}
               />
             </Grid>
           ))}
         </Grid>
      </Container>

      {/* Compare Dialog */}
      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          So sánh sản phẩm
          <Button onClick={() => { localStorage.removeItem('compareList'); setCompareOpen(false); }} color="error" size="small">Xóa tất cả</Button>
        </DialogTitle>
        <DialogContent dividers>
          {compareList.length > 0 ? (
            <TableContainer>
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell width="20%"><strong>Tiêu chí</strong></TableCell>
                    {compareList.map((cp, idx) => (
                      <TableCell key={idx} width="26%" align="center">
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                          <IconButton size="small" onClick={() => handleRemoveCompare(cp.maSanPham || cp.maSP)} sx={{ position: 'absolute', top: -10, right: -10, bgcolor: '#f44336', color: '#fff', '&:hover': { bgcolor: '#d32f2f' }, width: 24, height: 24 }}>
                            <Typography sx={{ fontSize: 16, lineHeight: 1 }}>&times;</Typography>
                          </IconButton>
                          <img src={cp.hinhAnh || 'https://via.placeholder.com/150'} alt={cp.tenSP} style={{ height: 120, objectFit: 'contain' }} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 40 }}>{cp.tenSP}</Typography>
                      </TableCell>
                    ))}
                    {compareList.length < 3 && (
                      <TableCell width="26%" align="center" sx={{ verticalAlign: 'middle' }}>
                        {!showAddCompare ? (
                          <Box onClick={() => setShowAddCompare(true)} sx={{ height: 160, border: '2px dashed #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#e68c55', color: '#e68c55', bgcolor: '#fff5f0' } }}>
                            <Box sx={{ fontSize: 36, mb: 1, lineHeight: 1 }}>+</Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Thêm sản phẩm<br/>để so sánh</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Autocomplete
                              options={allProductsState.filter(p => !compareList.find(c => (c.maSanPham || c.maSP) == (p.maSanPham || p.maSP)))}
                              getOptionLabel={(option) => `${option.tenSP} (${(option.giaSauKhuyenMai || option.giaBan || 0).toLocaleString('vi-VN')}đ)`}
                              onChange={(e, val) => handleAddCompareItem(val)}
                              onBlur={() => setShowAddCompare(false)}
                              renderInput={(params) => <TextField {...params} label="Tìm kiếm SP..." variant="outlined" size="small" autoFocus />}
                              sx={{ width: '100%' }}
                            />
                          </Box>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Thương hiệu</strong></TableCell>
                    {compareList.map((cp, idx) => <TableCell key={idx} align="center">{cp.thuongHieu || '-'}</TableCell>)}
                    {compareList.length < 3 && <TableCell align="center" sx={{ bgcolor: '#fafafa' }} />}
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Giá bán</strong></TableCell>
                    {compareList.map((cp, idx) => (
                      <TableCell key={idx} align="center">
                        <Typography sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                          {(cp.giaSauKhuyenMai || cp.giaBan || 0).toLocaleString('vi-VN')}đ
                        </Typography>
                      </TableCell>
                    ))}
                    {compareList.length < 3 && <TableCell align="center" sx={{ bgcolor: '#fafafa' }} />}
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Đơn vị tính</strong></TableCell>
                    {compareList.map((cp, idx) => <TableCell key={idx} align="center">{cp.donViTinh || '-'}</TableCell>)}
                    {compareList.length < 3 && <TableCell align="center" sx={{ bgcolor: '#fafafa' }} />}
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Xuất xứ</strong></TableCell>
                    {compareList.map((cp, idx) => <TableCell key={idx} align="center">{cp.xuatXu || '-'}</TableCell>)}
                    {compareList.length < 3 && <TableCell align="center" sx={{ bgcolor: '#fafafa' }} />}
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Danh mục</strong></TableCell>
                    {compareList.map((cp, idx) => <TableCell key={idx} align="center">{cp.tenLoai || '-'}</TableCell>)}
                    {compareList.length < 3 && <TableCell align="center" sx={{ bgcolor: '#fafafa' }} />}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ p: 4, textAlign: 'center' }}>Chưa có sản phẩm nào để so sánh.</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================= MEDIA PREVIEW DIALOG ======================== */}
      <Dialog open={!!previewMedia} onClose={() => setPreviewMedia(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {previewType === 'image' ? 'Xem ảnh' : 'Xem video'} đánh giá
          <IconButton onClick={() => setPreviewMedia(null)} size="small">
             <CompareIcon sx={{ transform: 'rotate(45deg)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', bgcolor: '#000' }}>
          {previewMedia && (
            previewType === 'image' ? (
              <img src={previewMedia} alt="Preview" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            ) : (
              <video src={previewMedia} controls autoPlay style={{ maxWidth: '100%', maxHeight: '70vh' }} />
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewMedia(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ProductDetailPage;
