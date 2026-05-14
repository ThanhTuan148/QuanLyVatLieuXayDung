import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Button, Avatar, Divider } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useNavigate } from 'react-router-dom';

const teamMembers = [
  {
    name: 'Trương Thanh Tuấn',
    role: '2001224546',
    avatar: 'https://i.pravatar.cc/300?img=11',
    socials: { facebook: '#', linkedin: '#', instagram: '#' }
  },
  {
    name: 'Phạm Hồ Thúy Vy',
    role: '2001224546',
    avatar: 'https://i.pravatar.cc/300?img=47',
    socials: { facebook: '#', twitter: '#', linkedin: '#', instagram: '#' }
  },
  {
    name: 'Lê Trần Ngọc Yến',
    role: '2001224546',
    avatar: 'https://i.pravatar.cc/300?img=45',
    socials: { facebook: '#', twitter: '#', instagram: '#' }
  },
];

const SocialButton = ({ icon, color }) => (
  <Box
    component="a"
    href="#"
    sx={{
      width: 36, height: 36, borderRadius: '50%',
      bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', cursor: 'pointer',
      transition: 'transform 0.2s, opacity 0.2s',
      '&:hover': { opacity: 0.8, transform: 'scale(1.1)' }
    }}
  >
    {icon}
  </Box>
);

const CustomerAboutPage = () => {
  const navigate = useNavigate();
  const [readMore, setReadMore] = useState(false);

  return (
    <Box>

      {/* ── HERO BANNER ── */}
      <Box sx={{
        bgcolor: '#9cad9f',
        minHeight: 340,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* White oval shape behind chairs */}
        <Box sx={{
          position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)',
          width: 420, height: 260, bgcolor: 'rgba(255,255,255,0.25)',
          borderRadius: '50%',
        }} />

        {/* Chairs illustration using colored boxes as stand-ins */}
        <Box sx={{ position: 'absolute', right: '5%', top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { w: 80, h: 90, bg: '#c6bfb6', mt: 20 },
            { w: 110, h: 120, bg: '#4a6741', mt: 5 },
            { w: 70, h: 75, bg: '#3b82c4', mt: 30 },
            { w: 100, h: 100, bg: '#c4823b', mt: 10 },
            { w: 60, h: 100, bg: '#2b5bb5', mt: 0 },
          ].map((shape, i) => (
            <Box key={i} sx={{
              width: shape.w, height: shape.h, bgcolor: shape.bg,
              borderRadius: '40% 40% 50% 50%', mt: `${shape.mt}px`,
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
            }} />
          ))}
        </Box>

        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 }, position: 'relative', zIndex: 1 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontFamily: '"Inter", "Roboto", sans-serif', fontWeight: 700, mb: 1.5, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            Về chúng tôi
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.8)', fontFamily: '"Inter", "Roboto", sans-serif', cursor: 'pointer', '&:hover': { color: '#fff' } }}
              onClick={() => navigate('/shopping')}
            >
              Trang chủ
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"Inter", "Roboto", sans-serif' }}>/</Typography>
            <Typography variant="body2" sx={{ color: '#fff', fontFamily: '"Inter", "Roboto", sans-serif', fontWeight: 600 }}>Về chúng tôi</Typography>
          </Box>
        </Container>
      </Box>

      {/* ── TWO PHOTOS + ABOUT TEXT ── */}
      <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 }, py: 10 }}>
        <Grid container spacing={5} alignItems="center">
          {/* Left: two stacked photos */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{
                flex: 1, height: 380, borderRadius: '16px', overflow: 'hidden',
                backgroundImage: 'url(https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400)',
                backgroundSize: 'cover', backgroundPosition: 'center'
              }} />
              <Box sx={{
                flex: 1, height: 380, borderRadius: '16px', overflow: 'hidden',
                backgroundImage: 'url(https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400)',
                backgroundSize: 'cover', backgroundPosition: 'center'
              }} />
            </Box>
          </Grid>

          {/* Right: text */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#222', mb: 1.5, fontFamily: '"Inter", "Roboto", sans-serif' }}>
              Về cửa hàng trực tuyến của chúng tôi
            </Typography>
            <Typography variant="body2" sx={{ color: '#e68c55', fontStyle: 'italic', mb: 3, lineHeight: 1.7 }}>
              Cung cấp vật liệu xây dựng chất lượng cao,
              đáp ứng mọi nhu cầu xây dựng và trang trí nội thất.
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', mb: 2.5, lineHeight: 1.9 }}>
              Chúng tôi là đơn vị chuyên cung cấp vật liệu xây dựng hàng đầu với nhiều năm
              kinh nghiệm trong ngành. Từ xi măng, ống đồng, dây điện cho đến các vật tư
              hoàn thiện nội ngoại thất – tất cả đều được tuyển chọn kỹ lưỡng từ các thương
              hiệu uy tín trong và ngoài nước.
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.9 }}>
              Hệ thống phân phối rộng khắp, dịch vụ giao hàng tận nơi và đội ngũ tư vấn
              chuyên nghiệp giúp khách hàng lựa chọn đúng sản phẩm, tiết kiệm thời gian và
              chi phí tối đa cho mọi công trình.
            </Typography>
          </Grid>
        </Grid>
      </Container>

      {/* ── TEAM MEMBERS ── */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#222', mb: 1, fontFamily: '"Inter", "Roboto", sans-serif' }}>Thành viên nhóm</Typography>
          </Box>

          <Grid container spacing={6} justifyContent="center">
            {teamMembers.map((member, i) => (
              <Grid item xs={12} sm={6} md={4} key={i} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center', maxWidth: 300 }}>
                  {/* Circle Avatar */}
                  <Box sx={{
                    width: 260, height: 260, borderRadius: '50%', overflow: 'hidden',
                    mx: 'auto', mb: 3,
                    backgroundImage: `url(${member.avatar})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    border: '4px solid #f0ede8',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                  }} />

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#222', mb: 0.5 }}>{member.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>{member.role}</Typography>

                  {/* Social Icons */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {member.socials.facebook && <SocialButton color="#1877f2" icon={<FacebookIcon sx={{ fontSize: 18 }} />} />}
                    {member.socials.twitter && <SocialButton color="#000" icon={<TwitterIcon sx={{ fontSize: 18 }} />} />}
                    {member.socials.linkedin && <SocialButton color="#0a66c2" icon={<LinkedInIcon sx={{ fontSize: 18 }} />} />}
                    {member.socials.instagram && <SocialButton color="#c13584" icon={<InstagramIcon sx={{ fontSize: 18 }} />} />}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── VIDEO / IMAGE SHOWCASE ── */}
      <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 }, py: 6 }}>
        <Box sx={{
          borderRadius: '40px', overflow: 'hidden', position: 'relative',
          height: 380,
          backgroundImage: 'url(https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          {/* Dark overlay */}
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)' }} />

          {/* Text */}
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, letterSpacing: 1 }}>
              Vật liệu xây dựng
            </Typography>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 4, fontSize: { xs: '1.8rem', md: '2.8rem' } }}>
              Cách chúng tôi xây dựng thương hiệu
            </Typography>

            {/* Play Button */}
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.3s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', transform: 'scale(1.1)' }
            }}>
              <PlayArrowIcon sx={{ color: '#fff', fontSize: 34 }} />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* ── TEXT CONTENT BLOCKS ── */}
      <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 }, py: 6 }}>
        <Grid container spacing={8}>
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', mb: 2 }}>
              Cửa hàng trực tuyến với đa dạng vật liệu xây dựng
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', lineHeight: 2, mb: 4 }}>
              Vật liệu xây dựng là nền tảng không thể thiếu của bất kỳ công trình nào.
              Chúng tôi cung cấp không gian sinh hoạt đúng nghĩa, tạo điều kiện lý tưởng
              để làm việc hiệu quả hoặc nghỉ ngơi sau một ngày dài. Ngày càng phổ biến hơn,
              khách hàng có thể đặt hàng ngay trong cửa hàng trực tuyến của chúng tôi, ngồi
              thoải mái tại nhà, chọn lựa vật liệu phù hợp và mua sắm những sản phẩm mình ưa thích.
              Cửa hàng trực tuyến của chúng tôi có danh mục vật liệu đồ sộ: từ vật liệu thô như
              xi măng, cát, đá cho đến vật liệu hoàn thiện nội ngoại thất cao cấp.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', mb: 2 }}>
              Sản xuất vật liệu là một hình thức nghệ thuật hiện đại
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#555', lineHeight: 2,
                overflow: readMore ? 'visible' : 'hidden',
                maxHeight: readMore ? 'none' : '80px',
                display: '-webkit-box',
                WebkitLineClamp: readMore ? 'unset' : 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              Các nhà sản xuất vật liệu xây dựng, cũng như các nhà sản xuất đồ gia dụng
              khác, luôn mang đến những ưu đãi tuyệt vời: chúng ta thường bắt gặp cả những
              sản phẩm sản xuất đại trà tiêu chuẩn lẫn những sáng tạo độc đáo – vật liệu từ
              những người thợ thủ công lành nghề sẽ được đánh giá cao bởi những người thực sự
              am hiểu chất lượng. Chúng tôi đã tuyển chọn cho bạn những mẫu tốt nhất từ các
              nghệ nhân hiện đại, những người đã thành công kết hợp hài hòa giữa truyền thống
              và đổi mới trong từng sản phẩm.
            </Typography>

            <Button
              onClick={() => setReadMore(r => !r)}
              sx={{ mt: 3, color: '#333', fontWeight: 700, borderBottom: '2px solid #333', borderRadius: 0, px: 0, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#e68c55', borderColor: '#e68c55' } }}
            >
              {readMore ? 'Thu gọn' : 'Đọc thêm'}
            </Button>
          </Grid>
        </Grid>
      </Container>

      {/* ── STATS BANNER ── */}
      <Box sx={{ bgcolor: '#2b2b2b', py: 6, mt: 4 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Grid container spacing={4} justifyContent="space-around" textAlign="center">
            {[
              { num: '2,500+', label: 'Sản phẩm' },
              { num: '150+', label: 'Thương hiệu' },
              { num: '10,000+', label: 'Khách hàng' },
              { num: '15+', label: 'Năm kinh nghiệm' },
            ].map((stat, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Typography variant="h3" sx={{ color: '#e68c55', fontWeight: 800, mb: 0.5 }}>{stat.num}</Typography>
                <Typography variant="body1" sx={{ color: '#aaa' }}>{stat.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

    </Box>
  );
};

export default CustomerAboutPage;
