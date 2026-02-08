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
    state.theme = themeId || "";
    // reset scene state pra trocar completamente
    state.sceneState = {};
  }

  function init(){
    state.canvas = ensureCanvas();
    state.ctx = state.canvas.getContext("2d", { alpha:true, desynchronized:true });
    resize();
    window.addEventListener("resize", resize);

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