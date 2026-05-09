// Theme-specific animated background layers + overlays
const ThemeAnim = ({ theme }) => {
  if (theme === "default") return <VasteriaAnim />;
  if (theme === "blood") return <BloodAnim />;
  if (theme === "cthulhu") return <CthulhuAnim />;
  if (theme === "kh-sora") return <KHSoraAnim />;
  if (theme === "kh-dark") return <KHDarkAnim />;
  return null;
};

// ─── KINGDOM KEY (Sora) — floating magic spheres + paopu stars + waves
const KHSoraAnim = () => {
  const orbs = [
    { src: "assets/kh/fire.png", x: 8, y: 70, dur: 22, delay: 0, size: 56 },
    { src: "assets/kh/blizzard.png", x: 88, y: 22, dur: 26, delay: 4, size: 64 },
    { src: "assets/kh/thunder.png", x: 18, y: 18, dur: 24, delay: 2, size: 48 },
    { src: "assets/kh/cure.png", x: 78, y: 78, dur: 28, delay: 6, size: 52 },
    { src: "assets/kh/cure-sphere.png", x: 32, y: 50, dur: 27, delay: 7, size: 50 },
    { src: "assets/kh/reflect.png", x: 62, y: 60, dur: 25, delay: 2.5, size: 54 },
    { src: "assets/kh/valor-form.png", x: 4, y: 35, dur: 30, delay: 1, size: 72 },
    { src: "assets/kh/wisdom-form.png", x: 92, y: 50, dur: 32, delay: 3, size: 76 },
    { src: "assets/kh/master-form.png", x: 50, y: 90, dur: 26, delay: 5, size: 60 },
    { src: "assets/kh/munny.png", x: 70, y: 8, dur: 20, delay: 4.5, size: 38 },
    { src: "assets/kh/hp-bubble.png", x: 24, y: 88, dur: 18, delay: 0.5, size: 42 },
    { src: "assets/kh/mp-bubble.png", x: 14, y: 55, dur: 22, delay: 3.5, size: 42 },
  ];
  const stars = Array.from({ length: 26 }, (_, i) => i);
  return (
    <div className="theme-fx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: -1, overflow: "hidden" }}>
      <img src="assets/kh/dive-heart.png" alt="" style={{
        position: "absolute", top: "50%", left: "50%", width: 1100, height: 1100,
        transform: "translate(-50%, -50%)", opacity: 0.07,
        animation: "kh-pulse 8s ease-in-out infinite",
        filter: "drop-shadow(0 0 60px rgba(255,220,100,0.4))",
      }} />
      <img src="assets/kh/sora-heart.png" alt="" style={{
        position: "absolute", top: "12%", right: "8%", width: 220, opacity: 0.18,
        animation: "kh-float 7s ease-in-out infinite",
        filter: "drop-shadow(0 0 30px rgba(255, 80, 80, 0.6))",
      }} />
      {orbs.map((o, i) => (
        <img key={i} src={o.src} alt="" style={{
          position: "absolute", left: `${o.x}%`, top: `${o.y}%`,
          width: o.size, height: o.size,
          opacity: 0.55,
          animation: `kh-orb-float ${o.dur}s ${o.delay}s ease-in-out infinite`,
          filter: "drop-shadow(0 0 20px currentColor)",
        }} />
      ))}
      {stars.map((i) => {
        const left = (i * 13.7) % 100;
        const top = (i * 7.3) % 100;
        const delay = (i * 0.3) % 5;
        const size = 6 + (i % 4) * 3;
        return (
          <div key={`s${i}`} style={{
            position: "absolute", left: `${left}%`, top: `${top}%`,
            width: size, height: size,
            background: `radial-gradient(circle, ${i % 3 === 0 ? "rgba(255,240,150" : i % 3 === 1 ? "rgba(180,220,255" : "rgba(255,255,255"},0.95) 0%, transparent 60%)`,
            animation: `kh-star ${2 + (i % 4)}s ${delay}s ease-in-out infinite`,
          }} />
        );
      })}
      <style>{`
        @keyframes kh-pulse { 0%, 100% { opacity: 0.05; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.1; transform: translate(-50%, -50%) scale(1.04); } }
        @keyframes kh-float { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-20px, 30px) rotate(8deg); } }
        @keyframes kh-orb-float {
          0%, 100% { transform: translate(0, 0) rotate(0); opacity: 0.45; }
          25% { transform: translate(40px, -30px) rotate(15deg); opacity: 0.8; }
          50% { transform: translate(20px, 50px) rotate(-10deg); opacity: 0.6; }
          75% { transform: translate(-30px, 20px) rotate(5deg); opacity: 0.7; }
        }
        @keyframes kh-star {
          0%, 100% { opacity: 0.2; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1.4); box-shadow: 0 0 12px currentColor; }
        }
      `}</style>
    </div>
  );
};

// ─── REINO DAS TREVAS (Heartless) — yellow eyes + dark crown
const KHDarkAnim = () => {
  const eyes = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="theme-fx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: -1, overflow: "hidden" }}>
      <img src="assets/kh/end-of-world.png" alt="" style={{
        position: "absolute", top: "50%", left: "50%", width: 1000, height: 1000,
        transform: "translate(-50%, -50%)", opacity: 0.08,
        animation: "dark-pulse 10s ease-in-out infinite",
        filter: "drop-shadow(0 0 80px rgba(180, 80, 255, 0.5))",
      }} />
      <img src="assets/kh/dark-world.png" alt="" style={{
        position: "absolute", bottom: "5%", left: "3%", width: 300, opacity: 0.15,
        animation: "dark-sway 9s ease-in-out infinite",
      }} />
      <img src="assets/kh/anti-form.png" alt="" style={{
        position: "absolute", top: "8%", right: "5%", width: 180, opacity: 0.5,
        animation: "anti-spin 30s linear infinite",
        filter: "drop-shadow(0 0 30px rgba(180, 80, 255, 0.7))",
      }} />
      <img src="assets/kh/anti-crest.png" alt="" style={{
        position: "absolute", top: "42%", right: "10%", width: 120, opacity: 0.35,
        animation: "anti-spin 45s linear infinite reverse",
        filter: "drop-shadow(0 0 22px rgba(255, 210, 50, 0.5))",
      }} />
      <img src="assets/kh/mp-bubble.png" alt="" style={{
        position: "absolute", top: "22%", left: "12%", width: 70, opacity: 0.5,
        animation: "dark-sway 8s ease-in-out infinite",
        filter: "drop-shadow(0 0 18px rgba(180,100,255,0.7))",
      }} />
      <img src="assets/kh/hp-bubble.png" alt="" style={{
        position: "absolute", bottom: "18%", right: "22%", width: 60, opacity: 0.45,
        animation: "dark-sway 10s ease-in-out infinite reverse",
        filter: "drop-shadow(0 0 16px rgba(255,80,90,0.6))",
      }} />
      <img src="assets/kh/roxas-heart.png" alt="" style={{
        position: "absolute", top: "60%", left: "6%", width: 160, opacity: 0.25,
        animation: "dark-sway 11s ease-in-out infinite reverse",
      }} />
      {eyes.map((i) => {
        const left = (i * 11.3 + 4) % 100;
        const top = (i * 13.7 + 8) % 100;
        const delay = (i * 0.4) % 5;
        return (
          <React.Fragment key={`e${i}`}>
            <div style={{
              position: "absolute", left: `${left}%`, top: `${top}%`,
              width: 7, height: 4, borderRadius: "50%",
              background: "radial-gradient(ellipse, #ffcc40 0%, rgba(255, 180, 0, 0.6) 60%, transparent 100%)",
              boxShadow: "0 0 8px rgba(255, 200, 50, 0.8)",
              animation: `eye-blink ${3 + (i % 3)}s ${delay}s ease-in-out infinite`,
            }} />
            <div style={{
              position: "absolute", left: `calc(${left}% + 12px)`, top: `${top}%`,
              width: 7, height: 4, borderRadius: "50%",
              background: "radial-gradient(ellipse, #ffcc40 0%, rgba(255, 180, 0, 0.6) 60%, transparent 100%)",
              boxShadow: "0 0 8px rgba(255, 200, 50, 0.8)",
              animation: `eye-blink ${3 + (i % 3)}s ${delay}s ease-in-out infinite`,
            }} />
          </React.Fragment>
        );
      })}
      <style>{`
        @keyframes dark-pulse { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.12; } }
        @keyframes dark-sway { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -20px); } }
        @keyframes anti-spin { to { transform: rotate(360deg); } }
        @keyframes eye-blink {
          0%, 88%, 100% { opacity: 0.85; transform: scaleY(1); }
          92% { opacity: 0.85; transform: scaleY(0.05); }
          96% { opacity: 0.85; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

// ─── VASTERIA: drifting golden embers + slow rune sigil
const VasteriaAnim = () => {
  const embers = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="theme-fx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: -1, overflow: "hidden" }}>
      {embers.map((i) => {
        const left = (i * 53) % 100;
        const dur = 12 + (i % 6) * 2;
        const delay = (i * 0.7) % 10;
        const size = 2 + (i % 3);
        return (
          <div key={i} style={{
            position: "absolute", left: `${left}%`, bottom: -10,
            width: size, height: size, borderRadius: "50%",
            background: "rgba(240, 193, 112, 0.7)",
            boxShadow: "0 0 8px rgba(240, 193, 112, 0.8), 0 0 16px rgba(216, 162, 90, 0.4)",
            animation: `ember-rise ${dur}s ${delay}s linear infinite`,
            opacity: 0,
          }} />
        );
      })}
      <svg style={{ position: "absolute", top: "50%", left: "50%", width: 900, height: 900, transform: "translate(-50%, -50%)", opacity: 0.05, animation: "rune-spin 240s linear infinite" }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#d8a25a" strokeWidth="0.4" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="#d8a25a" strokeWidth="0.3" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="#d8a25a" strokeWidth="0.3" />
        <polygon points="100,20 165,140 35,140" fill="none" stroke="#d8a25a" strokeWidth="0.5" />
        <polygon points="100,180 35,60 165,60" fill="none" stroke="#d8a25a" strokeWidth="0.5" />
        {[..."✦❖✧✶⟡◈"].map((g, i) => {
          const a = (i / 6) * Math.PI * 2;
          const x = 100 + Math.cos(a) * 80;
          const y = 100 + Math.sin(a) * 80;
          return <text key={i} x={x} y={y} fontSize="6" fill="#d8a25a" textAnchor="middle">{g}</text>;
        })}
      </svg>
      <style>{`
        @keyframes ember-rise {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translate(20px, -50vh); opacity: 0.8; }
          100% { transform: translate(-30px, -100vh); opacity: 0; }
        }
        @keyframes rune-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ─── BLOOD: dripping smears + heartbeat
const BloodAnim = () => {
  const drips = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="theme-fx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: -1, overflow: "hidden" }}>
      {drips.map((i) => {
        const left = (i * 13 + 7) % 100;
        const dur = 10 + (i % 4) * 3;
        const delay = (i * 1.3) % 8;
        return (
          <div key={i} style={{
            position: "absolute", left: `${left}%`, top: -40,
            width: 2, height: 60,
            background: "linear-gradient(180deg, transparent, rgba(255,40,60,0.7), rgba(180,10,20,0.9))",
            filter: "blur(0.5px)",
            animation: `blood-drip ${dur}s ${delay}s ease-in infinite`,
            opacity: 0,
          }} />
        );
      })}
      <div style={{
        position: "absolute", inset: 0,
        boxShadow: "inset 0 0 200px 50px rgba(180, 10, 20, 0.25)",
        animation: "heartbeat 1.2s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(180, 10, 20, 0.04)",
        animation: "horror-flicker 7s steps(2) infinite",
      }} />
      <svg style={{ position: "absolute", top: "50%", left: "50%", width: 800, height: 800, transform: "translate(-50%, -50%)", opacity: 0.04, animation: "sigil-pulse 6s ease-in-out infinite" }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="#ff3050" strokeWidth="0.6" />
        <polygon points="100,15 122,80 190,80 135,120 156,185 100,145 44,185 65,120 10,80 78,80" fill="none" stroke="#ff3050" strokeWidth="0.5" />
      </svg>
      <style>{`
        @keyframes blood-drip {
          0% { transform: translateY(0) scaleY(0.3); opacity: 0; }
          10% { opacity: 1; transform: translateY(20vh) scaleY(1); }
          70% { opacity: 0.8; }
          100% { transform: translateY(110vh) scaleY(1.5); opacity: 0; }
        }
        @keyframes heartbeat {
          0%, 100% { box-shadow: inset 0 0 180px 30px rgba(180,10,20,0.18); }
          15% { box-shadow: inset 0 0 240px 80px rgba(220,30,40,0.4); }
          25% { box-shadow: inset 0 0 200px 40px rgba(180,10,20,0.22); }
          40% { box-shadow: inset 0 0 240px 80px rgba(220,30,40,0.35); }
        }
        @keyframes horror-flicker {
          0%, 92%, 96%, 100% { opacity: 0.03; }
          93%, 95% { opacity: 0.18; }
        }
        @keyframes sigil-pulse {
          0%, 100% { opacity: 0.025; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.07; transform: translate(-50%, -50%) scale(1.04); }
        }
      `}</style>
    </div>
  );
};

// ─── CTHULHU: rising bubbles + tentacle wave + dust motes
const CthulhuAnim = () => {
  const bubbles = Array.from({ length: 14 }, (_, i) => i);
  const motes = Array.from({ length: 22 }, (_, i) => i);
  return (
    <div className="theme-fx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: -1, overflow: "hidden" }}>
      {bubbles.map((i) => {
        const left = (i * 17) % 100;
        const dur = 18 + (i % 5) * 4;
        const delay = (i * 1.7) % 14;
        const size = 4 + (i % 4) * 2;
        return (
          <div key={i} style={{
            position: "absolute", left: `${left}%`, bottom: -20,
            width: size, height: size, borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, rgba(180,230,220,0.5), rgba(74,155,142,0.1))",
            border: "1px solid rgba(160, 220, 210, 0.3)",
            animation: `bubble-rise ${dur}s ${delay}s ease-in infinite`,
            opacity: 0,
          }} />
        );
      })}
      {motes.map((i) => {
        const left = (i * 7 + 3) % 100;
        const top = (i * 11) % 100;
        const dur = 25 + (i % 6) * 3;
        const delay = (i * 0.9) % 12;
        return (
          <div key={`m${i}`} style={{
            position: "absolute", left: `${left}%`, top: `${top}%`,
            width: 1.5, height: 1.5, borderRadius: "50%",
            background: "rgba(200, 220, 215, 0.5)",
            animation: `dust-drift ${dur}s ${delay}s ease-in-out infinite`,
          }} />
        );
      })}
      <svg style={{ position: "absolute", bottom: -40, left: 0, width: "100%", height: 300, opacity: 0.08, animation: "tentacle-wave 18s ease-in-out infinite" }} viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M0,200 Q150,140 300,180 T600,170 T900,190 T1200,160 L1200,300 L0,300 Z" fill="url(#cgrad)" />
        <defs>
          <linearGradient id="cgrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4a9b8e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0a1318" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <svg style={{ position: "absolute", top: "50%", left: "50%", width: 700, height: 700, transform: "translate(-50%, -50%)", opacity: 0.05, animation: "eye-blink 12s ease-in-out infinite" }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="#7dc8b8" strokeWidth="0.4" />
        <ellipse cx="100" cy="100" rx="70" ry="35" fill="none" stroke="#7dc8b8" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="22" fill="none" stroke="#7dc8b8" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="10" fill="#7dc8b8" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={100 + Math.cos(a) * 95} y1={100 + Math.sin(a) * 95} x2={100 + Math.cos(a) * 110} y2={100 + Math.sin(a) * 110} stroke="#7dc8b8" strokeWidth="0.5" />;
        })}
      </svg>
      <style>{`
        @keyframes bubble-rise {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.9; }
          50% { transform: translate(15px, -55vh); opacity: 0.7; }
          100% { transform: translate(-20px, -110vh); opacity: 0; }
        }
        @keyframes dust-drift {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(20px, -10px); opacity: 0.7; }
        }
        @keyframes tentacle-wave {
          0%, 100% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(-40px) scaleY(1.15); }
        }
        @keyframes eye-blink {
          0%, 92%, 100% { opacity: 0.05; transform: translate(-50%, -50%) scaleY(1); }
          94% { opacity: 0.02; transform: translate(-50%, -50%) scaleY(0.05); }
          96% { opacity: 0.05; transform: translate(-50%, -50%) scaleY(1); }
        }
      `}</style>
    </div>
  );
};

window.ThemeAnim = ThemeAnim;
