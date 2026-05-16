import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import teamService from '../services/teamService';

const useFadeIn = () => {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, v];
};

const Counter = ({ target, suffix, visible }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let s = 0; const step = Math.ceil(target / 60);
    const t = setInterval(() => { s += step; if (s >= target) { setVal(target); clearInterval(t); } else setVal(s); }, 20);
    return () => clearInterval(t);
  }, [visible, target]);
  return <>{val.toLocaleString('vi-VN')}{suffix}</>;
};

const imgs = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=420&h=260&fit=crop',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=420&h=260&fit=crop',
  'https://images.unsplash.com/photo-1615529179035-e760f6a2dcee?w=420&h=260&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=420&h=260&fit=crop',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=420&h=260&fit=crop',
  'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=420&h=260&fit=crop',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=420&h=260&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=420&h=260&fit=crop',
];

const MarqueeRow = ({ reverse, isImages }) => {
  const items = [...imgs, ...imgs, ...imgs];
  const labels = ['Vật liệu xây dựng ✦', 'Chất lượng cao cấp ✦', 'Sắt thép uy tín ✦', 'Gạch & Ngói ✦', 'Xi măng đặc biệt ✦', 'Nội thất đẳng cấp ✦', 'Tư vấn chuyên nghiệp ✦', 'Giao hàng toàn quốc ✦'];
  const allLabels = [...labels, ...labels, ...labels];

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: isImages ? '1rem' : '2.5rem', animation: `${reverse ? 'marqueeRev' : 'marquee'} ${isImages ? 50 : 28}s linear infinite`, willChange: 'transform' }}>
        {isImages ? items.map((src, i) => (
          <div key={i} style={{ flexShrink: 0, borderRadius: 10, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <img src={src} alt="" loading="lazy" style={{ width: 190, height: 115, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(230,140,85,0.12), transparent)' }} />
          </div>
        )) : allLabels.map((label, i) => (
          <span key={i} style={{ fontFamily: "'Kanit', sans-serif", fontWeight: i % 2 === 0 ? 700 : 300, fontSize: 'clamp(0.9rem,1.8vw,1.4rem)', color: i % 2 === 0 ? '#e68c55' : '#8B7355', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

// Floating particles
const Particles = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {[...Array(12)].map((_, i) => (
      <div key={i} style={{
        position: 'absolute',
        width: Math.random() * 6 + 4,
        height: Math.random() * 6 + 4,
        borderRadius: '50%',
        background: i % 3 === 0 ? '#e68c55' : i % 3 === 1 ? '#C9963A' : '#f0c080',
        opacity: 0.25,
        left: `${(i * 8.3) % 100}%`,
        top: `${(i * 13.7) % 100}%`,
        animation: `float${i % 4} ${5 + i * 0.7}s ${i * 0.4}s ease-in-out infinite`,
      }} />
    ))}
  </div>
);

const services = [
  { n: '01', name: 'Vật liệu thô', desc: 'Xi măng, cát, đá, sỏi — được tuyển chọn kỹ lưỡng từ nhà cung cấp uy tín.' },
  { n: '02', name: 'Sắt thép xây dựng', desc: 'Hòa Phát, Pomina và các thương hiệu hàng đầu với chứng nhận quốc tế.' },
  { n: '03', name: 'Vật liệu hoàn thiện', desc: 'Gạch ốp lát, sơn, kính, nhôm — nội ngoại thất cao cấp đa dạng.' },
  { n: '04', name: 'Tư vấn kỹ thuật', desc: 'Chuyên gia hỗ trợ lựa chọn vật liệu tối ưu cho từng công trình.' },
  { n: '05', name: 'Giao hàng & Lắp đặt', desc: 'Vận chuyển tận nơi, hỗ trợ lắp đặt với đội ngũ kỹ thuật chuyên nghiệp.' },
];

const DEFAULT_TEAM = [
  { name: 'Trương Thanh Tuấn', id: '2001224546', role: 'Trưởng nhóm phát triển', avatar: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png', bg: '#F4845F' },
  { name: 'Phạm Hồ Thúy Vy', id: '2001225958', role: 'Thiết kế UI/UX', avatar: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png', bg: '#6BBF7A' },
  { name: 'Lê Trần Ngọc Yến', id: '2001226134', role: 'Phát triển Backend', avatar: 'https://i.ibb.co/5hHx2KNM/Chat-GPT-Image-21-19-31-16-thg-5-2026-removebg-preview.png', bg: '#E882B4' },
];

const ORG = '#e68c55';
const CREAM = '#fdf8f2';
const WARM = '#f8f3eb';
const DARK = '#2C1810';
const MID = '#7C5C3E';

export default function CustomerAboutPage() {
  const navigate = useNavigate();
  const [sRef, sV] = useFadeIn();
  const [stRef, stV] = useFadeIn();
  const [svRef, svV] = useFadeIn();
  const [tRef, tV] = useFadeIn();

  const [teamMembers, setTeamMembers] = useState(DEFAULT_TEAM);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await teamService.getAllTeamMembers();
        if (data && data.length > 0) {
          const updatedData = data.map(m => {
            if (m.studentId === '2001226134' || m.id === '2001226134' || m.name?.includes('Ngọc Yến')) {
              return {
                ...m,
                avatar: 'https://i.ibb.co/5hHx2KNM/Chat-GPT-Image-21-19-31-16-thg-5-2026-removebg-preview.png',
                bg: '#5A9BD5'
              };
            }
            return m;
          });
          setTeamMembers(updatedData);
        }
      } catch (err) {
        console.error('Error fetching team members:', err);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div style={{ background: CREAM, fontFamily: "'Kanit', sans-serif", overflowX: 'clip' }}>
      <style>{`
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}
        @keyframes marqueeRev{from{transform:translateX(-33.333%)}to{transform:translateX(0)}}
        @keyframes float0{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes float1{0%,100%{transform:translateY(0)}50%{transform:translateY(-24px)}}
        @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes float3{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.4)}}
        @keyframes blob{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}}
        .sym-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.25rem; max-width: 960px; margin: 0 auto; }
        .sym-card { width: calc(33.333% - 0.84rem); min-width: 260px; background: #fdf8f2; border: 1px solid rgba(230,140,85,.25); border-radius: 16px; padding: 1.5rem 1.5rem; display: flex; flex-direction: column; justify-content: space-between; transition: transform .4s cubic-bezier(.4,0,.2,1), box-shadow .4s, background .4s, border-color .4s; box-shadow: 0 4px 20px rgba(0,0,0,.03); position: relative; overflow: hidden; }
        .sym-card:hover { transform: translateY(-6px); background: #fff; border-color: #e68c55; box-shadow: 0 16px 32px rgba(230,140,85,.15); }
        @media(max-width: 1024px) { .sym-card { width: calc(50% - 0.75rem); } }
        @media(max-width: 640px) { .sym-card { width: 100%; } }
        .team-card{transition:transform .4s cubic-bezier(.4,0,.2,1),box-shadow .4s}
        .team-card:hover{transform:translateY(-12px);box-shadow:0 24px 50px rgba(230,140,85,.25)!important}
        .cta-btn{background:linear-gradient(135deg,${ORG},#d4743a);border:none;color:#fff;font-family:'Kanit',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.12em;padding:10px 32px;border-radius:999px;cursor:pointer;font-size:clamp(.8rem,1.2vw,.95rem);box-shadow:0 8px 28px rgba(230,140,85,.4);transition:transform .2s,box-shadow .2s}
        .cta-btn:hover{transform:scale(1.04);box-shadow:0 12px 40px rgba(230,140,85,.6)}
        .ghost-btn2{background:transparent;border:2px solid rgba(230,140,85,.7);color:${DARK};font-family:'Kanit',sans-serif;font-weight:500;text-transform:uppercase;letter-spacing:.1em;padding:10px 32px;border-radius:999px;cursor:pointer;font-size:clamp(.8rem,1.2vw,.95rem);transition:all .2s}
        .ghost-btn2:hover{background:rgba(230,140,85,.1);border-color:${ORG}}
      `}</style>

      <HeroCarousel />

      <section style={{ background: '#fff', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(230,140,85,.15)', borderBottom: '1px solid rgba(230,140,85,.15)' }}>
        <MarqueeRow reverse={false} isImages={true} />
        <MarqueeRow reverse={true} isImages={false} />
        <MarqueeRow reverse={false} isImages={true} />
      </section>

      <section ref={sRef} style={{ background: WARM, padding: 'clamp(40px,5vw,60px) clamp(20px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <Particles />
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 400, height: 400, background: 'rgba(230,140,85,0.08)', borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%', animation: 'blob 8s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 300, height: 300, background: 'rgba(201,150,58,0.07)', borderRadius: '30% 60% 70% 40%/50% 60% 30% 60%', animation: 'blob 10s 3s ease-in-out infinite', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ opacity: sV ? 1 : 0, transform: sV ? 'translateX(0)' : 'translateX(-50px)', transition: 'all .9s ease' }}>
            <p style={{ color: ORG, fontWeight: 600, letterSpacing: '.25em', textTransform: 'uppercase', fontSize: '.85rem', marginBottom: '1rem' }}>VLXD Thành Đạt — Từ 2009</p>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.6rem,4.5vw,3rem)', lineHeight: 1.1, color: DARK, marginBottom: '1.2rem' }}>
              Kiến tạo<br />
              <span style={{ color: ORG }}>công trình</span><br />
              của bạn
            </h2>
            <p style={{ color: MID, fontWeight: 300, lineHeight: 1.85, fontSize: 'clamp(.95rem,1.6vw,1.15rem)', marginBottom: '2rem' }}>
              Hơn <strong style={{ color: DARK, fontWeight: 700 }}>15 năm</strong> đồng hành cùng hàng chục nghìn công trình — từ những nền móng đầu tiên đến những công trình hoàn thiện ấn tượng nhất.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="cta-btn" onClick={() => navigate('/contact')}>Liên hệ ngay</button>
              <button className="ghost-btn2" onClick={() => navigate('/shopping')}>Xem sản phẩm</button>
            </div>
          </div>
          <div style={{ opacity: sV ? 1 : 0, transform: sV ? 'translateX(0)' : 'translateX(50px)', transition: 'all .9s .2s ease', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {imgs.slice(0, 4).map((src, i) => (
              <div key={i} style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '4/3', animation: `float${i % 4} ${5 + i}s ${i * 0.5}s ease-in-out infinite`, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={stRef} style={{ background: DARK, padding: 'clamp(36px,4vw,50px) clamp(20px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, rgba(230,140,85,0.12), transparent 60%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '2.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {[{ n: 2500, s: '+', l: 'Sản phẩm' }, { n: 150, s: '+', l: 'Thương hiệu' }, { n: 10000, s: '+', l: 'Khách hàng' }, { n: 15, s: '+', l: 'Năm kinh nghiệm' }].map((x, i) => (
            <div key={i} style={{ opacity: stV ? 1 : 0, transform: stV ? 'translateY(0)' : 'translateY(40px)', transition: `all .7s ${i * .12}s ease` }}>
              <p style={{ fontWeight: 900, fontSize: 'clamp(2rem,5.5vw,3.2rem)', lineHeight: 1, color: ORG, marginBottom: '.3rem' }}><Counter target={x.n} suffix={x.s} visible={stV} /></p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, letterSpacing: '.15em', textTransform: 'uppercase', fontSize: '.8rem' }}>{x.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={svRef} style={{ background: '#fff', borderRadius: 'clamp(24px,4vw,48px) clamp(24px,4vw,48px) 0 0', padding: 'clamp(30px,3vw,45px) clamp(20px,5vw,60px)' }}>
        <h2 style={{ fontFamily: "'Kanit',sans-serif", fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', color: DARK, fontSize: 'clamp(1.8rem,5vw,3.5rem)', lineHeight: 1.15, marginBottom: 'clamp(1.5rem,3vw,2.5rem)' }}>Dịch vụ</h2>
        <div className="sym-grid">
          {services.map((s, i) => (
            <div key={i} className="sym-card" style={{ opacity: svV ? 1 : 0, transform: svV ? 'translateY(0)' : 'translateY(20px)', transition: `all .7s ${i * .1}s ease` }}>
              <div style={{ position: 'absolute', right: -15, bottom: -15, fontSize: '6rem', fontWeight: 900, fontFamily: "'Anton', sans-serif", color: 'rgba(230,140,85,0.05)', pointerEvents: 'none', lineHeight: 1, userSelect: 'none' }}>
                {s.n}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '2rem', color: ORG, lineHeight: 1 }}>{s.n}</span>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(230,140,85,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORG, fontSize: '1rem' }}>
                    ✦
                  </div>
                </div>
                <p style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '1.15rem', color: DARK, marginBottom: '0.5rem', letterSpacing: '.03em' }}>{s.name}</p>
                <p style={{ fontWeight: 300, fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TEAM ── */}
      <section ref={tRef} style={{ background: WARM, borderRadius: 'clamp(24px,4vw,48px) clamp(24px,4vw,48px) 0 0', marginTop: -16, padding: 'clamp(30px,3vw,45px) clamp(20px,5vw,60px)', position: 'relative', overflow: 'hidden' }}>
        <Particles />
        <h2 style={{ fontFamily: "'Kanit',sans-serif", fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', color: DARK, fontSize: 'clamp(1.8rem,5vw,3.5rem)', lineHeight: 1.15, marginBottom: 'clamp(1.5rem,3vw,2.5rem)' }}>
          <span style={{ color: ORG }}>Đội</span> ngũ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', maxWidth: 820, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {teamMembers.map((m, i) => (
            <div key={i} className="team-card" style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: `1px solid rgba(230,140,85,.2)`, boxShadow: '0 4px 20px rgba(0,0,0,.06)', opacity: tV ? 1 : 0, transform: tV ? 'translateY(0)' : 'translateY(30px)', transition: `all .8s ${i * .15}s ease` }}>
              {/* Character image with pastel bg */}
              <div style={{ background: m.bg, height: 155, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={m.avatar} alt={m.name} style={{ height: 145, objectFit: 'contain', objectPosition: 'bottom' }} />
              </div>
              {/* Info */}
              <div style={{ padding: '0.8rem 1.2rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: DARK, marginBottom: '.15rem' }}>{m.name}</p>
                <p style={{ fontWeight: 400, fontSize: '.75rem', color: ORG, letterSpacing: '.05em' }}>MSSV: {m.id || m.studentId}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: DARK, padding: 'clamp(30px,3vw,45px) clamp(20px,5vw,60px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 70% 50%, rgba(230,140,85,.1), transparent 60%)`, pointerEvents: 'none' }} />
        <p style={{ color: ORG, fontWeight: 400, letterSpacing: '.25em', textTransform: 'uppercase', fontSize: '.8rem', marginBottom: '1.25rem', opacity: .8 }}>Sẵn sàng xây dựng cùng chúng tôi?</p>
        <h2 style={{ fontFamily: "'Kanit',sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(1.8rem,5vw,3.5rem)', lineHeight: 1.15, color: '#fff', marginBottom: '1.8rem' }}>
          Bắt đầu <span style={{ color: ORG }}>ngay</span>
        </h2>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button className="cta-btn" onClick={() => navigate('/contact')}>Liên hệ với chúng tôi</button>
          <button style={{ background: 'transparent', border: '2px solid rgba(230,140,85,.6)', color: '#fff', fontFamily: "'Kanit',sans-serif", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em', padding: '10px 32px', borderRadius: 999, cursor: 'pointer', fontSize: 'clamp(.8rem,1.2vw,.95rem)', transition: 'all .2s' }} onClick={() => navigate('/shopping')}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,140,85,.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >Mua sắm ngay</button>
        </div>
      </section>
    </div>
  );
}
