import React, { useState, useEffect, useCallback } from 'react';
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
    label: 'BỘ SƯU TẬP ĐẶC BIỆT',
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

const HeroCarousel = ({ ctaLink = "/shopping", ctaLabel = "Khám Phá →", mode = "team" }) => {
  const [slides, setSlides] = useState(mode === "shopping" ? SHOPPING_SLIDES : DEFAULT_SLIDES);
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    if (mode === "shopping") {
      setSlides(SHOPPING_SLIDES);
      return;
    }
    const fetchTeam = async () => {
      try {
        const data = await teamService.getAllTeamMembers();
        if (data && data.length > 0) {
          setSlides(data.map(m => {
            let avatarUrl = m.avatar || 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png';
            let bgColor = m.bg || '#F4845F';
            if (m.studentId === '2001226134' || m.id === '2001226134' || m.name?.includes('Ngọc Yến')) {
              avatarUrl = 'https://i.ibb.co/5hHx2KNM/Chat-GPT-Image-21-19-31-16-thg-5-2026-removebg-preview.png';
              bgColor = '#5A9BD5';
            }
            return {
              bg: bgColor,
              label: m.role || 'Thành viên',
              name: m.name || '',
              id: m.studentId || m.id || '',
              img: avatarUrl
            };
          }));
        }
      } catch (err) {
        console.error('Error fetching team for carousel:', err);
      }
    };
    fetchTeam();
  }, [mode]);

  useEffect(() => {
    slides.forEach(s => { const i = new Image(); i.src = s.img; });
    const onResize = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [slides]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      if (!animating) {
        setAnimating(true);
        setActive(p => (p + 1) % slides.length);
        setTimeout(() => setAnimating(false), 650);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [animating, slides.length]);

  const go = useCallback((dir) => {
    if (animating) return;
    setAnimating(true);
    setActive(p => dir === 'next' ? (p + 1) % slides.length : (p + slides.length - 1) % slides.length);
    setTimeout(() => setAnimating(false), 650);
  }, [animating, slides.length]);

  if (mode === "shopping") {
    const N = slides.length || 6;
    const center = active % N;
    const left = (active + N - 1) % N;
    const right = (active + 1) % N;
    const farLeft = (active + N - 2) % N;
    const farRight = (active + 2) % N;

    const getRole = (i) => i === center ? 'center' : i === left ? 'left' : i === right ? 'right' : i === farLeft ? 'farLeft' : i === farRight ? 'farRight' : 'back';

    const shoppingRoleStyle = (role) => {
      const T = 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1), filter 700ms cubic-bezier(0.4, 0, 0.2, 1), opacity 700ms cubic-bezier(0.4, 0, 0.2, 1), left 700ms cubic-bezier(0.4, 0, 0.2, 1), bottom 700ms cubic-bezier(0.4, 0, 0.2, 1), width 700ms cubic-bezier(0.4, 0, 0.2, 1), height 700ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 700ms cubic-bezier(0.4, 0, 0.2, 1)';
      const base = { position: 'absolute', transition: T, willChange: 'transform,filter,opacity,left,width,height', borderRadius: 24, overflow: 'hidden' };

      if (role === 'center') return { ...base, left: '50%', width: mobile ? '88%' : '58%', height: mobile ? '72%' : '86%', bottom: mobile ? '16%' : '7%', transform: 'translateX(-50%) scale(1)', filter: 'none', opacity: 1, zIndex: 30, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' };
      if (role === 'left') return { ...base, left: mobile ? '18%' : '23%', width: mobile ? '75%' : '42%', height: mobile ? '60%' : '72%', bottom: mobile ? '22%' : '14%', transform: 'translateX(-50%) scale(0.95)', filter: 'blur(2px)', opacity: 0.8, zIndex: 20, boxShadow: '0 15px 35px -10px rgba(0,0,0,0.25)', cursor: 'pointer' };
      if (role === 'right') return { ...base, left: mobile ? '82%' : '77%', width: mobile ? '75%' : '42%', height: mobile ? '60%' : '72%', bottom: mobile ? '22%' : '14%', transform: 'translateX(-50%) scale(0.95)', filter: 'blur(2px)', opacity: 0.8, zIndex: 20, boxShadow: '0 15px 35px -10px rgba(0,0,0,0.25)', cursor: 'pointer' };
      if (role === 'farLeft') return { ...base, left: mobile ? '5%' : '8%', width: mobile ? '55%' : '32%', height: mobile ? '48%' : '56%', bottom: mobile ? '28%' : '22%', transform: 'translateX(-50%) scale(0.9)', filter: 'blur(4px)', opacity: 0.45, zIndex: 10, cursor: 'pointer' };
      if (role === 'farRight') return { ...(base), left: mobile ? '95%' : '92%', width: mobile ? '55%' : '32%', height: mobile ? '48%' : '56%', bottom: mobile ? '28%' : '22%', transform: 'translateX(-50%) scale(0.9)', filter: 'blur(4px)', opacity: 0.45, zIndex: 10, cursor: 'pointer' };
      return { ...base, left: '50%', width: '25%', height: '40%', bottom: '30%', transform: 'translateX(-50%) scale(0.8)', opacity: 0, zIndex: 5 };
    };

    return (
      <div style={{
        backgroundColor: slides[active]?.bg || '#f4f3ef',
        transition: 'background-color 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        width: '100%',
        height: 'clamp(400px, 60vh, 600px)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        boxSizing: 'border-box'
      }}>
        {/* Architectural Background Grid & Watermark */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.15,
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px' }} />
        
        {/* Huge Watermark Typography */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', pointerEvents: 'none', zIndex: 1, userSelect: 'none' }}>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(60px, 18vw, 220px)', fontWeight: 900, color: 'rgba(0,0,0,0.04)', lineHeight: 0.8, letterSpacing: '0.05em' }}>
            {slides[active]?.shortName}
          </span>
        </div>

        {/* Main Stage: 3D Rotating Circular Carousel */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
          {slides.map((s, i) => {
            const role = getRole(i);
            const isCenter = role === 'center';
            return (
              <div
                key={i}
                onClick={() => { if (!animating && !isCenter) { setActive(i); setAnimating(true); setTimeout(() => setAnimating(false), 650); } }}
                style={shoppingRoleStyle(role)}
              >
                <img
                  src={s.img}
                  alt={s.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isCenter ? 'scale(1.02)' : 'scale(1)'
                  }}
                />
                {/* Overlay gradient */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: isCenter 
                    ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' 
                    : 'rgba(0,0,0,0.4)',
                  transition: 'background 700ms ease'
                }} />

                {/* Content inside card */}
                {isCenter ? (
                  <div style={{ position: 'absolute', inset: 0, padding: mobile ? '1.5rem 1rem' : '4rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', opacity: animating ? 0.5 : 1, transition: 'opacity 300ms ease', pointerEvents: 'auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: 999, marginBottom: 12, width: 'fit-content', border: '1px solid rgba(255,255,255,0.4)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#F7DC6F', letterSpacing: '0.15em' }}>{s.label}</span>
                    </div>
                    <h3 style={{ fontSize: mobile ? 22 : 'clamp(26px, 3vw, 42px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 12, letterSpacing: '-0.02em' }}>
                      {s.name}
                    </h3>
                    <p style={{ fontSize: mobile ? 13 : 16, color: 'rgba(255,255,255,0.9)', maxWidth: 640, lineHeight: 1.6, marginBottom: mobile ? 16 : 30, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {s.id}
                    </p>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <a href={ctaLink} style={{ backgroundColor: '#ef4d23', color: '#fff', padding: mobile ? '10px 24px' : '14px 36px', borderRadius: 999, fontSize: mobile ? 13 : 15, fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 10px 25px rgba(239, 77, 35, 0.4)', transition: 'transform 200ms, background-color 200ms', display: 'inline-block' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.backgroundColor = '#d9431d'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#ef4d23'; }}
                      >{ctaLabel}</a>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 800, fontSize: mobile ? 14 : 20, letterSpacing: '0.15em', textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                      {s.shortName || s.name.split(' ').slice(-2).join(' ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation Dock - Light Glassmorphism (Arrows Only) */}
        <div style={{ position: 'absolute', bottom: mobile ? 16 : 24, right: mobile ? 16 : 32, zIndex: 40, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', padding: '8px 12px', borderRadius: 30, border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
          <button onClick={() => go('prev')}
            style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.15)', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
          <button onClick={() => go('next')}
            style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.15)', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 1, justifyContent: 'center', transition: 'all 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5 7 7-7 7"/><path d="M5 12h14"/></svg>
          </button>
        </div>

        {/* Auto-play progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, zIndex: 61, background: 'rgba(0,0,0,0.08)' }}>
          <div key={active} style={{ height: '100%', background: '#ef4d23', animation: 'progress 4s linear forwards' }} />
        </div>
      </div>
    );
  }

  const N = slides.length || 3;
  const center = active % N;
  const left = (active + N - 1) % N;
  const right = (active + 1) % N;

  const roleStyle = (role) => {
    const T = 'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1), bottom 650ms cubic-bezier(0.4,0,0.2,1)';
    const base = { position: 'absolute', aspectRatio: '0.6/1', transition: T, willChange: 'transform,filter,opacity' };

    if (role === 'center') return { ...base, left: '50%', height: mobile ? '80%' : '95%', bottom: 0, transform: `translateX(-50%) scale(${mobile ? 1.15 : 1.35})`, filter: 'none', opacity: 1, zIndex: 20 };
    if (role === 'left')   return { ...base, left: mobile ? '15%' : '25%', height: mobile ? '28%' : '42%', bottom: mobile ? '20%' : '12%', transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.8, zIndex: 10 };
    if (role === 'right')  return { ...base, left: mobile ? '85%' : '75%', height: mobile ? '28%' : '42%', bottom: mobile ? '20%' : '12%', transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.8, zIndex: 10 };
    return { ...base, left: '50%', height: '0%', opacity: 0, zIndex: 1 };
  };

  const getRole = (i) => i === center ? 'center' : i === left ? 'left' : i === right ? 'right' : 'hidden';

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
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50, opacity: 0.3,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px' }} />

        {/* Ghost text — fluid size to always fit viewport */}
        <div style={{ position: 'absolute', inset: 0, top: '18%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', zIndex: 2 }}>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(40px, 12vw, 150px)', fontWeight: 900, color: 'rgba(255,255,255,0.22)', lineHeight: 1, letterSpacing: '0.05em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>CHÚNG TÔI</span>
        </div>

        {/* Brand top-left */}
        <div style={{ position: 'absolute', top: 20, left: mobile ? 16 : 32, zIndex: 60 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.9)' }}>Vật liệu xây dựng Thành Đạt</span>
        </div>

        {/* Characters */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
          {slides.map((s, i) => (
            <div key={i} style={roleStyle(getRole(i))}>
              <img src={s.img} alt={s.name} draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center' }} />
            </div>
          ))}
        </div>

        {/* Bottom-left controls */}
        <div style={{ position: 'absolute', bottom: mobile ? 16 : 32, left: mobile ? 16 : 48, zIndex: 60, maxWidth: 300 }}>
          <p style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: mobile ? 14 : 20, marginBottom: 4, opacity: 0.95 }}>
            {slides[active]?.name}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: mobile ? 11 : 12, marginBottom: !mobile ? 16 : 10 }}>
            MSSV: {slides[active]?.id}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => go('prev')}
              style={{ width: mobile ? 40 : 48, height: mobile ? 40 : 48, borderRadius: '50%', background: 'transparent', border: '2px solid rgba(255,255,255,0.85)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 150ms, background-color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
            <button onClick={() => go('next')}
              style={{ width: mobile ? 40 : 48, height: mobile ? 40 : 48, borderRadius: '50%', background: 'transparent', border: '2px solid rgba(255,255,255,0.85)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 150ms, background-color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5 7 7-7 7"/><path d="M5 12h14"/></svg>
            </button>
          </div>
        </div>

        {/* Bottom-right link */}
        <div style={{ position: 'absolute', bottom: mobile ? 16 : 32, right: mobile ? 16 : 40, zIndex: 60 }}>
          <a href={ctaLink} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Anton', sans-serif", fontSize: 'clamp(16px, 3vw, 36px)', fontWeight: 400, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', textDecoration: 'none', textTransform: 'uppercase', transition: 'opacity 200ms' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >{ctaLabel}</a>
        </div>

        {/* Dot indicators */}
        <div style={{ position: 'absolute', top: 20, right: mobile ? 16 : 32, zIndex: 60, display: 'flex', gap: 8, alignItems: 'center' }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => { if (!animating) { setActive(i); setAnimating(true); setTimeout(() => setAnimating(false), 650); } }}
              style={{ width: i === active ? 28 : 8, height: 8, borderRadius: 4, background: i === active ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 400ms ease', cursor: 'pointer' }} />
          ))}
        </div>

        {/* Auto-play progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 61, background: 'rgba(255,255,255,0.2)' }}>
          <div key={active} style={{ height: '100%', background: 'rgba(255,255,255,0.8)', animation: 'progress 4s linear forwards' }} />
        </div>
        <style>{`@keyframes progress { from{width:0%} to{width:100%} }`}</style>
      </div>
    </div>
  );
};

export default HeroCarousel;
