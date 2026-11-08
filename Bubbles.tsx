import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { FLAVORS, type FlavorId } from "../lib/data";

export interface BubblesHandle {
  burst(x: number, y: number): void;
}

interface Bubble {
  x: number; y: number; r: number; vy: number; wa: number; wf: number; ph: number; a: number;
}
interface Particle {
  x: number; y: number; vx: number; vy: number; r: number; life: number; ttl: number;
}

const hexRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export const Bubbles = forwardRef<BubblesHandle, { flavor: FlavorId }>(function Bubbles({ flavor }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetColor = useRef<[number, number, number]>(hexRgb(FLAVORS[flavor].colors.bubble));
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    targetColor.current = hexRgb(FLAVORS[flavor].colors.bubble);
  }, [flavor]);

  useImperativeHandle(ref, () => ({
    burst(x: number, y: number) {
      const ps = particlesRef.current;
      for (let i = 0; i < 30; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 190;
        ps.push({
          x, y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 120,
          r: 1 + Math.random() * 3.2,
          life: 0,
          ttl: 0.6 + Math.random() * 0.7,
        });
      }
      if (ps.length > 400) ps.splice(0, ps.length - 400);
    },
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let W = 0, H = 0, raf = 0;
    let bubbles: Bubble[] = [];
    const cur: [number, number, number] = [...targetColor.current];

    const spawn = (anywhere: boolean): Bubble => ({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 20 + Math.random() * 60,
      r: 0.8 + Math.random() * 3.6,
      vy: 16 + Math.random() * 46,
      wa: 6 + Math.random() * 16,
      wf: 0.4 + Math.random() * 0.9,
      ph: Math.random() * Math.PI * 2,
      a: 0.07 + Math.random() * 0.22,
    });

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = reduced ? 14 : Math.min(64, Math.max(26, Math.round(W / 26)));
      bubbles = Array.from({ length: count }, () => spawn(true));
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      for (let i = 0; i < 3; i++) cur[i] += (targetColor.current[i] - cur[i]) * (1 - Math.exp(-dt * 2));
      const rgb = `${cur[0] | 0},${cur[1] | 0},${cur[2] | 0}`;
      ctx.clearRect(0, 0, W, H);

      for (const b of bubbles) {
        b.y -= b.vy * dt * (reduced ? 0.4 : 1);
        if (b.y < -24) Object.assign(b, spawn(false));
        const x = b.x + Math.sin(t * b.wf + b.ph) * b.wa;
        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${(b.a * 0.55).toFixed(3)})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb},${b.a.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life += dt;
        if (p.life >= p.ttl) { ps.splice(i, 1); continue; }
        p.vy -= 90 * dt;
        p.vx *= Math.exp(-dt * 1.6);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = 1 - p.life / p.ttl;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.3, p.r * k), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${(0.75 * k).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true" />;
});
