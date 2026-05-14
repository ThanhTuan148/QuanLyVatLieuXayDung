import React, { useState } from 'react';
import { Box, Container, Grid, Typography, Card, CardMedia, CardContent, CardActions, Button, Chip } from '@mui/material';
import { AccessTime, ArrowForward } from '@mui/icons-material';

const mockNews = [
  {
    id: 1,
    title: 'Xu Hướng Thiết Kế Nội Thất Tối Giản (Minimalism) Lên Ngôi Năm 2026',
    excerpt: 'Phong cách tối giản không chỉ mang lại không gian sống thoáng đãng mà còn thể hiện sự tinh tế của gia chủ. Cùng khám phá những vật liệu phù hợp nhất.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '10/05/2026',
    category: 'Xu Hướng'
  },
  {
    id: 2,
    title: 'Cách Chọn Gạch Lát Nền Phù Hợp Cho Từng Không Gian Trong Nhà',
    excerpt: 'Mỗi khu vực như phòng khách, phòng tắm, nhà bếp đều đòi hỏi loại gạch lát nền có đặc tính khác nhau về độ nhám, độ thấm nước và thẩm mỹ.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '05/05/2026',
    category: 'Kinh Nghiệm'
  },
  {
    id: 3,
    title: 'VLXD Thành Đạt Chính Thức Khai Trương Showroom Mới Tại Quận 2',
    excerpt: 'Nhằm đáp ứng nhu cầu ngày càng cao của khách hàng, chúng tôi tự hào ra mắt không gian trải nghiệm vật liệu xây dựng quy mô lớn nhất khu vực.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '28/04/2026',
    category: 'Tin Tức Công Ty'
  },
  {
    id: 4,
    title: 'Top 5 Vật Liệu Thân Thiện Với Môi Trường Đang Gây Bão',
    excerpt: 'Xu hướng kiến trúc xanh đang ngày càng được quan tâm. Dưới đây là những vật liệu sinh thái bền vững giúp giảm thiểu tác động đến môi trường.',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '15/04/2026',
    category: 'Kiến Trúc Xanh'
  },
  {
    id: 5,
    title: 'Bảng Giá Sắt Thép Xây Dựng Mới Nhất Tháng 5/2026',
    excerpt: 'Cập nhật diễn biến thị trường và bảng báo giá chi tiết các loại sắt thép xây dựng từ các thương hiệu hàng đầu như Hòa Phát, Pomina.',
    image: 'https://images.unsplash.com/photo-1533575971408-569b3ee90fb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '02/05/2026',
    category: 'Thị Trường'
  },
  {
    id: 6,
    title: 'Lưu Ý Quan Trọng Khi Chống Thấm Cho Công Trình Mùa Mưa',
    excerpt: 'Chống thấm là công đoạn không thể bỏ qua để bảo vệ cấu trúc ngôi nhà. Chuyên gia của chúng tôi chia sẻ những lưu ý vàng.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '20/04/2026',
    category: 'Kinh Nghiệm'
  }
];

const CustomerNewsPage = () => {
  const [activeCategory, setActiveCategory] = useState('Tất Cả');
  const categories = ['Tất Cả', 'Tin Tức Công Ty', 'Xu Hướng', 'Kinh Nghiệm', 'Kiến Trúc Xanh', 'Thị Trường'];

  const filteredNews = activeCategory === 'Tất Cả' ? mockNews : mockNews.filter(n => n.category === activeCategory);

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', pb: 8 }}>
      {/* Hero Section */}
      <Box sx={{ bgcolor: '#222', color: '#fff', py: { xs: 8, md: 10 }, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>Tin Tức & Sự Kiện</Typography>
        <Typography variant="body1" sx={{ color: '#aaa', maxWidth: 600, mx: 'auto', px: 2 }}>
          Cập nhật những thông tin mới nhất về thị trường, xu hướng thiết kế và các mẹo hữu ích cho ngôi nhà của bạn.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 6, px: { xs: 4, md: 8, lg: 12 } }}>
        {/* Filter Categories */}
        <Box sx={{ display: 'flex', gap: 2, mb: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map((cat, idx) => (
            <Chip 
              key={idx} 
              label={cat} 
              onClick={() => setActiveCategory(cat)}
              sx={{ 
                px: 2, 
                py: 2.5, 
                fontSize: '1rem', 
                fontWeight: activeCategory === cat ? 700 : 500,
                bgcolor: activeCategory === cat ? '#e68c55' : '#fff',
                color: activeCategory === cat ? '#fff' : '#555',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                '&:hover': { bgcolor: activeCategory === cat ? '#d17a4a' : '#f0f0f0' },
                transition: 'all 0.3s ease'
              }} 
            />
          ))}
        </Box>

        {/* News Grid */}
        <Grid container spacing={4}>
          {filteredNews.map((news) => (
            <Grid item xs={12} sm={6} lg={4} key={news.id}>
              <Card sx={{ 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
                }
              }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="240"
                    image={news.image}
                    alt={news.title}
                  />
                  <Chip 
                    label={news.category} 
                    size="small" 
                    sx={{ position: 'absolute', top: 16, left: 16, bgcolor: '#e68c55', color: '#fff', fontWeight: 600 }} 
                  />
                </Box>
                
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#888', mb: 2 }}>
                    <AccessTime fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{news.date}</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.4, color: '#222', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {news.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {news.excerpt}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button endIcon={<ArrowForward />} sx={{ color: '#e68c55', fontWeight: 700, p: 0, '&:hover': { bgcolor: 'transparent', color: '#cc7a4a' } }}>
                    Đọc tiếp
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {filteredNews.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h6" sx={{ color: '#888' }}>Chưa có bài viết nào trong chuyên mục này.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CustomerNewsPage;
