/* ============ Screenshot Maker — core ============ */
(function () {
  'use strict';

  /* ---------- Export sizes (App Store phone requirements) ---------- */
  const SIZES = [
    { id: '69', label: 'iPhone 6.9"', w: 1320, h: 2868 },
    { id: '67', label: 'iPhone 6.7"', w: 1290, h: 2796 },
    { id: '65', label: 'iPhone 6.5"', w: 1284, h: 2778 },
    { id: '55', label: 'iPhone 5.5"', w: 1242, h: 2208 },
  ];

  /* ---------- Style presets ---------- */
  const PRESETS = [
    { id: 'paper',   bg: '#ece5d8', bg2: '#e3d9c6', text: '#1c1914', accent: '#b4543a' },
    { id: 'linen',   bg: '#f4efe7', bg2: '#e9e0d0', text: '#2a2118', accent: '#8a6d3b' },
    { id: 'sage',    bg: '#e6ebe0', bg2: '#d5decb', text: '#1f2a1c', accent: '#4f7942' },
    { id: 'dusk',    bg: '#e9e2ef', bg2: '#d9cfe6', text: '#241b31', accent: '#7b5ea7' },
    { id: 'ocean',   bg: '#e0eaf0', bg2: '#cbdde8', text: '#122531', accent: '#2a6f97' },
    { id: 'night',   bg: '#17151f', bg2: '#221e2e', text: '#f3eee4', accent: '#e8a87c' },
    { id: 'carbon',  bg: '#101214', bg2: '#1b1f24', text: '#eef1f4', accent: '#5eead4' },
  ];

  const DENSITY = { comfy: 0.72, tight: 0.82, xtight: 0.92 };

  /* ---------- State ---------- */
  const defaultSlide = () => ({
    img: null,             // HTMLImageElement
    caption: 'Train harder. *Rest smarter*.',
    subtitle: '',
  });

  const state = {
    slides: [defaultSlide()],
    cur: 0,
    sizeId: '67',
    captionScale: 1.0,     // 0.6..1.4
    position: 'top',
    density: 'tight',
    subPlacement: 'below',
    bg: '#ece5d8', bg2: '#e3d9c6', text: '#1c1914', accent: '#b4543a',
    presetId: 'paper',
    screenMode: 'tracker',      // 'tracker' | 'screenshot'
    timerPhase: 'work',
    tracker: {
      title: 'FULL BODY · DAY 12',
      workSec: 45, restSec: 15,
      exercises: [
        { name: 'Push-ups',       type: 'pushups',  detail: '3 × 15', done: true  },
        { name: 'Dumbbell Press', type: 'strength', detail: '4 × 10', done: false },
        { name: 'Jump Rope',      type: 'cardio',   detail: '5 min',  done: false },
      ],
    },
    callout: null,              // {x,y,w,h,zoom} in screen fractions 0..1
  };

  const $ = (s) => document.querySelector(s);
  const canvas = $('#preview');
  const ctx = canvas.getContext('2d');
  let _screen = null;           // last rendered screen area {sx,sy,sw,sh,src} for mouse mapping + zoom source

  const size = () => SIZES.find((s) => s.id === state.sizeId);
  const slide = () => state.slides[state.cur];

  /* ---------- Markup parser: *accent* + | line breaks ---------- */
  function parseMarkup(text) {
    // returns array of lines; each line = array of {t, accent}
    return text.split('|').map((line) => {
      const runs = [];
      line.trim().split(/(\*[^*]+\*)/).forEach((part) => {
        if (!part) return;
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          runs.push({ t: part.slice(1, -1), accent: true });
        } else {
          runs.push({ t: part, accent: false });
        }
      });
      return runs;
    }).filter((l) => l.length);
  }

  /* ---------- Text layout: wrap runs into lines of maxWidth ---------- */
  function layoutRuns(c, runs, maxWidth, fontFor) {
    const lines = [];
    let line = [], lineW = 0;
    runs.forEach((run) => {
      run.t.split(/(\s+)/).forEach((word) => {
        if (!word) return;
        c.font = fontFor(run.accent);
        const w = c.measureText(word).width;
        if (lineW + w > maxWidth && line.length && word.trim()) {
          lines.push(line);
          line = []; lineW = 0;
          if (!word.trim()) return; // don't lead with space
        }
        line.push({ t: word, accent: run.accent, w });
        lineW += w;
      });
    });
    if (line.length) lines.push(line);
    // trim trailing/leading whitespace tokens per line
    return lines.map((l) => {
      while (l.length && !l[0].t.trim()) l.shift();
      while (l.length && !l[l.length - 1].t.trim()) l.pop();
      return l;
    }).filter((l) => l.length);
  }

  function drawTextBlock(c, W, y, text, opts) {
    // opts: {sizePx, serif, color, accent, align:'center', italicAccent}
    const parsedLines = parseMarkup(text);
    const fontFor = (accent) => {
      const style = accent ? 'italic ' : '';
      const family = opts.serif ? "'Playfair Display', Georgia, serif" : "'Inter', sans-serif";
      const weight = opts.serif ? 600 : 600;
      return `${style}${weight} ${opts.sizePx}px ${family}`;
    };
    const maxW = W * 0.86;
    let allLines = [];
    parsedLines.forEach((runs) => {
      allLines = allLines.concat(layoutRuns(c, runs, maxW, fontFor));
    });
    const lineH = opts.sizePx * 1.18;
    allLines.forEach((line, i) => {
      let totalW = 0;
      line.forEach((tok) => { c.font = fontFor(tok.accent); totalW += c.measureText(tok.t).width; });
      let x = (W - totalW) / 2;
      line.forEach((tok) => {
        c.font = fontFor(tok.accent);
        c.fillStyle = tok.accent ? opts.accent : opts.color;
        c.textBaseline = 'alphabetic';
        c.fillText(tok.t, x, y + i * lineH);
        x += c.measureText(tok.t).width;
      });
    });
    return allLines.length * lineH;
  }

  /* ---------- Device frame ---------- */
  function roundRectPath(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ---------- Fitness tracker demo screen ---------- */
  const EX_STYLE = {
    pushups:  { chip: '#b4543a', label: 'PSH' },
    strength: { chip: '#3a2e24', label: 'STR' },
    cardio:   { chip: '#4f7942', label: 'CRD' },
  };

  function drawTrackerScreen(c, sw, sh) {
    const t = state.tracker, u = sw / 100;
    const ink = '#1c1914', grey = '#9a917f', greyD = '#6f6758', terra = '#b4543a';
    const g = c.createLinearGradient(0, 0, 0, sh);
    g.addColorStop(0, '#f7f3ea'); g.addColorStop(1, '#efe7d8');
    c.fillStyle = g; c.fillRect(0, 0, sw, sh);

    /* ---- iOS status bar: clock left · signal / wi-fi / battery 76% right ---- */
    c.fillStyle = ink;
    c.font = `600 ${u * 3.4}px 'Inter', sans-serif`;
    c.fillText('8:32', u * 9, u * 8);

    // cellular bars (4, last one dimmed)
    const sbBase = u * 8, barW = u * 1.0, barGap = u * 0.5;
    const bars = [u * 1.7, u * 2.4, u * 3.1, u * 3.8];
    const barsX = sw - u * 27;
    bars.forEach((bh, i) => {
      c.fillStyle = i < 3 ? ink : 'rgba(28,25,20,0.32)';
      roundRectPath(c, barsX + i * (barW + barGap), sbBase - bh, barW, bh, barW * 0.35);
      c.fill();
    });

    // wi-fi (3 arcs + dot)
    const wfX = sw - u * 17.6, wfY = sbBase;
    c.strokeStyle = ink; c.lineCap = 'round';
    [u * 3.1, u * 2.1, u * 1.1].forEach((r) => {
      c.lineWidth = u * 0.75;
      c.beginPath(); c.arc(wfX, wfY, r, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
    });
    c.fillStyle = ink;
    c.beginPath(); c.arc(wfX, wfY - u * 0.35, u * 0.55, 0, Math.PI * 2); c.fill();

    // battery at 76% with digits inside
    const btX = sw - u * 12.6, btY = sbBase - u * 3.6, btW = u * 8.8, btH = u * 4.4, btR = u * 1.4;
    c.strokeStyle = 'rgba(28,25,20,0.4)'; c.lineWidth = u * 0.5;
    roundRectPath(c, btX, btY, btW, btH, btR); c.stroke();
    c.fillStyle = 'rgba(28,25,20,0.4)'; // nub
    roundRectPath(c, btX + btW + u * 0.55, btY + btH * 0.3, u * 0.8, btH * 0.4, u * 0.4); c.fill();
    c.fillStyle = ink; // 76% fill
    roundRectPath(c, btX + u * 0.55, btY + u * 0.55, (btW - u * 1.1) * 0.76, btH - u * 1.1, btR * 0.55); c.fill();
    c.fillStyle = '#f7f3ea';
    c.font = `700 ${u * 2.5}px 'Inter', sans-serif`;
    c.fillText('76', btX + u * 1.4, btY + btH - u * 1.2);

    /* ---- app header: logotype + PRO · link icon + heart-rate pill ---- */
    const hdY = u * 17.5;
    c.fillStyle = ink;
    c.font = `700 ${u * 4.6}px 'Playfair Display', serif`;
    c.fillText('liftful.', u * 7, hdY);
    const logoW = c.measureText('liftful.').width;
    c.fillStyle = ink; // PRO badge
    roundRectPath(c, u * 7 + logoW + u * 2, hdY - u * 3.5, u * 8.2, u * 4.2, u * 1.2); c.fill();
    c.fillStyle = '#f7f3ea';
    c.font = `700 ${u * 2.2}px 'Inter', sans-serif`;
    c.fillText('PRO', u * 7 + logoW + u * 4, hdY - u * 0.6);

    // heart-rate pill (right)
    const plH = u * 5.8, plW = u * 27, plX = sw - u * 7 - plW, plY = hdY - u * 4.4;
    c.fillStyle = '#ffffff';
    roundRectPath(c, plX, plY, plW, plH, plH / 2); c.fill();
    c.fillStyle = terra;
    c.font = `600 ${u * 2.8}px 'Inter', sans-serif`;
    c.fillText('♥', plX + u * 2.6, plY + u * 4.1);
    c.fillStyle = greyD;
    c.font = `500 ${u * 2.3}px 'JetBrains Mono', monospace`;
    c.fillText('RHR · 56 BPM', plX + u * 6, plY + u * 3.9);
    c.fillStyle = grey;
    c.font = `600 ${u * 2.8}px 'Inter', sans-serif`;
    c.fillText('›', plX + plW - u * 2.8, plY + u * 4.1);

    // link icon (chain) left of the pill
    c.strokeStyle = grey; c.lineWidth = u * 0.6;
    c.beginPath(); c.arc(plX - u * 5, plY + u * 2.3, u * 1.1, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(plX - u * 3.8, plY + u * 3.5, u * 1.1, 0, Math.PI * 2); c.stroke();

    /* ---- headline (serif, terracotta italic accent) + subtext ---- */
    c.fillStyle = ink;
    c.font = `600 ${u * 7.4}px 'Playfair Display', serif`;
    c.fillText('What are you', u * 7, u * 31);
    c.fillStyle = terra;
    c.font = `italic 600 ${u * 7.4}px 'Playfair Display', serif`;
    c.fillText('training', u * 7, u * 39.6);
    const accW = c.measureText('training').width;
    c.fillStyle = ink;
    c.font = `600 ${u * 7.4}px 'Playfair Display', serif`;
    c.fillText(' today?', u * 7 + accW, u * 39.6);
    c.fillStyle = grey;
    c.font = `400 ${u * 3}px 'Inter', sans-serif`;
    c.fillText("Track it. We'll tell you when to rest.", u * 7, u * 45.4);

    /* ---- dark timer card (mono label top · icon square top-right · serif time) ---- */
    const isWork = state.timerPhase === 'work';
    const secs = isWork ? t.workSec : t.restSec;
    const cdX = u * 6, cdY = u * 50, cdW = sw - u * 12, cdH = u * 30;
    const cg = c.createLinearGradient(cdX, cdY, cdX + cdW, cdY + cdH);
    if (isWork) { cg.addColorStop(0, '#33261b'); cg.addColorStop(1, '#231911'); }
    else { cg.addColorStop(0, '#4f7942'); cg.addColorStop(1, '#3d6134'); }
    c.fillStyle = cg;
    roundRectPath(c, cdX, cdY, cdW, cdH, u * 5); c.fill();

    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.font = `500 ${u * 2.4}px 'JetBrains Mono', monospace`;
    c.fillText(`${isWork ? 'WORK' : 'REST'} · ${t.title}`, cdX + u * 5, cdY + u * 7);

    // icon square with progress ring
    const iqS = u * 8.4, iqX = cdX + cdW - u * 4.5 - iqS, iqY = cdY + u * 4;
    c.fillStyle = 'rgba(255,255,255,0.14)';
    roundRectPath(c, iqX, iqY, iqS, iqS, u * 2.4); c.fill();
    c.lineWidth = u * 0.8;
    c.strokeStyle = 'rgba(255,255,255,0.3)';
    c.beginPath(); c.arc(iqX + iqS / 2, iqY + iqS / 2, u * 2.5, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#faf6ec';
    c.beginPath(); c.arc(iqX + iqS / 2, iqY + iqS / 2, u * 2.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.66); c.stroke();

    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    c.fillStyle = '#faf6ec';
    c.font = `600 ${u * 6.6}px 'Playfair Display', serif`;
    c.fillText(`${mm}:${ss}`, cdX + u * 5, cdY + cdH - u * 9);
    const next = t.exercises.find((e) => !e.done);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.font = `400 ${u * 2.7}px 'Inter', sans-serif`;
    c.fillText(`${next ? 'Next: ' + next.name : 'All done'}  →`, cdX + u * 5, cdY + cdH - u * 4.2);

    /* ---- search bar (magnifier · placeholder · GO chip) ---- */
    const srX = u * 6, srY = u * 84.5, srW = sw - u * 12, srH = u * 9;
    c.fillStyle = '#ffffff';
    roundRectPath(c, srX, srY, srW, srH, srH / 2); c.fill();
    c.strokeStyle = grey; c.lineWidth = u * 0.6;
    c.beginPath(); c.arc(srX + u * 4.8, srY + srH / 2 - u * 0.4, u * 1.5, 0, Math.PI * 2); c.stroke();
    c.beginPath();
    c.moveTo(srX + u * 5.9, srY + srH / 2 + u * 0.8);
    c.lineTo(srX + u * 6.9, srY + srH / 2 + u * 1.8);
    c.stroke();
    c.fillStyle = grey;
    c.font = `400 ${u * 3}px 'Inter', sans-serif`;
    c.fillText('Type an exercise…', srX + u * 8.6, srY + srH / 2 + u * 1.1);
    c.fillStyle = '#efe7d8';
    roundRectPath(c, srX + srW - u * 9.6, srY + u * 2.2, u * 6.8, srH - u * 4.4, (srH - u * 4.4) / 2); c.fill();
    c.fillStyle = greyD;
    c.font = `600 ${u * 2.1}px 'JetBrains Mono', monospace`;
    c.fillText('GO', srX + srW - u * 7.7, srY + srH / 2 + u * 0.8);

    /* ---- section row: EXERCISES · See all ---- */
    let y = u * 100.5;
    c.fillStyle = greyD;
    c.font = `600 ${u * 2.6}px 'JetBrains Mono', monospace`;
    c.fillText('EXERCISES', u * 7, y);
    c.fillStyle = ink;
    c.font = `500 ${u * 2.7}px 'Inter', sans-serif`;
    const seeW = c.measureText('See all').width;
    c.fillText('See all', sw - u * 7 - seeW, y);

    /* ---- exercise list: one white container with dividers ---- */
    y += u * 3;
    const itemH = u * 14.5;
    const fitCount = Math.max(1, Math.min(t.exercises.length, Math.floor((sh - u * 10 - y) / itemH)));
    if (t.exercises.length) {
      c.fillStyle = '#ffffff';
      roundRectPath(c, u * 6, y, sw - u * 12, fitCount * itemH, u * 4); c.fill();
      for (let i = 0; i < fitCount; i++) {
        const ex = t.exercises[i], iy = y + i * itemH;
        if (i) {
          c.strokeStyle = 'rgba(28,25,20,0.07)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(u * 10, iy); c.lineTo(sw - u * 10, iy); c.stroke();
        }
        const st = EX_STYLE[ex.type] || EX_STYLE.strength;
        c.fillStyle = st.chip;
        roundRectPath(c, u * 9.5, iy + u * 3, u * 8.5, u * 8.5, u * 2.4); c.fill();
        c.fillStyle = '#faf6ec';
        c.font = `700 ${u * 2.1}px 'JetBrains Mono', monospace`;
        c.fillText(st.label, u * 10.6, iy + u * 8.2);
        c.fillStyle = ink;
        c.font = `600 ${u * 3.6}px 'Inter', sans-serif`;
        c.fillText(ex.name, u * 21, iy + u * 6.6);
        c.fillStyle = grey;
        c.font = `400 ${u * 2.7}px 'Inter', sans-serif`;
        c.fillText(ex.detail, u * 21, iy + u * 10.8);
        // status chip + sub label (GOOD/AVOID style)
        const chipTxt = ex.done ? '✓ DONE' : '→ GO';
        c.font = `600 ${u * 2.1}px 'JetBrains Mono', monospace`;
        const ctW = c.measureText(chipTxt).width + u * 3.2;
        const ctX = sw - u * 10 - ctW, ctY = iy + u * 3.4;
        c.fillStyle = ex.done ? 'rgba(79,121,66,0.14)' : 'rgba(180,84,58,0.12)';
        roundRectPath(c, ctX, ctY, ctW, u * 4, u * 2); c.fill();
        c.fillStyle = ex.done ? '#4f7942' : terra;
        c.fillText(chipTxt, ctX + u * 1.6, ctY + u * 2.9);
        c.fillStyle = grey;
        c.font = `400 ${u * 2.2}px 'Inter', sans-serif`;
        const tdW = c.measureText('today').width;
        c.fillText('today', sw - u * 10 - tdW, iy + u * 10.8);
      }
    }

    /* ---- iOS home indicator ---- */
    c.fillStyle = 'rgba(28,25,20,0.85)';
    roundRectPath(c, sw / 2 - u * 17, sh - u * 4, u * 34, u * 1.5, u * 0.75); c.fill();
  }

  function drawDevice(c, x, y, w, h, img, cropBottom) {
    const bezel = Math.max(10, w * 0.028);
    const outerR = w * 0.155;
    const innerR = outerR - bezel * 0.55;

    // soft shadow
    c.save();
    c.shadowColor = 'rgba(20, 16, 10, 0.38)';
    c.shadowBlur = w * 0.13;
    c.shadowOffsetY = w * 0.05;
    // body (titanium-ish frame)
    const body = c.createLinearGradient(x, y, x + w, y);
    body.addColorStop(0, '#4a4a4e');
    body.addColorStop(0.06, '#8d8d92');
    body.addColorStop(0.12, '#3a3a3e');
    body.addColorStop(0.5, '#2c2c30');
    body.addColorStop(0.88, '#3a3a3e');
    body.addColorStop(0.94, '#8d8d92');
    body.addColorStop(1, '#4a4a4e');
    c.fillStyle = body;
    roundRectPath(c, x, y, w, h, outerR);
    c.fill();
    c.restore();

    // screen area clip
    const sx = x + bezel, sy = y + bezel, sw = w - bezel * 2, sh = h - bezel * 2;
    c.save();
    roundRectPath(c, sx, sy, sw, sh, innerR);
    c.clip();

    // render screen content into an offscreen canvas — also the zoom-callout source
    const srcW = Math.max(2, Math.round(sw)), srcH = Math.max(2, Math.round(sh));
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = srcW; srcCanvas.height = srcH;
    const scc = srcCanvas.getContext('2d');
    if (state.screenMode === 'screenshot' && img) {
      // cover-fit the screenshot; if cropBottom, anchor to top
      const ir = img.width / img.height;
      const sr = srcW / srcH;
      let dw, dh, dx, dy;
      if (ir > sr) { dh = srcH; dw = dh * ir; dx = -(dw - srcW) / 2; dy = 0; }
      else { dw = srcW; dh = dw / ir; dx = 0; dy = cropBottom ? 0 : -(dh - srcH) / 2; }
      scc.drawImage(img, dx, dy, dw, dh);
    } else {
      drawTrackerScreen(scc, srcW, srcH);
    }
    c.drawImage(srcCanvas, sx, sy, sw, sh);
    _screen = { sx, sy, sw, sh, src: srcCanvas };
    // locked zones (like the reference): status bar + header + headline on top,
    // home indicator at the bottom — callout can't be drawn, moved or placed there
    if (state.screenMode === 'tracker' || !img) {
      const lu = sw / 100;
      _screen.lockTop = (lu * 47) / sh;
      _screen.lockBot = (sh - lu * 6.5) / sh;
    } else {
      _screen.lockTop = 0;
      _screen.lockBot = 1;
    }

    // dynamic island
    const diW = sw * 0.30, diH = sw * 0.088;
    const diX = sx + (sw - diW) / 2, diY = sy + sw * 0.045;
    c.fillStyle = '#000';
    roundRectPath(c, diX, diY, diW, diH, diH / 2);
    c.fill();
    c.restore();

    // subtle inner bezel highlight
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 1.4;
    roundRectPath(c, sx - bezel * 0.25, sy - bezel * 0.25, sw + bezel * 0.5, sh + bezel * 0.5, innerR + bezel * 0.25);
    c.stroke();
    c.restore();
  }

  /* ---------- Main render ---------- */
  function render(targetCtx, W, H) {
    const c = targetCtx;
    const s = slide();

    // background
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, state.bg);
    g.addColorStop(1, state.bg2);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // subtle vignette glow with accent
    const rg = c.createRadialGradient(W * 0.7, -H * 0.1, 0, W * 0.7, -H * 0.1, H * 0.9);
    rg.addColorStop(0, hexA(state.accent, 0.07));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg;
    c.fillRect(0, 0, W, H);

    const pad = W * 0.07;
    const capSize = W * 0.058 * state.captionScale;
    const subSize = capSize * 0.42;

    // measure text block height first (draw later)
    const topArea = state.position === 'top';

    // device sizing by density
    const devH = H * DENSITY[state.density];
    const devW = devH * 0.482;

    // vertical layout
    let textY, devY;
    if (topArea) {
      textY = pad + capSize;
      devY = H - devH * (state.density === 'comfy' ? 0.92 : 1) + (state.density === 'comfy' ? 0 : H * 0.02);
      // device partially out of bottom for tight modes
      devY = textY + capSize * 2.6 + (s.subtitle ? subSize * 2.2 : 0);
    } else {
      devY = -(devH * 0.06);
      textY = 0; // computed later
    }

    const devX = (W - devW) / 2;

    if (topArea) {
      // text block
      let y = pad + capSize * 0.9;
      if (s.subtitle && state.subPlacement === 'above') {
        const hSub = drawTextBlock(c, W, y, s.subtitle.toUpperCase(), {
          sizePx: subSize, serif: false, color: hexA(state.text, 0.62), accent: state.accent,
        });
        y += hSub + subSize * 0.7;
      }
      const hCap = drawTextBlock(c, W, y, s.caption, {
        sizePx: capSize, serif: true, color: state.text, accent: state.accent,
      });
      y += hCap;
      if (s.subtitle && state.subPlacement === 'below') {
        y += subSize * 0.8;
        y += drawTextBlock(c, W, y, s.subtitle.toUpperCase(), {
          sizePx: subSize, serif: false, color: hexA(state.text, 0.62), accent: state.accent,
        });
      }
      const devTop = y + H * 0.035;
      drawDevice(c, devX, devTop, devW, devH, s.img, true);
    } else {
      // device on top (cropped at top), text at bottom
      drawDevice(c, devX, -(devH * 0.08), devW, devH, s.img, false);
      let y = H - pad - capSize * 0.4;
      // draw bottom-up: measure by drawing to invisible? simpler: estimate lines then draw
      // draw subtitle below caption => it sits lowest
      const capLines = estimateLines(c, s.caption, capSize, true, W * 0.86);
      const subLines = s.subtitle ? estimateLines(c, s.subtitle.toUpperCase(), subSize, false, W * 0.86) : 0;
      const capBlockH = capLines * capSize * 1.18;
      const subBlockH = subLines * subSize * 1.18;
      let blockTop = H - pad - capBlockH - (s.subtitle ? subBlockH + subSize * 0.8 : 0);
      if (s.subtitle && state.subPlacement === 'above') {
        blockTop += 0;
        drawTextBlock(c, W, blockTop, s.subtitle.toUpperCase(), { sizePx: subSize, serif: false, color: hexA(state.text, 0.62), accent: state.accent });
        drawTextBlock(c, W, blockTop + subBlockH + subSize * 0.8, s.caption, { sizePx: capSize, serif: true, color: state.text, accent: state.accent });
      } else {
        drawTextBlock(c, W, blockTop, s.caption, { sizePx: capSize, serif: true, color: state.text, accent: state.accent });
        if (s.subtitle) {
          drawTextBlock(c, W, blockTop + capBlockH + subSize * 0.8, s.subtitle.toUpperCase(), { sizePx: subSize, serif: false, color: hexA(state.text, 0.62), accent: state.accent });
        }
      }
    }

    // zoom callout on top of everything
    drawCallout(c);
  }

  /* ---------- Zoom callout ---------- */
  function drawCallout(c) {
    const co = state.callout, scr = _screen;
    if (!co || !scr || co.w < 0.03 || co.h < 0.03) return;
    const { sx, sy, sw, sh, src } = scr;
    const rx = sx + co.x * sw, ry = sy + co.y * sh, rw = co.w * sw, rh = co.h * sh;

    // source rectangle marker
    c.strokeStyle = state.accent;
    c.lineWidth = Math.max(2, sw * 0.006);
    c.setLineDash([sw * 0.02, sw * 0.012]);
    roundRectPath(c, rx, ry, rw, rh, sw * 0.015); c.stroke();
    c.setLineDash([]);

    // inset: source size × zoom, no stretching
    let iw = rw * co.zoom, ih = rh * co.zoom;
    const maxW = sw * 0.92;
    if (iw > maxW) { ih *= maxW / iw; iw = maxW; }
    let ix = sx + (sw - iw) / 2;
    let iy = (ry + rh / 2 < sy + sh / 2) ? ry + rh + sh * 0.035 : ry - ih - sh * 0.035;
    // manual position — inset is draggable like in the reference
    if (co.ix != null) { ix = sx + co.ix * sw; iy = sy + co.iy * sh; }
    // keep the inset out of the locked zones (header/headline top, home bar bottom)
    const zTopPx = sy + (scr.lockTop ?? 0) * sh, zBotPx = sy + (scr.lockBot ?? 1) * sh;
    ix = Math.max(sx + sw * 0.01, Math.min(ix, sx + sw - iw - sw * 0.01));
    iy = Math.max(zTopPx + sh * 0.01, Math.min(iy, zBotPx - ih - sh * 0.01));
    // remember inset rect (screen fractions) for pointer hit-testing
    scr.inset = { fx: (ix - sx) / sw, fy: (iy - sy) / sh, fw: iw / sw, fh: ih / sh };

    c.save();
    c.shadowColor = 'rgba(20,16,10,0.4)';
    c.shadowBlur = sw * 0.06; c.shadowOffsetY = sw * 0.02;
    c.fillStyle = '#fff';
    roundRectPath(c, ix, iy, iw, ih, sw * 0.03); c.fill();
    c.restore();
    c.save();
    roundRectPath(c, ix, iy, iw, ih, sw * 0.03); c.clip();
    c.drawImage(src, co.x * src.width, co.y * src.height, co.w * src.width, co.h * src.height, ix, iy, iw, ih);
    c.restore();
    c.strokeStyle = state.accent;
    c.lineWidth = Math.max(2.5, sw * 0.008);
    roundRectPath(c, ix, iy, iw, ih, sw * 0.03); c.stroke();

    // corner handles — source rect
    [[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]].forEach(([hx, hy]) => {
      c.fillStyle = state.accent;
      c.beginPath(); c.arc(hx, hy, Math.max(4, sw * 0.012), 0, Math.PI * 2); c.fill();
    });
    // corner handles — inset (white fill, accent ring: resize the magnified window)
    [[ix, iy], [ix + iw, iy], [ix, iy + ih], [ix + iw, iy + ih]].forEach(([hx, hy]) => {
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(hx, hy, Math.max(4.5, sw * 0.013), 0, Math.PI * 2); c.fill();
      c.strokeStyle = state.accent;
      c.lineWidth = Math.max(2, sw * 0.006);
      c.beginPath(); c.arc(hx, hy, Math.max(4.5, sw * 0.013), 0, Math.PI * 2); c.stroke();
    });
  }

  function estimateLines(c, text, sizePx, serif, maxW) {
    const family = serif ? "'Playfair Display', Georgia, serif" : "'Inter', sans-serif";
    let count = 0;
    parseMarkup(text).forEach((runs) => {
      c.font = `600 ${sizePx}px ${family}`;
      const fontFor = () => `600 ${sizePx}px ${family}`;
      count += layoutRuns(c, runs, maxW, fontFor).length;
    });
    return count || 1;
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  /* ---------- Preview repaint ---------- */
  function repaint() {
    const { w, h } = size();
    const inner = $('.stage-inner');
    const availW = inner.clientWidth || 600;
    const availH = inner.clientHeight || 700;
    // display size: fit inside stage, keep aspect
    const fit = Math.min(availW / w, availH / h);
    const dispW = Math.round(w * fit), dispH = Math.round(h * fit);
    canvas.style.width = dispW + 'px';
    canvas.style.height = dispH + 'px';
    // internal resolution: display size × dpr (crisp on retina)
    const dpr = window.devicePixelRatio || 1;
    const scale = fit * dpr;
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    render(ctx, w, h);
    $('#sizeLabel').textContent = `${w} × ${h} · APP STORE READY`;
    $('#exportBtn').textContent = `Export ${w} × ${h} PNG`;
    $('#dropHint').classList.toggle('show', state.screenMode === 'screenshot' && !slide().img);
  }

  /* ---------- Export ---------- */
  function exportPNG(sz, slideIdx, cb) {
    const off = document.createElement('canvas');
    off.width = sz.w; off.height = sz.h;
    const oc = off.getContext('2d');
    const keep = state.cur;
    state.cur = slideIdx;
    render(oc, sz.w, sz.h);
    state.cur = keep;
    repaint(); // export render overwrote _screen — restore preview coordinates
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `screenshot-${slideIdx + 1}-${sz.w}x${sz.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      cb && cb();
    }, 'image/png');
  }

  /* ---------- Palette extraction (auto-match) ---------- */
  function extractPalette(img) {
    const c = document.createElement('canvas');
    const s = 64;
    c.width = s; c.height = s;
    const cc = c.getContext('2d');
    cc.drawImage(img, 0, 0, s, s);
    const data = cc.getImageData(0, 0, s, s).data;
    // simple frequency buckets (quantize to 4 bits/channel)
    const buckets = new Map();
    let rSum = 0, gSum = 0, bSum = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      rSum += r; gSum += g; bSum += b; n++;
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    const avg = [rSum / n, gSum / n, bSum / n];
    // most saturated frequent color -> accent
    let accent = null, bestScore = -1;
    buckets.forEach((count, key) => {
      const r = ((key >> 8) & 15) * 17, g = ((key >> 4) & 15) * 17, b = (key & 15) * 17;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      if (lum < 0.15 || lum > 0.92) return;
      if (sat < 0.25) return; // ignore near-greys: accent must be a real color
      // saturation dominates, pixel area matters only mildly
      const score = Math.pow(sat, 1.8) * Math.pow(count, 0.3);
      if (score > bestScore) { bestScore = score; accent = [r, g, b]; }
    });
    if (!accent) accent = avg;
    const avgLum = (avg[0] * 0.299 + avg[1] * 0.587 + avg[2] * 0.114) / 255;
    const dark = avgLum < 0.45;
    // bg: soft tint of avg; text: contrast
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const white = [250, 247, 240], black = [18, 16, 22];
    const bg = dark ? mix(avg, black, 0.72) : mix(avg, white, 0.82);
    const bg2 = dark ? mix(avg, black, 0.55) : mix(avg, white, 0.65);
    const text = dark ? [243, 238, 228] : [24, 20, 16];
    const hex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
    return { bg: hex(bg), bg2: hex(bg2), text: hex(text), accent: hex(mix(accent, dark ? white : black, 0.08)) };
  }

  /* ---------- Slides UI ---------- */
  function renderSlides() {
    const strip = $('#slideStrip');
    strip.innerHTML = '';
    if (state.slides.length <= 1 && !state.slides[0].img) return;
    state.slides.forEach((sl, i) => {
      const b = document.createElement('button');
      b.className = 'slide-thumb' + (i === state.cur ? ' on' : '');
      if (sl.img) b.style.backgroundImage = `url(${sl.img.src})`;
      b.title = `Slide ${i + 1}`;
      const x = document.createElement('span');
      x.className = 'x';
      x.textContent = '×';
      x.onclick = (e) => {
        e.stopPropagation();
        state.slides.splice(i, 1);
        if (!state.slides.length) state.slides = [defaultSlide()];
        state.cur = Math.min(state.cur, state.slides.length - 1);
        syncInputs(); renderSlides(); repaint();
      };
      b.appendChild(x);
      b.onclick = () => { saveInputs(); state.cur = i; syncInputs(); renderSlides(); repaint(); };
      strip.appendChild(b);
    });
    const add = document.createElement('button');
    add.className = 'slide-add';
    add.textContent = '+';
    add.title = 'Add slide';
    add.onclick = () => $('#fileInput').click();
    strip.appendChild(add);
  }

  /* ---------- Input sync ---------- */
  function saveInputs() {
    slide().caption = $('#captionInput').value;
    slide().subtitle = $('#subtitleInput').value;
  }
  function syncInputs() {
    $('#captionInput').value = slide().caption;
    $('#subtitleInput').value = slide().subtitle;
  }

  /* ---------- Image loading ---------- */
  function loadFiles(files) {
    const imgs = [...files].filter((f) => /^image\/(png|jpeg|webp)/.test(f.type));
    if (!imgs.length) return;
    let loaded = 0;
    imgs.forEach((file, idx) => {
      const img = new Image();
      img.onload = () => {
        // first file goes to current slide if empty, rest become new slides
        if (idx === 0 && !slide().img) {
          slide().img = img;
        } else {
          state.slides.push({ ...defaultSlide(), img, caption: slide().caption });
        }
        loaded++;
        if (loaded === imgs.length) {
          state.cur = state.slides.length - 1;
          if (idx === 0 && imgs.length === 1) state.cur = state.slides.indexOf(state.slides.find(s => s.img === img));
          state.screenMode = 'screenshot';
          syncSeg('screenMode');
          syncInputs(); renderSlides(); repaint();
          toast(imgs.length > 1 ? `${imgs.length} slides loaded` : 'Screenshot loaded');
        }
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /* ---------- Toast ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ---------- Build controls ---------- */
  function buildSizeRow() {
    const row = $('#sizeRow');
    SIZES.forEach((sz) => {
      const b = document.createElement('button');
      b.className = 'size-opt' + (sz.id === state.sizeId ? ' on' : '');
      b.innerHTML = `<span>${sz.label}</span><span class="dim">${sz.w} × ${sz.h}</span>`;
      b.onclick = () => {
        state.sizeId = sz.id;
        row.querySelectorAll('.size-opt').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        repaint();
      };
      row.appendChild(b);
    });
  }

  function buildPresets() {
    const row = $('#presetRow');
    PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.className = 'swatch' + (p.id === state.presetId ? ' on' : '');
      b.style.background = `linear-gradient(160deg, ${p.bg}, ${p.bg2})`;
      b.title = p.id;
      const i = document.createElement('i');
      i.style.background = p.accent;
      b.appendChild(i);
      b.onclick = () => {
        Object.assign(state, { bg: p.bg, bg2: p.bg2, text: p.text, accent: p.accent, presetId: p.id });
        row.querySelectorAll('.swatch').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        syncColorInputs();
        repaint();
      };
      row.appendChild(b);
    });
  }

  function syncColorInputs() {
    $('#bgColor').value = state.bg;
    $('#bgColor2').value = state.bg2;
    $('#textColor').value = state.text;
    $('#accentColor').value = state.accent;
  }

  /* ---------- Sync segmented control to state ---------- */
  function syncSeg(name) {
    const seg = document.querySelector(`.seg[data-seg="${name}"]`);
    if (!seg) return;
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.val === state[name]));
  }

  /* ---------- Exercises UI ---------- */
  function renderExList() {
    const box = $('#exList'); box.innerHTML = '';
    state.tracker.exercises.forEach((ex, i) => {
      const row = document.createElement('div');
      row.className = 'ex-row';
      row.innerHTML = `<i class="dot ${ex.type}"></i><span class="ex-name">${ex.name}</span><span class="ex-det">${ex.detail}</span>`;
      const done = document.createElement('button');
      done.className = 'ex-done' + (ex.done ? ' on' : '');
      done.textContent = '✓'; done.title = 'Toggle done';
      done.onclick = () => { ex.done = !ex.done; renderExList(); repaint(); };
      const del = document.createElement('button');
      del.className = 'ex-del'; del.textContent = '×'; del.title = 'Remove';
      del.onclick = () => { state.tracker.exercises.splice(i, 1); renderExList(); repaint(); };
      row.append(done, del);
      box.appendChild(row);
    });
  }

  /* ---------- Callout chip ---------- */
  function renderCalloutRow() {
    const row = $('#calloutRow'); row.innerHTML = '';
    if (!state.callout) return;
    const chip = document.createElement('div');
    chip.className = 'callout-chip';
    const label = document.createElement('span');
    label.textContent = `● Callout · ${state.callout.zoom.toFixed(2).replace(/0$/, '')}×`;
    const x = document.createElement('button');
    x.textContent = '×'; x.title = 'Remove callout';
    x.onclick = () => { state.callout = null; renderCalloutRow(); repaint(); };
    chip.append(label, x); row.appendChild(chip);
  }

  /* ---------- Callout pointer interaction ---------- */
  const clampR = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function ptFromEvent(e) {
    if (!_screen) return null;
    const r = canvas.getBoundingClientRect(), { w, h } = size();
    const px = (e.clientX - r.left) / r.width * w;
    const py = (e.clientY - r.top) / r.height * h;
    return { x: (px - _screen.sx) / _screen.sw, y: (py - _screen.sy) / _screen.sh };
  }

  let dragOp = null;

  function capture(e) {
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* synthetic events have no active pointer */ }
  }

  function wireCallout() {
    canvas.style.touchAction = 'none';

    canvas.addEventListener('pointerdown', (e) => {
      const p = ptFromEvent(e);
      if (!p || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return;
      const zT = _screen.lockTop ?? 0, zB = _screen.lockBot ?? 1;
      if (p.y < zT || p.y > zB) return; // fixed UI zones — not selectable
      const co = state.callout, tol = 0.035;
      if (co) {
        // inset is on top visually — hit-test it first
        const ins = _screen.inset;
        if (ins) {
          // inset corner handles: resize the magnified window
          const icorners = { nw: [ins.fx, ins.fy], ne: [ins.fx + ins.fw, ins.fy], sw: [ins.fx, ins.fy + ins.fh], se: [ins.fx + ins.fw, ins.fy + ins.fh] };
          for (const k in icorners) {
            if (Math.abs(p.x - icorners[k][0]) < tol && Math.abs(p.y - icorners[k][1]) < tol) {
              dragOp = { kind: 'iresize', k, ins0: { ...ins } }; capture(e); return;
            }
          }
          // grab the magnified inset — draggable like in the reference
          if (p.x > ins.fx && p.x < ins.fx + ins.fw && p.y > ins.fy && p.y < ins.fy + ins.fh) {
            dragOp = { kind: 'inset', dx: p.x - ins.fx, dy: p.y - ins.fy };
            capture(e); return;
          }
        }
        const corners = { nw: [co.x, co.y], ne: [co.x + co.w, co.y], sw: [co.x, co.y + co.h], se: [co.x + co.w, co.y + co.h] };
        for (const k in corners) {
          if (Math.abs(p.x - corners[k][0]) < tol && Math.abs(p.y - corners[k][1]) < tol) {
            dragOp = { kind: 'resize', k }; capture(e); return;
          }
        }
        if (p.x > co.x && p.x < co.x + co.w && p.y > co.y && p.y < co.y + co.h) {
          dragOp = { kind: 'move', dx: p.x - co.x, dy: p.y - co.y };
          capture(e); return;
        }
      }
      // keep a backup: an accidental click must not destroy the existing callout
      dragOp = { kind: 'draw', x0: p.x, y0: p.y, prev: co };
      state.callout = { x: p.x, y: p.y, w: 0, h: 0, zoom: (+$('#zoomAmt').value) / 100 };
      capture(e);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!dragOp) return;
      const p = ptFromEvent(e); if (!p) return;
      const co = state.callout, MIN = 0.06;
      const zT = _screen.lockTop ?? 0, zB = _screen.lockBot ?? 1;
      if (dragOp.kind === 'draw') {
        const py = clampR(p.y, zT, zB);
        co.x = clampR(Math.min(dragOp.x0, p.x), 0, 1);
        co.y = clampR(Math.min(dragOp.y0, py), zT, zB);
        co.w = clampR(Math.abs(p.x - dragOp.x0), 0, 1 - co.x);
        co.h = clampR(Math.abs(py - dragOp.y0), 0, zB - co.y);
      } else if (dragOp.kind === 'inset') {
        const ins = _screen.inset;
        co.ix = clampR(p.x - dragOp.dx, 0.01, 1 - ins.fw - 0.01);
        co.iy = clampR(p.y - dragOp.dy, zT + 0.01, zB - ins.fh - 0.01);
      } else if (dragOp.kind === 'iresize') {
        // resize the magnified window from a corner: opposite corner stays anchored
        const i0 = dragOp.ins0, k = dragOp.k;
        const ax = k.includes('w') ? i0.fx + i0.fw : i0.fx;
        const ay = k.includes('n') ? i0.fy + i0.fh : i0.fy;
        const newFw = Math.max(0.08, Math.abs(p.x - ax));
        const zoom = clampR(newFw / co.w, 1.1, 3.0);
        const fw = co.w * zoom, fh = co.h * zoom; // inset size in screen fractions
        co.zoom = zoom;
        co.ix = clampR(k.includes('w') ? ax - fw : ax, 0.01, 1 - fw - 0.01);
        co.iy = clampR(k.includes('n') ? ay - fh : ay, zT + 0.01, zB - fh - 0.01);
        $('#zoomAmt').value = Math.round(zoom * 100);
      } else if (dragOp.kind === 'move') {
        co.x = clampR(p.x - dragOp.dx, 0, 1 - co.w);
        co.y = clampR(p.y - dragOp.dy, zT, zB - co.h);
      } else {
        const x2 = co.x + co.w, y2 = co.y + co.h, k = dragOp.k;
        if (k.includes('w')) { co.x = clampR(p.x, 0, x2 - MIN); co.w = x2 - co.x; }
        if (k.includes('e')) { co.w = clampR(p.x - co.x, MIN, 1 - co.x); }
        if (k.includes('n')) { co.y = clampR(p.y, zT, y2 - MIN); co.h = y2 - co.y; }
        if (k.includes('s')) { co.h = clampR(p.y - co.y, MIN, zB - co.y); }
      }
      repaint();
    });

    canvas.addEventListener('pointerup', () => {
      if (dragOp && dragOp.kind === 'draw' && state.callout && (state.callout.w < 0.04 || state.callout.h < 0.04)) {
        // accidental click, not a rectangle — restore the previous callout instead of destroying it
        state.callout = dragOp.prev || null;
      }
      dragOp = null;
      renderCalloutRow(); repaint();
    });
  }

  /* ---------- Wire events ---------- */
  function wire() {
    $('#captionInput').addEventListener('input', () => { saveInputs(); repaint(); });
    $('#subtitleInput').addEventListener('input', () => { saveInputs(); repaint(); });
    $('#captionSize').addEventListener('input', (e) => { state.captionScale = e.target.value / 100; repaint(); });

    document.querySelectorAll('.seg').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        seg.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        state[seg.dataset.seg] = b.dataset.val;
        repaint();
      });
    });

    // exercises
    $('#exAdd').onclick = () => {
      const name = $('#exName').value.trim();
      if (!name) { toast('Type an exercise name'); return; }
      state.tracker.exercises.push({
        name, type: $('#exType').value,
        detail: $('#exDetail').value.trim() || '3 × 12', done: false,
      });
      $('#exName').value = ''; $('#exDetail').value = '';
      renderExList(); repaint();
    };
    $('#exName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#exAdd').click(); });

    // work/rest timer
    $('#workSec').addEventListener('input', (e) => { state.tracker.workSec = clampR(+e.target.value || 0, 0, 599); repaint(); });
    $('#restSec').addEventListener('input', (e) => { state.tracker.restSec = clampR(+e.target.value || 0, 0, 599); repaint(); });

    // zoom amount
    $('#zoomAmt').addEventListener('input', (e) => {
      if (state.callout) { state.callout.zoom = e.target.value / 100; repaint(); renderCalloutRow(); }
    });

    $('#pickBtn').onclick = () => $('#fileInput').click();
    $('#fileInput').addEventListener('change', (e) => { loadFiles(e.target.files); e.target.value = ''; });

    // drag & drop on stage
    const stage = $('#stage');
    ['dragenter', 'dragover'].forEach((ev) => stage.addEventListener(ev, (e) => {
      e.preventDefault();
      $('#dropHint').classList.add('show');
    }));
    stage.addEventListener('dragleave', () => $('#dropHint').classList.toggle('show', !slide().img));
    stage.addEventListener('drop', (e) => {
      e.preventDefault();
      loadFiles(e.dataTransfer.files);
    });

    // clipboard paste
    document.addEventListener('paste', (e) => {
      const items = [...(e.clipboardData?.items || [])].filter((i) => i.type.startsWith('image/'));
      if (items.length) loadFiles(items.map((i) => i.getAsFile()).filter(Boolean));
    });

    // colors
    [['bgColor', 'bg'], ['bgColor2', 'bg2'], ['textColor', 'text'], ['accentColor', 'accent']].forEach(([id, key]) => {
      $('#' + id).addEventListener('input', (e) => {
        state[key] = e.target.value;
        state.presetId = null;
        document.querySelectorAll('.swatch').forEach((x) => x.classList.remove('on'));
        repaint();
      });
    });

    // magic auto-match
    $('#magicBtn').onclick = () => {
      if (!slide().img) { toast('Load a screenshot first'); return; }
      const pal = extractPalette(slide().img);
      Object.assign(state, pal, { presetId: null });
      document.querySelectorAll('.swatch').forEach((x) => x.classList.remove('on'));
      syncColorInputs();
      repaint();
      toast('Palette matched from screenshot ✦');
    };

    // export current
    $('#exportBtn').onclick = () => {
      saveInputs();
      exportPNG(size(), state.cur, () => toast('PNG exported'));
    };

    // export all sizes (current slide) — or all slides × all sizes if multiple
    $('#exportAllBtn').onclick = () => {
      saveInputs();
      const slides = state.slides.filter((s) => s.img).length ? state.slides : [slide()];
      let queue = [];
      slides.forEach((_, si) => SIZES.forEach((sz) => queue.push([sz, si])));
      if (state.slides.length === 1) queue = SIZES.map((sz) => [sz, 0]);
      let i = 0;
      (function next() {
        if (i >= queue.length) { toast(`${queue.length} PNGs exported`); return; }
        const [sz, si] = queue[i++];
        exportPNG(sz, si, () => setTimeout(next, 350));
      })();
    };

    $('#resetBtn').onclick = () => {
      state.slides = [defaultSlide()];
      state.cur = 0;
      state.captionScale = 1; $('#captionSize').value = 100;
      const p = PRESETS[0];
      Object.assign(state, { bg: p.bg, bg2: p.bg2, text: p.text, accent: p.accent, presetId: p.id });
      state.screenMode = 'tracker';
      state.timerPhase = 'work';
      state.callout = null;
      state.tracker = {
        title: 'FULL BODY · DAY 12',
        workSec: 45, restSec: 15,
        exercises: [
          { name: 'Push-ups',       type: 'pushups',  detail: '3 × 15', done: true  },
          { name: 'Dumbbell Press', type: 'strength', detail: '4 × 10', done: false },
          { name: 'Jump Rope',      type: 'cardio',   detail: '5 min',  done: false },
        ],
      };
      $('#workSec').value = 45; $('#restSec').value = 15; $('#zoomAmt').value = 140;
      syncSeg('screenMode'); syncSeg('timerPhase');
      document.querySelectorAll('.swatch').forEach((x, i) => x.classList.toggle('on', i === 0));
      syncColorInputs(); syncInputs(); renderSlides(); renderExList(); renderCalloutRow(); repaint();
    };

    window.addEventListener('resize', repaint);
  }

  /* ---------- Init ---------- */
  buildSizeRow();
  buildPresets();
  syncColorInputs();
  syncInputs();
  renderExList();
  renderCalloutRow();
  wire();
  wireCallout();
  // wait for fonts so serif renders correctly on first paint
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(repaint);
  }
  repaint();
})();
