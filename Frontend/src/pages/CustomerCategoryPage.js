import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Grid, Box, Typography, Button, 
  IconButton, Slider, Checkbox, FormControlLabel, Select, MenuItem, Skeleton, Divider, Snackbar, Alert
} from '@mui/material';
import { FavoriteBorder as FavoriteIcon, GridView as GridIcon, ViewList as ListIcon, ViewModule as Grid3Icon, ViewComfy as Grid4Icon } from '@mui/icons-material';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import cartService from '../services/cartService';
import storageHelper from '../services/storageHelper';

const CustomerCategoryPage = () => {
  const { slug: id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [allProductsRaw, setAllProductsRaw] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [sortOrder, setSortOrder] = useState('latest');
  const [viewMode, setViewMode] = useState('grid4'); // 'list', 'grid3', 'grid4'
  const [favorites, setFavorites] = useState(() => storageHelper.getFavorites());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getAllProducts(),
          fetch('http://localhost:5000/api/categories').then(r => r.json()).catch(() => [])
        ]);
        
        const prods = Array.isArray(productsRes?.data) ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []);
        const cats = Array.isArray(categoriesRes) ? categoriesRes : (Array.isArray(categoriesRes?.data) ? categoriesRes.data : []);
        
        let currentCat = cats.find(c => c.maLoaiSanPham == id) || null;
        setCategory(currentCat);
        setAllProductsRaw(prods);
        
        let filteredProds = id ? prods.filter(p => p.maLoaiSP == id) : prods; // if no ID, show all or default
        setProducts(filteredProds);
        
        let maxP = 0;
        filteredProds.forEach(p => {
          const price = Number(p.giaSauKhuyenMai || p.giaKhuyenMai || p.giaBan || 0);
          if (price > maxP) maxP = price;
        });
        if (maxP === 0) maxP = 5000;
        setMaxPrice(maxP);
        setPriceRange([0, maxP]);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleToggleFavorite = (product, e) => {
    if (e) e.stopPropagation();
    const productId = product.maSanPham || product.maSP;
    if (!productId) return;
    const isFav = favorites.includes(productId);
    let newFavs;
    if (isFav) {
      newFavs = favorites.filter(id => id !== productId);
    } else {
      newFavs = [...favorites, productId];
    }
    setFavorites(newFavs);
    storageHelper.saveFavorites(newFavs);
  };

  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    try {
      await cartService.addToCart({
        userId: parseInt(localStorage.getItem('userId') || 1),
        productId: product.maSanPham || product.maSP,
        price: product.giaSauKhuyenMai || product.giaBan || 0,
        quantity: 1
      });
      setSnackbar({ open: true, message: 'Đã thêm vào giỏ hàng!', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Lỗi khi thêm vào giỏ hàng', severity: 'error' });
    }
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  // Derive dynamic filters
  const brands = [...new Set(products.map(p => p.thuongHieu).filter(Boolean))];
  const units = [...new Set(products.map(p => p.donViTinh).filter(Boolean))];

  // Apply filters & sorts
  const getDisplayedProducts = () => {
    let res = [...products];

    // Price
    res = res.filter(p => {
      const price = Number(p.giaSauKhuyenMai || p.giaKhuyenMai || p.giaBan || 0);
      return price >= Number(priceRange[0]) && price <= Number(priceRange[1]);
    });

    // Brands
    if (selectedBrands.length > 0) {
      res = res.filter(p => selectedBrands.includes(p.thuongHieu));
    }

    // Units
    if (selectedUnits.length > 0) {
      res = res.filter(p => selectedUnits.includes(p.donViTinh));
    }

    // Sort
    if (sortOrder === 'price-asc') {
      res.sort((a, b) => Number(a.giaSauKhuyenMai || a.giaKhuyenMai || a.giaBan || 0) - Number(b.giaSauKhuyenMai || b.giaKhuyenMai || b.giaBan || 0));
    } else if (sortOrder === 'price-desc') {
      res.sort((a, b) => Number(b.giaSauKhuyenMai || b.giaKhuyenMai || b.giaBan || 0) - Number(a.giaSauKhuyenMai || a.giaKhuyenMai || a.giaBan || 0));
    }

    return res;
  };

  const displayedProducts = getDisplayedProducts();

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', bgcolor: '#f9f9f9', pb: 10 }}>
      {/* Category Banner */}
      <Box sx={{ 
        bgcolor: '#bdc1c4', // Gray matching the screenshot
        minHeight: '250px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        mb: 6
      }}>
        {category && category.hinhAnh ? (
           <Box sx={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: `url(${category.hinhAnh})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
        ) : (
          <Box sx={{ position: 'absolute', right: '10%', top: '0', width: '400px', height: '100%', display: 'flex', gap: 2 }}>
             <Box sx={{ alignSelf: 'flex-end', width: '200px', height: '220px', bgcolor: '#d2ab72', borderRadius: '10px 10px 0 0' }} />
             <Box sx={{ alignSelf: 'flex-end', width: '150px', height: '120px', bgcolor: '#bba078', borderRadius: '10px 10px 0 0' }} />
          </Box>
        )}

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
          <Typography 
            onClick={() => navigate('/shopping')}
            variant="h2" 
            sx={{ color: '#fff', fontSize: '3rem', fontWeight: 700, mb: 1, textShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', '&:hover': {opacity: 0.8} }}
          >
            ← {loading ? 'Loading...' : (category ? category.tenLoai : 'Danh mục')}
          </Typography>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', mb: 4 }}>
              {/* Filter By Price */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Khoảng Giá</Typography>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                min={0}
                max={maxPrice}
                sx={{ color: '#e68c55', mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>
                  Giá: {priceRange[0].toLocaleString('vi-VN')}đ — {priceRange[1].toLocaleString('vi-VN')}đ
                </Typography>
                {/* <Button variant="contained" size="small" sx={{ bgcolor: '#f0f0f0', color: '#333', boxShadow: 'none', '&:hover':{bgcolor:'#e0e0e0'} }}>Filter</Button> */}
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Filter By Brand */}
              {brands.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Thương Hiệu</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
                    {brands.map((brand, i) => {
                      const count = products.filter(p => p.thuongHieu === brand).length;
                      return (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FormControlLabel 
                            control={<Checkbox size="small" checked={selectedBrands.includes(brand)} onChange={(e) => {
                              if(e.target.checked) setSelectedBrands([...selectedBrands, brand]);
                              else setSelectedBrands(selectedBrands.filter(b => b !== brand));
                            }} sx={{ color: '#ccc', '&.Mui-checked': { color: '#e68c55' } }} />} 
                            label={<Typography variant="body2" sx={{ color: '#555' }}>{brand}</Typography>} 
                          />
                          <Box sx={{ bgcolor: '#f4f4f4', px: 1, py: 0.2, borderRadius: '12px', fontSize: '0.75rem', color: '#888' }}>
                            {count}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  <Divider sx={{ mb: 4 }} />
                </>
              )}

              {/* Filter By Unit */}
              {units.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Đơn Vị Tính</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {units.map((unit, i) => {
                      const count = products.filter(p => p.donViTinh === unit).length;
                      return (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FormControlLabel 
                            control={<Checkbox size="small" checked={selectedUnits.includes(unit)} onChange={(e) => {
                              if(e.target.checked) setSelectedUnits([...selectedUnits, unit]);
                              else setSelectedUnits(selectedUnits.filter(u => u !== unit));
                            }} sx={{ color: '#ccc', '&.Mui-checked': { color: '#e68c55' } }} />} 
                            label={<Typography variant="body2" sx={{ color: '#555' }}>{unit}</Typography>} 
                          />
                          <Box sx={{ bgcolor: '#f4f4f4', px: 1, py: 0.2, borderRadius: '12px', fontSize: '0.75rem', color: '#888' }}>
                            {count}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </>
              )}
            </Box>
          </Grid>

          {/* Product Grid Area */}
          <Grid item xs={12} md={9}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#777' }}>
                Hiển thị {displayedProducts.length} kết quả
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, color: '#aaa', alignItems: 'center' }}>
                  <ListIcon 
                    onClick={() => setViewMode('list')} 
                    sx={{ cursor: 'pointer', color: viewMode === 'list' ? '#333' : '#aaa' }} 
                  />
                  <Grid3Icon 
                    onClick={() => setViewMode('grid3')} 
                    sx={{ cursor: 'pointer', color: viewMode === 'grid3' ? '#333' : '#aaa' }} 
                  />
                  <Grid4Icon 
                    onClick={() => setViewMode('grid4')} 
                    sx={{ cursor: 'pointer', color: viewMode === 'grid4' ? '#333' : '#aaa' }} 
                  />
                </Box>
                <Select size="small" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} sx={{ minWidth: 150, bgcolor: '#fff', borderRadius: '20px', '& fieldset': {border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'} }}>
                  <MenuItem value="latest">Mới nhất</MenuItem>
                  <MenuItem value="popularity">Phổ biến</MenuItem>
                  <MenuItem value="price-asc">Giá: Thấp đến Cao</MenuItem>
                  <MenuItem value="price-desc">Giá: Cao đến Thấp</MenuItem>
                </Select>
              </Box>
            </Box>

            {/* Grid */}
            <Grid container spacing={3}>
              {loading ? (
                 [1, 2, 3, 4].map(i => (
                  <Grid item xs={12} sm={6} lg={viewMode === 'grid3' ? 4 : viewMode === 'grid4' ? 3 : 12} key={i}>
                    <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))
              ) : displayedProducts.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" sx={{ color: '#777' }}>Không tìm thấy sản phẩm nào khớp với bộ lọc của bạn.</Typography>
                    <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { setPriceRange([0, maxPrice]); setSelectedBrands([]); setSelectedUnits([]); }}>Xóa bộ lọc</Button>
                  </Box>
                </Grid>
              ) : (
                displayedProducts.map((product) => (
                  <Grid item xs={12} sm={viewMode === 'list' ? 12 : 6} lg={viewMode === 'grid3' ? 4 : viewMode === 'grid4' ? 3 : 12} key={product.maSanPham || product.maSP}>
                    <ProductCard
                      product={product}
                      horizontal={viewMode === 'list'}
                      isFavorite={favorites.includes(product.maSanPham || product.maSP)}
                      onToggleFav={handleToggleFavorite}
                      onAddToCart={handleAddToCart}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </Grid>

        </Grid>
      </Container>
      
      {/* Recommended / Other Products */}
      <Container maxWidth="xl" sx={{ mt: 10 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#333' }}>Có thể bạn sẽ thích</Typography>
        <Grid container spacing={3}>
           {loading ? (
              Array(4).fill().map((_, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" height={360} sx={{ borderRadius: '12px' }} />
                </Grid>
              ))
           ) : (
             allProductsRaw.filter(p => p.maLoaiSP != id).slice(0, 4).map(p => (
               <Grid item xs={12} sm={6} md={3} key={p.maSanPham || p.maSP}>
                 <ProductCard 
                   product={p} 
                   isFavorite={favorites.includes(p.maSanPham || p.maSP)} 
                   onToggleFav={handleToggleFavorite} 
                   onAddToCart={handleAddToCart} 
                 />
               </Grid>
             ))
           )}
        </Grid>
      </Container>

      {/* Favorite Products */}
      <Container maxWidth="xl" sx={{ mt: 10, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#333' }}>Sản phẩm yêu thích của bạn</Typography>
        <Grid container spacing={3}>
           {favorites.length === 0 ? (
             <Grid item xs={12}>
               <Typography sx={{ color: '#777', fontStyle: 'italic' }}>Bạn chưa có sản phẩm yêu thích nào.</Typography>
             </Grid>
           ) : (
             favorites.slice(0, 4).map(p => (
               <Grid item xs={12} sm={6} md={3} key={p.maSanPham || p.maSP}>
                 <ProductCard 
                   product={p} 
                   isFavorite={true} 
                   onToggleFav={handleToggleFavorite} 
                   onAddToCart={handleAddToCart} 
                 />
               </Grid>
             ))
           )}
        </Grid>
      </Container>

      <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerCategoryPage;
