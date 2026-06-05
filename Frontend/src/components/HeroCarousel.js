import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import teamService from '../services/teamService';

const DEFAULT_SLIDES = [
  {
    bg: '#F4845F', label: 'Trưởng nhóm phát triển', name: 'Thanh Tuấn', id: '2001224546',
    img: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
  },
  {
    bg: '#6BBF7A', label: 'Thiết kế UI/UX', name: 'Thúy Vy', id: '2001225958',
    img: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
  },
  {
    bg: '#5A9BD5', label: 'Phát triển Backend', name: 'Ngọc Yến', id: '2001226134',
    img: 'https://i.ibb.co/5hHx2KNM/Chat-GPT-Image-21-19-31-16-thg-5-2026-removebg-preview.png',
  },
];

const SHOPPING_SLIDES = [
  {
    bg: '#f4f3ef',
    label: 'VẬT LIỆU TIÊU BIỂU',
    shortName: 'GẠCH MEN',
    name: 'GẠCH MEN CAO CẤP IMPERIAL',
    id: 'Bề mặt phủ men Nano kháng khuẩn siêu bóng, hoa văn đá cẩm thạch tự nhiên sang trọng.',
    img: 'https://images.unsplash.com/photo-1615529179035-e760f6a2dcee?w=800&q=80',
  },
  {
    bg: '#eae6df',
    label: 'CÔNG NGHỆ VƯỢT TRỘI',
    shortName: 'THÉP XÂY DỰNG',
    name: 'THÉP XÂY DỰNG CAO CẤP HÒA PHÁT',
    id: 'Chịu lực vượt trội, đạt chuẩn quốc tế ASTM (Mỹ) và JIS (Nhật Bản), bảo hành trọn đời.',
    img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
  },
  {
    bg: '#e2ddd5',
    label: 'KIẾN TRÚC HIỆN ĐẠI',
    shortName: 'KÍNH CƯỜNG LỰC',
    name: 'KÍNH CƯỜNG LỰC SOLAR CONTROL',
    id: 'Cách nhiệt, cản 99% tia UV, mang lại không gian sống đẳng cấp và tiết kiệm năng lượng.',
    img: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
  },
  {
    bg: '#dfd8ce',
    label: 'ĐỘ BỀN THẾ KỶ',
    shortName: 'XI MĂNG',
    name: 'XI MĂNG ĐẶC CHỦNG INSEE EXTRA',
    id: 'Công thức phát triển cường độ sớm vượt trội, chống thấm hoàn hảo cho mọi công trình quy mô.',
    img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  },
  {
    bg: '#e8e4db',
    label: 'KIẾN TRÚC NHẬT BẢN',
    shortName: 'NGÓI TRÁNG MEN',
    name: 'NGÓI TRÁNG MEN CAO CẤP FUJITA',
    id: 'Siêu nhẹ, siêu bền màu dưới thời tiết khắc nghiệt, thiết kế lượn sóng đậm chất Á Đông.',
    img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  },
  {
    bg: '#f0ede6',
    label: 'KHÔNG GIAN SỐNG XANH',
    shortName: 'SƠN NỘI THẤT',
    name: 'SƠN NỘI THẤT DULUX LUXURY',
    id: 'Bề mặt láng mịn như lụa, lau chùi tối đa, công nghệ Air Clean thanh lọc không khí trong lành.',
    img: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80',
  },
];

const HeroCarousel = ({ ctaLink = "/shopping", ctaLabel = "Khám Phá →", mode = "team", products = [] }) => {
  const [slides, setSlides] = useState(mode === "shopping" ? SHOPPING_SLIDES : DEFAULT_SLIDES);
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "shopping") {
      if (products && products.length > 0) {
        // Map products dynamically based on keywords for each slide type
        const keyMap = [
          { keys: ['gạch', 'men', 'gach'], fallbackIdx: 0 },
          { keys: ['thép', 'sắt', 'sat', 'thep'], fallbackIdx: 1 },
          { keys: ['kính', 'cát', 'đá', 'kinh', 'cat', 'da'], fallbackIdx: 2 },
          { keys: ['xi măng', 'ximang', 'insee', 'hà tiên'], fallbackIdx: 3 },
          { keys: ['ngói', 'mái', 'ngoi', 'mai'], fallbackIdx: 4 },
          { keys: ['sơn', 'dulux', 'son'], fallbackIdx: 5 },
        ];

        const mappedSlides = SHOPPING_SLIDES.map((slide, idx) => {
          const mapping = keyMap[idx] || { keys: [] };
          // Find the first product that matches the category keywords
          const matchedProduct = products.find(p => {
            const name = (p.tenSP || '').toLowerCase();
            const cat = (p.tenLoai || p.tenDanhMuc || '').toLowerCase();
            return mapping.keys.some(k => name.includes(k) || cat.includes(k));
          }) || products[idx % products.length]; // fallback to any product if no keyword matches

          if (matchedProduct) {
            return {
              ...slide,
              name: matchedProduct.tenSP.toUpperCase(),
              id: matchedProduct.moTa || matchedProduct.tenLoai || slide.id,
              targetProductId: matchedProduct.maSanPham || matchedProduct.maSP,
            };
          }
          return slide;
        });
        setSlides(mappedSlides);
      } else {
        setSlides(SHOPPING_SLIDES);
      }
      return;
    }
    const fetchTeam = async () => {
      try {
        const data = await teamService.getAllTeamMembers();
        if (data && data.length > 0) {
          setSlides(data.map((m, index) => {
            const defaultSlide = DEFAULT_SLIDES.find(s => s.id === (m.studentId || m.id)) || DEFAULT_SLIDES[index % DEFAULT_SLIDES.length];
            return {
              bg: m.bg || defaultSlide.bg,
              label: m.role || defaultSlide.label || 'Thành viên',
              name: m.name || '',
              id: m.studentId || m.id || '',
              img: m.avatar || defaultSlide.img
            };
          }));
        }
      } catch (err) {
        console.error('Error fetching team for carousel:', err);
      }
    };
    fetchTeam();
  }, [mode, products]);

  useEffect(() => {
    slides.forEach(s => { const i = new Image(); i.src = s.img; });
    const onResize = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [slides]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setActive(p => (p + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const go = useCallback((dir) => {
    if (animating) return;
    setAnimating(true);
    setActive(p => dir === 'next' ? (p + 1) % slides.length : (p + slides.length - 1) % slides.length);
    setTimeout(() => setAnimating(false), 650);
  }, [animating, slides.length]);

  const N = slides.length || 3;
  const center = active % N;
  const left = (active + N - 1) % N;
  const right = (active + 1) % N;

  const roleStyle = (role) => {
    const T = 'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1), bottom 650ms cubic-bezier(0.4,0,0.2,1), width 650ms cubic-bezier(0.4,0,0.2,1), height 650ms cubic-bezier(0.4,0,0.2,1)';
    const base = { position: 'absolute', aspectRatio: mode === "shopping" ? '1.6/1' : '0.6/1', transition: T, willChange: 'transform,filter,opacity,width,height', borderRadius: mode === "shopping" ? '20px' : '0px', overflow: 'hidden', boxShadow: mode === "shopping" ? '0 25px 50px -12px rgba(0,0,0,0.4)' : 'none' };

    if (role === 'center') return { ...base, left: '50%', width: mode === "shopping" ? (mobile ? '90%' : '65%') : 'auto', height: mode === "shopping" ? (mobile ? '60%' : '75%') : (mobile ? '80%' : '95%'), bottom: mode === "shopping" ? '12%' : 0, transform: `translateX(-50%) scale(${mode === "shopping" ? 1 : (mobile ? 1.15 : 1.35)})`, filter: 'none', opacity: 1, zIndex: 20 };
    if (role === 'left') return { ...base, left: mobile ? '15%' : '18%', width: mode === "shopping" ? (mobile ? '70%' : '50%') : 'auto', height: mode === "shopping" ? (mobile ? '45%' : '55%') : (mobile ? '28%' : '42%'), bottom: mobile ? '20%' : '18%', transform: 'translateX(-50%) scale(1)', filter: 'blur(3px)', opacity: 0.6, zIndex: 10 };
    if (role === 'right') return { ...base, left: mobile ? '85%' : '82%', width: mode === "shopping" ? (mobile ? '70%' : '50%') : 'auto', height: mode === "shopping" ? (mobile ? '45%' : '55%') : (mobile ? '28%' : '42%'), bottom: mobile ? '20%' : '18%', transform: 'translateX(-50%) scale(1)', filter: 'blur(3px)', opacity: 0.6, zIndex: 10 };
    return { ...base, left: '50%', width: mode === "shopping" ? '50%' : 'auto', height: '0%', opacity: 0, zIndex: 1 };
  };

  const getRole = (i) => i === center ? 'center' : i === left ? 'left' : i === right ? 'right' : 'hidden';

  const renderTeamName = (fullName) => {
    if (!fullName) return 'CHÚNG TÔI';
    const allParts = fullName.trim().split(' ');
    const parts = allParts.length >= 2 ? allParts.slice(-2) : allParts;
    return parts.join(' ');
  };

  return (
    <div style={{
      backgroundColor: slides[active]?.bg || '#F4845F',
      transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)',
      position: 'relative',
      width: '100%',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ position: 'relative', width: '100%', height: 'clamp(400px, 60vh, 600px)', overflow: 'hidden' }}>

        {/* Grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50, opacity: 0.3,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }} />

        {/* Ghost text BEHIND character */}
        <div style={{ position: 'absolute', inset: 0, top: '16%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', zIndex: 2 }}>
          <span style={{ fontFamily: "'Kanit', sans-serif", fontSize: 'clamp(42px, 12vw, 150px)', fontWeight: 900, color: mode === "shopping" ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.25)', lineHeight: 1, letterSpacing: '0.08em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
            {mode === "shopping" ? (slides[active]?.shortName || 'SHOPPING') : renderTeamName(slides[active]?.name)}
          </span>
        </div>

        {/* Brand top-left */}
        <div style={{ position: 'absolute', top: mobile ? 16 : 24, left: mobile ? 16 : 32, zIndex: 60, display: 'flex', alignItems: 'center' }}>
          {mode === "shopping" ? (
            <div style={{ background: '#222', color: '#fff', padding: mobile ? '6px 14px' : '8px 18px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4d23', animation: 'pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <span style={{ fontSize: mobile ? 11 : 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                {slides[active]?.label}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: mobile ? 11 : 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
              Vật liệu xây dựng Thành Đạt
            </span>
          )}
        </div>
        <style>{`@keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }`}</style>

        {/* Characters / Product Images */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          {slides.map((s, i) => {
            const role = getRole(i);
            const isCenter = role === 'center';
            return (
              <div key={i} style={roleStyle(role)}>
                <img src={s.img} alt={s.name} draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: mode === "shopping" ? 'cover' : 'contain', objectPosition: mode === "shopping" ? 'center' : 'bottom center' }} />

                {/* Overlay gradient & Text for Center Card in Shopping Mode */}
                {mode === "shopping" && isCenter && (
                  <>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)',
                      pointerEvents: 'none'
                    }} />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      padding: mobile ? '1.5rem 1.25rem' : '2.5rem 3.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      pointerEvents: 'auto',
                      zIndex: 30,
                      cursor: s.targetProductId ? 'pointer' : 'default',
                    }}
                      onClick={() => {
                        if (s.targetProductId) {
                          navigate(`/product/${s.targetProductId}`);
                        } else {
                          window.location.href = ctaLink;
                        }
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', padding: '6px 18px', borderRadius: 999, marginBottom: 12, width: 'fit-content', border: '1px solid rgba(255,255,255,0.5)' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#F7DC6F', letterSpacing: '0.15em' }}>{s.label}</span>
                      </div>
                      <h3 style={{ fontSize: mobile ? 22 : 'clamp(26px, 3.2vw, 42px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.01em', textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
                        {s.name}
                      </h3>
                      <p style={{ fontSize: mobile ? 13 : 15, color: 'rgba(255,255,255,0.92)', maxWidth: 650, lineHeight: 1.6, marginBottom: mobile ? 16 : 24, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                        {s.id}
                      </p>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (s.targetProductId) {
                              navigate(`/product/${s.targetProductId}`);
                            } else {
                              window.location.href = ctaLink;
                            }
                          }}
                          style={{
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                            backgroundColor: '#ef4d23', color: '#fff', padding: mobile ? '10px 24px' : '14px 36px', borderRadius: 999, fontSize: mobile ? 13 : 15, fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 10px 25px rgba(239, 77, 35, 0.4)', transition: 'transform 200ms, background-color 200ms', display: 'inline-block'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.backgroundColor = '#d9431d'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#ef4d23'; }}
                        >
                          {ctaLabel}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom controls / Navigation Dock */}
        {mode === "shopping" ? (
          <div style={{ position: 'absolute', bottom: mobile ? 16 : 32, right: mobile ? 16 : 48, zIndex: 60, display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', padding: '8px 16px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <button onClick={() => go('prev')}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.15)', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
            </button>
            <button onClick={() => go('next')}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.15)', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5 7 7-7 7" /><path d="M5 12h14" /></svg>
            </button>
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', bottom: mobile ? 16 : 32, left: mobile ? 16 : 48, zIndex: 60, maxWidth: 300 }}>
              <p style={{ color: '#fff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: mobile ? 16 : 20, marginBottom: 6, opacity: 0.95, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                {slides[active]?.name}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: mobile ? 12 : 14, marginBottom: !mobile ? 20 : 12, lineHeight: 1.5, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                MSSV: {slides[active]?.id}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => go('prev')}
                  style={{ width: mobile ? 40 : 48, height: mobile ? 40 : 48, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.85)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 150ms, background-color 150ms', backdropFilter: 'blur(4px)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                </button>
                <button onClick={() => go('next')}
                  style={{ width: mobile ? 40 : 48, height: mobile ? 40 : 48, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.85)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 150ms, background-color 150ms', backdropFilter: 'blur(4px)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5 7 7-7 7" /><path d="M5 12h14" /></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;
