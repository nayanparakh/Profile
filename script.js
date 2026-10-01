(() => {
  'use strict';

  const mqMobile = window.matchMedia('(max-width: 760px)');
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = () => mqMobile.matches;
  const hasGsap = () => typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Hamburger menu ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Neon ripple on buttons ---------- */
  document.querySelectorAll('.ripple').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove());
    });
  });

  /* ---------- Card spotlight ---------- */
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Particle field ---------- */
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w = 0, h = 0, raf = 0, running = true;
  const mouse = { x: -9999, y: -9999 };

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = mqReduce.matches ? 0 : isMobile() ? 28 : Math.min(110, Math.floor((w * h) / 16000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * (isMobile() ? .25 : .45),
      vy: (Math.random() - .5) * (isMobile() ? .25 : .45),
      r: Math.random() * 1.6 + .6,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const link = isMobile() ? 0 : 130;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,234,255,.8)';
      ctx.shadowColor = '#00eaff'; ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      if (link) {
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < link) {
            ctx.strokeStyle = `rgba(0,191,255,${(1 - d / link) * .35})`;
            ctx.lineWidth = .7;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (md < 160) {
          ctx.strokeStyle = `rgba(0,234,255,${(1 - md / 160) * .6})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    raf = running ? requestAnimationFrame(draw) : 0;
  }

  sizeCanvas();
  if (particles.length) draw();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { sizeCanvas(); if (!raf && particles.length) { running = true; draw(); } }, 150);
  });
  window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !raf && particles.length) draw();
  });

  /* ---------- GSAP animations ---------- */
  if (!hasGsap() || mqReduce.matches) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js-anim');

  // Hero intro
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .fromTo('.hero .reveal', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .9, stagger: .15 }, 0.1)
    .from('.photo-frame', { opacity: 0, scale: .92, duration: 1.1 }, 0.2);

  // Section titles + cards
  gsap.utils.toArray('[data-title]').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, x: -40 }, {
      opacity: 1, x: 0, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, duration: .8, stagger: .1, ease: 'power3.out', overwrite: true,
    }),
  });

  // Desktop-only parallax
  ScrollTrigger.matchMedia({
    '(min-width: 1025px)': () => {
      gsap.to('.photo-frame', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.graph', { yPercent: 14, xPercent: -4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.grid-bg', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true } });
      const hero = document.querySelector('.hero');
      const frame = document.querySelector('.photo-frame');
      const move = (e) => {
        const x = (e.clientX / window.innerWidth - .5) * 2;
        const y = (e.clientY / window.innerHeight - .5) * 2;
        gsap.to('.graph', { x: x * -18, y: y * -12, duration: .8, overwrite: 'auto' });
        gsap.to(frame, { rotateY: x * 5, rotateX: y * -4, transformPerspective: 900, duration: .8, overwrite: 'auto' });
      };
      hero.addEventListener('pointermove', move);
      return () => hero.removeEventListener('pointermove', move);
    },
  });
})();
