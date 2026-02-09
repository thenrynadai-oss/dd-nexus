/* =========================================================
   VASTERIA GATE — BG ENGINE (CANVAS)
   - Fundo vivo e "desenhado" (NÃO slideshow)
   - Half minimal / half lowpoly (tema controla a cena)
   - NÃO interfere no layout (pointer-events:none)
   ========================================================= */

(() => {
  "use strict";

  // =========================================================
  // Parallax 2.5D (mouse/touch) — deixa o LOW POLY virar "wallpaper"
  // =========================================================
  const PAR = { x:0, y:0, tx:0, ty:0, has:false };
  let _lastW = 1, _lastH = 1;

  function clamp(v,min,max){ return v<min?min:(v>max?max:v); }

  function hookParallax(){
    // mouse
    window.addEventListener("mousemove", (e) => {
      _lastW = window.innerWidth || _lastW;
      _lastH = window.innerHeight || _lastH;
      const nx = ((e.clientX / _lastW) * 2 - 1);
      const ny = ((e.clientY / _lastH) * 2 - 1);
      PAR.tx = clamp(nx, -1, 1);
      PAR.ty = clamp(ny, -1, 1);
      PAR.has = true;
    }, { passive:true });

    // touch
    window.addEventListener("touchmove", (e) => {
      const t = e.touches && e.touches[0];
      if(!t) return;
      _lastW = window.innerWidth || _lastW;
      _lastH = window.innerHeight || _lastH;
      const nx = ((t.clientX / _lastW) * 2 - 1);
      const ny = ((t.clientY / _lastH) * 2 - 1);
      PAR.tx = clamp(nx, -1, 1);
      PAR.ty = clamp(ny, -1, 1);
      PAR.has = true;
    }, { passive:true });

    // se não mexer, fica no centro
    window.addEventListener("mouseleave", () => {
      PAR.tx = 0; PAR.ty = 0; PAR.has = false;
    }, { passive:true });
  }

  function stepParallax(){
    // smoothing
    PAR.x += (PAR.tx - PAR.x) * 0.06;
    PAR.y += (PAR.ty - PAR.y) * 0.06;
  }

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

    function drawMesh(ctx, tris, palette, t, parallax=0.0, alpha=0.55, pointerDepth=1.0){
    // compat: drawMesh(ctx,tris,palette,t,{parallax,alpha,pointerDepth})
    if(typeof parallax === "object" && parallax){
      const o = parallax;
      parallax = o.parallax ?? 0.0;
      alpha = o.alpha ?? alpha;
      pointerDepth = o.pointerDepth ?? pointerDepth;
    }

    ctx.save();

    // drift "vivo"
    const dx = Math.sin(t*0.0002)*parallax;
    const dy = Math.cos(t*0.00017)*parallax;

    // parallax 2.5D (mouse/touch)
    const px = (PAR.x || 0) * parallax * 0.85 * pointerDepth;
    const py = (PAR.y || 0) * parallax * 0.85 * pointerDepth;

    ctx.translate(dx + px, dy + py);

    for(let i=0;i<tris.length;i++){
      const tri = tris[i];
      const n = (i*9973) % 1000 / 1000;
      const base = lerpColor(palette.bg1, palette.bg3, n);
      const c = lerpColor(base, palette.bg2, 0.25 + 0.25*Math.sin((i*0.2)+(t*0.00035)));
      ctx.fillStyle = rgba(c, alpha);
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
  // Wallpaper LOW POLY 2.5D — 3 camadas (far/mid/near)
  // Usado por TODOS os temas kind:"lowpoly"
  // =========================================================
  function ensureWallpaper(state, w,h, cell=260){
    if(!state.wp || state.wp.w!==w || state.wp.h!==h || state.wp.cell!==cell){
      state.wp = {
        w,h,cell,
        far:  makeMesh(w,h, Math.round(cell*1.35), 0.22),
        mid:  makeMesh(w,h, Math.round(cell*1.00), 0.30),
        near: makeMesh(w,h, Math.round(cell*0.78), 0.36),
      };
    }
  }

  function drawLowPolyWallpaper(state, ctx, palette, w,h, t, opts={}){
    const cell = opts.cell || 260;
    const strength = opts.strength || 22;
    ensureWallpaper(state, w,h, cell);

    // 3 layers com profundidades diferentes
    drawMesh(ctx, state.wp.far, palette, t, { parallax: strength*0.35, alpha: 0.22, pointerDepth: 0.55 });
    drawMesh(ctx, state.wp.mid, palette, t, { parallax: strength*0.62, alpha: 0.26, pointerDepth: 0.85 });
    drawMesh(ctx, state.wp.near, palette, t, { parallax: strength*0.95, alpha: 0.30, pointerDepth: 1.10 });

    // leve vinheta p/ dar cara de wallpaper
    const g = ctx.createRadialGradient(w*0.5, h*0.4, Math.min(w,h)*0.15, w*0.5, h*0.5, Math.max(w,h)*0.75);
    g.addColorStop(0, "rgba(0,0,0,0.00)");
    g.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
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

  function sceneDawnAura(state, ctx, palette, w,h, t){
    // Amanhecer low poly: céu -> sol -> aurora -> montanhas + partículas "estelares"
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 240, 0.32);
      state.stars = Array.from({length:140}).map(()=> ({
        x:Math.random()*w,
        y:Math.random()*h*0.55,
        r:0.6 + Math.random()*1.8,
        a:0.05 + Math.random()*0.25,
        sp:0.15 + Math.random()*0.45,
        ph:Math.random()*Math.PI*2
      }));
      state.dust = makeParticles(90, w,h);
      // ribbons de aurora (3 faixas)
      state.ribbons = [0,1,2].map(i=>({
        y:h*(0.22 + i*0.08),
        amp: 18 + i*10,
        sp:  0.0008 + i*0.00035,
        off: Math.random()*Math.PI*2
      }));
      state.w=w; state.h=h;
    }

    // Base mesh (triangulação suave)
    drawLowPolyWallpaper(state, ctx, palette, w,h, t, {cell: 300, strength: 36});

    ctx.save();

    // Gradiente de céu (noite -> dourado)
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0, rgba(palette.bg1, 0.35));
    sky.addColorStop(0.45, rgba(palette.bg2, 0.22));
    sky.addColorStop(1, rgba(palette.bg2, 0.55));
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,w,h);

    // Estrelas (somem devagar)
    const fade = clamp(1 - ( (Math.sin(t*0.00018)+1)/2 )*0.65, 0.1, 1);
    for(const s of state.stars){
      const tw = (Math.sin(t*s.sp*0.001 + s.ph)+1)/2;
      const a = s.a * (0.35 + tw*0.65) * fade;
      ctx.fillStyle = rgba(palette.accent, a);
      ctx.beginPath();
      ctx.arc(s.x, s.y + Math.sin(t*0.0004+s.ph)*0.8, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // Sol + glow
    const sunX = w*0.72;
    const sunY = h*0.34 + Math.sin(t*0.00025)*4;
    const sunR = Math.min(w,h)*0.10;
    const g = ctx.createRadialGradient(sunX, sunY, 1, sunX, sunY, sunR*2.6);
    g.addColorStop(0, rgba(palette.accent, 0.42));
    g.addColorStop(0.35, rgba(palette.accent, 0.18));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    ctx.fillStyle = rgba(palette.accent, 0.25);
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI*2);
    ctx.fill();

    // Aurora ribbons
    ctx.globalCompositeOperation = "lighter";
    for(const r of state.ribbons){
      const y0 = r.y + Math.sin(t*r.sp + r.off)*14;
      const grad = ctx.createLinearGradient(0, y0-60, 0, y0+60);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.35, rgba(palette.accent, 0.10));
      grad.addColorStop(0.55, rgba(lerpColor(palette.accent, "#ffffff", 0.25), 0.12));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 48;
      ctx.lineCap = "round";
      ctx.beginPath();
      for(let x= -40; x<=w+40; x+=40){
        const y = y0 + Math.sin((x*0.008)+t*0.0012+r.off)*r.amp;
        if(x<0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    // Montanhas low poly (parallax)
    const mountain = (baseY, col, amp, spd) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, h);
      let x=0;
      while(x<=w+120){
        const y = baseY + Math.sin((x*0.012)+t*spd)*amp;
        ctx.lineTo(x, y);
        x += 120;
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };
    mountain(h*0.62, "rgba(0,0,0,0.25)", 22, 0.00035);
    mountain(h*0.70, "rgba(0,0,0,0.35)", 18, 0.00028);
    mountain(h*0.78, "rgba(0,0,0,0.45)", 14, 0.00022);

    // Poeira estelar (particles)
    drawParticles(ctx, state.dust, palette, w,h, t, "dust");

    // Vinheta suave
    const v = ctx.createRadialGradient(w*0.5, h*0.45, 20, w*0.5, h*0.45, Math.max(w,h)*0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.26)");
    ctx.fillStyle = v;
    ctx.fillRect(0,0,w,h);

    ctx.restore();
  }



  function sceneCafe(state, ctx, palette, w,h, t){
    // CAFETERIA LOW POLY (mais "desenhado"): janela, letreiro, balcão, gente na rua e vapor volumétrico
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 260, 0.30);
      state.parts = makeParticles(70, w,h);

      // pessoas passando (rua fora da janela) + pessoas internas
      state.people = Array.from({length:7}).map(()=>({
        x:Math.random()*w,
        y:h*0.56 + Math.random()*h*0.14,
        s:0.65 + Math.random()*0.7,
        dir: Math.random()>0.5 ? 1 : -1,
        sp: 0.22 + Math.random()*0.42,
        coat: Math.random()*0.6
      }));

      // vapor "puff" (xícaras) + trilhas
      state.steam = Array.from({length:26}).map(()=> ({
        x:w*(0.22 + Math.random()*0.56),
        y:h*(0.63 + Math.random()*0.18),
        off:Math.random()*Math.PI*2,
        r: 10 + Math.random()*18
      }));

      // luminárias penduradas
      state.lamps = Array.from({length:4}).map((_,i)=>({
        x:w*(0.28 + i*0.15),
        y:h*(0.14 + Math.random()*0.04),
        ph:Math.random()*Math.PI*2
      }));

      // reflexos na janela
      state.ref = Array.from({length:12}).map(()=>({
        x:Math.random()*w,
        y:Math.random()*h*0.45,
        w:40+Math.random()*120,
        a:0.04+Math.random()*0.08,
        sp:0.12+Math.random()*0.32
      }));

      state.w=w; state.h=h;
    }

    // base triangular (quente)
    drawLowPolyWallpaper(state, ctx, palette, w,h, t, {cell: 280, strength: 30});

    ctx.save();

    // Paredes / interior
    const wall = ctx.createLinearGradient(0,0,0,h);
    wall.addColorStop(0, rgba(palette.bg2, 0.30));
    wall.addColorStop(1, rgba(palette.bg1, 0.55));
    ctx.fillStyle = wall;
    ctx.fillRect(0,0,w,h);

    // Janela grande (rua)
    const wx=w*0.10, wy=h*0.12, ww=w*0.80, wh=h*0.38;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.roundRect(wx, wy, ww, wh, 18);
    ctx.fill();

    // Rua: faixa de luz passando (parallax)
    const street = ctx.createLinearGradient(0, wy, 0, wy+wh);
    street.addColorStop(0, "rgba(10,10,10,0.10)");
    street.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = street;
    ctx.beginPath();
    ctx.roundRect(wx+10, wy+10, ww-20, wh-20, 14);
    ctx.fill();

    // Pessoas passando na rua (silhueta simplificada)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(wx+12, wy+12, ww-24, wh-24, 12);
    ctx.clip();
    for(const p of state.people){
      p.x += p.dir * p.sp;
      if(p.x > w+60) p.x = -60;
      if(p.x < -60) p.x = w+60;

      const px = p.x;
      const py = p.y + Math.sin((t*0.002)+px*0.008)*2;

      // corpo
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.beginPath();
      ctx.roundRect(px-10*p.s, py-30*p.s, 20*p.s, 34*p.s, 8*p.s);
      ctx.fill();
      // casaco
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.roundRect(px-11*p.s, py-18*p.s, 22*p.s, 22*p.s*(0.9+p.coat), 8*p.s);
      ctx.fill();
      // cabeça
      ctx.fillStyle = "rgba(0,0,0,0.44)";
      ctx.beginPath();
      ctx.arc(px, py-38*p.s, 9.5*p.s, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    // Reflexos na janela (streaks)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for(const r of state.ref){
      const rx = (r.x + t*r.sp*0.06) % (w+200) - 100;
      const ry = r.y + Math.sin(t*0.0008+r.x*0.01)*4;
      ctx.fillStyle = `rgba(255,255,255,${r.a})`;
      ctx.beginPath();
      ctx.roundRect(rx, ry, r.w, 10, 8);
      ctx.fill();
    }
    ctx.restore();

    // Moldura da janela
    ctx.strokeStyle = rgba(palette.accent, 0.26);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(wx, wy, ww, wh, 18);
    ctx.stroke();

    // Letreiro "CAFÉ" com glow e flicker
    const flick = 0.85 + (Math.sin(t*0.004)+1)/2*0.15;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.font = "900 44px Outfit, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = rgba(palette.accent, 0.22*flick);
    ctx.fillText("CAFÉ", w*0.15+2, h*0.105+2);
    ctx.fillStyle = rgba(palette.accent, 0.55*flick);
    ctx.fillText("CAFÉ", w*0.15, h*0.105);
    ctx.restore();

    // Luminárias penduradas (sway + cone de luz)
    for(const L of state.lamps){
      const sway = Math.sin(t*0.0012 + L.ph)*10;
      const lx = L.x + sway;
      const ly = L.y;

      // fio
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(L.x, 0);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      // corpo da lâmpada
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.roundRect(lx-14, ly-6, 28, 18, 8);
      ctx.fill();

      // luz
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const cone = ctx.createRadialGradient(lx, ly+18, 5, lx, ly+18, 140);
      cone.addColorStop(0, rgba(palette.accent, 0.18));
      cone.addColorStop(0.45, rgba(palette.accent, 0.06));
      cone.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(lx-22, ly+14);
      ctx.lineTo(lx+22, ly+14);
      ctx.lineTo(lx+120, ly+180);
      ctx.lineTo(lx-120, ly+180);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Chão (perspectiva)
    const floor = ctx.createLinearGradient(0, h*0.55, 0, h);
    floor.addColorStop(0, rgba(palette.bg2, 0.15));
    floor.addColorStop(1, rgba(palette.bg1, 0.62));
    ctx.fillStyle = floor;
    ctx.fillRect(0, h*0.52, w, h*0.48);

    // linhas do piso
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for(let i=0;i<16;i++){
      const yy = h*0.60 + i*18;
      ctx.beginPath();
      ctx.moveTo(w*0.15, yy);
      ctx.lineTo(w*0.85, yy + i*2);
      ctx.stroke();
    }

    // Balcão (trapezoide)
    ctx.fillStyle = rgba(lerpColor(palette.bg2, palette.accent, 0.25), 0.24);
    ctx.beginPath();
    ctx.moveTo(w*0.10, h*0.62);
    ctx.lineTo(w*0.70, h*0.62);
    ctx.lineTo(w*0.82, h*0.82);
    ctx.lineTo(w*0.18, h*0.82);
    ctx.closePath();
    ctx.fill();

    // Detalhe do balcão
    ctx.strokeStyle = rgba(palette.accent, 0.14);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w*0.12, h*0.66);
    ctx.lineTo(w*0.72, h*0.66);
    ctx.stroke();

    // Xícaras + vapor
    for(let i=0;i<4;i++){
      const cx = w*(0.24 + i*0.12);
      const cy = h*0.69;

      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.strokeStyle = rgba(palette.accent, 0.34);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx-18, cy-12, 36, 22, 8);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx+22, cy-2, 8, -Math.PI/2, Math.PI/2);
      ctx.stroke();
    }

    // Vapor volumétrico (puffs)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for(const s of state.steam){
      const x = s.x + Math.sin(t*0.001 + s.off)*10;
      const y = s.y;
      const puff = ctx.createRadialGradient(x, y-40, 4, x, y-40, s.r);
      puff.addColorStop(0, rgba(palette.accent, 0.10));
      puff.addColorStop(0.35, rgba("#ffffff", 0.04));
      puff.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = puff;
      ctx.beginPath();
      ctx.arc(x, y-40 + Math.sin(t*0.0015+s.off)*6, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    // partículas (poeira / brilho)
    drawParticles(ctx, state.parts, palette, w,h, t, "dust");

    // vinheta quente
    const v = ctx.createRadialGradient(w*0.5, h*0.45, 30, w*0.5, h*0.45, Math.max(w,h)*0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = v;
    ctx.fillRect(0,0,w,h);

    ctx.restore();
  }

  function sceneBonfire(state, ctx, palette, w,h, t){
    // BONFIRE LOW POLY (souls): espada, fogo, brasas, ruínas e cinzas
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 260, 0.33);
      state.embers = Array.from({length:70}).map(()=>({
        x:Math.random()*w,
        y:h*0.55 + Math.random()*h*0.45,
        vy:0.35+Math.random()*1.1,
        vx:(Math.random()*2-1)*0.25,
        a:0.08+Math.random()*0.25,
        r:1+Math.random()*3.5,
        ph:Math.random()*Math.PI*2
      }));
      state.ash = makeParticles(90, w,h);
      state.w=w; state.h=h;
    }

    drawLowPolyWallpaper(state, ctx, palette, w,h, t, {cell: 280, strength: 30});

    ctx.save();

    // céu escuro
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0, "rgba(0,0,0,0.40)");
    sky.addColorStop(1, "rgba(0,0,0,0.70)");
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,w,h);

    // ruínas ao fundo
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    for(let i=0;i<7;i++){
      const x = w*(0.05 + i*0.14);
      const hh = h*(0.18 + Math.random()*0.14);
      ctx.beginPath();
      ctx.roundRect(x, h*0.42-hh, w*0.08, hh, 8);
      ctx.fill();
    }

    // chão
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, h*0.62, w, h*0.38);

    // espada cravada
    ctx.strokeStyle = rgba(palette.accent, 0.20);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w*0.52, h*0.45);
    ctx.lineTo(w*0.48, h*0.78);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(w*0.45, h*0.62);
    ctx.lineTo(w*0.55, h*0.62);
    ctx.stroke();

    // fogo (triângulos low poly) + glow
    const fx = w*0.50;
    const fy = h*0.72;
    const flick = 0.8 + (Math.sin(t*0.01)+1)/2*0.2;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(fx, fy, 10, fx, fy, 220);
    glow.addColorStop(0, rgba(palette.accent, 0.18*flick));
    glow.addColorStop(0.45, rgba(palette.accent, 0.08*flick));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,w,h);
    ctx.restore();

    ctx.fillStyle = rgba(palette.accent, 0.16*flick);
    for(let i=0;i<7;i++){
      const a = i/7;
      ctx.beginPath();
      ctx.moveTo(fx-40+Math.random()*10, fy+20);
      ctx.lineTo(fx, fy-110*a - Math.random()*12);
      ctx.lineTo(fx+40-Math.random()*10, fy+20);
      ctx.closePath();
      ctx.fill();
    }

    // brasas subindo
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    for(const e of state.embers){
      e.y -= e.vy;
      e.x += e.vx + Math.sin(t*0.002 + e.ph)*0.15;
      if(e.y < h*0.20){
        e.y = h*0.78 + Math.random()*h*0.15;
        e.x = fx + (Math.random()*2-1)*70;
      }
      ctx.fillStyle = rgba(palette.accent, e.a*(0.6+flick*0.4));
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    // cinzas / poeira
    drawParticles(ctx, state.ash, palette, w,h, t, "snow");

    // vinheta
    const v = ctx.createRadialGradient(w*0.5, h*0.62, 30, w*0.5, h*0.62, Math.max(w,h)*0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = v;
    ctx.fillRect(0,0,w,h);

    ctx.restore();
  }

  function sceneViking(state, ctx, palette, w,h, t){
    // VIKING LOW POLY: fiorde, montanhas, aurora e barco balançando
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 260, 0.33);
      state.snow = Array.from({length:120}).map(()=>({
        x:Math.random()*w, y:Math.random()*h,
        vy:0.35+Math.random()*1.2,
        vx:-0.15+Math.random()*0.35,
        r:0.7+Math.random()*2.2,
        a:0.03+Math.random()*0.12,
        ph:Math.random()*Math.PI*2
      }));
      state.w=w; state.h=h;
    }
    drawLowPolyWallpaper(state, ctx, palette, w,h, t, {cell: 300, strength: 32});

    ctx.save();

    // céu frio
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0, rgba(palette.bg2, 0.30));
    sky.addColorStop(0.6, "rgba(0,0,0,0.35)");
    sky.addColorStop(1, "rgba(0,0,0,0.60)");
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,w,h);

    // aurora ribbon
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for(let i=0;i<2;i++){
      const y0 = h*(0.18+i*0.10) + Math.sin(t*0.0012+i)*18;
      const grad = ctx.createLinearGradient(0, y0-80, 0, y0+80);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.5, rgba(palette.accent, 0.10));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 56;
      ctx.lineCap = "round";
      ctx.beginPath();
      for(let x=-60;x<=w+60;x+=50){
        const y = y0 + Math.sin(x*0.01 + t*0.0016+i)*24;
        if(x<0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // montanhas low poly
    const mount = (baseY, col, step, amp, sp) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0,h);
      for(let x=0;x<=w+step;x+=step){
        const y = baseY + Math.sin(x*0.01 + t*sp)*amp;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(w,h);
      ctx.closePath();
      ctx.fill();
    };
    mount(h*0.55, "rgba(0,0,0,0.35)", 120, 18, 0.00025);
    mount(h*0.62, "rgba(0,0,0,0.45)", 100, 14, 0.00020);
    mount(h*0.70, "rgba(0,0,0,0.55)", 90,  10, 0.00016);

    // fiorde (água)
    const sea = ctx.createLinearGradient(0,h*0.72,0,h);
    sea.addColorStop(0, rgba(palette.bg1, 0.35));
    sea.addColorStop(1, "rgba(0,0,0,0.70)");
    ctx.fillStyle = sea;
    ctx.fillRect(0, h*0.72, w, h*0.28);

    // ondas suaves
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    for(let i=0;i<6;i++){
      const yy = h*(0.78+i*0.04);
      ctx.beginPath();
      for(let x=0;x<=w;x+=40){
        const y = yy + Math.sin(x*0.02 + t*0.002 + i)*4;
        if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    // barco viking (bobbing)
    const bx = w*0.62;
    const by = h*0.79 + Math.sin(t*0.002)*6;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.moveTo(bx-90, by);
    ctx.quadraticCurveTo(bx, by+35, bx+90, by);
    ctx.lineTo(bx+70, by+25);
    ctx.quadraticCurveTo(bx, by+45, bx-70, by+25);
    ctx.closePath();
    ctx.fill();

    // vela
    ctx.strokeStyle = rgba(palette.accent, 0.20);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx, by-80);
    ctx.lineTo(bx, by+10);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(bx, by-80);
    ctx.lineTo(bx+55, by-20);
    ctx.lineTo(bx, by-20);
    ctx.closePath();
    ctx.fill();

    // neve
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    for(const s of state.snow){
      s.y += s.vy;
      s.x += s.vx + Math.sin(t*0.001+s.ph)*0.10;
      if(s.y>h+10){ s.y=-10; s.x=Math.random()*w; }
      if(s.x<-10) s.x=w+10;
      if(s.x>w+10) s.x=-10;
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }

  function sceneCthulhu(state, ctx, palette, w,h, t){
    // CTHULHU IMPERADOR LOW POLY + GALÁXIA — tentáculos, runas, bolhas e olhos brilhando
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 280, 0.34);

      state.bubbles = Array.from({length:90}).map(()=> ({
        x:Math.random()*w,
        y:h + Math.random()*h,
        vy:0.25 + Math.random()*0.85,
        r:2 + Math.random()*11,
        a:0.04 + Math.random()*0.18,
        wob:Math.random()*Math.PI*2
      }));

      state.stars = Array.from({length:120}).map(()=>({
        x:Math.random()*w,
        y:Math.random()*h*0.55,
        r:0.6+Math.random()*1.6,
        a:0.05+Math.random()*0.22,
        ph:Math.random()*Math.PI*2,
        sp:0.0003 + Math.random()*0.0006
      }));

      state.runes = Array.from({length:26}).map(()=>({
        a: Math.random()*Math.PI*2,
        r: 120 + Math.random()*260,
        s: 0.6 + Math.random()*0.9,
        sp: 0.00035 + Math.random()*0.00055
      }));

      state.w=w; state.h=h;
    }

    drawLowPolyWallpaper(state, ctx, palette, w,h, t, {cell: 320, strength: 34});

    ctx.save();

    // GALÁXIA no fundo
    const gx = w*0.62;
    const gy = h*0.30;
    const gr = Math.max(w,h)*0.55;
    const gal = ctx.createRadialGradient(gx,gy, 10, gx,gy, gr);
    gal.addColorStop(0, rgba(lerpColor(palette.accent, "#ffffff", 0.25), 0.18));
    gal.addColorStop(0.25, rgba(palette.accent, 0.10));
    gal.addColorStop(0.55, "rgba(80,0,120,0.06)");
    gal.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gal;
    ctx.fillRect(0,0,w,h);

    // estrelas
    for(const s of state.stars){
      const tw = (Math.sin(t*s.sp + s.ph)+1)/2;
      ctx.fillStyle = rgba(palette.accent, s.a*(0.35+tw*0.65));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // runas orbitando
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.font = "700 18px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for(const r of state.runes){
      const ang = r.a + t*r.sp;
      const x = gx + Math.cos(ang)*r.r;
      const y = gy + Math.sin(ang)*r.r*0.55;
      const a = 0.05 + (Math.sin(ang*2)+1)/2*0.08;
      ctx.fillStyle = rgba(palette.accent, a);
      ctx.fillText("✶", x, y);
      ctx.fillText("⟡", x+12*r.s, y-10*r.s);
    }
    ctx.restore();

    // TRONO
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.moveTo(w*0.22, h*0.78);
    ctx.lineTo(w*0.78, h*0.78);
    ctx.lineTo(w*0.70, h*0.98);
    ctx.lineTo(w*0.30, h*0.98);
    ctx.closePath();
    ctx.fill();

    // encosto do trono
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.moveTo(w*0.36, h*0.78);
    ctx.lineTo(w*0.64, h*0.78);
    ctx.lineTo(w*0.62, h*0.42);
    ctx.lineTo(w*0.38, h*0.42);
    ctx.closePath();
    ctx.fill();

    // Cthulhu (corpo + cabeça)
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.moveTo(w*0.46, h*0.78);
    ctx.lineTo(w*0.54, h*0.78);
    ctx.lineTo(w*0.58, h*0.56);
    ctx.lineTo(w*0.50, h*0.46);
    ctx.lineTo(w*0.42, h*0.56);
    ctx.closePath();
    ctx.fill();

    // cabeça
    const headX = w*0.50, headY = h*0.42;
    ctx.beginPath();
    ctx.arc(headX, headY, w*0.055, 0, Math.PI*2);
    ctx.fill();

    // coroa
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(palette.accent, 0.22);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX-w*0.06, headY-w*0.06);
    ctx.lineTo(headX-w*0.02, headY-w*0.09);
    ctx.lineTo(headX,       headY-w*0.06);
    ctx.lineTo(headX+w*0.02, headY-w*0.09);
    ctx.lineTo(headX+w*0.06, headY-w*0.06);
    ctx.stroke();
    ctx.restore();

    // olhos glow
    const eyeGlow = ctx.createRadialGradient(headX, headY, 2, headX, headY, 70);
    eyeGlow.addColorStop(0, rgba(palette.accent, 0.18));
    eyeGlow.addColorStop(0.35, rgba(palette.accent, 0.08));
    eyeGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = eyeGlow;
    ctx.fillRect(0,0,w,h);

    ctx.fillStyle = rgba(palette.accent, 0.28);
    ctx.beginPath();
    ctx.arc(headX-18, headY-6, 3.6, 0, Math.PI*2);
    ctx.arc(headX+18, headY-6, 3.6, 0, Math.PI*2);
    ctx.fill();

    // TENTÁCULOS (múltiplos, com onda)
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(palette.accent, 0.07);
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    for(let i=0;i<6;i++){
      const ox = w*(0.22 + i*0.12);
      const oy = h*0.98;
      const sway = Math.sin(t*0.001 + i*0.7)*50;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.bezierCurveTo(ox-80, h*0.80, ox+60, h*0.62, ox+sway, h*0.30);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    // Bolhas subindo
    for(const b of state.bubbles){
      b.y -= b.vy;
      b.x += Math.sin(t*0.0015 + b.wob)*0.35;
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

    // vinheta
    const v = ctx.createRadialGradient(w*0.5, h*0.55, 20, w*0.5, h*0.55, Math.max(w,h)*0.70);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.40)");
    ctx.fillStyle = v;
    ctx.fillRect(0,0,w,h);

    ctx.restore();
  }

  function scenePirate(state, ctx, palette, w,h, t){
    // PIRATE LOW POLY: mar, tempestade, chuva e relâmpago
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 260, 0.34);
      state.rain = Array.from({length:180}).map(()=>({
        x:Math.random()*w, y:Math.random()*h,
        vy:4+Math.random()*7,
        vx:-1.5+Math.random()*1.2,
        a:0.03+Math.random()*0.08,
        len:10+Math.random()*22
      }));
      state.flash = 0;
      state.w=w; state.h=h;
    }

    drawLowPolyWallpaper(state, ctx, palette, w,h, t, {cell: 320, strength: 30});

    // relâmpago ocasional
    if(Math.random() < 0.003) state.flash = 1.0;

    ctx.save();

    // céu
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0, rgba(palette.bg2, 0.25));
    sky.addColorStop(1, "rgba(0,0,0,0.70)");
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,w,h);

    // flash overlay
    if(state.flash>0){
      ctx.fillStyle = `rgba(255,255,255,${0.22*state.flash})`;
      ctx.fillRect(0,0,w,h);
      state.flash *= 0.92;
    }

    // mar
    const sea = ctx.createLinearGradient(0,h*0.55,0,h);
    sea.addColorStop(0, rgba(palette.bg1, 0.25));
    sea.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = sea;
    ctx.fillRect(0,h*0.55,w,h*0.45);

    // ondas
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    for(let i=0;i<9;i++){
      const yy = h*(0.60+i*0.04);
      ctx.beginPath();
      for(let x=0;x<=w;x+=36){
        const y = yy + Math.sin(x*0.02 + t*0.002 + i)*6;
        if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    // navio (silhueta)
    const bx=w*0.42;
    const by=h*0.70 + Math.sin(t*0.002)*5;
    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.beginPath();
    ctx.moveTo(bx-110, by);
    ctx.quadraticCurveTo(bx, by+42, bx+110, by);
    ctx.lineTo(bx+90, by+30);
    ctx.quadraticCurveTo(bx, by+55, bx-90, by+30);
    ctx.closePath();
    ctx.fill();

    // mastro e vela
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bx, by-120);
    ctx.lineTo(bx, by+10);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(bx, by-120);
    ctx.lineTo(bx+70, by-55);
    ctx.lineTo(bx, by-55);
    ctx.closePath();
    ctx.fill();

    // chuva
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    for(const r of state.rain){
      r.y += r.vy;
      r.x += r.vx;
      if(r.y>h+40){ r.y=-40; r.x=Math.random()*w; }
      if(r.x<-60) r.x=w+60;
      ctx.strokeStyle = `rgba(255,255,255,${r.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + r.vx*2, r.y + r.len);
      ctx.stroke();
    }
    ctx.restore();

    // vinheta
    const v = ctx.createRadialGradient(w*0.5, h*0.5, 20, w*0.5, h*0.5, Math.max(w,h)*0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.40)");
    ctx.fillStyle = v;
    ctx.fillRect(0,0,w,h);

    ctx.restore();
  }

  function sceneSamurai(state, ctx, palette, w,h, t){
    // SAMURAI LOW POLY: torii, lanternas, névoa e pétalas
    if(!state.mesh || state.w!==w || state.h!==h){
      state.mesh = makeMesh(w,h, 250, 0.33);
      state.petals = Array.from({length:70}).map(()=>({
        x:Math.random()*w, y:Math.random()*h,
        vy:0.4+Math.random()*1.1,
        vx:-0.2+Math.random()*0.4,
        r:2+Math.random()*4,
        a:0.04+Math.random()*0.14,
        ph:Math.random()*Math.PI*2
      }));
      state.w=w; state.h=h;
    }

    drawLowPolyWallpaper(state, ctx, palette, w,h, t, {cell: 300, strength: 30});

    ctx.save();

    // céu crepúsculo
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0, rgba(palette.bg2, 0.30));
    sky.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,w,h);

    // névoa
    ctx.save();
    ctx.globalCompositeOperation="screen";
    for(let i=0;i<3;i++){
      const y = h*(0.55+i*0.08) + Math.sin(t*0.0008+i)*10;
      const fog = ctx.createRadialGradient(w*0.55, y, 10, w*0.55, y, w*0.55);
      fog.addColorStop(0, "rgba(255,255,255,0.05)");
      fog.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0,0,w,h);
    }
    ctx.restore();

    // torii
    const cx = w*0.52;
    const base = h*0.70;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(cx-120, base-160, 240, 26, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx-95, base-132, 190, 18, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx-95, base-132, 18, 170, 10);
    ctx.roundRect(cx+77, base-132, 18, 170, 10);
    ctx.fill();

    // caminho
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(cx-60, base+40);
    ctx.lineTo(cx+60, base+40);
    ctx.lineTo(cx+160, h);
    ctx.lineTo(cx-160, h);
    ctx.closePath();
    ctx.fill();

    // lanternas (glow)
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    const sway = Math.sin(t*0.0012)*6;
    for(let i=0;i<2;i++){
      const lx = cx + (i?1:-1)*90;
      const ly = base-60 + sway*(i?1:-1);
      const glow = ctx.createRadialGradient(lx, ly, 4, lx, ly, 90);
      glow.addColorStop(0, rgba(palette.accent, 0.18));
      glow.addColorStop(0.5, rgba(palette.accent, 0.06));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0,0,w,h);

      ctx.fillStyle = rgba(palette.accent, 0.12);
      ctx.beginPath();
      ctx.roundRect(lx-14, ly-14, 28, 36, 10);
      ctx.fill();
    }
    ctx.restore();

    // pétalas
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    for(const p of state.petals){
      p.y += p.vy;
      p.x += p.vx + Math.sin(t*0.001+p.ph)*0.15;
      if(p.y>h+20){ p.y=-20; p.x=Math.random()*w; }
      if(p.x<-20) p.x=w+20;
      ctx.fillStyle = `rgba(255,160,200,${p.a})`;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r*1.2, p.r, (Math.sin(t*0.002+p.ph))*0.8, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

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
    drawLowPolyWallpaper(state, ctx, palette, w,h, t, {cell: 340, strength: 26});

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
    aura: sceneDawnAura,

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
    stepParallax();
    if(!state.running) return;
    const ctx = state.ctx;
    const w = state.w, h = state.h;
    const palette = getCSSVars();

    clear(ctx,w,h,palette);

    const sceneFn = sceneMap[state.theme] || sceneGeneric;
    sceneFn(state.sceneState, ctx, palette, w,h, t);

    requestAnimationFrame(tick);
  }

  
  /* =========================================================
     ÁUDIO AMBIENTE — Engine Procedural (SEM arquivos)
     - Inicia só após primeira interação (política do navegador)
     - Mute persiste (localStorage)
     - Tema controla o "ambiente" (cafeteria, abismo, aurora…)
     ========================================================= */
  const AMBIENT_KEY = "vasteria_ambient_muted";
  const THEME_KEY = "vasteria_theme";

  const Ambient = (() => {
    let ctx = null;
    let master = null;
    let current = null; // {gain, stopAll}
    let currentTheme = "";
    let started = false;

    function isMuted(){
      return localStorage.getItem(AMBIENT_KEY) === "1";
    }

    function setMasterGain(val){
      if(!ctx || !master) return;
      master.gain.setTargetAtTime(val, ctx.currentTime, 0.05);
    }

    function ensureContext(){
      if(ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = isMuted() ? 0.0 : 0.38;
      master.connect(ctx.destination);
    }

    function resume(){
      if(!ctx) return;
      if(ctx.state === "suspended") ctx.resume().catch(()=>{});
    }

    function makeNoise(seconds=2){
      const len = Math.floor(seconds * ctx.sampleRate);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0;i<len;i++){
        data[i] = (Math.random()*2 - 1) * 0.6;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      return src;
    }

    function tone(freq, type="sine"){
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      return o;
    }

    function lfo(freq){
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      return o;
    }

    function buildScene(themeId){
      // Grupo com ganho próprio (pra fade)
      const group = ctx.createGain();
      group.gain.value = 0.0001;

      const nodes = [];
      const timeouts = [];

      function connect(node, dest){ node.connect(dest); nodes.push(node); return node; }
      function later(ms, fn){ const id=setTimeout(fn, ms); timeouts.push(id); return id; }

      // Helpers de filtros
      function lowpass(freq){
        const f = ctx.createBiquadFilter();
        f.type = "lowpass"; f.frequency.value = freq; f.Q.value = 0.7;
        return f;
      }
      function highpass(freq){
        const f = ctx.createBiquadFilter();
        f.type = "highpass"; f.frequency.value = freq; f.Q.value = 0.7;
        return f;
      }
      function bandpass(freq, q=1.2){
        const f = ctx.createBiquadFilter();
        f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
        return f;
      }

      const t0 = ctx.currentTime;

      // ===== CAFÉ & CARAMEL — cafeteria quente =====
      if(themeId === "caramel"){
        // room tone
        const hum = tone(110, "sine");
        const humGain = ctx.createGain(); humGain.gain.value = 0.03;
        connect(hum, humGain); connect(humGain, group); hum.start();

        // chatter (band noise)
        const n1 = makeNoise(2.5);
        const bp = bandpass(1200, 0.9);
        const ng = ctx.createGain(); ng.gain.value = 0.04;
        connect(n1, bp); connect(bp, ng); connect(ng, group); n1.start();

        // warm air (lowpass noise)
        const n2 = makeNoise(2.0);
        const lp = lowpass(450);
        const ng2 = ctx.createGain(); ng2.gain.value = 0.05;
        connect(n2, lp); connect(lp, ng2); connect(ng2, group); n2.start();

        // clinks ocasionais
        const scheduleClink = () => {
          if(!ctx) return;
          const now = ctx.currentTime;
          const o = tone(1200 + Math.random()*800, "triangle");
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
          o.connect(g); g.connect(group);
          o.start(now); o.stop(now + 0.14);
          later(1200 + Math.random()*2600, scheduleClink);
        };
        later(900, scheduleClink);
      }

      // ===== CTHULHU — abismo + bolhas =====
      else if(themeId === "cthulhu"){
        // Drone profundo + abismo (noise lowpass) + bolhas ocasionais
        const drone = tone(55, "sine");
        const dg = ctx.createGain(); dg.gain.value = 0.055;
        connect(drone, dg); connect(dg, group);
        drone.start();

        const abyssNoise = makeNoise(3.0);
        const lp = lowpass(260);
        const ng = ctx.createGain(); ng.gain.value = 0.085;
        connect(abyssNoise, lp); connect(lp, ng); connect(ng, group);
        abyssNoise.start();

        // bubbles
        const scheduleBubble = () => {
          const now = ctx.currentTime;
          const o = tone(160 + Math.random()*120, "sine");
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
          o.connect(g); g.connect(group);
          o.start(now); o.stop(now + 0.25);
          later(700 + Math.random()*1700, scheduleBubble);
        };
        later(600, scheduleBubble);
      }

      // ===== AURA DO AMANHECER — pad etéreo ===== — pad etéreo =====
      else if(themeId === "aura"){
        const base = tone(220, "sine");
        const fifth = tone(330, "sine");
        const g1 = ctx.createGain(); g1.gain.value = 0.03;
        const g2 = ctx.createGain(); g2.gain.value = 0.02;
        connect(base, g1); connect(fifth, g2); connect(g1, group); connect(g2, group);

        const wob = lfo(0.08);
        const wobGain = ctx.createGain(); wobGain.gain.value = 0.012;
        wob.connect(wobGain.gain);
        wobGain.connect(g1.gain);
        wob.start();

        base.start(); fifth.start();

        const airy = makeNoise(2.6);
        const hp = highpass(1600);
        const ag = ctx.createGain(); ag.gain.value = 0.02;
        connect(airy, hp); connect(hp, ag); connect(ag, group);
        airy.start();
      }

      // ===== Bonfire (souls) — crepitar leve =====
      else if(themeId === "bonfire"){
        const fire = makeNoise(1.4);
        const bp = bandpass(1200, 0.6);
        const fg = ctx.createGain(); fg.gain.value = 0.05;
        connect(fire, bp); connect(bp, fg); connect(fg, group);
        fire.start();

        const low = tone(70, "sine");
        const lg = ctx.createGain(); lg.gain.value = 0.03;
        connect(low, lg); connect(lg, group);
        low.start();
      }

      

      // ===== Viking — vento gelado + chifre distante =====
      else if(themeId === "viking"){
        // wind bed
        const wind = makeNoise(3.0);
        const hp = highpass(220);
        const lp = lowpass(1800);
        const wg = ctx.createGain(); wg.gain.value = 0.06;
        connect(wind, hp); connect(hp, lp); connect(lp, wg); connect(wg, group);
        wind.start();

        // sub rumble
        const sub = tone(48, "sine");
        const sg = ctx.createGain(); sg.gain.value = 0.02;
        connect(sub, sg); connect(sg, group); sub.start();

        // distant horn (rare)
        const scheduleHorn = () => {
          const now = ctx.currentTime;
          const o1 = tone(196 + Math.random()*40, "triangle");
          const o2 = tone(98 + Math.random()*20, "sine");
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.06, now + 0.18);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
          o1.connect(g); o2.connect(g); g.connect(group);
          o1.start(now); o2.start(now);
          o1.stop(now+3.0); o2.stop(now+3.0);
          later(12000 + Math.random()*18000, scheduleHorn);
        };
        later(4500, scheduleHorn);
      }

      // ===== Pirate — ondas + chuva + trovão distante =====
      else if(themeId === "pirate"){
        // waves (low noise)
        const waves = makeNoise(3.2);
        const lp = lowpass(520);
        const wg = ctx.createGain(); wg.gain.value = 0.075;
        connect(waves, lp); connect(lp, wg); connect(wg, group);
        waves.start();

        // rain hiss
        const rain = makeNoise(2.4);
        const hp = highpass(2200);
        const rg = ctx.createGain(); rg.gain.value = 0.02;
        connect(rain, hp); connect(hp, rg); connect(rg, group);
        rain.start();

        // wood creak pulse
        const creak = tone(92, "sine");
        const cg = ctx.createGain(); cg.gain.value = 0.018;
        connect(creak, cg); connect(cg, group); creak.start();
        const wob = lfo(0.06);
        const wobG = ctx.createGain(); wobG.gain.value = 0.012;
        wob.connect(wobG.gain); wobG.connect(cg.gain); wob.start();

        // thunder
        const scheduleThunder = () => {
          const now = ctx.currentTime;
          const th = makeNoise(1.6);
          const lp2 = lowpass(180);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
          th.connect(lp2); lp2.connect(g); g.connect(group);
          th.start(now); th.stop(now + 1.6);
          later(9000 + Math.random()*21000, scheduleThunder);
        };
        later(6500, scheduleThunder);
      }

      // ===== Samurai — vento + sinos + gong raro =====
      else if(themeId === "samurai"){
        const wind = makeNoise(2.8);
        const hp = highpass(380);
        const lp = lowpass(1400);
        const g = ctx.createGain(); g.gain.value = 0.05;
        connect(wind, hp); connect(hp, lp); connect(lp, g); connect(g, group);
        wind.start();

        // bamboo chimes
        const scheduleChime = () => {
          const now = ctx.currentTime;
          const o = tone(520 + Math.random()*600, "sine");
          const gg = ctx.createGain();
          gg.gain.setValueAtTime(0.0001, now);
          gg.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
          gg.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
          o.connect(gg); gg.connect(group);
          o.start(now); o.stop(now + 0.65);
          later(2200 + Math.random()*4500, scheduleChime);
        };
        later(1200, scheduleChime);

        // distant gong
        const scheduleGong = () => {
          const now = ctx.currentTime;
          const o = tone(180 + Math.random()*30, "triangle");
          const gg = ctx.createGain();
          gg.gain.setValueAtTime(0.0001, now);
          gg.gain.exponentialRampToValueAtTime(0.08, now + 0.06);
          gg.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
          o.connect(gg); gg.connect(group);
          o.start(now); o.stop(now + 5.0);
          later(18000 + Math.random()*24000, scheduleGong);
        };
        later(9000, scheduleGong);
      }

      // ===== Desert — vento + areia + sininho distante =====
      else if(themeId === "desert"){
        const wind = makeNoise(3.0);
        const bp = bandpass(680, 0.8);
        const g = ctx.createGain(); g.gain.value = 0.06;
        connect(wind, bp); connect(bp, g); connect(g, group);
        wind.start();

        const hiss = makeNoise(2.0);
        const hp = highpass(1800);
        const g2 = ctx.createGain(); g2.gain.value = 0.018;
        connect(hiss, hp); connect(hp, g2); connect(g2, group);
        hiss.start();

        const scheduleBell = () => {
          const now = ctx.currentTime;
          const o = tone(880 + Math.random()*220, "sine");
          const gg = ctx.createGain();
          gg.gain.setValueAtTime(0.0001, now);
          gg.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
          gg.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
          o.connect(gg); gg.connect(group);
          o.start(now); o.stop(now + 1.05);
          later(8000 + Math.random()*14000, scheduleBell);
        };
        later(4000, scheduleBell);
      }

// ===== Padrão: ambiente quase silencioso =====
      else {
        const n = makeNoise(2.2);
        const lp = lowpass(220);
        const g = ctx.createGain(); g.gain.value = 0.015;
        connect(n, lp); connect(lp, g); connect(g, group);
        n.start();
      }

      // Fade-in
      group.gain.setValueAtTime(0.0001, t0);
      group.gain.exponentialRampToValueAtTime(1.0, t0 + 0.5);

      group.connect(master);

      function stopAll(){
        const now = ctx.currentTime;
        try{
          group.gain.setValueAtTime(group.gain.value || 1.0, now);
          group.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        }catch(e){}
        // parar fontes após fade
        setTimeout(() => {
          timeouts.forEach(id => clearTimeout(id));
          nodes.forEach(n => {
            try{
              if(n.stop) n.stop();
            }catch(e){}
            try{
              if(n.disconnect) n.disconnect();
            }catch(e){}
          });
          try{ group.disconnect(); }catch(e){}
        }, 750);
      }

      return { group, stopAll };
    }

    function setTheme(themeId){
      currentTheme = themeId || currentTheme;
      if(!ctx || !master) return;
      if(current) current.stopAll();
      current = buildScene(currentTheme);
    }

    function setMuted(muted){
      localStorage.setItem(AMBIENT_KEY, muted ? "1" : "0");
      if(!ctx || !master) return;
      setMasterGain(muted ? 0.0 : 0.38);
    }

    function userStart(){
      if(started) {
        ensureContext(); resume();
        // garante cena atual
        if(!current){
          currentTheme = localStorage.getItem(THEME_KEY) || currentTheme || "caramel";
          setTheme(currentTheme);
        }
        return;
      }
      started = true;
      ensureContext();
      resume();
      currentTheme = localStorage.getItem(THEME_KEY) || currentTheme || "caramel";
      setTheme(currentTheme);
      // aplica mute inicial
      setMasterGain(isMuted() ? 0.0 : 0.38);
    }

    // auto: primeira interação
    const gesture = () => userStart();
    window.addEventListener("pointerdown", gesture, { once:true });
    window.addEventListener("keydown", gesture, { once:true });

    return {
      userStart,
      setTheme,
      setMuted,
      isMuted
    };
  })();

  // expõe para o Theme Modal
  window.VG_Ambient = Ambient;


function setTheme(themeId){
    state.theme = themeId || "";
    // reset scene state pra trocar completamente
    state.sceneState = {};

    // áudio ambiente acompanha o tema (se engine existir)
    try{
      if(window.VG_Ambient && typeof window.VG_Ambient.setTheme === "function"){
        window.VG_Ambient.setTheme(state.theme);
      }
    }catch(e){}
  }

  function init(){
    state.canvas = ensureCanvas();
    state.ctx = state.canvas.getContext("2d", { alpha:true, desynchronized:true });
    resize();
    window.addEventListener("resize", resize);
    hookParallax();

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