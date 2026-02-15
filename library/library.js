/* =========================================================
   VASTERIA GATE — BIBLIOTECA (AnyFlip-like)
   - Cards 3D (hover abre como livro)
   - Preview com 2 páginas aleatórias (canvas)
   - Viewer fullscreen com virada por drag (PageFlip)
   - Robustez: monta ao abrir a aba + fallback de PDF worker
   ========================================================= */

(function(){
  "use strict";

  var BOOKS = [
    {
      id: "dd5e",
      title: "D&D 5e sistema",
      subtitle: "Livro do Jogador",
      file: "library/books/dd5e-sistema.pdf",
    },
    {
      id: "valdas",
      title: "Valda's Spire of Secrets",
      subtitle: "Livro",
      file: "library/books/valdas-spire-of-secrets.pdf",
    }
  ];

  // CDN libs (mantém simples; com fallback de worker)
  var PDFJS_SRC    = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js";
  var PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";
  var PAGEFLIP_SRC = "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js";

  // Resolve paths correctly both locally and in deploy (subpaths/case-sensitive servers)
  function resolveUrl(rel){
    try{ return new URL(rel, document.baseURI).toString(); }
    catch(e){ return rel; }
  }

  // Quick check if a file exists on the server (helps debug deploy vs local).
  // We use a small ranged request so we don't download the whole PDF.
  async function probeUrl(url){
    try{
      if(String(location.protocol || '').toLowerCase() === 'file:') return true;
      var ctrl = new AbortController();
      var t = setTimeout(function(){ try{ ctrl.abort(); }catch(e){} }, 4500);
      var resp = await fetch(url, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-0' },
        signal: ctrl.signal,
        cache: 'no-store'
      });
      clearTimeout(t);
      return resp && (resp.status === 206 || resp.status === 200);
    }catch(e){
      return false;
    }
  }

  var state = {
    pdfjs: null,
    PageFlip: null,
    // id -> { pdf, pages } OU { promise }
    bookCache: new Map(),
    hoverTimers: new Map(),
    mounted: false,
    viewer: {
      open: false,
      book: null,
      pdf: null,
      pages: 0,
      zoom: 1.0,
      flip: null,
      rendered: new Set()
    }
  };

  function $(sel, root){ return (root||document).querySelector(sel); }
  function $$(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  function esc(s){
    s = String(s == null ? "" : s);
    return s.replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c] || c;
    });
  }

  function loadScriptOnce(src, key){
    return new Promise(function(resolve, reject){
      var existing = document.querySelector('script[data-vg-lib="'+key+'"]');
      if(existing){
        if(existing.getAttribute('data-loaded') === '1') return resolve();
        existing.addEventListener('load', function(){ resolve(); });
        existing.addEventListener('error', function(){ reject(new Error('Falha ao carregar '+src)); });
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-vg-lib', key);
      s.addEventListener('load', function(){ s.setAttribute('data-loaded','1'); resolve(); });
      s.addEventListener('error', function(){ reject(new Error('Falha ao carregar '+src)); });
      document.head.appendChild(s);
    });
  }

  async function ensureLibs(){
    if(!state.pdfjs){
      await loadScriptOnce(PDFJS_SRC, 'pdfjs');
      state.pdfjs = window.pdfjsLib;
      try{
        // pode falhar em alguns browsers por CSP; a gente faz fallback depois
        state.pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      }catch(e){}
    }
    if(!state.PageFlip){
      await loadScriptOnce(PAGEFLIP_SRC, 'pageflip');
      state.PageFlip = (window.St && window.St.PageFlip) ? window.St.PageFlip : null;
      if(!state.PageFlip){
        throw new Error('PageFlip não carregou (St.PageFlip ausente)');
      }
    }
  }

  function getPdfCached(bookId){
    var c = state.bookCache.get(bookId);
    if(!c) return null;
    if(c && c.pdf) return c;
    return c;
  }

  async function getPdf(book, onProgress){
    var cached = getPdfCached(book.id);
    if(cached && cached.pdf) return cached;
    if(cached && cached.promise) return await cached.promise;

    await ensureLibs();

    function attachProgress(task, touch){
      if(task && task.onProgress){
        task.onProgress = function(evt){
          try{ touch(); }catch(e){}
          try{ if(onProgress) onProgress(evt); }catch(e){}
        };
      }
    }

    async function loadAttempt(opts){
      // Vercel/Edge pode não lidar bem com Range/Stream em PDFs grandes.
      // Forçamos modo compatível e adicionamos watchdog (evita “carregando infinito”).
      var controller = new AbortController();
      var lastProgressAt = Date.now();
      var startedAt = Date.now();

      function touch(){ lastProgressAt = Date.now(); }

      var task = state.pdfjs.getDocument(Object.assign({
        url: resolveUrl(book.file),
        disableStream: true,
        disableRange: true,
        disableAutoFetch: false,
        signal: controller.signal
      }, opts || {}));

      attachProgress(task, touch);

      // Watchdog: sem progresso por 20s OU tempo total > 4min → aborta.
      var timer = setInterval(function(){
        var now = Date.now();
        if((now - lastProgressAt) > 20000) {
          try{ controller.abort(); }catch(e){}
        }
        if((now - startedAt) > 240000) {
          try{ controller.abort(); }catch(e){}
        }
      }, 1200);

      try{
        var pdf = await task.promise;
        clearInterval(timer);
        return pdf;
      }catch(e){
        clearInterval(timer);
        throw e;
      }
    }

    var p = (async function(){
      try{
        var pdf = await loadAttempt({ disableWorker: false });
        var out = { pdf: pdf, pages: pdf.numPages };
        state.bookCache.set(book.id, out);
        return out;
      }catch(err){
        try{
          var pdf2 = await loadAttempt({ disableWorker: true });
          var out2 = { pdf: pdf2, pages: pdf2.numPages };
          state.bookCache.set(book.id, out2);
          return out2;
        }catch(err2){
          state.bookCache.delete(book.id);
          throw err2;
        }
      }
    })();

    state.bookCache.set(book.id, { promise: p });
    return await p;
  }

  /* =========================
     SHELF (cards)
  ========================== */

  function mountShelf(panel){
    var shelf = $('#vg-lib-shelf', panel);
    if(!shelf) return;

    shelf.innerHTML = '';

    for(var i=0;i<BOOKS.length;i++){
      (function(book){
        var el = document.createElement('div');
        el.className = 'vg-book panel-skin';
        el.setAttribute('data-file', resolveUrl(book.file));
        el.setAttribute('data-book-id', book.id);
        el.innerHTML =
          '<div class="spine"></div>'+
          '<div class="page-edges"></div>'+
          '<div class="peek">'+
            '<div class="pages">'+
              '<canvas class="l"></canvas>'+
              '<canvas class="r"></canvas>'+
            '</div>'+
            '<div class="loading">passa o mouse…</div>'+
          '</div>'+
          '<div class="cover">'+
            '<div class="title">'+esc(book.title)+'</div>'+
            '<div class="sub">'+esc(book.subtitle || 'PDF')+'</div>'+
            '<div class="hint">Clique para abrir</div>'+
          '</div>';

        el.addEventListener('mouseenter', function(){ schedulePeek(el, book); });
        el.addEventListener('mouseleave', function(){ cancelPeek(el); });
        el.addEventListener('click', function(){ openViewer(book); });

        shelf.appendChild(el);
        try{ var io = ensureObserver(); if(io) io.observe(el); }catch(e){}
      })(BOOKS[i]);
    }
  }

  // Preload leve: quando o card entra na tela, testamos se o PDF existe no deploy.
  // Se não existir (muito comum quando o PDF não foi enviado pro GitHub por limite do upload web),
  // mostramos uma mensagem clara no card.
  var _io = null;
  function ensureObserver(){
    if(_io) return _io;
    if(!('IntersectionObserver' in window)) return null;
    _io = new IntersectionObserver(async function(entries){
      for(var i=0;i<entries.length;i++){
        var it = entries[i];
        if(!it.isIntersecting) continue;
        var card = it.target;
        try{ _io.unobserve(card); }catch(e){}

        var url = card.getAttribute('data-file') || '';
        var ok = await probeUrl(url);
        if(!ok){
          card.classList.add('vg-missing');
          var hint = card.querySelector('.cover .hint');
          if(hint) hint.textContent = 'PDF não encontrado no deploy';
          var sub = card.querySelector('.cover .sub');
          if(sub) sub.textContent = 'Confere se o PDF foi enviado ao GitHub (upload web tem limite).';
          var loading = card.querySelector('.peek .loading');
          if(loading){ loading.textContent = 'arquivo ausente'; loading.style.display = ''; }
        }
      }
    }, { root: null, threshold: 0.12 });
    return _io;
  }

  function schedulePeek(card, book){
    cancelPeek(card);
    var t = setTimeout(function(){ runPeek(card, book); }, 220);
    state.hoverTimers.set(card, t);
  }

  function cancelPeek(card){
    var t = state.hoverTimers.get(card);
    if(t) clearTimeout(t);
    state.hoverTimers.delete(card);
  }

  function pct(evt){
    if(!evt || !evt.loaded || !evt.total) return null;
    return Math.max(0, Math.min(100, Math.round((evt.loaded/evt.total)*100)));
  }

  async function runPeek(card, book){
    if(!card || !card.isConnected) return;
    var peek = $('.peek', card);
    if(!peek) return;
    var loading = $('.loading', peek);
    if(loading){
      loading.textContent = 'carregando…';
      loading.style.display = '';
    }

    try{
      var cached = await getPdf(book, function(evt){
        var p = pct(evt);
        if(p != null && loading){
          loading.textContent = 'baixando… ' + p + '%';
        }
      });
      var pdf = cached.pdf;
      var pages = cached.pages;

      var max = Math.min(pages, 40);
      var base = 2 + Math.floor(Math.random() * Math.max(1, (max - 2)));
      var left = base;
      var right = Math.min(pages, base + 1);

      var cL = $('canvas.l', peek);
      var cR = $('canvas.r', peek);
      await renderThumb(pdf, left, cL);
      await renderThumb(pdf, right, cR);

      card.classList.add('peek-ready');
      if(loading) loading.style.display = 'none';
    }catch(e){
      if(loading){
        loading.textContent = 'falha ao carregar';
        loading.style.display = '';
      }
    }
  }

  async function renderThumb(pdf, pageNumber, canvas){
    if(!canvas) return;
    var page = await pdf.getPage(pageNumber);
    var viewport = page.getViewport({ scale: 0.35 });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    var ctx = canvas.getContext('2d', { alpha: false });
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
  }

  /* =========================
     VIEWER (fullscreen flipbook)
  ========================== */

  function ensureViewerShell(){
    var ov = document.getElementById('vg-lib-viewer');
    if(ov) return ov;

    ov = document.createElement('div');
    ov.id = 'vg-lib-viewer';
    ov.className = 'vg-lib-viewer-overlay';
    ov.innerHTML =
      '<div class="vg-lib-viewer-top panel-skin">'+
        '<div class="left">'+
          '<button id="vg-lib-close" class="icon-btn" title="Fechar">✕</button>'+
          '<div class="meta">'+
            '<strong id="vg-lib-title">Livro</strong>'+
            '<span id="vg-lib-page">—</span>'+
          '</div>'+
        '</div>'+
        '<div class="right">'+
          '<button id="vg-lib-full" class="icon-btn" title="Tela cheia">⛶</button>'+
          '<button id="vg-lib-zoomout" class="icon-btn" title="Zoom -">−</button>'+
          '<button id="vg-lib-zoomin" class="icon-btn" title="Zoom +">+</button>'+
        '</div>'+
      '</div>'+
      '<div class="vg-lib-flip-wrap">'+
        '<div id="vg-lib-flip"></div>'+
      '</div>';

    document.body.appendChild(ov);

    $('#vg-lib-close', ov).addEventListener('click', closeViewer);
    ov.addEventListener('click', function(e){
      if(e.target === ov) closeViewer();
    });

    $('#vg-lib-zoomin', ov).addEventListener('click', function(){ setZoom(state.viewer.zoom + 0.1); });
    $('#vg-lib-zoomout', ov).addEventListener('click', function(){ setZoom(state.viewer.zoom - 0.1); });

    $('#vg-lib-full', ov).addEventListener('click', function(){
      try{
        if(!document.fullscreenElement){ ov.requestFullscreen(); }
        else { document.exitFullscreen(); }
      }catch(e){}
    });

    window.addEventListener('keydown', function(e){
      if(!state.viewer.open) return;
      if(e.key === 'Escape') closeViewer();
    });

    window.addEventListener('resize', function(){
      if(state.viewer.open) rebuildFlip();
    });

    return ov;
  }

  function setZoom(z){
    state.viewer.zoom = Math.max(0.7, Math.min(1.6, z));
    rebuildFlip();
  }

  function calcFlipSize(){
    var w = Math.min(1100, window.innerWidth - 36);
    var h = Math.min(760, window.innerHeight - 110);
    return { w: w, h: h };
  }

  async function openViewer(book){
    var ov = ensureViewerShell();
    ov.classList.add('show');
    state.viewer.open = true;
    state.viewer.book = book;

    $('#vg-lib-title', ov).textContent = book.title;
    $('#vg-lib-page', ov).textContent = 'carregando…';

    var host = document.getElementById('vg-lib-flip');
    if(host) host.innerHTML = '<div class="vg-lib-error"><strong>Carregando livro…</strong><div style="opacity:.8;margin-top:6px">Se demorar muito, é porque o navegador travou o leitor (CDN/worker) ou o PDF é muito pesado.</div></div>';

    try{
      await ensureLibs();
    }catch(e){
      showViewerError(book, 'Falha ao carregar o leitor (scripts externos bloqueados).', e);
      return;
    }

    try{
      var cached = await getPdf(book, function(evt){
        var p = pct(evt);
        if(p != null) $('#vg-lib-page', ov).textContent = 'baixando… ' + p + '%';
      });

      state.viewer.pdf = cached.pdf;
      state.viewer.pages = cached.pages;

      buildFlip();
    }catch(e2){
      showViewerError(book, 'Não consegui abrir o PDF. Pode ser Range/Stream do deploy ou download travado.', e2);
    }
  }

  function showViewerError(book, msg, err){
    var ov = document.getElementById('vg-lib-viewer');
    var host = document.getElementById('vg-lib-flip');
    var url = resolveUrl(book.file);
    if(ov){
      $('#vg-lib-title', ov).textContent = book.title;
      $('#vg-lib-page', ov).textContent = 'erro';
    }
    if(host){
      var details = '';
      try{ details = (err && err.message) ? String(err.message) : String(err||''); }catch(e){}
      host.innerHTML =
        '<div class="vg-lib-error">'
        + '<strong>'+esc(msg)+'</strong>'
        + '<div style="opacity:.85;margin-top:8px">Teste abrindo o PDF direto no navegador. Se abrir, o problema é só no leitor.</div>'
        + '<div class="actions" style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">'
        +   '<button class="icon-btn" id="vg-lib-openraw">Abrir PDF</button>'
        +   '<button class="icon-btn" id="vg-lib-retry">Tentar de novo</button>'
        + '</div>'
        + (details ? ('<div style="opacity:.6;margin-top:10px;font-size:12px">'+esc(details)+'</div>') : '')
        + '</div>';

      var b1 = document.getElementById('vg-lib-openraw');
      if(b1) b1.addEventListener('click', function(e){ e.stopPropagation(); try{ window.open(url, '_blank'); }catch(_e){} });
      var b2 = document.getElementById('vg-lib-retry');
      if(b2) b2.addEventListener('click', function(e){ e.stopPropagation(); openViewer(book); });
    }
  }

  function closeViewer(){
    var ov = document.getElementById('vg-lib-viewer');
    if(ov) ov.classList.remove('show');

    try{ if(state.viewer.flip && state.viewer.flip.destroy) state.viewer.flip.destroy(); }catch(e){}

    state.viewer.open = false;
    state.viewer.book = null;
    state.viewer.pdf = null;
    state.viewer.pages = 0;
    state.viewer.flip = null;
    state.viewer.rendered = new Set();

    var host = document.getElementById('vg-lib-flip');
    if(host) host.innerHTML = '';
  }

  function buildPageDiv(n){
    var d = document.createElement('div');
    d.className = 'vg-page';
    d.setAttribute('data-page', String(n));
    d.innerHTML = '<div class="ph">carregando…</div>';
    return d;
  }

  async function buildFlip(){
    var host = document.getElementById('vg-lib-flip');
    if(!host) return;

    host.innerHTML = '';

    var pages = state.viewer.pages;
    for(var i=1;i<=pages;i++) host.appendChild(buildPageDiv(i));

    var size = calcFlipSize();
    var w = size.w;
    var h = size.h;

    var flip = new state.PageFlip(host, {
      width:  Math.floor((w/2) * state.viewer.zoom),
      height: Math.floor(h * state.viewer.zoom),
      size: 'stretch',
      minWidth: 320,
      minHeight: 420,
      maxWidth: 1400,
      maxHeight: 900,
      showCover: true,
      mobileScrollSupport: true,
      useMouseEvents: true,
      useTouchEvents: true,
    });

    flip.loadFromHTML($$('.vg-page', host));

    flip.on('flip', function(e){
      var page = ((e && e.data) ? e.data : 0) + 1;
      updatePageLabel(page);
      renderAround(page);
    });

    state.viewer.flip = flip;

    updatePageLabel(1);
    renderAround(1);

    // animação de “abrir livro”
    try{ host.parentElement.classList.add('animate-in'); setTimeout(function(){ host.parentElement.classList.remove('animate-in'); }, 350); }catch(e){}
  }

  function rebuildFlip(){
    if(!state.viewer.open) return;

    try{ if(state.viewer.flip && state.viewer.flip.destroy) state.viewer.flip.destroy(); }catch(e){}
    state.viewer.flip = null;
    state.viewer.rendered = new Set();

    buildFlip();
  }

  function updatePageLabel(p){
    var ov = document.getElementById('vg-lib-viewer');
    if(!ov) return;
    $('#vg-lib-page', ov).textContent = 'Página ' + p + ' / ' + state.viewer.pages;
  }

  async function renderAround(page){
    var pdf = state.viewer.pdf;
    if(!pdf) return;

    var want = [page, page-1, page+1, page-2, page+2];
    for(var i=0;i<want.length;i++){
      var n = want[i];
      if(n < 1 || n > state.viewer.pages) continue;
      if(state.viewer.rendered.has(n)) continue;
      state.viewer.rendered.add(n);
      renderPageInto(n);
    }
  }

  async function renderPageInto(pageNumber){
    var host = document.getElementById('vg-lib-flip');
    if(!host) return;

    var pageEl = host.querySelector('.vg-page[data-page="'+pageNumber+'"]');
    if(!pageEl) return;

    var ph = $('.ph', pageEl);
    if(ph){ ph.textContent = 'renderizando…'; ph.style.display = ''; }

    try{
      var pdf = state.viewer.pdf;
      var page = await pdf.getPage(pageNumber);

      // cria canvas on-demand (bem mais leve)
      var canvas = pageEl.querySelector('canvas');
      if(!canvas){
        canvas = document.createElement('canvas');
        pageEl.insertBefore(canvas, pageEl.firstChild);
      }

      var size = calcFlipSize();
      var targetW = Math.floor((size.w/2) * state.viewer.zoom);
      var baseVp = page.getViewport({ scale: 1 });
      var scale = targetW / baseVp.width;
      var vp = page.getViewport({ scale: scale });

      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);

      var ctx = canvas.getContext('2d', { alpha: false });
      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      if(ph) ph.style.display = 'none';
    }catch(e){
      if(ph){ ph.textContent = 'falha ao renderizar'; ph.style.display = ''; }
    }
  }

  /* =========================
     SEARCH
  ========================== */

  function mountSearch(panel){
    var input = $('#vg-lib-search', panel);
    if(!input) return;

    input.addEventListener('input', function(){
      var q = (input.value || '').trim().toLowerCase();
      var cards = $$('.vg-book', panel);
      cards.forEach(function(c){
        var id = c.getAttribute('data-book-id');
        var book = null;
        for(var i=0;i<BOOKS.length;i++) if(BOOKS[i].id === id) book = BOOKS[i];
        var hay = ((book ? book.title : '') + ' ' + (book ? (book.subtitle||'') : '')).toLowerCase();
        c.style.display = (!q || hay.indexOf(q) !== -1) ? '' : 'none';
      });
    });
  }

  function mountWhenReady(){
    var panel = document.getElementById('library-panel');
    if(!panel) return;

    if(panel.getAttribute('data-vg-lib-mounted') === '1') return;
    panel.setAttribute('data-vg-lib-mounted', '1');

    mountShelf(panel);
    mountSearch(panel);
  }

  // expõe para o resto do app (online.js chama ao abrir a aba)
  window.VGLibrary = {
    mount: mountWhenReady,
    open: openViewer,
    books: BOOKS
  };

  // monta em vários momentos (garante que sempre aparece)
  window.addEventListener('load', function(){ mountWhenReady(); });
  window.addEventListener('DOMContentLoaded', function(){ mountWhenReady(); });
  window.addEventListener('vg:show-library', function(){ mountWhenReady(); });

})();
