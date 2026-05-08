import React, { useState, useEffect } from 'react';
import { Container, Grid, Button, Typography, Box, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import cartService from '../services/cartService';
import storageHelper from '../services/storageHelper';
import ProductCard from '../components/ProductCard';

const FavoritesPage = () => {
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(() => storageHelper.getFavorites());

  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      try {
        setLoading(true);
        const res = await productService.getAllProducts();
        const prods = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        
        // Filter products that are in favorites
        const favProds = prods.filter(p => favorites.includes(p.maSanPham || p.maSP));
        setFavoriteProducts(favProds);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavoriteProducts();
  }, [favorites]);

  const handleRemoveFavorite = (product, e) => {
    if (e) e.stopPropagation();
    const productId = product.maSanPham || product.maSP;
    if (!productId) return;

    const newFavs = favorites.filter(id => id !== productId);
    setFavorites(newFavs);
    storageHelper.saveFavorites(newFavs);
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
    <Box sx={{ bgcolor: '#f4f3ef', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
        <Typography variant="h3" sx={{ color: '#333', fontWeight: 700, mb: 1 }}>
          Sản phẩm yêu thích ❤️
        </Typography>
        <Typography variant="body1" sx={{ color: '#888', mb: 6 }}>
          Danh sách các sản phẩm bạn đã đánh dấu yêu thích
        </Typography>

        {loading ? (
          <Grid container spacing={3}>
            {Array(4).fill({}).map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={360} sx={{ borderRadius: '12px' }} />
              </Grid>
            ))}
          </Grid>
        ) : favoriteProducts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <Typography variant="h5" sx={{ color: '#555', mb: 2 }}>Bạn chưa có sản phẩm yêu thích nào.</Typography>
            <Button variant="contained" sx={{ bgcolor: '#e68c55', '&:hover': { bgcolor: '#cc7a4a' } }} onClick={() => navigate('/shopping')}>
              Quay lại cửa hàng
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {favoriteProducts.map((prod) => (
              <Grid item xs={12} sm={6} md={3} key={prod.maSanPham || prod.maSP}>
                <ProductCard
                  product={prod}
                  isFavorite={true}
                  onToggleFav={(product, e) => handleRemoveFavorite(product, e)}
                  onAddToCart={handleAddToCart}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default FavoritesPage;
