import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Checkbox,
  Button,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon, CardGiftcard as GiftIcon } from '@mui/icons-material';
import productService from '../services/productService';

const GiftsModal = ({ open, onClose, currentTotal, selectedGifts, onSelect }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchGifts();
    }
  }, [open]);

  const fetchGifts = async () => {
    // Only show loading if we really need to fetch (though service handles cache now)
    setLoading(true);
    try {
      const res = await productService.getAllProducts();
      const all = res.data || (Array.isArray(res) ? res : []);
      // Filter gift items
      const giftItems = all.filter(p => p.isGift).map(p => {
        let tier = 500000;
        const name = (p.tenSP || '').toLowerCase();
        if (name.includes('thước') || name.includes('nón') || name.includes('mũ')) tier = 2000000;
        else if (name.includes('đèn pin') || name.includes('tua vít') || name.includes('khoan')) tier = 3000000;
        
        return {
          id: p.maSanPham || p.maSP,
          name: p.tenSP,
          image: p.hinhAnh,
          tier: tier
        };
      });
      setGifts(giftItems);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine gift limit
  let limit = 0;
  if (currentTotal >= 3000000) limit = 3;
  else if (currentTotal >= 2000000) limit = 2;
  else if (currentTotal >= 500000) limit = 1;

  const handleToggleGift = (gift) => {
    const isSelected = selectedGifts.find(g => g.id === gift.id);
    if (isSelected) {
      onSelect(selectedGifts.filter(g => g.id !== gift.id));
    } else {
      if (selectedGifts.length < limit) {
        onSelect([...selectedGifts, gift]);
      } else {
        alert(`Bạn chỉ được chọn tối đa ${limit} phần quà.`);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ borderBottom: '1px solid #eee', py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GiftIcon color="error" />
            <Typography variant="h6" fontWeight={700}>Chọn quà tặng theo đơn hàng</Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} textColor="inherit" indicatorColor="primary" sx={{ px: 2 }}>
          <Tab label={`Quà được nhận (${selectedGifts.length}/${limit})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Thông tin hỗ trợ" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ bgcolor: '#fafafa', p: 3, minHeight: '300px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : activeTab === 0 ? (
          <Box>
            {[500000, 2000000, 3000000].map(tier => (
              <Box key={tier} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Đơn hàng {tier >= 1000000 ? `${tier/1000000} triệu` : `${tier/1000}k`}
                  </Typography>
                  {currentTotal < tier && (
                    <Typography fontSize={12} color="error" fontWeight={600}>
                      Chưa đủ điều kiện (Thiếu ₫{(tier - currentTotal).toLocaleString('vi-VN')})
                    </Typography>
                  )}
                </Box>
                
                <Grid container spacing={2}>
                  {gifts.filter(g => g.tier === tier).map(gift => {
                    const disabled = currentTotal < tier;
                    const selected = selectedGifts.find(g => g.id === gift.id);
                    return (
                      <Grid item xs={12} sm={6} key={gift.id}>
                        <Card 
                          elevation={0}
                          onClick={() => !disabled && handleToggleGift(gift)}
                          sx={{ 
                            display: 'flex', p: 1.5, borderRadius: '12px', border: '1px solid',
                            borderColor: selected ? '#e68c55' : '#eee',
                            bgcolor: disabled ? '#f9f9f9' : '#fff',
                            cursor: disabled ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': !disabled && { borderColor: '#e68c55' }
                          }}
                        >
                          <CardMedia
                            component="img"
                            sx={{ width: 80, height: 80, objectFit: 'contain', borderRadius: '8px', bgcolor: '#f5f5f5', opacity: disabled ? 0.5 : 1 }}
                            image={gift.image || '/images/gift_placeholder.png'}
                            alt={gift.name}
                          />
                          <CardContent sx={{ flex: '1 0 auto', p: '0 0 0 16px !important', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, color: disabled ? '#aaa' : '#333' }}>
                              {gift.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography fontSize={11} color="text.secondary">Quà tặng 0đ</Typography>
                              {!disabled && (
                                <Checkbox 
                                  size="small" 
                                  checked={!!selected} 
                                  sx={{ color: '#e68c55', '&.Mui-checked': { color: '#e68c55' } }}
                                />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                  {gifts.filter(g => g.tier === tier).length === 0 && (
                    <Grid item xs={12}>
                       <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Không có quà tặng khả dụng cho mức này.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Chương trình quà tặng tri ân khách hàng nhân dịp khai trương chi nhánh mới.</Typography>
          </Box>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="contained" fullWidth onClick={onClose} sx={{ bgcolor: '#d32f2f', borderRadius: '8px', py: 1.5, fontWeight: 700, '&:hover': { bgcolor: '#b71c1c' } }}>
              Xác nhận
            </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GiftsModal;
