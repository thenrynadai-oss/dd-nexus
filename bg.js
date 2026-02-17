/* =========================================================
   VASTERIA GATE — BG ENGINE (CANVAS)
   - Fundo vivo e "desenhado" (NÃO slideshow)
   - Half minimal / half lowpoly (tema controla a cena)
   - NÃO interfere no layout (pointer-events:none)
   ========================================================= */

(() => {
  "use strict";

  // roundRect polyfill (para browsers mais antigos)
  if(typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect){
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r){
      r = Math.min(r || 0, w/2, h/2);
      this.beginPath();
      this.moveTo(x+r, y);
      this.lineTo(x+w-r, y);
      this.quadraticCurveTo(x+w, y, x+w, y+r);
      this.lineTo(x+w, y+h-r);
      this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
      this.lineTo(x+r, y+h);
      this.quadraticCurveTo(x, y+h, x, y+h-r);
      this.lineTo(x, y+r);
      this.quadraticCurveTo(x, y, x+r, y);
      this.closePath();
      return this;
    };
  }


  const qs = (sel, el=document) => el.querySelector(sel);

  function parseColor(input){
    // aceita #rgb, #rrggbb, rgb(), rgba()
    if(!input) return {r:0,g:0,b:0,a:1};
    let s = String(input).trim();
    if(s.startsWith("#")){
      const hex = s.slice(1);
      if(hex.length === 3){
        const r = parseInt(hex[0]+hex[0],16);
        const g = parseInt(hex[1]+hex[1],16);
        const b = parseInt(hex[2]+hex[2],16);
        return {r,g,b,a:1};
      }
      if(hex.length === 6){
        const r = parseInt(hex.slice(0,2),16);
        const g = parseInt(hex.slice(2,4),16);
        const b = parseInt(hex.slice(4,6),16);
        return {r,g,b,a:1};
      }
    }
    const m = s.match(/rgba?\(([^)]+)\)/i);
    if(m){
      const parts = m[1].split(",").map(x => x.trim());
      const r = Number(parts[0]||0);
      const g = Number(parts[1]||0);
      const b = Number(parts[2]||0);
      const a = parts.length >= 4 ? Number(parts[3]) : 1;
      return {r,g,b,a:isNaN(a)?1:a};
    }
    return {r:0,g:0,b:0,a:1};
  }

  function rgba(c, a=1){
    return `rgba(${c.r|0},${c.g|0},${c.b|0},${a})`;
  }

  function lerp(a,b,t){ return a + (b-a)*t; }
  function lerpColor(c1,c2,t){
    return { r:lerp(c1.r,c2.r,t), g:lerp(c1.g,c2.g,t), b:lerp(c1.b,c2.b,t), a:lerp(c1.a,c2.a,t) };
  }

  function getCSSVars(){
    const st = getComputedStyle(document.body);
    return {
      bg1: parseColor(st.getPropertyValue("--bg-1")),
      bg2: parseColor(st.getPropertyValue("--bg-2")),
      bg3: parseColor(st.getPropertyValue("--bg-3")),
      accent: parseColor(st.getPropertyValue("--accent")),
      accentGlow: parseColor(st.getPropertyValue("--accent-glow")),
    };
  }

  // =========================================================
  // Lowpoly mesh generator
  // =========================================================
  function makeMesh(w,h, cell=120, jitter=0.35){
    const pts = [];
    const cols = Math.ceil(w/cell)+2;
    const rows = Math.ceil(h/cell)+2;

    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const jx = (Math.random()*2-1)*cell*jitter;
        const jy = (Math.random()*2-1)*cell*jitter;
        pts.push({x: x*cell + jx, y: y*cell + jy});
      }
    }

    const tris = [];
    const idx = (x,y)=> y*cols + x;
    for(let y=0;y<rows-1;y++){
      for(let x=0;x<cols-1;x++){
        const p00 = pts[idx(x,y)];
        const p10 = pts[idx(x+1,y)];
        const p01 = pts[idx(x,y+1)];
        const p11 = pts[idx(x+1,y+1)];

        // divide cell randomly
        if(Math.random() > 0.5){
          tris.push([p00,p10,p11]);
          tris.push([p00,p11,p01]);
        }else{
          tris.push([p00,p10,p01]);
          tris.push([p10,p11,p01]);
        }
      }
    }
    return tris;
  }

  function drawMesh(ctx, tris, palette, t, parallax=0.0){
    ctx.save();
    ctx.translate(Math.sin(t*0.0002)*parallax, Math.cos(t*0.00017)*parallax);

    for(let i=0;i<tris.length;i++){
      const tri = tris[i];
      const n = (i*9973) % 1000 / 1000;
      const base = lerpColor(palette.bg1, palette.bg3, n);
      const c = lerpColor(base, palette.bg2, 0.25 + 0.25*Math.sin((i*0.2)+(t*0.00035)));
      ctx.fillStyle = rgba(c, 0.55);
      ctx.beginPath();
      ctx.moveTo(tri[0].x, tri[0].y);
      ctx.lineTo(tri[1].x, tri[1].y);
      ctx.lineTo(tri[2].x, tri[2].y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================
  // Particles (generic)
  // =========================================================
  function makeParticles(count, w,h){
    const arr = [];
    for(let i=0;i<count;i++){
      arr.push({
        x:Math.random()*w,
        y:Math.random()*h,
        vx:(Math.random()*2-1)*0.15,
        vy:(Math.random()*2-1)*0.15,
        r:Math.random()*2.2 + 0.6,
        a:Math.random()*0.25 + 0.08,
        s:Math.random()*0.6 + 0.2
      });
    }
    return arr;
  }

  function drawParticles(ctx, parts, palette, w,h, t, style="dust"){
    ctx.save();
    for(const p of parts){
      p.x += p.vx * (1.0 + p.s);
      p.y += p.vy * (1.0 + p.s);
      if(p.x < -20) p.x = w+20;
      if(p.x > w+20) p.x = -20;
      if(p.y < -20) p.y = h+20;
      if(p.y > h+20) p.y = -20;

      const wob = Math.sin((p.x+p.y)*0.003 + t*0.0012)*0.5;
      const alpha = clamp(p.a + wob*0.05, 0.03, 0.35);

      ctx.fillStyle = style === "stars"
        ? `rgba(255,255,255,${alpha})`
        : rgba(palette.accent, alpha*0.55);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

  // =========================================================
  // Scenes
  // =========================================================
  function sceneGeneric(state, ctx, palette, w,h, t){
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 160, 0.45);
      state.parts = makeParticles(90, w,h);
      state.w=w; state.h=h;
    }
    drawMesh(ctx, state.mesh, palette, t, 18);
    drawParticles(ctx, state.parts, palette, w,h, t, "dust");
  }

  function sceneStars(state, ctx, palette, w,h, t){
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 180, 0.35);
      state.parts = makeParticles(160, w,h);
      state.w=w; state.h=h;
    }
    drawMesh(ctx, state.mesh, palette, t, 10);
    drawParticles(ctx, state.parts, palette, w,h, t, "stars");

    // nebulosa suave
    ctx.save();
    const grad = ctx.createRadialGradient(w*0.35, h*0.3, 10, w*0.35, h*0.3, Math.max(w,h)*0.8);
    grad.addColorStop(0, rgba(palette.accent, 0.08));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }

  function sceneCafe(state, ctx, palette, w, h, t){
    // === CAFETERIA LOW POLY 2.5D (WALLPAPER VIVO) ===
    // Objetivo: parecer uma cafeteria de verdade (balcão, mesas, janela, letreiro)
    // + pessoas passando (loop) + vapor + luz quente.
    const T = t*0.001;

    // base céu interno quente
    ctx.save();
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0, palette.bgTop || "#1a0f0a");
    bg.addColorStop(1, palette.bgBot || "#4a2c20");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,w,h);
    ctx.restore();

    // parallax suave (mouse/touch)
    const px = (state.parX||0)*0.8;
    const py = (state.parY||0)*0.8;

    // helpers
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    function poly(points, fill, stroke, alpha=1){
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for(let i=1;i<points.length;i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      if(fill){ ctx.fillStyle = fill; ctx.fill(); }
      if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.restore();
    }
    function glowCircle(x,y,r, col, a){
      ctx.save();
      ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, col);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    // === chão isométrico (trapezoide) ===
    const floorTop = h*0.56 + py*0.25;
    const floorBot = h*1.02;
    const floorL = w*0.08 + px*0.2;
    const floorR = w*0.92 + px*0.2;

    poly([[floorL,floorTop],[floorR,floorTop],[w*1.02,floorBot],[-w*0.02,floorBot]],
      "rgba(10,6,5,0.55)", "rgba(255,179,71,0.06)", 1);

    // tiles low poly (losangos) — bem leve
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "rgba(255,179,71,0.09)";
    ctx.lineWidth = 1;
    const tile = Math.max(30, Math.min(70, w/18));
    for(let y=floorTop; y<floorBot; y+=tile*0.55){
      const off = (Math.floor((y-floorTop)/(tile*0.55))%2)*tile*0.5;
      for(let x=-tile; x<w+tile; x+=tile){
        ctx.beginPath();
        ctx.moveTo(x+off, y);
        ctx.lineTo(x+off+tile*0.5, y+tile*0.25);
        ctx.lineTo(x+off, y+tile*0.5);
        ctx.lineTo(x+off-tile*0.5, y+tile*0.25);
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();

    // === parede + janela ===
    const wallTop = h*0.12 + py*0.1;
    const wallMid = h*0.56 + py*0.15;

    poly([[0,wallTop],[w,wallTop],[w,wallMid],[0,wallMid]],
      "rgba(35,22,18,0.70)", null, 1);

    // moldura da janela
    const winX = w*0.16 + px*0.25;
    const winY = h*0.18 + py*0.12;
    const winW = w*0.68;
    const winH = h*0.22;

    poly([[winX,winY],[winX+winW,winY],[winX+winW,winY+winH],[winX,winY+winH]],
      "rgba(0,0,0,0.18)", "rgba(255,179,71,0.14)", 1);

    // reflexo da janela (anima)
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const rx = winX + (Math.sin(T*0.7)*0.5+0.5)*winW*0.18;
    ctx.beginPath();
    ctx.moveTo(rx, winY+winH*0.08);
    ctx.lineTo(rx+winW*0.22, winY+winH*0.04);
    ctx.lineTo(rx+winW*0.28, winY+winH*0.92);
    ctx.lineTo(rx+winW*0.06, winY+winH*0.96);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // === pessoas passando atrás da janela (mantém a ideia que você curtiu) ===
    // 3 faixas com velocidades diferentes
    function person(x,y,s, col){
      poly([[x,y],[x+s*0.55,y],[x+s*0.60,y+s*1.1],[x-s*0.05,y+s*1.1]], col, "rgba(0,0,0,0.2)", 0.85);
      glowCircle(x+s*0.25,y+s*0.2,s*0.35,"rgba(255,179,71,0.22)",0.35);
    }
    const laneY = winY + winH*0.55;
    const baseS = Math.max(18, Math.min(42, w*0.04));
    for(let i=0;i<7;i++){
      const sp = 26 + i*7;
      const x = ((T*sp*18 + i*120) % (winW+baseS*4)) - baseS*2;
      person(winX+x, laneY + Math.sin(T*1.5+i)*2, baseS*(0.75+0.08*(i%3)), "rgba(15,10,9,0.45)");
    }
    for(let i=0;i<5;i++){
      const sp = 18 + i*6;
      const x = ((T*sp*14 + i*170) % (winW+baseS*5)) - baseS*3;
      person(winX+(winW-x), laneY-10 + Math.sin(T*1.1+i)*2, baseS*(0.65+0.06*(i%3)), "rgba(10,7,6,0.38)");
    }

    // === letreiro "CAFÉ" (neon) ===
    ctx.save();
    ctx.font = `900 ${Math.max(18, Math.min(36, w*0.035))}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const signX = w*0.50 + px*0.25;
    const signY = h*0.33 + py*0.15;
    glowCircle(signX, signY, w*0.12, "rgba(255,179,71,0.20)", 0.55);
    ctx.fillStyle = "rgba(255,179,71,0.95)";
    ctx.fillText("CAFÉ", signX, signY);
    ctx.restore();


    // === prateleiras / menu / detalhes (deixa a cena menos "crua") ===
    const shelfY1 = wallTop + (wallMid-wallTop)*0.72;
    const shelfY2 = wallTop + (wallMid-wallTop)*0.86;
    function shelf(y){
      poly([[w*0.12+px*0.15,y],[w*0.88+px*0.15,y],[w*0.90+px*0.15,y+6],[w*0.10+px*0.15,y+6]],
        "rgba(0,0,0,0.22)","rgba(255,179,71,0.10)",1);
    }
    shelf(shelfY1); shelf(shelfY2);

    // garrafas/canecas low poly (balançam levemente)
    ctx.save();
    for(let i=0;i<10;i++){
      const x = (w*0.16 + i*(w*0.07)) + px*0.12;
      const wob = Math.sin(T*1.4 + i*0.9)*1.2;
      const y = (i%2? shelfY1 : shelfY2) - 16 + wob;
      const col = (i%3===0) ? "rgba(255,179,71,0.35)" : (i%3===1 ? "rgba(200,140,80,0.28)" : "rgba(255,255,255,0.16)");
      poly([[x,y],[x+18,y+3],[x+16,y+22],[x-2,y+20]], col, "rgba(0,0,0,0.25)", 0.95);
      glowCircle(x+8,y+10,18,"rgba(255,179,71,0.20)",0.35);
    }
    ctx.restore();

    // menu board (texto fake com brilho)
    ctx.save();
    const mX = w*0.78+px*0.22, mY = wallTop + 28 + py*0.1;
    poly([[mX,mY],[mX+w*0.14,mY],[mX+w*0.14,mY+h*0.18],[mX,mY+h*0.18]],
      "rgba(0,0,0,0.25)","rgba(255,179,71,0.18)",1);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "rgba(255,179,71,0.35)";
    for(let l=0;l<8;l++){
      const yy = mY + 16 + l*14 + Math.sin(T*0.8 + l)*1.2;
      ctx.fillRect(mX+12, yy, w*0.11 - (l%3)*10, 3);
    }
    ctx.restore();


    // === balcão ===
    const counterY = h*0.62 + py*0.20;
    poly([[w*0.18+px*0.2,counterY],[w*0.82+px*0.2,counterY],[w*0.90+px*0.2,h*0.90],[w*0.10+px*0.2,h*0.90]],
      "rgba(55,33,25,0.78)", "rgba(255,179,71,0.08)", 1);

    // tampo do balcão
    poly([[w*0.22+px*0.2,counterY-18],[w*0.78+px*0.2,counterY-18],[w*0.82+px*0.2,counterY],[w*0.18+px*0.2,counterY]],
      "rgba(90,60,45,0.75)", "rgba(255,179,71,0.10)", 1);

    // === mesas + xícaras com vapor ===
    function cup(cx, cy, s){
      // pires
      poly([[cx-s*1.2,cy],[cx+s*1.2,cy],[cx+s*0.9,cy+s*0.35],[cx-s*0.9,cy+s*0.35]],
        "rgba(255,248,225,0.10)", "rgba(255,179,71,0.10)", 0.9);
      // copo
      poly([[cx-s*0.45,cy-s*0.9],[cx+s*0.45,cy-s*0.9],[cx+s*0.35,cy],[cx-s*0.35,cy]],
        "rgba(255,248,225,0.14)", "rgba(255,179,71,0.12)", 0.95);

      // vapor (3 colunas)
      for(let k=0;k<3;k++){
        const tt = T*0.9 + k*0.7;
        const vx = cx + (k-1)*s*0.28 + Math.sin(tt*2.0)*s*0.10;
        const vy = cy - s*1.05 - (tt%1)*s*1.6;
        glowCircle(vx, vy, s*0.9, "rgba(255,255,255,0.18)", 0.35);
        ctx.save();
        ctx.globalAlpha = 0.24;
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vx, vy+s*0.9);
        ctx.bezierCurveTo(vx-s*0.2, vy+s*0.55, vx+s*0.25, vy+s*0.25, vx, vy);
        ctx.stroke();
        ctx.restore();
      }
    }

    const tables = [
      {x:w*0.28,y:h*0.78,s:baseS*0.55},
      {x:w*0.46,y:h*0.84,s:baseS*0.62},
      {x:w*0.66,y:h*0.79,s:baseS*0.58}
    ];
    tables.forEach((tb,i)=>{
      const x=tb.x+px*0.25, y=tb.y+py*0.25, s=tb.s;
      poly([[x-s*2.2,y-s*0.4],[x+s*2.2,y-s*0.4],[x+s*1.6,y+s*0.6],[x-s*1.6,y+s*0.6]],
        "rgba(255,179,71,0.06)", "rgba(255,179,71,0.08)", 1);
      cup(x+(i-1)*s*0.8, y, s*0.55);
    });

    // === luzes pendentes ===
    for(let i=0;i<4;i++){
      const lx = w*(0.28+i*0.16) + px*0.15;
      const ly = h*0.18 + py*0.10;
      ctx.save();
      ctx.strokeStyle = "rgba(255,179,71,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, wallTop);
      ctx.lineTo(lx + Math.sin(T*0.9+i)*6, ly);
      ctx.stroke();
      ctx.restore();

      glowCircle(lx + Math.sin(T*0.9+i)*6, ly+18, 42, "rgba(255,179,71,0.18)", 0.55);
      poly([[lx-10,ly+10],[lx+10,ly+10],[lx+16,ly+26],[lx-16,ly+26]],
        "rgba(255,179,71,0.10)", "rgba(255,179,71,0.12)", 1);
    }

    // vinheta sutil
    ctx.save();
    const vg = ctx.createRadialGradient(w*0.5,h*0.6, w*0.1, w*0.5,h*0.6, w*0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }

  function sceneBonfire(state, ctx, palette, w,h, t){
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 220, 0.33);
      // brasas
      state.embers = Array.from({length:90}).map(()=> ({
        x:w*0.5 + (Math.random()*2-1)*w*0.18,
        y:h*0.70 + Math.random()*h*0.12,
        vy: - (0.25 + Math.random()*0.7),
        vx: (Math.random()*2-1)*0.12,
        a: 0.1 + Math.random()*0.35,
        r: 0.8 + Math.random()*1.6
      }));
      state.w=w; state.h=h;
    }

    drawMesh(ctx, state.mesh, palette, t, 10);

    // chão escuro
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, h*0.6, w, h*0.4);

    // fogueira (triângulos)
    const fx = w*0.52, fy = h*0.72;
    const flick = Math.sin(t*0.01)*0.5 + 0.5;
    const flameH = lerp(90, 140, flick);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = rgba(palette.accent, 0.16);
    for(let i=0;i<10;i++){
      const a = (i/10)*Math.PI*2;
      const r = 38 + Math.sin(t*0.01+i)*8;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(a)*r, fy + Math.sin(a)*r);
      ctx.lineTo(fx + Math.cos(a+0.4)*r, fy + Math.sin(a+0.4)*r);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    // chamas
    const grad = ctx.createRadialGradient(fx, fy, 10, fx, fy, 180);
    grad.addColorStop(0, rgba(palette.accent, 0.38));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 120, 80, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = rgba(palette.accent, 0.55);
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(fx-40, fy-60, fx, fy-flameH);
    ctx.quadraticCurveTo(fx+40, fy-60, fx, fy);
    ctx.closePath();
    ctx.fill();

    // brasas subindo
    for(const e of state.embers){
      e.x += e.vx;
      e.y += e.vy;
      e.a *= 0.996;
      if(e.y < h*0.35 || e.a < 0.05){
        e.x = w*0.5 + (Math.random()*2-1)*w*0.18;
        e.y = h*0.72 + Math.random()*h*0.14;
        e.vy = -(0.25 + Math.random()*0.8);
        e.vx = (Math.random()*2-1)*0.12;
        e.a = 0.12 + Math.random()*0.35;
      }
      ctx.fillStyle = rgba(palette.accent, e.a);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  function sceneViking(state, ctx, palette, w,h, t){
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 260, 0.28);
      state.snow = Array.from({length:140}).map(()=> ({
        x:Math.random()*w,
        y:Math.random()*h,
        vy:0.25 + Math.random()*0.9,
        vx:-0.2 + Math.random()*0.4,
        r:0.8 + Math.random()*1.8,
        a:0.05 + Math.random()*0.18
      }));
      state.w=w; state.h=h;
    }

    drawMesh(ctx, state.mesh, palette, t, 8);

    ctx.save();

    // montanhas low poly
    ctx.fillStyle = rgba(palette.bg2, 0.20);
    ctx.beginPath();
    ctx.moveTo(0, h*0.72);
    ctx.lineTo(w*0.18, h*0.55);
    ctx.lineTo(w*0.35, h*0.72);
    ctx.lineTo(w*0.55, h*0.50);
    ctx.lineTo(w*0.72, h*0.72);
    ctx.lineTo(w*0.88, h*0.58);
    ctx.lineTo(w, h*0.72);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // aurora (faixa ondulante)
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(palette.accent, 0.16);
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    for(let i=0;i<=24;i++){
      const x = (i/24)*w;
      const y = h*0.18 + Math.sin(i*0.35 + t*0.001)*18 + Math.sin(i*0.12 + t*0.0008)*8;
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.strokeStyle = rgba(palette.accent, 0.22);
    ctx.beginPath();
    for(let i=0;i<=24;i++){
      const x = (i/24)*w;
      const y = h*0.24 + Math.sin(i*0.33 + t*0.0012)*12;
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    // neve
    for(const s of state.snow){
      s.x += s.vx;
      s.y += s.vy;
      if(s.y > h+10){ s.y = -10; s.x = Math.random()*w; }
      if(s.x < -10) s.x = w+10;
      if(s.x > w+10) s.x = -10;
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  function sceneCthulhu(state, ctx, palette, w, h, t){
    // === CTHULHU IMPERADOR LOW POLY 2.5D (WALLPAPER VIVO) ===
    // Trono + galáxia + tentáculos + bolhas do abismo.
    const T = t*0.001;
    const px = (state.parX||0);
    const py = (state.parY||0);

    // fundo galáctico
    ctx.save();
    const g = ctx.createRadialGradient(w*0.5, h*0.35, w*0.05, w*0.5, h*0.35, w*0.75);
    g.addColorStop(0, "rgba(130,70,255,0.12)");
    g.addColorStop(0.35, "rgba(0,180,255,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0.95)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.restore();

    // estrelas
    if(!state.stars || state.w!==w || state.h!==h){
      state.stars = Array.from({length:140}).map(()=> ({
        x:Math.random()*w,
        y:Math.random()*h,
        r:Math.random()*1.8+0.2,
        s:Math.random()*0.8+0.2,
        tw:Math.random()*2.0+0.5
      }));
    }
    ctx.save();
    for(const s of state.stars){
      const tw = 0.25 + 0.75*(0.5+0.5*Math.sin(T*s.tw + s.x*0.01));
      ctx.globalAlpha = tw*0.55;
      ctx.fillStyle = "rgba(220,245,255,0.9)";
      ctx.beginPath();
      ctx.arc(s.x + px*0.15, s.y + py*0.10, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    // vórtice/galáxia
    ctx.save();
    ctx.translate(w*0.5 + px*0.2, h*0.32 + py*0.18);
    ctx.rotate(T*0.15);
    for(let i=0;i<10;i++){
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = i%2? "rgba(0,255,200,0.45)" : "rgba(160,120,255,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const r0 = w*(0.06+i*0.03);
      for(let a=0;a<Math.PI*2; a+=0.2){
        const rr = r0 + Math.sin(a*3 + T*1.1+i)*8;
        const x = Math.cos(a)*rr;
        const y = Math.sin(a)*rr*0.62;
        if(a===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // helpers
    function poly(points, fill, stroke, alpha=1){
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for(let i=1;i<points.length;i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      if(fill){ ctx.fillStyle = fill; ctx.fill(); }
      if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.restore();
    }
    function glow(x,y,r,col,a){
      ctx.save();
      ctx.globalAlpha = a;
      const gg = ctx.createRadialGradient(x,y,0,x,y,r);
      gg.addColorStop(0,col);
      gg.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    // chão do trono (plataforma)
    const baseY = h*0.78 + py*0.25;
    poly([[w*0.14,baseY],[w*0.86,baseY],[w*0.98,h*1.02],[w*0.02,h*1.02]],
      "rgba(0,0,0,0.55)","rgba(0,255,200,0.06)",1);


    // névoa/nebula low poly (camadas)
    function nebula(seed, yBase, colA, colB, alpha){
      const a = alpha;
      ctx.save();
      ctx.globalAlpha = a;
      for(let i=0;i<6;i++){
        const k = seed*100 + i;
        const x0 = (w*0.10 + i*w*0.15) + Math.sin(T*0.18 + k)*w*0.06 + px*0.18;
        const y0 = yBase + Math.cos(T*0.22 + k)*h*0.03 + py*0.12;
        poly([[x0,y0],[x0+w*0.18,y0-h*0.06],[x0+w*0.28,y0+h*0.02],[x0+w*0.12,y0+h*0.09]],
          i%2?colA:colB, null, 1);
      }
      ctx.restore();
    }
    nebula(1, h*0.22, "rgba(0,255,200,0.06)", "rgba(120,70,255,0.05)", 1);
    nebula(2, h*0.34, "rgba(0,180,255,0.07)", "rgba(0,255,150,0.05)", 1);

    // aura imperial atrás do Cthulhu
    ctx.save();
    const haloR = Math.min(w,h)*0.32;
    const halo = ctx.createRadialGradient(w*0.5+px*0.22, h*0.55+py*0.18, 0, w*0.5+px*0.22, h*0.55+py*0.18, haloR);
    halo.addColorStop(0, "rgba(0,255,200,0.18)");
    halo.addColorStop(0.45, "rgba(0,180,255,0.08)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(w*0.5+px*0.22, h*0.55+py*0.18, haloR, 0, Math.PI*2); ctx.fill();
    ctx.restore();


    // trono
    const tx = w*0.5 + px*0.25;
    const ty = h*0.60 + py*0.22;
    poly([[tx-w*0.08,ty],[tx+w*0.08,ty],[tx+w*0.11,ty+h*0.16],[tx-w*0.11,ty+h*0.16]],
      "rgba(8,18,18,0.70)","rgba(0,255,200,0.10)",1);
    poly([[tx-w*0.11,ty],[tx-w*0.02,ty-h*0.14],[tx+w*0.02,ty-h*0.14],[tx+w*0.11,ty]],
      "rgba(10,25,25,0.72)","rgba(0,255,200,0.10)",1);

    // Cthulhu "imperador" (cabeça + coroa + olhos)
    const hx = tx;
    const hy = ty-h*0.10;
    poly([[hx-w*0.05,hy],[hx+w*0.05,hy],[hx+w*0.04,hy+h*0.08],[hx-w*0.04,hy+h*0.08]],
      "rgba(10,40,35,0.75)","rgba(0,255,200,0.12)",1);

    // coroa
    poly([[hx-w*0.05,hy],[hx-w*0.02,hy-h*0.05],[hx,hy-h*0.02],[hx+w*0.02,hy-h*0.05],[hx+w*0.05,hy],[hx,hy+h*0.01]],
      "rgba(0,255,200,0.10)","rgba(0,255,200,0.18)",1);

    // olhos glow
    glow(hx-w*0.015, hy+h*0.04, 26, "rgba(0,255,200,0.35)", 0.8);
    glow(hx+w*0.015, hy+h*0.04, 26, "rgba(0,255,200,0.35)", 0.8);
    ctx.save();
    ctx.fillStyle = "rgba(0,255,200,0.95)";
    ctx.beginPath(); ctx.arc(hx-w*0.015, hy+h*0.04, 3.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx+w*0.015, hy+h*0.04, 3.2, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // tentáculos (4) animados
    for(let i=0;i<4;i++){
      const side = i<2?-1:1;
      const off = (i%2?0.02:0.06);
      const sx = hx + side*w*off;
      const sy = hy + h*0.08;
      const sway = Math.sin(T*0.9 + i)*w*0.03;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "rgba(0,255,200,0.22)";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx+side*w*0.06+sway, sy+h*0.10, sx+side*w*0.14-sway, sy+h*0.22, sx+side*w*0.10, sy+h*0.33);
      ctx.stroke();
      ctx.restore();
    }

    // runas flutuando
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "rgba(160,120,255,0.35)";
    for(let i=0;i<18;i++){
      const x = (i*97 + (T*40)%w) % w;
      const y = (i*53 + (T*24)%h) % h;
      ctx.beginPath();
      ctx.arc(x, y, 8 + 4*Math.sin(T*1.3+i), 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();

    // bolhas subindo do abismo
    if(!state.bubbles || state.w!==w || state.h!==h){
      state.bubbles = Array.from({length:90}).map(()=> ({
        x:Math.random()*w,
        y:h + Math.random()*h*0.8,
        r:Math.random()*8+2,
        sp:Math.random()*18+8,
        drift:(Math.random()*2-1)*16
      }));
    }
    for(const b of state.bubbles){
      b.y -= (b.sp*0.12);
      b.x += Math.sin(T*0.8 + b.y*0.01)*0.4 + b.drift*0.002;
      if(b.y < -30){ b.y = h + Math.random()*h*0.5; b.x = Math.random()*w; }
      glow(b.x + px*0.1, b.y + py*0.1, b.r*2.2, "rgba(0,255,200,0.12)", 0.55);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "rgba(200,255,245,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(b.x + px*0.1, b.y + py*0.1, b.r, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }

    // vinheta final
    ctx.save();
    const vg = ctx.createRadialGradient(w*0.5,h*0.55, w*0.12, w*0.5,h*0.55, w*0.85);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }

  function scenePirate(state, ctx, palette, w,h, t){
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 260, 0.28);
      state.splashes = Array.from({length:70}).map(()=> ({
        x:Math.random()*w,
        y:h*0.65 + Math.random()*h*0.35,
        vy:0.2 + Math.random()*0.5,
        r:1 + Math.random()*2,
        a:0.03 + Math.random()*0.12
      }));
      state.w=w; state.h=h;
    }
    drawMesh(ctx, state.mesh, palette, t, 8);

    ctx.save();

    // mar (ondas)
    ctx.fillStyle = rgba(palette.bg2, 0.16);
    ctx.fillRect(0, h*0.58, w, h*0.42);
    ctx.strokeStyle = rgba(palette.accent, 0.08);
    ctx.lineWidth = 4;
    for(let j=0;j<6;j++){
      ctx.beginPath();
      for(let i=0;i<=40;i++){
        const x = (i/40)*w;
        const y = h*(0.62 + j*0.06) + Math.sin(i*0.55 + t*0.0015 + j)*10;
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    // navio (silhueta)
    const bx = w*0.55 + Math.sin(t*0.001)*14;
    const by = h*0.60 + Math.sin(t*0.0012)*6;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(bx-w*0.18, by);
    ctx.lineTo(bx+w*0.18, by);
    ctx.lineTo(bx+w*0.12, by+h*0.06);
    ctx.lineTo(bx-w*0.12, by+h*0.06);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(bx-4, by-h*0.18, 8, h*0.18);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.moveTo(bx, by-h*0.18);
    ctx.lineTo(bx+w*0.10, by-h*0.05);
    ctx.lineTo(bx, by-h*0.05);
    ctx.closePath();
    ctx.fill();

    // respingos / partículas do mar
    for(const s of state.splashes){
      s.x += 0.12 + Math.sin(t*0.001 + s.x*0.01)*0.08;
      s.y += Math.sin(t*0.002 + s.x*0.02)*0.2;
      if(s.x > w+10){ s.x = -10; s.y = h*0.65 + Math.random()*h*0.35; }
      ctx.fillStyle = rgba(palette.accent, s.a);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  function sceneSamurai(state, ctx, palette, w,h, t){
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 240, 0.32);
      state.petals = Array.from({length:90}).map(()=> ({
        x:Math.random()*w,
        y:Math.random()*h,
        vy:0.25 + Math.random()*0.9,
        vx:-0.15 + Math.random()*0.3,
        r:1.2 + Math.random()*2.5,
        a:0.04 + Math.random()*0.14,
        rot:Math.random()*Math.PI*2
      }));
      state.w=w; state.h=h;
    }
    drawMesh(ctx, state.mesh, palette, t, 8);

    ctx.save();
    // lantern glow
    const g = ctx.createRadialGradient(w*0.18, h*0.25, 10, w*0.18, h*0.25, 220);
    g.addColorStop(0, rgba(palette.accent, 0.18));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // pétalas caindo
    ctx.fillStyle = rgba(palette.accent, 0.20);
    for(const p of state.petals){
      p.x += p.vx + Math.sin(t*0.001 + p.y*0.02)*0.1;
      p.y += p.vy;
      p.rot += 0.02;
      if(p.y > h+10){ p.y = -10; p.x = Math.random()*w; }
      if(p.x < -10) p.x = w+10;
      if(p.x > w+10) p.x = -10;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.ellipse(0,0, p.r*1.6, p.r, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function sceneDesert(state, ctx, palette, w,h, t){
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 260, 0.26);
      state.dust = Array.from({length:120}).map(()=> ({
        x:Math.random()*w,
        y:h*0.35 + Math.random()*h*0.65,
        vx:0.3 + Math.random()*0.9,
        r:0.8 + Math.random()*2.2,
        a:0.03 + Math.random()*0.12
      }));
      state.w=w; state.h=h;
    }
    drawMesh(ctx, state.mesh, palette, t, 8);

    ctx.save();

    // dunas
    ctx.fillStyle = rgba(palette.bg2, 0.16);
    ctx.beginPath();
    ctx.moveTo(0, h*0.72);
    ctx.quadraticCurveTo(w*0.25, h*0.60, w*0.55, h*0.70);
    ctx.quadraticCurveTo(w*0.75, h*0.78, w, h*0.68);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // sol
    const sunX = w*0.18, sunY = h*0.22;
    const sun = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 280);
    sun.addColorStop(0, rgba(palette.accent, 0.22));
    sun.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0,0,w,h);

    // poeira
    for(const d of state.dust){
      d.x += d.vx;
      if(d.x > w+20){ d.x = -20; d.y = h*0.35 + Math.random()*h*0.65; }
      ctx.fillStyle = rgba(palette.accent, d.a);
      ctx.beginPath();
      ctx.arc(d.x, d.y + Math.sin(t*0.001 + d.x*0.01)*2, d.r, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================
  // Engine core
  // =========================================================
  const state = {
    canvas:null,
    ctx:null,
    w:0,
    h:0,
    dpr:1,
    running:false,
    theme:"",
    sceneState:{},
    mesh:null
  };

  
  /* ===============================
     AMBIENT AUDIO (procedural)
     - Sem arquivos externos
     - Respeita vasteria_mute
     =============================== */
  const AUDIO = {
    ctx: null,
    master: null,
    running: false,
    theme: "",
    muted: false,
    nodes: [],
    _timer: null
  };

  function audioEnsure(){
    if(AUDIO.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    AUDIO.ctx = new Ctx();
    AUDIO.master = AUDIO.ctx.createGain();
    AUDIO.master.gain.value = 0.0;
    AUDIO.master.connect(AUDIO.ctx.destination);
    AUDIO.running = true;
  }

  function audioSetMuted(m){
    AUDIO.muted = !!m;
    if(!AUDIO.master) return;
    AUDIO.master.gain.setTargetAtTime(AUDIO.muted ? 0.0 : 0.12, AUDIO.ctx.currentTime, 0.05);
  }

  function audioStop(){
    if(!AUDIO.ctx) return;
    try{
      AUDIO.nodes.forEach(n => { try{ n.disconnect(); }catch(e){} });
      AUDIO.nodes = [];
      if(AUDIO._timer) { clearInterval(AUDIO._timer); AUDIO._timer=null; }
    }catch(e){}
    AUDIO.theme = "";
  }

  function audioStart(theme){
    audioEnsure();
    if(!AUDIO.ctx) return;
    if(AUDIO.theme === theme) return;
    audioStop();
    AUDIO.theme = theme;

    // só roda em lowpoly (piloto café + cthulhu)
    if(theme !== "coffee_caramel" && theme !== "cthulhu") return;

    // garantir que o contexto esteja ativo (necessita gesto)
    if(AUDIO.ctx.state === "suspended"){
      // tenta retomar; se falhar, ficará mudo até o próximo clique
      AUDIO.ctx.resume().catch(()=>{});
    }

    const ctx = AUDIO.ctx;

    // base noise
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const out = noiseBuf.getChannelData(0);
    for(let i=0;i<out.length;i++) out[i] = (Math.random()*2-1);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 200;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = theme === "coffee_caramel" ? 1800 : 900;

    const ambGain = ctx.createGain();
    ambGain.gain.value = theme === "coffee_caramel" ? 0.35 : 0.28;

    noise.connect(hp); hp.connect(lp); lp.connect(ambGain); ambGain.connect(AUDIO.master);
    noise.start();

    AUDIO.nodes.push(noise, hp, lp, ambGain);

    // eventos pontuais (clinks / sussurros)
    AUDIO._timer = setInterval(() => {
      if(AUDIO.muted || !AUDIO.ctx) return;
      const now = ctx.currentTime;

      if(theme === "coffee_caramel"){
        // "clink" aleatório
        if(Math.random() < 0.45){
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(700 + Math.random()*600, now);
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.02, now+0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, now+0.08);
          osc.connect(g); g.connect(AUDIO.master);
          osc.start(now); osc.stop(now+0.09);
          AUDIO.nodes.push(osc,g);
        }
      } else {
        // "sussurro" grave + ping distante
        if(Math.random() < 0.35){
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(90 + Math.random()*60, now);
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.03, now+0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, now+0.35);
          const flt = ctx.createBiquadFilter();
          flt.type = "lowpass"; flt.frequency.value = 380;
          osc.connect(flt); flt.connect(g); g.connect(AUDIO.master);
          osc.start(now); osc.stop(now+0.36);
          AUDIO.nodes.push(osc,flt,g);
        }
      }
    }, 1200);

    audioSetMuted(localStorage.getItem("vasteria_mute")==="1");
  }
const sceneMap = {
    caramel: sceneCafe,
    coffee_caramel: sceneCafe,
    coffee: sceneGeneric,
    master: sceneGeneric,
    arcane: sceneGeneric,
    stellar: sceneStars,
    aura: sceneStars,

    might: sceneGeneric,
    stealth: sceneGeneric,
    wild: sceneGeneric,

    paladin: sceneGeneric,
    cleric: sceneGeneric,
    bard: sceneGeneric,
    monk: sceneGeneric,
    barbarian: sceneGeneric,
    ranger: sceneGeneric,
    warlock: sceneGeneric,

    bonfire: sceneBonfire,
    viking: sceneViking,
    cthulhu: sceneCthulhu,
    pirate: scenePirate,
    samurai: sceneSamurai,
    desert: sceneDesert,

    frost: sceneGeneric,
    noir: sceneGeneric,
    clockwork: sceneGeneric,
    sunset: sceneGeneric,
    classic: sceneGeneric,

    // SECRET skins (usa a cena genérica com partículas)
    secret_obsidian: sceneGeneric,
    secret_bloodmoon: sceneGeneric,
    secret_abyss: sceneGeneric,
  };

  function ensureCanvas(){
    let c = qs("#bg-canvas");
    if(!c){
      c = document.createElement("canvas");
      c.id = "bg-canvas";
      document.body.prepend(c);
    }
    return c;
  }

  function resize(){
    if(!state.canvas) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    state.dpr = dpr;
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    state.w = w;
    state.h = h;
    state.canvas.width = Math.floor(w*dpr);
    state.canvas.height = Math.floor(h*dpr);
    state.canvas.style.width = w+"px";
    state.canvas.style.height = h+"px";
    state.ctx.setTransform(dpr,0,0,dpr,0,0);

    // reset scene state so it regenere conforme tela
    state.sceneState = {};
  }

  function clear(ctx,w,h,palette){
    // fundo: gradiente do tema
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, rgba(palette.bg1, 0.92));
    g.addColorStop(0.6, rgba(palette.bg2, 0.88));
    g.addColorStop(1, rgba(palette.bg3, 0.86));
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
  }

  function tick(t){
    if(!state.running) return;
    const ctx = state.ctx;
    const w = state.w, h = state.h;
    const palette = getCSSVars();

    clear(ctx,w,h,palette);

    const sceneFn = sceneMap[state.theme] || sceneGeneric;
    sceneFn(state.sceneState, ctx, palette, w,h, t);

    requestAnimationFrame(tick);
  }

  function setTheme(themeId){
    if(themeId === "caramel") themeId = "coffee_caramel";
    state.theme = themeId || "";
    // áudio ambiente (piloto)
    audioStart(state.theme);
    // reset scene state pra trocar completamente
    state.sceneState = {};
  }

  function setMuted(m){
    try{ audioEnsure(); }catch(e){}
    try{ audioSetMuted(!!m); }catch(e){}
  }

  function init(){
    state.canvas = ensureCanvas();
    state.ctx = state.canvas.getContext("2d", { alpha:true, desynchronized:true });
    resize();
    window.addEventListener("resize", resize);

    document.addEventListener("pointerdown", () => {
      try{ audioEnsure(); if(AUDIO.ctx && AUDIO.ctx.state === "suspended") AUDIO.ctx.resume().catch(()=>{}); }catch(e){}
    }, { once:false });

    // recebe eventos do Theme.apply()
    window.addEventListener("vasteria:theme", (e) => {
      setTheme(e.detail?.theme || "");
    });

    // recebe mute/unmute
    window.addEventListener("vasteria:mute", (e) => {
      setMuted(!!(e.detail && e.detail.muted));
    });

    // também reage se mudar em outra aba
    window.addEventListener('storage', (e) => {
      if(e && e.key === 'vasteria_mute'){
        setMuted(localStorage.getItem('vasteria_mute') === '1');
      }
    });

    // pega tema atual no carregamento
    setTheme(document.documentElement.getAttribute("data-theme") || document.body.getAttribute("data-theme") || "");

    // aplica mute atual no carregamento
    setMuted(localStorage.getItem('vasteria_mute') === '1');

    state.running = true;
    requestAnimationFrame(tick);
  }

  window.VasteriaBG = { init, setTheme, setMuted };

  // auto-init
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();