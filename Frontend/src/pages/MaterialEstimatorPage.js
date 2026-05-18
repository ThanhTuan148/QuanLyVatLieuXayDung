import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, TextField, Button, 
  Grid, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Divider, 
  Slider, Alert, Breadcrumbs, CircularProgress, Skeleton
} from '@mui/material';
import { 
  CalculateOutlined, ShoppingCartOutlined, NavigateNext, 
  AutoAwesomeOutlined, LocalShippingOutlined, MonetizationOnOutlined
} from '@mui/icons-material';
import api from '../services/api';
import cartService from '../services/cartService';
import { useNavigate } from 'react-router-dom';

const MaterialEstimatorPage = () => {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  
  // Custom inputs
  const [purpose, setPurpose] = useState('Xây tường gạch ống');
  const [area, setArea] = useState(50);
  
  // Results states
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [estimatedItems, setEstimatedItems] = useState([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Fetch active products on load for matching
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setAllProducts(res.data || []);
      } catch (err) {
        console.error('Error fetching products for estimator:', err);
      }
    };
    fetchProducts();
  }, []);

  const handleEstimate = async () => {
    if (!purpose.trim()) {
      alert('Vui lòng nhập mục đích hoặc hạng mục cần xây dựng.');
      return;
    }

    setLoading(true);
    setHasCalculated(true);
    setAiText('');
    setEstimatedItems([]);

    try {
      // Call our new dedicated backend controller endpoint
      const res = await api.post('/chat/estimate', {
        purpose: purpose,
        area: area
      });

      const responseText = res.data?.response || '';
      
      // Parse the ESTIMATE_ACTION tag from AI text
      const actionRegex = /\[ESTIMATE_ACTION:\s*(\{[\s\S]*\})\s*\]/s;
      const match = responseText.match(actionRegex);
      
      let cleanText = responseText.replace(actionRegex, '').trim();
      setAiText(cleanText);

      if (match) {
        try {
          const actionData = JSON.parse(match[1]);
          if (actionData && actionData.items) {
            // Resolve products with fuzzy match exactly like chat
            const resolved = actionData.items.map(item => {
              const prod = allProducts.find(p => {
                if (!p || !item.maSP) return false;
                const codeMatch = p.maSP.toLowerCase() === item.maSP.toLowerCase();
                const nameMatch = p.tenSP.toLowerCase() === item.maSP.toLowerCase();
                const partialMatch = p.tenSP.toLowerCase().includes(item.maSP.toLowerCase()) || 
                                     item.maSP.toLowerCase().includes(p.tenSP.toLowerCase());
                return codeMatch || nameMatch || partialMatch;
              });

              return {
                maSP: item.maSP,
                quantity: item.quantity,
                product: prod || null
              };
            });
            setEstimatedItems(resolved);
          }
        } catch (e) {
          console.error('Error parsing JSON action block:', e);
        }
      }
    } catch (err) {
      console.error('Error getting AI estimation:', err);
      setAiText('Rất tiếc, đã xảy ra lỗi kết nối với máy chủ AI. Bạn vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToCart = async () => {
    let addedCount = 0;
    try {
      for (const item of estimatedItems) {
        if (item.product) {
          await cartService.addToCart({
            productId: item.product.maSanPham,
            productName: item.product.tenSP,
            price: item.product.giaSauKhuyenMai || item.product.giaBan,
            image: item.product.hinhAnh,
            unit: item.product.donViTinh,
            quantity: item.quantity
          });
          addedCount++;
        }
      }
      alert(`🎉 Đã thêm thành công ${addedCount} sản phẩm vào giỏ hàng của bạn!`);
      // Dispatch cart updated event so header changes count instantly
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      console.error('Error adding all to cart:', err);
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 4, md: 8, lg: 12 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Typography 
          onClick={() => navigate('/shopping')} 
          sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main', textDecoration: 'underline' }, fontSize: '0.85rem', fontWeight: 500 }}
        >
          Trang chủ
        </Typography>
        <Typography sx={{ color: 'text.primary', fontSize: '0.85rem', fontWeight: 600 }}>
          Ước tính vật liệu thông minh
        </Typography>
      </Breadcrumbs>

      {/* Hero Banner Banner */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
          borderRadius: '16px', 
          p: { xs: 4, md: 5 }, 
          color: 'white', 
          mb: 4,
          boxShadow: '0 8px 30px rgba(30, 60, 114, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1, fontFamily: '"Inter", "Roboto", sans-serif' }}>
            📊 Công Cụ Ước Tính Vật Liệu Thông Minh AI
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '900px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Công cụ hỗ trợ độc quyền của Thành Đạt. Khách hàng tự nhập mục đích thi công xây dựng và diện tích mong muốn, trí tuệ nhân tạo AI sẽ tự động phân tích kỹ thuật và bóc tách khối lượng vật tư chi tiết nhất đưa vào giỏ hàng!
          </Typography>
        </Box>
        <Box 
          sx={{ 
            position: 'absolute', right: -30, bottom: -30, opacity: 0.1, 
            transform: 'rotate(-10deg)', fontSize: '200px', fontWeight: 900 
          }}
        >
          🏗️
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Purpose & Scale Form */}
        <Grid item xs={12} md={5}>
          <Card elevation={3} sx={{ borderRadius: '16px', border: '1px solid #eaeaea', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#e68c55' }}>
                <CalculateOutlined /> Nhập Thông Số Công Trình
              </Typography>

              {/* Requirement Input Text Area */}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Mục đích xây cái gì (Hạng mục thi công):
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Ví dụ: Xây tường gạch ống 10cm, Đổ bê tông móng mác 200, Plastering tường nhà, Xây hồ cá chống thấm..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Estimated Area / Volume Slider */}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                Dự kiến diện tích hoặc thể tích thi công (m² hoặc m³):
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
                <Slider
                  value={area}
                  min={1}
                  max={500}
                  onChange={(e, val) => setArea(val)}
                  valueLabelDisplay="auto"
                  sx={{ 
                    flexGrow: 1,
                    color: '#e68c55',
                    '& .MuiSlider-thumb': {
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0px 0px 0px 8px rgba(230,140,85,0.16)'
                      }
                    }
                  }}
                />
                <TextField
                  type="number"
                  value={area}
                  onChange={(e) => setArea(Math.max(1, parseInt(e.target.value) || 1))}
                  size="small"
                  sx={{ width: '100px' }}
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeOutlined />}
                onClick={handleEstimate}
                sx={{ 
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  bgcolor: '#e68c55',
                  color: 'white',
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(230,140,85,0.3)',
                  '&:hover': {
                    bgcolor: '#d47b44',
                    boxShadow: '0 6px 20px rgba(230,140,85,0.4)'
                  }
                }}
              >
                {loading ? 'Đang phân tích & tính toán...' : '📊 ƯỚC TÍNH VẬT LIỆU'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: AI Analysis & Calculated Products List */}
        <Grid item xs={12} md={7}>
          <Card elevation={3} sx={{ borderRadius: '16px', border: '1px solid #eaeaea', minHeight: '400px' }}>
            <CardContent sx={{ p: 4 }}>
              {!hasCalculated ? (
                <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ opacity: 0.15, mb: 2 }}>📊</Typography>
                  <Typography variant="h6" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
                    Chưa có dữ liệu tính toán
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '400px' }}>
                    Vui lòng nhập mục đích xây dựng và bấm nút <strong>📊 ƯỚC TÍNH VẬT LIỆU</strong> bên trái để AI tự động tính toán.
                  </Typography>
                </Box>
              ) : loading ? (
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: '#e68c55' }} /> Trợ lý AI đang bóc tách vật tư...
                  </Typography>
                  <Skeleton variant="text" height={30} width="80%" />
                  <Skeleton variant="text" height={20} width="95%" />
                  <Skeleton variant="text" height={20} width="90%" />
                  <Skeleton variant="text" height={20} width="85%" sx={{ mb: 4 }} />

                  <Skeleton variant="rectangular" height={150} sx={{ borderRadius: '12px' }} />
                </Box>
              ) : (
                <Box>
                  {/* AI Explanation Text */}
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e3c72', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🤖 Báo Cáo Phân Tích Từ Trợ Lý AI:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 3, bgcolor: '#fcfcfc', borderRadius: '12px', mb: 4, borderStyle: 'dashed', borderColor: '#d3d3d3' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                      {aiText}
                    </Typography>
                  </Paper>

                  {/* Calculated Products Table */}
                  {estimatedItems.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>
                        📋 Danh Sách Sản Phẩm Khuyên Dùng Tại Cửa Hàng:
                      </Typography>

                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eaeaea', borderRadius: '12px', mb: 4 }}>
                        <Table>
                          <TableHead sx={{ bgcolor: '#fafafa' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Sản phẩm thực tế</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Số lượng dự toán</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Đơn giá bán</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Thành tiền</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {estimatedItems.map((item, idx) => {
                              const prod = item.product;
                              const hasDiscount = prod && prod.giaSauKhuyenMai < prod.giaBan;
                              const priceToUse = prod ? (prod.giaSauKhuyenMai || prod.giaBan) : 0;
                              const subtotal = priceToUse * item.quantity;

                              return (
                                <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Box sx={{ width: 45, height: 45, bgcolor: '#f5f5f5', borderRadius: '6px', mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {prod && prod.hinhAnh ? (
                                          <img src={prod.hinhAnh} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="" />
                                        ) : (
                                          <Typography variant="caption" color="text.secondary">Vật tư</Typography>
                                        )}
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {prod ? prod.tenSP : `Mã sản phẩm: ${item.maSP}`}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Mã: {item.maSP}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {item.quantity} {prod ? prod.donViTinh : 'đơn vị'}
                                  </TableCell>
                                  <TableCell align="right">
                                    {prod ? (
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: hasDiscount ? '#e68c55' : 'text.primary' }}>
                                          ₫{priceToUse.toLocaleString('vi-VN')}
                                        </Typography>
                                        {hasDiscount && (
                                          <Typography variant="caption" sx={{ textDecoration: 'line-through', opacity: 0.6, display: 'block' }}>
                                            ₫{prod.giaBan.toLocaleString('vi-VN')}
                                          </Typography>
                                        )}
                                      </Box>
                                    ) : (
                                      'Liên hệ'
                                    )}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1e3c72' }}>
                                    ₫{subtotal.toLocaleString('vi-VN')}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight="bold">Tổng chi phí vật tư dự kiến:</Typography>
                        <Typography variant="h5" fontWeight="900" color="primary.main">
                          ₫{estimatedItems.reduce((sum, item) => {
                            const price = item.product ? (item.product.giaSauKhuyenMai || item.product.giaBan || 0) : 0;
                            return sum + (price * item.quantity);
                          }, 0).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<ShoppingCartOutlined />}
                        onClick={handleAddAllToCart}
                        sx={{ 
                          py: 1.8,
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          borderRadius: '12px',
                          bgcolor: '#e68c55',
                          color: 'white',
                          textTransform: 'none',
                          boxShadow: '0 4px 15px rgba(230,140,85,0.3)',
                          '&:hover': {
                            bgcolor: '#d47b44',
                            boxShadow: '0 6px 20px rgba(230,140,85,0.4)'
                          }
                        }}
                      >
                        🛒 Thêm tất cả vật liệu ước tính vào giỏ hàng
                      </Button>
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                      AI đã phân tích kỹ thuật nhưng không tìm thấy sản phẩm phù hợp tương ứng trong cơ sở dữ liệu hiện tại của cửa hàng.
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MaterialEstimatorPage;
