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

  function sceneCafe(state, ctx, palette, w,h, t){
    // cafeteria low poly: paredes + balcão + pessoas + vapor
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 220, 0.30);
      state.parts = makeParticles(60, w,h);
      // pessoas (silhuetas)
      state.people = Array.from({length:6}).map((_,i)=>({
        x:Math.random()*w,
        y:h*0.58 + Math.random()*h*0.12,
        s:0.7 + Math.random()*0.6,
        dir: Math.random()>0.5 ? 1 : -1,
        sp: 0.25 + Math.random()*0.35
      }));
      // vapor
      state.steam = Array.from({length:14}).map(()=> ({
        x:w*0.5 + (Math.random()*2-1)*w*0.18,
        y:h*0.62 + Math.random()*h*0.15,
        off:Math.random()*Math.PI*2
      }));
      state.w=w; state.h=h;
    }

    drawMesh(ctx, state.mesh, palette, t, 14);

    // chão + balcão (low poly)
    ctx.save();
    // chão
    const floor = ctx.createLinearGradient(0, h*0.55, 0, h);
    floor.addColorStop(0, rgba(palette.bg2, 0.15));
    floor.addColorStop(1, rgba(palette.bg1, 0.55));
    ctx.fillStyle = floor;
    ctx.fillRect(0, h*0.55, w, h*0.45);

    // balcão
    ctx.fillStyle = rgba(lerpColor(palette.bg2, palette.accent, 0.25), 0.22);
    ctx.beginPath();
    ctx.moveTo(w*0.12, h*0.62);
    ctx.lineTo(w*0.68, h*0.62);
    ctx.lineTo(w*0.78, h*0.80);
    ctx.lineTo(w*0.22, h*0.80);
    ctx.closePath();
    ctx.fill();

    // xícaras
    for(let i=0;i<3;i++){
      const cx = w*(0.25 + i*0.12);
      const cy = h*0.68;
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.strokeStyle = rgba(palette.accent, 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx-18, cy-12, 36, 22, 8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx+22, cy-2, 8, -Math.PI/2, Math.PI/2);
      ctx.stroke();
    }

    // pessoas passando (silhuetas simples)
    for(const p of state.people){
      p.x += p.dir * p.sp;
      if(p.x > w+40) p.x = -40;
      if(p.x < -40) p.x = w+40;

      const px = p.x;
      const py = p.y + Math.sin((t*0.002)+px*0.01)*2;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.roundRect(px-10*p.s, py-32*p.s, 20*p.s, 36*p.s, 8*p.s);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py-40*p.s, 10*p.s, 0, Math.PI*2);
      ctx.fill();
    }

    // vapor (linhas sinuosas)
    ctx.strokeStyle = rgba(palette.accent, 0.20);
    ctx.lineWidth = 2;
    for(const s of state.steam){
      const x = s.x + Math.sin(t*0.001 + s.off)*10;
      const y = s.y;
      ctx.beginPath();
      for(let k=0;k<26;k++){
        const yy = y - k*8;
        const xx = x + Math.sin((k*0.35) + t*0.002 + s.off)*10;
        if(k===0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }

    // poeira / brilho
    drawParticles(ctx, state.parts, palette, w,h, t, "dust");
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

  function sceneCthulhu(state, ctx, palette, w,h, t){
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 240, 0.34);
      state.bubbles = Array.from({length:80}).map(()=> ({
        x:Math.random()*w,
        y:h + Math.random()*h,
        vy:0.25 + Math.random()*0.8,
        r:2 + Math.random()*10,
        a:0.04 + Math.random()*0.18,
        wob:Math.random()*Math.PI*2
      }));
      state.w=w; state.h=h;
    }
    drawMesh(ctx, state.mesh, palette, t, 10);

    ctx.save();

    // tentáculos desenhados (curvas)
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(palette.accent, 0.08);
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    for(let i=0;i<4;i++){
      const ox = w*(0.15 + i*0.22);
      const oy = h*0.95;
      const sway = Math.sin(t*0.001 + i)*40;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.bezierCurveTo(ox-80, h*0.75, ox+60, h*0.55, ox+sway, h*0.25);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    // bolhas subindo
    for(const b of state.bubbles){
      b.y -= b.vy;
      b.x += Math.sin(t*0.0015 + b.wob)*0.25;
      if(b.y < -40){
        b.y = h + 40 + Math.random()*h*0.5;
        b.x = Math.random()*w;
        b.vy = 0.25 + Math.random()*0.9;
      }
      ctx.strokeStyle = rgba(palette.accent, b.a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.stroke();
    }

    // vinheta escura
    const v = ctx.createRadialGradient(w*0.5, h*0.5, 20, w*0.5, h*0.5, Math.max(w,h)*0.65);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = v;
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
    parx: 0,
    pary: 0,
    ptrX: 0,
    ptrY: 0,
    ptrActive: false,
    
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

  const sceneMap = {
    caramel: sceneCafe,
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



  function ensureWallpaper(){
    let w = qs("#bg-wallpaper");
    if(!w){
      w = document.createElement("div");
      w.id = "bg-wallpaper";
      w.innerHTML = '<div class="wp" id="bg-wp"></div>';
      document.body.prepend(w);
    }
    return w;
  }

  function svgDataUri(svg){
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function wallpaperSVG(theme){
    const W = 1600, H = 900;
    const base = (inner) => `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">\n  <defs>\n    <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="rgba(255,255,255,0.06)"/>\n      <stop offset="1" stop-color="rgba(0,0,0,0.38)"/>\n    </linearGradient>\n    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">\n      <feGaussianBlur stdDeviation="6" result="b"/>\n      <feColorMatrix type="matrix" values="1 0 0 0 0\n 0 1 0 0 0\n 0 0 1 0 0\n 0 0 0 0.9 0" in="b" result="c"/>\n      <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>\n    </filter>\n  </defs>\n  ${inner}\n</svg>`;
    const poly = (pts, fill, extra="") => `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
    const circle = (cx,cy,r,fill,extra="") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
    const rect = (x,y,w,h,fill,extra="") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
    const path = (d,fill,extra="") => `<path d="${d}" fill="${fill}" ${extra}/>`;
    const stars = () => {
      let s = "";
      for(let i=0;i<140;i++){
        const x = (i*73)%W;
        const y = (i*191)%H;
        const r = (i%3===0)?1.8:1.2;
        const o = (i%7===0)?0.9:0.55;
        s += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(255,255,255,${o})" />`;
      }
      return s;
    };

    if(theme === "caramel"){
      return base(`
        <rect width="${W}" height="${H}" fill="#1a0f0a"/>
        <g data-depth style="--d:.08">
          ${rect(0,0,W,H,"#20120d")}
          ${rect(0,0,W,420,"#2a1b15")}
          ${rect(0,420,W,480,"#140b08")}
          ${poly("0,470 600,360 1200,420 1600,340 1600,900 0,900","#1a0f0a")}
        </g>

        <g data-depth style="--d:.18">
          ${rect(160,140,1280,420,"rgba(255,179,71,0.08)","rx='22'")}
          ${rect(190,170,1220,360,"rgba(10,10,10,0.35)","rx='16'")}
          ${rect(190,170,1220,360,"rgba(255,255,255,0.03)","rx='16'")}
          ${rect(200,180,1200,340,"rgba(255,179,71,0.02)","rx='16'")}
          <g filter="url(#softGlow)">
            <text x="800" y="120" text-anchor="middle" font-family="Outfit, sans-serif" font-size="72" fill="rgba(255,179,71,0.92)">CAFÉ</text>
            <text x="800" y="156" text-anchor="middle" font-family="Outfit, sans-serif" font-size="22" fill="rgba(255,248,225,0.75)">CARAMEL · LOW POLY</text>
          </g>
        </g>

        <g data-depth style="--d:.26">
          ${poly("220,620 1380,620 1500,900 100,900","#2a1b15")}
          ${poly("260,620 1340,620 1405,690 195,690","#3a241b")}
          ${poly("260,690 1340,690 1360,720 240,720","#2d1c15")}

          ${poly("310,560 520,520 600,590 390,640","#3b2a21")}
          ${poly("1020,560 1230,520 1310,590 1100,640","#3b2a21")}
          ${poly("480,520 520,520 390,640 350,640","#2b1a13")}
          ${poly("1190,520 1230,520 1100,640 1060,640","#2b1a13")}

          <g id="mugs">
            ${rect(520,575,52,28,"#e6c8a0","rx='6'")}
            ${rect(528,582,36,14,"rgba(0,0,0,0.25)","rx='6'")}
            ${rect(1040,575,52,28,"#e6c8a0","rx='6'")}
            ${rect(1048,582,36,14,"rgba(0,0,0,0.25)","rx='6'")}
          </g>
        </g>

        <g data-depth style="--d:.30">
          <g style="animation:steamRise 2.6s infinite ease-out;">
            ${circle(546,568,12,"rgba(255,255,255,0.25)")}
            ${circle(562,556,9,"rgba(255,255,255,0.18)")}
            ${circle(534,552,8,"rgba(255,255,255,0.14)")}
          </g>
          <g style="animation:steamRise 2.9s .6s infinite ease-out;">
            ${circle(1066,568,12,"rgba(255,255,255,0.25)")}
            ${circle(1082,556,9,"rgba(255,255,255,0.18)")}
            ${circle(1054,552,8,"rgba(255,255,255,0.14)")}
          </g>
        </g>

        <g data-depth style="--d:.12">
          <g class="npc-walk" style="animation:npcWalk 9s linear infinite;">
            ${rect(-140,520,70,160,"rgba(255,255,255,0.08)","rx='18'")}
            ${circle(-105,505,26,"rgba(255,255,255,0.08)")}
          </g>
          <g class="npc-walk" style="animation:npcWalk 12s 2s linear infinite;">
            ${rect(-260,540,90,190,"rgba(0,0,0,0.20)","rx='22'")}
            ${circle(-215,520,34,"rgba(0,0,0,0.20)")}
          </g>
        </g>

        <rect width="${W}" height="${H}" fill="url(#g-sky)" opacity="0.65"/>
      `);
    }

    if(theme === "bonfire"){
      return base(`
        <rect width="${W}" height="${H}" fill="#07070a"/>
        <g data-depth style="--d:.08">
          ${rect(0,0,W,520,"#0b0b12")}
          ${poly("0,520 400,420 900,520 1600,420 1600,900 0,900","#090910")}
          ${stars()}
        </g>

        <g data-depth style="--d:.18">
          ${poly("120,760 520,600 900,700 1350,580 1500,760 800,900","#14121a")}
          ${poly("0,820 430,640 980,780 1600,640 1600,900 0,900","#0f0f15")}
        </g>

        <g data-depth style="--d:.30">
          ${poly("760,740 840,740 860,820 740,820","#202028")}
          ${poly("798,540 812,540 822,740 788,740","#cfcfcf")}
          ${poly("792,525 818,525 812,548 798,548","#9f9f9f")}
          <g style="transform-origin:800px 740px;animation:flameFlicker 1.2s infinite ease-in-out;">
            ${path("M800 720 C770 700 775 660 800 640 C825 660 830 700 800 720 Z","#ffb347","filter='url(#softGlow)'")}
            ${path("M800 710 C785 695 790 675 800 660 C812 675 816 695 800 710 Z","#ffd700","opacity='0.85'")}
          </g>
          ${circle(740,790,3,"rgba(255,179,71,0.45)")}
          ${circle(860,800,2.5,"rgba(255,215,0,0.35)")}
        </g>

        <g data-depth style="--d:.24" opacity="0.65">
          <g style="animation:tentacleSway 6s infinite ease-in-out; transform-origin:700px 820px;">
            ${poly("640,820 710,750 760,820","#1a1622")}
            ${circle(700,742,18,"#1a1622")}
          </g>
          <g style="animation:tentacleSway 7.5s infinite ease-in-out; transform-origin:900px 820px;">
            ${poly("860,820 930,750 980,820","#1a1622")}
            ${circle(920,742,18,"#1a1622")}
          </g>
        </g>

        <rect width="${W}" height="${H}" fill="url(#g-sky)" opacity="0.5"/>
      `);
    }

    if(theme === "cthulhu"){
      return base(`
        <rect width="${W}" height="${H}" fill="#00030a"/>
        <g data-depth style="--d:.06">
          ${rect(0,0,W,H,"#00040b")}
          ${stars()}
          ${circle(1180,230,160,"rgba(0,255,200,0.06)")}
          ${circle(1180,230,260,"rgba(120,0,255,0.05)")}
        </g>

        <g data-depth style="--d:.12" opacity="0.9">
          <path d="M350,280 C520,140 760,140 920,260 C1060,360 1150,560 980,650 C800,740 520,720 360,560 C220,420 240,330 350,280 Z" fill="rgba(140,0,255,0.10)"/>
          <path d="M410,320 C560,210 750,210 880,310 C1000,400 1060,540 930,610 C780,690 560,670 430,560 C320,470 330,380 410,320 Z" fill="rgba(0,255,200,0.08)"/>
        </g>

        <g data-depth style="--d:.22">
          ${poly("600,760 1000,760 1120,900 480,900","#0a1720")}
          ${poly("650,520 950,520 1020,760 580,760","#0f2531")}
          ${poly("680,560 920,560 960,740 640,740","#102b38")}
          ${rect(705,610,40,10,"rgba(0,255,200,0.18)")}
          ${rect(855,610,40,10,"rgba(0,255,200,0.18)")}
        </g>

        <g data-depth style="--d:.30">
          ${poly("720,560 880,560 940,720 660,720","#0e2f2b")}
          ${circle(800,520,70,"#0e2f2b")}
          ${poly("750,460 800,420 850,460 838,470 800,450 762,470","#0b201e")}
          <g filter="url(#softGlow)">
            ${circle(775,520,10,"rgba(0,255,200,0.8)")}
            ${circle(825,520,10,"rgba(0,255,200,0.8)")}
          </g>

          <g style="transform-origin:800px 600px; animation:tentacleSway 4.5s infinite ease-in-out;">
            ${path("M730 560 C650 600 620 700 700 760 C760 800 760 830 720 860 C690 885 730 900 760 880 C820 850 820 820 780 790 C720 740 710 670 760 620 Z","rgba(14,47,43,0.9)")}
          </g>
          <g style="transform-origin:800px 600px; animation:tentacleSway 5.3s -.7s infinite ease-in-out;">
            ${path("M870 560 C950 600 980 700 900 760 C840 800 840 830 880 860 C910 885 870 900 840 880 C780 850 780 820 820 790 C880 740 890 670 840 620 Z","rgba(14,47,43,0.9)")}
          </g>
        </g>

        <rect width="${W}" height="${H}" fill="url(#g-sky)" opacity="0.45"/>
      `);
    }

    if(theme === "aura"){
      return base(`
        <rect width="${W}" height="${H}" fill="#02030b"/>
        <g data-depth style="--d:.06">
          ${rect(0,0,W,H,"#030514")}
          ${stars()}
        </g>

        <g data-depth style="--d:.12">
          ${circle(260,640,240,"rgba(255,190,120,0.12)")}
          ${circle(260,640,140,"rgba(255,220,180,0.18)")}
        </g>

        <g data-depth style="--d:.22">
          ${poly("0,760 240,560 520,700 820,520 1120,700 1400,560 1600,760 1600,900 0,900","#07162a")}
          ${poly("0,820 260,650 560,780 900,610 1200,780 1480,650 1600,820 1600,900 0,900","#061025")}
        </g>

        <g data-depth style="--d:.28" opacity="0.85">
          <path d="M-40,240 C240,160 420,280 680,220 C940,160 1160,260 1660,180 L1660,320 C1160,420 940,320 680,380 C420,440 240,320 -40,420 Z" fill="rgba(0,255,200,0.10)" style="animation:auraDrift 10s infinite ease-in-out;" />
          <path d="M-40,300 C260,220 460,340 720,280 C980,220 1200,320 1660,250 L1660,380 C1200,460 980,360 720,420 C460,480 260,360 -40,460 Z" fill="rgba(160,120,255,0.10)" style="animation:auraDrift 12s -.8s infinite ease-in-out;" />
        </g>

        <g data-depth style="--d:.18" opacity="0.55">
          <path d="M980,520 q30,-20 60,0 q-30,-10 -60,0 Z" fill="rgba(255,255,255,0.25)"/>
          <path d="M1040,540 q24,-16 48,0 q-24,-8 -48,0 Z" fill="rgba(255,255,255,0.22)"/>
        </g>

        <rect width="${W}" height="${H}" fill="url(#g-sky)" opacity="0.35"/>
      `);
    }


    if(theme === "viking"){
      return base(`
        <rect width="${W}" height="${H}" fill="#06121c"/>
        <g data-depth style="--d:.06">
          ${rect(0,0,W,H,"#061829")}
          ${stars()}
        </g>
        <g data-depth style="--d:.14">
          ${poly("0,720 260,560 540,680 860,540 1180,680 1500,560 1600,620 1600,900 0,900","#072235")}
          ${poly("0,800 300,650 600,780 900,630 1200,780 1500,660 1600,740 1600,900 0,900","#061b2c")}
        </g>
        <!-- fiorde + mar -->
        <g data-depth style="--d:.20">
          ${rect(0,700,W,200,"rgba(60,120,180,0.20)")}
          ${path("M0 770 C200 740 420 800 620 770 C820 740 1060 810 1260 780 C1460 750 1540 760 1600 740 L1600 900 L0 900 Z","rgba(90,170,255,0.10)")}
        </g>
        <!-- drakkar -->
        <g data-depth style="--d:.30">
          ${poly("560,760 1040,760 980,820 620,820","#0b2a2a")}
          ${poly("620,820 980,820 940,860 660,860","#0a2222")}
          ${poly("700,620 720,620 730,760 690,760","#c7c7c7")}
          ${poly("720,630 900,720 720,720","#e6d2b0")}
          ${path("M560 760 C520 770 520 800 560 810 C600 820 620 780 560 760 Z","#0b2a2a")}
          ${path("M1040 760 C1080 770 1080 800 1040 810 C1000 820 980 780 1040 760 Z","#0b2a2a")}
        </g>
        <rect width="${W}" height="${H}" fill="url(#g-sky)" opacity="0.35"/>
      `);
    }

    if(theme === "pirate"){
      return base(`
        <rect width="${W}" height="${H}" fill="#061022"/>
        <g data-depth style="--d:.06">
          ${rect(0,0,W,H,"#071431")}
          ${stars()}
          ${circle(1320,170,90,"rgba(255,255,255,0.06)")}
        </g>
        <!-- mar -->
        <g data-depth style="--d:.16">
          ${rect(0,600,W,300,"rgba(40,120,190,0.18)")}
          ${path("M0 650 C220 620 440 690 660 650 C880 610 1120 700 1320 660 C1480 628 1560 640 1600 620 L1600 900 L0 900 Z","rgba(120,220,255,0.10)")}
          ${path("M0 710 C260 680 520 750 780 710 C1040 670 1260 760 1600 700 L1600 900 L0 900 Z","rgba(255,255,255,0.04)")}
        </g>
        <!-- navio -->
        <g data-depth style="--d:.30">
          ${poly("560,700 1180,700 1100,820 640,820","#2a1a12")}
          ${poly("640,820 1100,820 1020,860 720,860","#21130e")}
          ${poly("860,420 884,420 900,700 844,700","#cfcfcf")}
          ${poly("900,460 1120,620 900,620","#f2e0c7")}
          ${poly("860,520 700,620 860,620","#e6d2b0")}
          ${path("M1180 700 C1250 720 1250 780 1180 800 C1120 820 1100 760 1180 700 Z","#2a1a12")}
        </g>
        <!-- gaivotas -->
        <g data-depth style="--d:.18" opacity="0.55">
          <path d="M380,260 q26,-16 52,0 q-26,-8 -52,0 Z" fill="rgba(255,255,255,0.22)"/>
          <path d="M440,280 q20,-12 40,0 q-20,-6 -40,0 Z" fill="rgba(255,255,255,0.18)"/>
        </g>
        <rect width="${W}" height="${H}" fill="url(#g-sky)" opacity="0.35"/>
      `);
    }

    if(theme === "samurai"){
      return base(`
        <rect width="${W}" height="${H}" fill="#120610"/>
        <g data-depth style="--d:.06">
          ${rect(0,0,W,H,"#1a0714")}
          ${stars()}
        </g>
        <!-- lua -->
        <g data-depth style="--d:.12">
          ${circle(1320,210,120,"rgba(255,230,240,0.08)")}
          ${circle(1320,210,80,"rgba(255,230,240,0.10)")}
        </g>
        <!-- colinas -->
        <g data-depth style="--d:.16">
          ${poly("0,760 260,620 520,740 820,600 1120,740 1400,610 1600,700 1600,900 0,900","#1b0a18")}
          ${poly("0,820 300,700 600,820 900,690 1200,820 1500,700 1600,760 1600,900 0,900","#140714")}
        </g>
        <!-- Torii -->
        <g data-depth style="--d:.28">
          ${rect(360,430,40,320,"#a5132d","rx='10'")}
          ${rect(520,430,40,320,"#a5132d","rx='10'")}
          ${rect(320,410,280,40,"#c0183a","rx='12'")}
          ${rect(300,380,320,36,"#8f0f25","rx='12'")}
          ${rect(392,520,136,18,"rgba(0,0,0,0.25)","rx='8'")}
        </g>
        <!-- lantern -->
        <g data-depth style="--d:.30">
          <g style="transform-origin:760px 520px;animation:tentacleSway 3.6s infinite ease-in-out;">
            ${rect(740,520,40,70,"#e6c8a0","rx='10'")}
            ${rect(748,530,24,50,"rgba(0,0,0,0.22)","rx='8'")}
            ${circle(760,555,14,"rgba(255,179,71,0.18)")}
          </g>
        </g>
        <rect width="${W}" height="${H}" fill="url(#g-sky)" opacity="0.42"/>
      `);
    }

    if(theme === "desert"){
      return base(`
        <rect width="${W}" height="${H}" fill="#200e05"/>
        <g data-depth style="--d:.06">
          ${rect(0,0,W,H,"#2a1307")}
          ${circle(1340,220,160,"rgba(255,179,71,0.08)")}
          ${circle(1340,220,90,"rgba(255,215,0,0.06)")}
        </g>
        <!-- dunas -->
        <g data-depth style="--d:.18">
          ${path("M0 640 C220 560 420 720 640 650 C860 580 1040 730 1260 660 C1460 610 1560 640 1600 620 L1600 900 L0 900 Z","rgba(255,179,71,0.12)")}
          ${path("M0 720 C260 650 520 800 780 730 C1040 660 1260 820 1600 720 L1600 900 L0 900 Z","rgba(255,215,160,0.08)")}
        </g>
        <!-- caravana -->
        <g data-depth style="--d:.30" opacity="0.65">
          ${poly("340,760 420,700 520,760","#1c0b05")}
          ${circle(420,690,16,"#1c0b05")}
          ${poly("600,760 680,700 780,760","#1c0b05")}
          ${circle(680,690,16,"#1c0b05")}
          <g class="npc-walk" style="animation:npcWalk 14s linear infinite;">
            ${poly("-120,790 -60,740 0,790","#140704")}
            ${circle(-60,730,12,"#140704")}
          </g>
        </g>
        <rect width="${W}" height="${H}" fill="url(#g-sky)" opacity="0.55"/>
      `);
    }

    return base(`<rect width="${W}" height="${H}" fill="rgba(0,0,0,0)"/>`);
  }

  function applyWallpaper(themeId){
    ensureWallpaper();
    const wp = qs("#bg-wp");
    if(!wp) return;
    const svg = wallpaperSVG(themeId);
    if(svg && svg.length > 50){
      wp.style.backgroundImage = `url(${svgDataUri(svg)})`;
      wp.style.backgroundSize = "cover";
      wp.style.backgroundPosition = "center";
    }else{
      wp.style.backgroundImage = "none";
    }
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


  // =========================================================
  // AMBIENT AUDIO (procedural — sem arquivos)
  // - respeita mute salvo em localStorage: vasteria_ambient_muted
  // - cada tema lowpoly tem "paisagem sonora" própria
  // =========================================================
  let amb = {
    ctx: null,
    master: null,
    nodes: [],
    theme: "",
    muted: false
  };

  function ambientIsMuted(){
    return localStorage.getItem("vasteria_ambient_muted") === "1";
  }

  function ambientEnsure(){
    if(!amb.ctx){
      amb.ctx = new (window.AudioContext || window.webkitAudioContext)();
      amb.master = amb.ctx.createGain();
      amb.master.gain.value = 0.0;
      amb.master.connect(amb.ctx.destination);
    }
    return amb.ctx;
  }

  function ambientStop(){
    try{
      amb.nodes.forEach(n=>{
        try{ n.stop && n.stop(); }catch(_){}
        try{ n.disconnect && n.disconnect(); }catch(_){}
      });
    }catch(_){}
    amb.nodes = [];
  }

  function ambientSetMuted(m){
    amb.muted = !!m;
    try{
      if(amb.master){
        amb.master.gain.cancelScheduledValues(amb.ctx.currentTime);
        amb.master.gain.setTargetAtTime(amb.muted ? 0.0 : 0.18, amb.ctx.currentTime, 0.12);
      }
    }catch(_){}
  }

  function brownNoise(ctx){
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    const node = ctx.createBufferSource();
    node.buffer = noiseBuffer;
    node.loop = true;
    return node;
  }

  function ambientCafe(ctx){
    // chatter + machine hiss + bell
    const mix = ctx.createGain(); mix.gain.value = 0.8;
    const chatter = brownNoise(ctx);
    const f1 = ctx.createBiquadFilter(); f1.type="bandpass"; f1.frequency.value=900; f1.Q.value=0.7;
    const g1 = ctx.createGain(); g1.gain.value=0.12;

    chatter.connect(f1); f1.connect(g1); g1.connect(mix);

    const hiss = brownNoise(ctx);
    const f2 = ctx.createBiquadFilter(); f2.type="highpass"; f2.frequency.value=1800; f2.Q.value=0.5;
    const g2 = ctx.createGain(); g2.gain.value=0.05;
    hiss.connect(f2); f2.connect(g2); g2.connect(mix);

    // slow LFO
    const lfo = ctx.createOscillator(); lfo.type="sine"; lfo.frequency.value=0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value=0.04;
    lfo.connect(lfoG); lfoG.connect(g1.gain);

    // bell ping
    const bell = () => {
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(); o.type="sine";
      const g = ctx.createGain();
      o.frequency.setValueAtTime(1200 + Math.random()*400, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+0.22);
      o.connect(g); g.connect(mix);
      o.start(t0); o.stop(t0+0.25);
      amb.nodes.push(o,g);
    };
    const bellTimer = setInterval(()=>{ if(!amb.muted && Math.random()<0.18) bell(); }, 2500);
    amb.nodes.push({ stop: ()=>clearInterval(bellTimer) });

    mix.connect(amb.master);
    chatter.start(); hiss.start(); lfo.start();
    amb.nodes.push(chatter,hiss,lfo,mix,f1,f2,g1,g2,lfoG);
  }

  function ambientFire(ctx){
    const mix = ctx.createGain(); mix.gain.value=1.0;
    const n = brownNoise(ctx);
    const lp = ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=900; lp.Q.value=0.7;
    const g = ctx.createGain(); g.gain.value=0.14;
    n.connect(lp); lp.connect(g); g.connect(mix);

    const crack = () => {
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(); o.type="triangle";
      const gg = ctx.createGain();
      o.frequency.setValueAtTime(300 + Math.random()*700, t0);
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.exponentialRampToValueAtTime(0.06, t0+0.005);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0+0.09);
      o.connect(gg); gg.connect(mix);
      o.start(t0); o.stop(t0+0.1);
      amb.nodes.push(o,gg);
    };
    const timer = setInterval(()=>{ if(!amb.muted && Math.random()<0.22) crack(); }, 900);
    amb.nodes.push({ stop: ()=>clearInterval(timer) });

    mix.connect(amb.master);
    n.start();
    amb.nodes.push(n,lp,g,mix);
  }

  function ambientCosmic(ctx){
    const mix = ctx.createGain(); mix.gain.value=1.0;
    const o1 = ctx.createOscillator(); o1.type="sine"; o1.frequency.value=55;
    const o2 = ctx.createOscillator(); o2.type="sine"; o2.frequency.value=110;
    const g1 = ctx.createGain(); g1.gain.value=0.05;
    const g2 = ctx.createGain(); g2.gain.value=0.03;

    const lfo = ctx.createOscillator(); lfo.type="sine"; lfo.frequency.value=0.03;
    const lfoG = ctx.createGain(); lfoG.gain.value=0.015;

    lfo.connect(lfoG); lfoG.connect(g1.gain);

    o1.connect(g1); o2.connect(g2);
    g1.connect(mix); g2.connect(mix);

    const sh = brownNoise(ctx);
    const hp = ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=2200; hp.Q.value=0.5;
    const ng = ctx.createGain(); ng.gain.value=0.012;
    sh.connect(hp); hp.connect(ng); ng.connect(mix);

    mix.connect(amb.master);
    o1.start(); o2.start(); lfo.start(); sh.start();
    amb.nodes.push(o1,o2,lfo,sh,hp,ng,g1,g2,lfoG,mix);
  }

  function ambientSetTheme(theme){
    const wantMute = ambientIsMuted();
    ambientEnsure();
    ambientStop();
    amb.theme = theme;
    ambientSetMuted(wantMute);
    // Não toca em temas minimalistas por padrão
    const lowpoly = ["caramel","bonfire","cthulhu","aura","viking","pirate","samurai","desert"];
    if(lowpoly.includes(theme)){
      if(theme === "caramel") ambientCafe(amb.ctx);
      else if(theme === "bonfire") ambientFire(amb.ctx);
      else if(theme === "cthulhu" || theme === "aura") ambientCosmic(amb.ctx);
      else ambientCosmic(amb.ctx);
      // fade in
      try{ amb.master.gain.setTargetAtTime(amb.muted?0.0:0.18, amb.ctx.currentTime, 0.2); }catch(_){}
    }else{
      try{ amb.master.gain.setTargetAtTime(0.0, amb.ctx.currentTime, 0.2); }catch(_){}
    }
  }

  // recebe mute do modal
  window.addEventListener("vasteria:ambient", (e)=>{
    const m = !!(e.detail && e.detail.muted);
    localStorage.setItem("vasteria_ambient_muted", m ? "1" : "0");
    ambientSetMuted(m);
  });

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
    state.theme = themeId || "";
    // reset scene state pra trocar completamente
    state.sceneState = {};
    applyWallpaper(state.theme);
    ambientSetTheme(state.theme);

  }

  function init(){
    state.canvas = ensureCanvas();
    state.ctx = state.canvas.getContext("2d", { alpha:true, desynchronized:true });
    resize();
    window.addEventListener("resize", resize);

    const onPtr = (x,y) => {
      state.ptrX = x; state.ptrY = y; state.ptrActive = true;
      // map to -1..1
      const nx = (x / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (y / Math.max(1, window.innerHeight)) * 2 - 1;
      state.parx = (-nx) * 22; // px
      state.pary = (-ny) * 18; // px
      const wp = qs("#bg-wallpaper");
      if(wp){
        wp.style.setProperty("--parx", state.parx + "px");
        wp.style.setProperty("--pary", state.pary + "px");
      }
    };
    window.addEventListener("pointermove", (e)=> onPtr(e.clientX, e.clientY), { passive:true });
    window.addEventListener("touchmove", (e)=> {
      if(e.touches && e.touches[0]) onPtr(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive:true });


    // recebe eventos do Theme.apply()
    window.addEventListener("vasteria:theme", (e) => {
      setTheme(e.detail?.theme || "");
    });

    // pega tema atual no carregamento
    setTheme(document.body.getAttribute("data-theme") || "");

    state.running = true;
    requestAnimationFrame(tick);
  }

  window.VasteriaBG = { init, setTheme };

  // auto-init
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();