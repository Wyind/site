import { useEffect, useRef } from 'react';

// faint to hot, in glyph-density order. idle cells live at the left end,
// and heat up into #, %, $ and @ as the cursor gets close.
const CHARS = ' .:-~=+*#01%&$@';
const CELL_W = 9;
const CELL_H = 17;
const REACH = 150;
const PUSH = 2.2;
const SWIRL = 1.6;
const SPRING = 0.085;
const FONT = '14px ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function AsciiField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const reduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 16 pre-baked stops from dim gray-green up to the accent green,
    // so fillStyle assignment stays cheap in the hot loop
    const styles = [];
    for (let i = 0; i < 16; i++) {
      const k = i / 15;
      const r = Math.round(118 + (74 - 118) * k);
      const g = Math.round(148 + (222 - 148) * k);
      const b = Math.round(130 + (128 - 130) * k);
      const a = 0.13 + 0.4 * k;
      styles.push('rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')');
    }

    let W = 0;
    let H = 0;
    let cells = [];
    let mx = -9999;
    let my = -9999;
    let raf = 0;
    let last = 0;
    let time = 0;
    let drift = 0;

    function scramble() {
      return Math.random() < 0.22 ? 0 : 1 + ((Math.random() * 4) | 0);
    }

    function seed() {
      const cols = Math.ceil(W / CELL_W) + 2;
      const rows = Math.ceil(H / CELL_H) + 2;
      cells = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          cells.push({
            hx: x * CELL_W,
            hy: y * CELL_H,
            x: x * CELL_W,
            y: y * CELL_H,
            vx: 0,
            vy: 0,
            level: 0,
            ci: scramble(),
          });
        }
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT;
      ctx.textBaseline = 'top';
      seed();
    }

    function paint(c) {
      const lv = c.level;
      const idx = Math.min(CHARS.length - 1, Math.floor(lv * 15 + c.ci * (1 - lv)));
      const ch = CHARS[idx];
      if (ch === ' ') return;
      const si = Math.min(15, (lv * 14 + (1 - lv) * (c.ci % 2)) | 0);
      ctx.fillStyle = styles[si];
      ctx.fillText(ch, c.x, c.y);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < cells.length; i++) paint(cells[i]);
    }

    function frame(ts) {
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      time += dt;
      const f = Math.min(dt * 60, 2);
      const rot = time * 0.6;
      const reach2 = REACH * REACH;

      ctx.clearRect(0, 0, W, H);

      // a few idle cells re-scramble now and then, so the field breathes
      drift += dt;
      if (drift > 0.7) {
        drift = 0;
        const n = Math.max(3, (cells.length * 0.01) | 0);
        for (let i = 0; i < n; i++) {
          const c = cells[(Math.random() * cells.length) | 0];
          if (c.level < 0.02) c.ci = scramble();
        }
      }

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];

        // spring back home, always
        let ax = (c.hx - c.x) * SPRING;
        let ay = (c.hy - c.y) * SPRING;

        const dx = c.x - mx;
        const dy = c.y - my;
        const d2 = dx * dx + dy * dy;
        let target = 0;

        if (d2 < reach2) {
          const d = Math.sqrt(d2) || 1;
          const k = 1 - d / REACH;
          target = k;

          const nx = dx / d;
          const ny = dy / d;

          // push out of the way, hardest right under the cursor
          const push = k * k * PUSH;
          ax += nx * push;
          ay += ny * push;

          // and a slow orbit, so the swarm turns instead of just bulging
          const ang = Math.atan2(ny, nx) + Math.PI / 2 + rot;
          const swirl = k * SWIRL;
          ax += Math.cos(ang) * swirl;
          ay += Math.sin(ang) * swirl;
        }

        c.vx = (c.vx + ax * f) * 0.9;
        c.vy = (c.vy + ay * f) * 0.9;
        c.x += c.vx * f;
        c.y += c.vy * f;

        c.level += (target - c.level) * Math.min(1, 0.15 * f);
        if (c.level < 0.002) c.level = 0;

        paint(c);
      }

      raf = requestAnimationFrame(frame);
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    }

    function onOut() {
      mx = -9999;
      my = -9999;
    }

    function onResize() {
      resize();
      if (reduced) drawStatic();
    }

    resize();

    if (reduced) {
      drawStatic();
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('blur', onOut);
      document.documentElement.addEventListener('pointerleave', onOut);
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', onOut);
      document.documentElement.removeEventListener('pointerleave', onOut);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
}
