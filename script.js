/* ════════════════════════════════
   1. HARD RESET ON REFRESH
   ════════════════════════════════ */

const curtainEl   = document.getElementById('curtain-container');
const curtainText = document.getElementById('curtain-text');
const leftPanel   = curtainEl.querySelector('.curtain.left');
const rightPanel  = curtainEl.querySelector('.curtain.right');
let curtainOpened = false;

history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;

window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('needsReset', '1');
});

if (sessionStorage.getItem('needsReset')) {
  sessionStorage.removeItem('needsReset');
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
  });
}

/* ════════════════════════════════
   SCROLL LOCK MANAGER
   Locks scroll globally; per-section
   unlock happens after each section
   is fully revealed
   ════════════════════════════════ */
function lockScroll()   { document.documentElement.style.overflow = 'hidden'; }
function unlockScroll() { document.documentElement.style.overflow = 'auto';   }

/* ════════════════════════════════
   2. CURTAIN — GSAP silk ripple
   Panels sweep fully off screen
   then container is hidden entirely
   ════════════════════════════════ */

function openCurtain() {
  if (curtainOpened) return;
  curtainOpened = true;

  startMusic();
  musicBtn.classList.add('show');

  const panelW  = leftPanel.getBoundingClientRect().width;
  // slideBy = full panel width + a little extra so panels go completely off screen
  const slideBy = panelW + 20;

  // Fade hint text
  curtainText.style.transition = 'opacity 0.3s ease';
  curtainText.style.opacity    = '0';
  setTimeout(() => { curtainText.style.display = 'none'; }, 300);

  gsap.registerPlugin(CustomEase);
  CustomEase.create('silkOpen', 'M0,0 C0.02,0 0.1,0.18 0.2,0.42 0.35,0.72 0.45,0.88 0.6,0.94 0.75,1.0 0.88,1.02 1,1');

  // Add silk sheen canvas to each panel
  [leftPanel, rightPanel].forEach(panel => {
    const sheen = document.createElement('canvas');
    sheen.classList.add('curtain-canvas');
    sheen.width  = panel.offsetWidth;
    sheen.height = panel.offsetHeight;
    panel.appendChild(sheen);

    const ctx = sheen.getContext('2d');
    const w = sheen.width, h = sheen.height;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0,   'rgba(255,255,255,0)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.22)');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    [0.15, 0.30, 0.60, 0.80].forEach(xRatio => {
      const lineGrad = ctx.createLinearGradient(0, 0, 0, h);
      lineGrad.addColorStop(0,   'rgba(255,255,255,0)');
      lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
      lineGrad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = lineGrad;
      ctx.fillRect(Math.floor(xRatio * w), 0, 1, h);
    });
  });

  const tl = gsap.timeline();

  // Silk tension
  tl.to([leftPanel, rightPanel], {
    duration: 0.06, scaleX: 1.018, skewY: 0.4, ease: 'power2.in'
  }, 0);

  // Initial ripple
  tl.to(leftPanel,  { duration: 0.32, skewY: -1.2, scaleX: 0.97, filter: 'brightness(1.08)', ease: 'sine.inOut' }, 0.06);
  tl.to(rightPanel, { duration: 0.32, skewY:  1.2, scaleX: 0.97, filter: 'brightness(1.08)', ease: 'sine.inOut' }, 0.06);

  // Main silk sweep — goes completely off screen (slideBy = panelW + 20)
  tl.to(leftPanel,  { duration: 2.0, x: -slideBy, skewY: -0.5, scaleX: 0.96, filter: 'brightness(1.04)', ease: 'silkOpen' }, 0.3);
  tl.to(rightPanel, { duration: 2.0, x:  slideBy, skewY:  0.5, scaleX: 0.96, filter: 'brightness(1.04)', ease: 'silkOpen' }, 0.3);

  // Sheen pulse
  tl.to('.curtain-canvas', { opacity: 0.32, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.3);

  // Mid-sweep secondary ripple
  tl.to(leftPanel,  { duration: 0.38, skewY: -1.3, scaleX: 0.94, ease: 'sine.in'  }, 0.95);
  tl.to(leftPanel,  { duration: 0.45, skewY: -0.2, scaleX: 0.96, ease: 'sine.out' }, 1.33);
  tl.to(rightPanel, { duration: 0.38, skewY:  1.3, scaleX: 0.94, ease: 'sine.in'  }, 0.95);
  tl.to(rightPanel, { duration: 0.45, skewY:  0.2, scaleX: 0.96, ease: 'sine.out' }, 1.33);

  // Settle flat
  tl.to([leftPanel, rightPanel], {
    duration: 0.45, skewY: 0, scaleX: 1, filter: 'brightness(1)', ease: 'elastic.out(1, 0.5)'
  }, 2.1);

  // Fade out panels after they're fully off screen, then hide entire container
  tl.to([leftPanel, rightPanel], {
    duration: 0.4, opacity: 0, ease: 'power2.inOut'
  }, 2.6);

  // Hide the curtain container completely — no remnant elements on page
  tl.call(() => {
    curtainEl.classList.add('opened'); // display:none via CSS
  }, null, 3.05);

  // Unlock scroll and start content animations
  tl.call(() => {
    unlockScroll();
    startFadeIns();
  }, null, 3.1);
}

curtainEl.addEventListener('click',      openCurtain);
curtainEl.addEventListener('touchstart', e => { e.preventDefault(); openCurtain(); }, { passive: false });
curtainEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCurtain(); }
});

/* ════════════════════════════════
   3. VINE CREEPERS — background layer
   ════════════════════════════════ */
function initVines() {
  const vineLeft  = document.getElementById('vine-left');
  const vineRight = document.getElementById('vine-right');
  if (!vineLeft || !vineRight) return;

  const leftCtx  = vineLeft.getContext('2d');
  const rightCtx = vineRight.getContext('2d');

  function resizeCanvases() {
    const h = window.innerHeight;
    vineLeft.height  = h; vineLeft.width  = 72;
    vineRight.height = h; vineRight.width = 72;
  }
  resizeCanvases();

  function drawVine(ctx, flip) {
    ctx.clearRect(0, 0, 72, ctx.canvas.height);
    if (flip) { ctx.save(); ctx.scale(-1, 1); ctx.translate(-72, 0); }

    const h = ctx.canvas.height;
    const seg = h / 8;
    const xV  = [48, 34, 54, 30, 50, 36, 56, 34, 44];
    const pts = xV.map((x, i) => ({ x, y: i * seg }));

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    let dir = 1;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i];
      ctx.quadraticCurveTo(p.x + (c.x - p.x) / 2 + dir * 10, p.y + (c.y - p.y) / 2, c.x, c.y);
      dir *= -1;
    }
    ctx.strokeStyle = 'rgba(90,165,70,0.42)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    for (let j = 1; j < 9; j++) {
      const pt = pts[j];
      const ji = j - 1;

      const lOff = ji % 2 === 0 ? 18 : 16;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.quadraticCurveTo(pt.x - lOff, pt.y - 7, pt.x - 12, pt.y + 5);
      ctx.quadraticCurveTo(pt.x - 3, pt.y + 3, pt.x, pt.y);
      ctx.fillStyle   = 'rgba(90,160,60,0.10)';
      ctx.strokeStyle = 'rgba(120,185,80,0.45)';
      ctx.lineWidth = 0.8;
      ctx.fill(); ctx.stroke();

      const rOff = ji % 2 === 0 ? 16 : 18;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.quadraticCurveTo(pt.x + rOff, pt.y - 7, pt.x + 12, pt.y + 5);
      ctx.quadraticCurveTo(pt.x + 3, pt.y + 3, pt.x, pt.y);
      ctx.fill(); ctx.stroke();

      if (ji % 2 === 0) {
        ctx.beginPath();
        ctx.arc(pt.x + (ji % 4 === 0 ? 9 : -9), pt.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,165,45,0.35)';
        ctx.fill();
      }
    }

    if (flip) ctx.restore();
  }

  function growVine(ctx, flip) {
    const t0 = performance.now();
    function animate(now) {
      const progress = Math.min((now - t0) / 2800, 1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 72, ctx.canvas.height * progress);
      ctx.clip();
      drawVine(ctx, flip);
      ctx.restore();
      if (progress < 1) requestAnimationFrame(animate);
      else drawVine(ctx, flip);
    }
    requestAnimationFrame(animate);
  }

  growVine(leftCtx, false);
  growVine(rightCtx, true);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvases();
      drawVine(leftCtx, false);
      drawVine(rightCtx, true);
    }, 200);
  });
}

/* ════════════════════════════════
   4. SEQUENTIAL FADE-INS (Page 1)
   After curtain opens, page 1 content
   fades in, then scroll unlocks for pg 2
   ════════════════════════════════ */
function startFadeIns() {
  initVines();
  fireSparks();

  setTimeout(() => {
    document.getElementById('vine-left').classList.add('show');
    document.getElementById('vine-right').classList.add('show');
  }, 300);

  setTimeout(() => {
    musicBtn.classList.add('show');
  }, 400);

  const items = document.querySelectorAll('.fade-item');
  const delay = 700;
  items.forEach((item, i) => {
    setTimeout(() => item.classList.add('show'), i * delay);
  });

  // Letter-by-letter names reveal
  const letters   = document.querySelectorAll('.invite-names .letter');
  const baseDelay = 700;
  letters.forEach((letter, i) => {
    setTimeout(() => letter.classList.add('show'), baseDelay + i * 75);
  });

  // Hide scroll hint on scroll
  const scrollHint = document.getElementById('scroll-hint');
  const hideHint = () => {
    if (window.scrollY > 40) {
      scrollHint.style.transition = 'opacity 0.5s ease';
      scrollHint.style.opacity    = '0';
      setTimeout(() => { scrollHint.style.display = 'none'; }, 500);
      window.removeEventListener('scroll', hideHint);
    }
  };
  window.addEventListener('scroll', hideHint, { passive: true });
}

/* ════════════════════════════════
   5. SAVE THE DATE — scroll locked
   until all 3 coins scratched + confetti
   ════════════════════════════════ */
const stdCard = document.getElementById('std-card');
let coinsAllScratched = false;

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      stdCard.classList.add('visible');
      cardObserver.disconnect();
      initCoins();
      // Lock scroll when save-the-date section is entered
      // Unlock happens inside initCoins after all 3 scratched + confetti
    }
  });
}, { threshold: 0.3 });

cardObserver.observe(stdCard);

function initCoins() {
  const hint         = document.getElementById('std-hint');
  let scratchedCount = 0;
  const resizeFns    = [];

  const coinDefs = [{ id: 'coin-day' }, { id: 'coin-month' }, { id: 'coin-year' }];

  coinDefs.forEach(({ id }) => {
    const coin   = document.getElementById(id);
    const canvas = coin.querySelector('.coin-canvas');
    const ctx    = canvas.getContext('2d');
    let revealed   = false;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let hasStarted = false;

    function resize() {
      canvas.width  = coin.offsetWidth;
      canvas.height = coin.offsetHeight;
      if (!revealed) drawGoldLayer();
    }

    function drawGoldLayer() {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2, r = w / 2;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

      const grad = ctx.createRadialGradient(cx * 0.55, cy * 0.55, 2, cx, cy, r);
      grad.addColorStop(0,    '#fff5a0');
      grad.addColorStop(0.2,  '#f0c830');
      grad.addColorStop(0.5,  '#d4a000');
      grad.addColorStop(0.75, '#b88000');
      grad.addColorStop(1,    '#7a5200');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const sheen = ctx.createLinearGradient(0, 0, w, h);
      sheen.addColorStop(0,    'rgba(255,255,255,0)');
      sheen.addColorStop(0.42, 'rgba(255,255,255,0.15)');
      sheen.addColorStop(0.5,  'rgba(255,255,255,0.28)');
      sheen.addColorStop(0.58, 'rgba(255,255,255,0.15)');
      sheen.addColorStop(1,    'rgba(255,255,255,0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(140,90,0,0.12)'; ctx.lineWidth = 0.7;
      for (let y = 4; y < h; y += 6) {
        ctx.beginPath();
        ctx.moveTo(0, y + (Math.random() - 0.5));
        ctx.lineTo(w, y + (Math.random() - 0.5));
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255,215,60,0.55)'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,80,0,0.22)';   ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r - 6, 0, Math.PI * 2); ctx.stroke();

      ctx.restore();
    }

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      const brush = ctx.createRadialGradient(x, y, 0, x, y, 22);
      brush.addColorStop(0,   'rgba(0,0,0,1)');
      brush.addColorStop(0.6, 'rgba(0,0,0,0.85)');
      brush.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = brush;
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    function scratchLine(x1, y1, x2, y2) {
      const steps = Math.max(1, Math.floor(Math.hypot(x2-x1, y2-y1) / 5));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        scratchAt(x1 + (x2-x1)*t, y1 + (y2-y1)*t);
      }
    }

    function checkReveal() {
      if (revealed) return;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0, total = 0;
      for (let i = 3; i < data.length; i += 16) {
        const px = ((i/4) % canvas.width) - canvas.width/2;
        const py = Math.floor((i/4) / canvas.width) - canvas.height/2;
        if (px*px + py*py <= (canvas.width/2)**2) {
          total++;
          if (data[i] < 128) cleared++;
        }
      }
      if (total > 0 && cleared/total > 0.5) autoReveal();
    }

    function autoReveal() {
      revealed = true;
      canvas.classList.remove('shimmer');
      canvas.style.transition = 'opacity 0.6s ease';
      canvas.style.opacity    = '0';
      setTimeout(() => {
        canvas.remove();
        scratchedCount++;
        if (scratchedCount === 1) hint.textContent = '✨ 2 more to go...';
        if (scratchedCount === 2) hint.textContent = '✨ One more!';
        if (scratchedCount === 3) {
          hint.textContent = '💛 28 May 2026 — The beginning of always';
          coinsAllScratched = true;
          fireConfetti();
          setTimeout(() => {
  const msg = document.getElementById('scratch-message');
  if (msg) {
    msg.style.opacity = '1';
    msg.style.transform = 'translateY(0)';
    msg.style.pointerEvents = 'all';
  }
}, 400);
          
          setTimeout(() => {
  const couple = document.getElementById('couple-silhouette');
  if (couple) couple.classList.add('show');
}, 600);
          // Unlock scrolling 2.5s after confetti fires (after celebration settles)
          setTimeout(() => {
            unlockScroll();
          }, 2500);
        }
      }, 650);
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const src  = e.touches ? e.touches[0] : e;
      return {
        x: (src.clientX - rect.left) * (canvas.width  / rect.width),
        y: (src.clientY - rect.top)  * (canvas.height / rect.height),
      };
    }

    canvas.addEventListener('mousedown', e => {
      isDragging = true;
      const p = getPos(e); lastX = p.x; lastY = p.y;
      scratchAt(p.x, p.y);
      if (!hasStarted) { hasStarted = true; hint.textContent = '✨ Keep scratching...'; }
    });
    canvas.addEventListener('mousemove', e => {
      if (!isDragging || revealed) return;
      const p = getPos(e);
      scratchLine(lastX, lastY, p.x, p.y);
      lastX = p.x; lastY = p.y;
      checkReveal();
    });
    window.addEventListener('mouseup', () => isDragging = false);

    canvas.addEventListener('touchstart', e => {
      e.preventDefault(); e.stopPropagation();
      isDragging = true;
      const p = getPos(e); lastX = p.x; lastY = p.y;
      scratchAt(p.x, p.y);
      if (!hasStarted) { hasStarted = true; hint.textContent = '✨ Keep scratching...'; }
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault(); e.stopPropagation();
      if (!isDragging || revealed) return;
      const p = getPos(e);
      scratchLine(lastX, lastY, p.x, p.y);
      lastX = p.x; lastY = p.y;
      checkReveal();
    }, { passive: false });
    canvas.addEventListener('touchend', () => isDragging = false);

    resize();
    canvas.classList.add('shimmer');
    resizeFns.push(resize);
  });

  window.addEventListener('resize', () => resizeFns.forEach(fn => fn()));

  function fireConfetti() {
    const colors = ['#d4a800','#f0c830','#a8e6a8','#4caf50','#ffffff','#fffde7'];
    const shared = { spread: 70, startVelocity: 55, gravity: 0.8, scalar: 1.1, ticks: 200, colors };
    confetti({ ...shared, particleCount: 120, angle: 60,  origin: { x: 0.1, y: 1 } });
    confetti({ ...shared, particleCount: 120, angle: 120, origin: { x: 0.9, y: 1 } });
    setTimeout(() => {
      confetti({ ...shared, particleCount: 60, startVelocity: 40, angle: 60,  origin: { x: 0.1, y: 1 } });
      confetti({ ...shared, particleCount: 60, startVelocity: 40, angle: 120, origin: { x: 0.9, y: 1 } });
    }, 400);
  }
}

/* ════════════════════════════════
   5b. KOLAM DIVIDERS — scroll reveal
   ════════════════════════════════ */
const laObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      const svg = entry.target.querySelector('.kolam-svg');
      if (svg) void svg.getBoundingClientRect();
      laObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.25 });

document.querySelectorAll('.la-reveal').forEach(el => laObserver.observe(el));

/* ════════════════════════════════
   6. EVENT DETAILS — staggered fade-in
   ════════════════════════════════ */
const edItems = document.querySelectorAll('.ed-stagger');

const edObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      edItems.forEach((el, i) => setTimeout(() => el.classList.add('show'), i * 130));
      edObserver.disconnect();
    }
  });
}, { threshold: 0.12 });

const edWrapper = document.querySelector('.ed-wrapper');
if (edWrapper) edObserver.observe(edWrapper);

/* ════════════════════════════════
   7. CLOSING SECTION — stagger + particles
   ════════════════════════════════ */
const clItems   = document.querySelectorAll('.cl-stagger');
const clWrapper = document.querySelector('.cl-wrapper');

const clObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      clItems.forEach((el, i) => setTimeout(() => el.classList.add('show'), i * 160));
      clObserver.disconnect();
    }
  });
}, { threshold: 0.12 });

if (clWrapper) clObserver.observe(clWrapper);

/* ── Countdown ── */
(function initCountdown() {
  const target  = new Date('2026-05-28T07:30:00+05:30').getTime();
  const daysEl  = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl  = document.getElementById('cd-mins');
  const secsEl  = document.getElementById('cd-secs');

  function pad(n) { return String(n).padStart(2,'0'); }

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      daysEl.textContent = hoursEl.textContent = minsEl.textContent = secsEl.textContent = '00';
      return;
    }
    daysEl.textContent  = pad(Math.floor(diff / 86400000));
    hoursEl.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    minsEl.textContent  = pad(Math.floor((diff % 3600000)  / 60000));

    secsEl.classList.add('tick');
    setTimeout(() => {
      secsEl.textContent = pad(Math.floor((diff % 60000) / 1000));
      secsEl.classList.remove('tick');
    }, 150);
  }

  tick();
  setInterval(tick, 1000);
})();

/* ── Particles — reduced count on mobile ── */
function initParticles(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const isMobile = window.innerWidth < 600;
  const COUNT = isMobile ? 18 : 32;
  let particles = [], W, H;

  function resize() {
    W = canvas.width  = canvas.parentElement.offsetWidth;
    H = canvas.height = canvas.parentElement.offsetHeight;
  }

  function randomParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vy: -(Math.random() * 0.28 + 0.08),
      vx: (Math.random() - 0.5) * 0.14,
      alpha: Math.random() * 0.45 + 0.12,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.01 + 0.005,
      color: Math.random() < 0.28 ? '212,175,55' : '140,220,140',
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${a.toFixed(3)})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.y + p.r < 0) { p.y = H + p.r; p.x = Math.random() * W; }
      if (p.x < -p.r) p.x = W + p.r;
      if (p.x > W + p.r) p.x = -p.r;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  particles = Array.from({ length: COUNT }, randomParticle);
  draw();
}
/* ════════════════════════════════
   FIREWORKS CANVAS
   ════════════════════════════════ */
function initFireworks() {
  const canvas = document.getElementById('fireworks-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const closingSection = document.getElementById('closing');
  let W, H, rockets = [], particles = [], running = false;
  let isSpawning = true; // Added to control the "stop" but allow completion

  function resize() {
    W = canvas.width = canvas.parentElement.offsetWidth;
    H = canvas.height = canvas.parentElement.offsetHeight;
  }

  const colors = ['rgba(212,175,55,1)', 'rgba(255,230,80,1)', 'rgba(140,210,110,1)', 'rgba(255,160,160,1)', 'rgba(255,255,200,1)', 'rgba(180,255,180,1)'];
  function randomColor() { return colors[Math.floor(Math.random() * colors.length)]; }

  function launchRocket() {
    if (!isSpawning) return; // Stop creating new rockets after time is up
    const x = W * (0.2 + Math.random() * 0.6);
    const targetY = H * (0.1 + Math.random() * 0.35);
    rockets.push({
      x, y: H,
      tx: x + (Math.random() - 0.5) * 60,
      ty: targetY,
      speed: 4 + Math.random() * 3,
      color: randomColor(),
      trail: [],
    });
    // Randomly launch the next one to keep the sky busy for 7 seconds
    if (isSpawning) setTimeout(launchRocket, 400 + Math.random() * 600);
  }

  function explode(x, y, color) {
    const count = 80 + Math.floor(Math.random() * 60);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.012,
        r: 1.2 + Math.random() * 1.8,
        color,
        gravity: 0.06,
      });
    }
  }

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H); // Changed to clearRect so it doesn't leave trails on the page bg

    // rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      const dx = r.tx - r.x;
      const dy = r.ty - r.y;
      const dist = Math.hypot(dx, dy);

      if (dist < r.speed) {
        explode(r.x, r.y, r.color);
        rockets.splice(i, 1);
      } else {
        r.x += (dx / dist) * r.speed;
        r.y += (dy / dist) * r.speed;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();
      }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
      p.vx *= 0.98; p.alpha -= p.decay;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('1)', `${p.alpha.toFixed(3)})`);
      ctx.fill();
    }

    if (running) requestAnimationFrame(draw);
  }

 function startSequence() {
    running = true;
    isSpawning = true;
    resize();
    
    // 1. Fade the BACKGROUND to black (Content stays bright)
    document.body.classList.add('global-darken');
    
    // 2. Start the fireworks
    launchRocket();
    draw();

    // 3. 15 Second Timer
    setTimeout(() => {
      
      // A. Stop creating new rockets
      isSpawning = false; 

      // B. Fade the background back to the original green/vine look
      document.body.classList.remove('global-darken');

      // C. Let existing sparks finish their animation
      setTimeout(() => {
        running = false;
        ctx.clearRect(0, 0, W, H);
      }, 3000);

    }, 15000); 
  }

  window.addEventListener('resize', resize, { passive: true });

  // Intersection Observer to trigger the sequence once
  let fired = false;
  const fwObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !fired) {
        fired = true;
        startSequence();
        fwObserver.disconnect();
      }
    });
  }, { threshold: 0.4 });

  if (closingSection) fwObserver.observe(closingSection);
}

initFireworks();


document.querySelectorAll('.page-particles, #closing-particles').forEach(initParticles);

/* ════════════════════════════════
   GOLD SPARK STREAKS
   ════════════════════════════════ */
const sparksCanvas = document.getElementById('sparks-canvas');
const sparksCtx    = sparksCanvas.getContext('2d');

function resizeSparks() {
  sparksCanvas.width  = window.innerWidth;
  sparksCanvas.height = window.innerHeight;
}
resizeSparks();
window.addEventListener('resize', resizeSparks, { passive: true });

function fireSparks() {
  const isMobile = window.innerWidth < 600;
  const count = isMobile ? 14 : 22;
  const sparks = [];
  const colors = ['rgba(212,175,55,1)','rgba(255,220,80,1)','rgba(240,200,60,1)','rgba(255,255,180,1)'];

  for (let i = 0; i < count; i++) {
    sparks.push({
      x: 0,
      y: window.innerHeight * (0.2 + Math.random() * 0.6),
      vx: 3.5 + Math.random() * 4,
      vy: -1.6 + Math.random() * 3.2,
      length: 30 + Math.random() * 50,
      alpha: 1,
      decay: 0.020 + Math.random() * 0.014,
      width: 0.9 + Math.random() * 1.1,
      color: colors[Math.floor(Math.random() * 4)],
      isLeft: true
    });
    sparks.push({
      x: window.innerWidth,
      y: window.innerHeight * (0.2 + Math.random() * 0.6),
      vx: -(3.5 + Math.random() * 4),
      vy: -1.6 + Math.random() * 3.2,
      length: 30 + Math.random() * 50,
      alpha: 1,
      decay: 0.020 + Math.random() * 0.014,
      width: 0.9 + Math.random() * 1.1,
      color: colors[Math.floor(Math.random() * 4)],
      isLeft: false
    });
  }

  function animateSparks() {
    sparksCtx.clearRect(0, 0, sparksCanvas.width, sparksCanvas.height);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      sparksCtx.save();
      sparksCtx.globalAlpha = s.alpha;
      sparksCtx.strokeStyle = s.color;
      sparksCtx.lineWidth   = s.width * s.alpha;
      sparksCtx.lineCap     = 'round';
      sparksCtx.beginPath();
      sparksCtx.moveTo(s.x, s.y);
      sparksCtx.lineTo(s.isLeft ? s.x - s.length : s.x + s.length, s.y);
      sparksCtx.stroke();
      sparksCtx.restore();

      sparksCtx.beginPath();
      sparksCtx.arc(s.x, s.y, s.width * 1.1 * s.alpha, 0, Math.PI * 2);
      sparksCtx.fillStyle = `rgba(255,240,120,${s.alpha})`;
      sparksCtx.fill();

      s.x += s.vx; s.y += s.vy;
      s.alpha -= s.decay;
      s.width *= 0.996;
      if (s.alpha <= 0) sparks.splice(i, 1);
    }
    if (sparks.length > 0) requestAnimationFrame(animateSparks);
  }
  requestAnimationFrame(animateSparks);
}

const sections    = document.querySelectorAll('#invite-content, #save-the-date, #event-details, #closing');
let lastSection   = null;

const sparksObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && entry.target !== lastSection) {
      lastSection = entry.target;
      fireSparks();
    }
  });
}, { threshold: 0.3 });

sections.forEach(s => sparksObserver.observe(s));

/* ════════════════════════════════
   8. BACKGROUND MUSIC
   ════════════════════════════════ */
const bgMusic   = document.getElementById('bg-music');
const musicBtn  = document.getElementById('music-btn');
const musicIcon = document.getElementById('music-icon');
let musicPlaying = false;

bgMusic.volume = 0.35;

function startMusic() {
  if (musicPlaying) return;
  bgMusic.volume = 0.35;
  bgMusic.load();
  bgMusic.play().then(() => {
    musicPlaying = true;
    musicBtn.classList.add('playing');
  }).catch(() => {});
}

function toggleMusic() {
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying = false;
    musicBtn.classList.remove('playing');
    musicIcon.textContent = '♪';
  } else {
    bgMusic.play();
    musicPlaying = true;
    musicBtn.classList.add('playing');
    musicIcon.textContent = '♪';
  }
}

musicBtn.addEventListener('click', toggleMusic);

// Pause music when user leaves or hides the page
let wasPlayingBeforeHide = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    wasPlayingBeforeHide = musicPlaying;
    if (musicPlaying) {
      bgMusic.pause();
      musicBtn.classList.remove('playing');
    }
  } else {
    if (wasPlayingBeforeHide) {
      bgMusic.play().catch(() => {});
      musicBtn.classList.add('playing');
    }
  }
});

window.addEventListener('pagehide', () => {
  if (musicPlaying) {
    bgMusic.pause();
  }
});