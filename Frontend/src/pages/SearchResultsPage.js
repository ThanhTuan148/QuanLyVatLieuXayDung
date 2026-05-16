import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Box, Typography, Button,
  Slider, Checkbox, FormControlLabel, Select, MenuItem, Skeleton, Divider
} from '@mui/material';
import { ViewList as ListIcon, ViewModule as Grid3Icon, ViewComfy as Grid4Icon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import cartService from '../services/cartService';
import storageHelper from '../services/storageHelper';
import ProductCard from '../components/ProductCard';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const SearchResultsPage = () => {
  const query = useQuery();
  const searchTerm = query.get('q') || '';
  const brandTerm = query.get('brand') || '';
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [viewMode, setViewMode] = useState('grid4'); // 'list', 'grid3', 'grid4'
  const [relatedProducts, setRelatedProducts] = useState([]);
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState(() => storageHelper.getFavorites());

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        const res = await productService.getAllProducts(null, false);
        const prods = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        
        // Filter products by search term or brand
        let filteredProds = prods;
        if (brandTerm) {
          filteredProds = prods.filter(p => 
            p.thuongHieu?.toLowerCase() === brandTerm.toLowerCase()
          );
        } else if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          filteredProds = prods.filter(p => 
            p.tenSP?.toLowerCase().includes(lowerSearchTerm) || 
            p.tenLoai?.toLowerCase().includes(lowerSearchTerm) ||
            p.moTa?.toLowerCase().includes(lowerSearchTerm) ||
            p.thuongHieu?.toLowerCase().includes(lowerSearchTerm)
          );
        }
        setSearchResults(filteredProds);

        // Fetch related products (same category as first result, or just random ones)
        if (filteredProds.length > 0) {
          const firstCat = filteredProds[0].tenLoai;
          let related = prods.filter(p => 
             p.tenLoai === firstCat && 
             !filteredProds.find(fp => (fp.maSanPham || fp.maSP) === (p.maSanPham || p.maSP))
          );
          if (related.length < 4) {
             const existingIds = new Set([...filteredProds, ...related].map(p => p.maSanPham || p.maSP));
             const more = prods.filter(p => !existingIds.has(p.maSanPham || p.maSP));
             related = [...related, ...more];
          }
          setRelatedProducts(related.slice(0, 4));
        } else {
          setRelatedProducts(prods.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (searchTerm || brandTerm) {
      fetchSearchResults();
    } else {
      setSearchResults([]);
      setLoading(false);
    }
  }, [searchTerm, brandTerm]);

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleToggleFavorite = (product, e) => {
    if (e) e.stopPropagation();
    const productId = product.maSanPham || product.maSP;
    if (!productId) return;

    setFavorites(prev => {
      let newFavs;
      if (prev.includes(productId)) {
        newFavs = prev.filter(id => id !== productId);
      } else {
        newFavs = [...prev, productId];
      }
      storageHelper.saveFavorites(newFavs);
      return newFavs;
    });
  };

  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    try {
      await cartService.addToCart({
        productId: product.maSanPham || product.maSP,
        price: product.giaSauKhuyenMai || product.giaBan || 0,
        quantity: 1
      });
      alert('Đã thêm vào giỏ hàng!');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi thêm vào giỏ hàng');
    }
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', bgcolor: '#f9f9f9', pb: 10 }}>
      {/* Category Banner mimicking screenshot */}
      <Box sx={{ 
        bgcolor: '#bdc1c4', 
        minHeight: '250px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        mb: 6
      }}>
        <Box sx={{ position: 'absolute', right: '10%', top: '0', width: '400px', height: '100%', display: 'flex', gap: 2, opacity: 0.8 }}>
           <Box sx={{ alignSelf: 'flex-end', width: '200px', height: '220px', bgcolor: '#d2ab72', borderRadius: '10px 10px 0 0' }} />
           <Box sx={{ alignSelf: 'flex-end', width: '150px', height: '120px', bgcolor: '#bba078', borderRadius: '10px 10px 0 0' }} />
        </Box>

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: { xs: '2.5rem', md: '4rem' }, fontWeight: 700, mb: 1, textShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            {brandTerm ? `Thương hiệu: ${brandTerm}` : `Kết quả tìm kiếm: "${searchTerm}"`}
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
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Lọc theo giá</Typography>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                min={0}
                max={10000000}
                sx={{ color: '#e68c55', mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>
                  Giá: {priceRange[0].toLocaleString('vi-VN')}đ — {priceRange[1].toLocaleString('vi-VN')}đ
                </Typography>
                <Button variant="contained" size="small" sx={{ bgcolor: '#f0f0f0', color: '#333', boxShadow: 'none', '&:hover':{bgcolor:'#e0e0e0'} }}>Lọc</Button>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Filter By Brand */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Lọc theo thương hiệu</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { name: '4Mariani', count: 2 },
                  { name: 'Bitte', count: 1 },
                  { name: 'Flos', count: 1 },
                  { name: 'Hay', count: 1 },
                  { name: 'Kettal', count: 2 },
                ].map((brand, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel 
                      control={<Checkbox size="small" sx={{ color: '#ccc', '&.Mui-checked': { color: '#e68c55' } }} />} 
                      label={<Typography variant="body2" sx={{ color: '#555' }}>{brand.name}</Typography>} 
                    />
                    <Box sx={{ bgcolor: '#f4f4f4', px: 1, py: 0.2, borderRadius: '12px', fontSize: '0.75rem', color: '#888' }}>
                      {brand.count}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Product Grid Area */}
          <Grid item xs={12} md={9}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#777' }}>
                Hiển thị 1–{searchResults.length} của {searchResults.length} kết quả
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant="body2" sx={{ color: '#777' }}>
                  Show: <b>9</b> / 12 / 18 / 24
                </Typography>
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
                <Select size="small" defaultValue="relevance" sx={{ minWidth: 150, bgcolor: '#fff', borderRadius: '20px', '& fieldset': {border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'} }}>
                  <MenuItem value="relevance">Liên quan nhất</MenuItem>
                  <MenuItem value="latest">Mới nhất</MenuItem>
                  <MenuItem value="popularity">Phổ biến nhất</MenuItem>
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
              ) : searchResults.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 5, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #eaeaea' }}>
                    <Typography variant="h6" color="text.secondary">Không tìm thấy sản phẩm nào phù hợp.</Typography>
                  </Box>
                </Grid>
              ) : (
                searchResults.map((product) => (
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

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 10, mb: 2, pt: 6, borderTop: '1px solid #eaeaea' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#333' }}>
              Có thể bạn cũng thích
            </Typography>
            <Grid container spacing={3}>
              {relatedProducts.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={`related-${product.maSanPham || product.maSP}`}>
                  <ProductCard
                    product={product}
                    isFavorite={favorites.includes(product.maSanPham || product.maSP)}
                    onToggleFav={handleToggleFavorite}
                    onAddToCart={handleAddToCart}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default SearchResultsPage;
