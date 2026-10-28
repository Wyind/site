import { useEffect, useRef } from 'react';

// the old windows pipes screensaver, hand-rolled
const COLORS = [
  { rgb: '74, 222, 128', a: 0.20 },
  { rgb: '46, 168, 104', a: 0.25 },
  { rgb: '152, 200, 172', a: 0.17 },
  { rgb: '216, 168, 86', a: 0.17 },
];
const DIRS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function pick(n) {
  return (Math.random() * n) | 0;
}

export default function Pipes() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let last = 0;
    let raf = 0;
    let pipes = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    function makePipe() {
      const c = COLORS[pick(COLORS.length)];
      const sx = rand(40, Math.max(41, W - 40));
      const sy = rand(40, Math.max(41, H - 40));

      // start heading into the screen, not straight off the nearest edge
      let d = pick(4);
      for (let t = 0; t < 8; t++) {
        const dir = DIRS[d];
        const toEdge =
          dir[0] > 0 ? W - sx : dir[0] < 0 ? sx : dir[1] > 0 ? H - sy : sy;
        if (toEdge > 150) break;
        d = pick(4);
      }

      return {
        sx,
        sy,
        x: sx,
        y: sy,
        dir: d,
        pts: [],
        width: rand(7, 13),
        color: c.rgb,
        alpha: c.a,
        speed: rand(55, 95),
        target: rand(55, 150),
        walked: 0,
        drawn: 0,
        maxDrawn: rand(900, 2000),
        age: 0,
        maxAge: rand(24, 44),
        dying: 0,
      };
    }

    function turn(p) {
      p.pts.push(p.x, p.y);
      p.walked = 0;
      p.target = rand(55, 150);
      // left or right turn only, never a reversal
      p.dir = (p.dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
    }

    function update(dt) {
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.age += dt;

        const step = p.speed * dt;
        p.x += DIRS[p.dir][0] * step;
        p.y += DIRS[p.dir][1] * step;
        p.walked += step;
        p.drawn += step;
        if (p.walked >= p.target) turn(p);

        if (p.dying) {
          p.dying += dt / 1.4;
          if (p.dying >= 1) {
            pipes.splice(i, 1);
            continue;
          }
        } else if (
          p.x < -40 ||
          p.x > W + 40 ||
          p.y < -40 ||
          p.y > H + 40 ||
          p.drawn > p.maxDrawn ||
          p.age > p.maxAge
        ) {
          p.dying = 0.0001;
        }
      }

      const want = W >= 1500 ? 4 : 3;
      let living = 0;
      for (let j = 0; j < pipes.length; j++) if (!pipes[j].dying) living++;
      for (let k = living; k < want; k++) pipes.push(makePipe());
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];
        const fadeIn = Math.min(1, p.age / 0.9);
        const fadeOut = p.dying ? Math.max(0, 1 - p.dying) : 1;
        const a = p.alpha * fadeIn * fadeOut;
        if (a < 0.01) continue;

        const paint = 'rgba(' + p.color + ',' + a.toFixed(3) + ')';
        ctx.strokeStyle = paint;
        ctx.lineWidth = p.width;

        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        for (let k = 0; k < p.pts.length; k += 2) ctx.lineTo(p.pts[k], p.pts[k + 1]);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // fittings at the start and at every elbow
        const r = p.width / 2 + 2.5;
        ctx.fillStyle = 'rgba(' + p.color + ',' + Math.min(0.4, a * 1.3).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        for (let j = 0; j < p.pts.length; j += 2) {
          ctx.moveTo(p.pts[j] + r, p.pts[j + 1]);
          ctx.arc(p.pts[j], p.pts[j + 1], r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    function frame(t) {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    resize();

    function onResize() {
      resize();
      if (reduced) draw();
    }

    window.addEventListener('resize', onResize);

    if (reduced) {
      // draw a finished composition once, then leave it alone
      for (let s = 0; s < 24; s++) update(0.5);
      draw();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas id="bg" ref={ref} aria-hidden="true" />;
}
