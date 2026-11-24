/* Kuro Detail Co.
   opener: the mark draws, a gloss meter climbs, a buffing pass sweeps across and the dull car turns glossy
   hero -> polish (scroll to buff the paint) -> packages (hover previews) -> about -> work (photo stack) -> reviews */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasG = typeof gsap !== 'undefined';

  /* ---------------- the logo: a K made of three bars, with a glint that sweeps across it ---------------- */
  let lid = 0;
  function logoSVG() {
    const id = 'km' + (++lid);
    const bars = '<line x1="26" y1="8" x2="26" y2="92"/><line x1="33" y1="55" x2="82" y2="9"/><line x1="47" y1="41" x2="88" y2="92"/>';
    return `<svg class="k-svg" viewBox="0 0 100 100" role="img" aria-label="Kuro Detail Co. mark">` +
      `<defs><mask id="${id}"><g stroke="#fff" stroke-width="19" fill="none">${bars}</g></mask></defs>` +
      `<g class="kl">${bars.replace(/<line /g, '<line pathLength="1" ')}</g>` +
      `<g mask="url(#${id})"><rect class="glint" x="28" y="-10" width="15" height="120"/></g></svg>`;
  }
  $$('[data-logo="mark"]').forEach(el => { el.innerHTML = logoSVG(); });
  $$('.k-svg .kl').forEach(g => { g.setAttribute('style', 'fill:none;stroke:currentColor;stroke-width:19'); });

  /* ---------------- hero parallax ---------------- */
  const heroImg = $('#heroImg'), hero = $('.hero');
  /* ---------------- polish: scroll to buff the paint ---------------- */
  const corr = $('#correction'), cstage = $('.cstage'), cNum = $('#cNum');
  let pShown = 0;
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function updateCorrection() {
    const r = corr.getBoundingClientRect(), span = r.height - innerHeight;
    const p = clamp(-r.top / span);
    const e = ease(clamp((p - 0.04) / 0.86));
    pShown += (e - pShown) * 0.18;
    cstage.style.setProperty('--p', (pShown * 100).toFixed(2) + '%');
    cNum.textContent = Math.round(pShown * 98);
  }

  /* ---------------- packages: a photo follows the cursor ---------------- */
  const plist = $('#plist'), pfloat = $('#pfloat');
  if (plist && pfloat && matchMedia('(hover:hover)').matches) {
    const pimg = $('img', pfloat);
    let mx = -999, my = -999, fx = -999, fy = -999, on = false;
    plist.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    $$('li', plist).forEach(li => {
      li.addEventListener('mouseenter', () => { pimg.src = li.dataset.img; pfloat.classList.add('on'); on = true; });
    });
    plist.addEventListener('mouseleave', () => { pfloat.classList.remove('on'); on = false; });
    (function loop() {
      fx += (mx - fx) * 0.14; fy += (my - fy) * 0.14;
      const w = pfloat.offsetWidth, h = pfloat.offsetHeight;
      pfloat.style.transform = `translate3d(${(fx + 28).toFixed(1)}px,${(fy - h / 2).toFixed(1)}px,0) scale(${on ? 1 : 0.85}) rotate(${((mx - fx) * 0.04).toFixed(2)}deg)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- work: photos stack ---------------- */
  const cards = $$('.card');
  function updateStack() {
    const vh = innerHeight;
    cards.forEach((c, i) => {
      const inner = $('.card-in', c);
      const next = cards[i + 1];
      if (!next) return;
      const t = clamp(1 - next.getBoundingClientRect().top / vh);
      inner.style.transform = `scale(${(1 - 0.07 * t).toFixed(4)})`;
      inner.style.filter = `brightness(${(1 - 0.5 * t).toFixed(3)})`;
    });
  }

  /* ---------------- counters, reveals, bar colour ---------------- */
  const bar = $('#bar'), about = $('#about');
  function updateBar() {
    const a = about.getBoundingClientRect();
    bar.classList.toggle('on-light', a.top < 40 && a.bottom > 40);
    if (heroImg && scrollY < innerHeight * 1.2) {
      heroImg.style.translate = `0 ${(scrollY * 0.22).toFixed(1)}px`;
    }
  }
  function countUp(el) {
    const to = +el.dataset.count, t0 = performance.now(), dur = 1400;
    (function step(now) {
      const t = clamp((now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  function setupReveals() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.matches('.facts')) $$('b[data-count]', e.target).forEach(countUp);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -10% 0px' });
    $$('.sec-head, .plist li, .about-photo, .about-copy > *, .about-grid > div > *, .facts').forEach((el, i) => {
      el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 0.07 + 's'; io.observe(el);
    });
  }

  /* ---------------- reviews: one big quote at a time ---------------- */
  (function reviews() {
    const qs = $$('.q'), now = $('#qNow'), bar = $('#qBar'), wrap = $('#qwrap');
    if (!qs.length) return;
    let cur = 0, timer = null, tween = null;
    // wrap each word so it can rise out of a mask
    qs.forEach(q => {
      const bq = $('blockquote', q);
      const words = bq.textContent.trim().split(/\s+/);
      bq.setAttribute('aria-label', words.join(' '));
      bq.textContent = '';
      words.forEach((w, i) => {
        const o = document.createElement('span'); o.className = 'qw'; o.setAttribute('aria-hidden', 'true');
        const n = document.createElement('span'); n.textContent = w; o.appendChild(n);
        bq.appendChild(o); if (i < words.length - 1) bq.appendChild(document.createTextNode(' '));
      });
    });
    function startBar() {
      if (!hasG || reduce) return;
      if (tween) tween.kill();
      gsap.set(bar, { width: '0%' });
      tween = gsap.to(bar, { width: '100%', duration: 7, ease: 'none', onComplete: () => go(cur + 1) });
    }
    function go(i, instant) {
      const n = (i + qs.length) % qs.length;
      qs[cur].classList.remove('on');
      cur = n;
      qs[cur].classList.add('on');
      now.textContent = String(cur + 1).padStart(2, '0');
      if (hasG && !reduce && !instant) {
        const ws = $$('.qw > span', qs[cur]);
        gsap.fromTo(ws, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.035 });
        gsap.fromTo($('figcaption', qs[cur]), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.35, ease: 'power3.out' });
      }
      startBar();
    }
    $('#qNext').addEventListener('click', () => go(cur + 1));
    $('#qPrev').addEventListener('click', () => go(cur - 1));
    // only start cycling once the section is on screen
    new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { go(0); io.disconnect(); } }, { threshold: 0.35 }).observe(wrap);
  })();

  /* bp-draw: the blueprint behind the About section draws itself the first time it is on screen */
  (function () {
    const bp = $('#bp'); if (!bp) return;
    new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { bp.classList.add('drawn'); io.disconnect(); } }, { threshold: 0.2 }).observe(bp);
  })();

  function onFrame() {
    updateCorrection(); updateStack(); updateBar();
  }
  let raf = 0;
  function loopOnScroll() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onFrame(); if (Math.abs(pShownTarget() - pShown) > 0.002) loopOnScroll(); }); }
  function pShownTarget() {
    const r = corr.getBoundingClientRect(), span = r.height - innerHeight;
    return ease(clamp((clamp(-r.top / span) - 0.04) / 0.86));
  }

  function showFinal() {
    window.__kuroReady = true;
    html.classList.add('ready');
    document.body.classList.remove('lock');
    const op = $('#opener'); if (op) op.style.display = 'none';
    const pass = $('#pass'); if (pass) pass.style.display = 'none';
    if (hasG) {
      gsap.set('.hw > span', { yPercent: 0 });
      gsap.set($('#heroBg'), { '--gl': 1 });
      gsap.set([bar, '.hero-top', '.hero-foot'], { opacity: 1, y: 0 });
    }
    setupReveals();
    addEventListener('scroll', loopOnScroll, { passive: true });
    addEventListener('resize', onFrame);
    onFrame();
    window.__kuro = { onFrame };
  }

  /* ---------------- the opener ---------------- */
  function run() {
    document.body.classList.add('lock');
    html.classList.add('ready');
    const opener = $('#opener'), pass = $('#pass'), heroBg = $('#heroBg');
    const opNum = $('#opNum'), opLine = $('#opLine');
    const mark = $('.op-mark .kl');
    const lines = $$('line', mark);
    lines.forEach(l => { l.style.strokeDasharray = 1; l.style.strokeDashoffset = 1; });
    const words = $$('.hw > span');
    gsap.set(heroBg, { '--gl': 0 });
    gsap.set(words, { yPercent: 110 });
    gsap.set(['.hero-top', '.hero-foot'], { opacity: 0 });
    gsap.set(bar, { opacity: 0, y: -14 });

    const sweep = { x: -18 };
    function applySweep() {
      const vw = innerWidth, vh = innerHeight;
      const skew = vw * 0.22;
      const X0 = sweep.x * vw / 100;
      opener.style.clipPath = `polygon(${X0 + skew / 2}px 0, 100% 0, 100% 100%, ${X0 - skew / 2}px 100%)`;
      const ang = -Math.atan(skew / vh) * 180 / Math.PI;
      pass.style.transform = `translateX(${X0 - pass.offsetWidth / 2}px) skewX(${ang}deg)`;
    }

    const T = gsap.timeline();
    T.to(lines, { strokeDashoffset: 0, duration: 0.75, ease: 'power2.out', stagger: 0.2 }, 0.2);
    const meter = { v: 0 };
    T.to(meter, {
      v: 100, duration: 2.0, ease: 'power1.inOut',
      onUpdate: () => { const n = Math.round(meter.v); opNum.textContent = String(n).padStart(3, '0'); opLine.style.width = n + '%'; }
    }, 0.6);
    T.addLabel('pass', 2.85);
    T.set(pass, { opacity: 1 }, 'pass');
    T.to(sweep, { x: 118, duration: 1.45, ease: 'power2.inOut', onUpdate: applySweep, onStart: applySweep }, 'pass');
    T.to(heroBg, { '--gl': 1, duration: 1.45, ease: 'power2.inOut' }, 'pass+=0.05');
    T.to(pass, { opacity: 0, duration: 0.3 }, 'pass+=1.25');
    T.to(words, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09 }, 'pass+=0.95');
    T.to(bar, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 'pass+=1.4');
    T.to(['.hero-top', '.hero-foot'], { opacity: 1, duration: 0.9, ease: 'power2.out' }, 'pass+=1.5');
    T.add(showFinal, '+=0.15');
    window.__kuroT = T;
  }

  /* ---------------- go ---------------- */
  if (!hasG || reduce) { showFinal(); return; }
  const first = ['hero-lights', 'd01', 'd05', 'd09'].map(n => new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = `images/${n}.jpg`; }));
  const ready = Promise.all([document.fonts ? document.fonts.ready : 0, ...first]);
  Promise.race([ready, new Promise(r => setTimeout(r, 3500))]).then(run);
})();
