import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import gsap from "gsap";
import { FLAVORS, type FlavorId } from "../lib/data";
import { ASSETS } from "../assets";
import { cn } from "../utils/cn";

export interface StageHandle {
  switchTo(next: FlavorId, cb: { onMid: () => void; onDone: () => void }): void;
  entrance(): void;
}

interface StageProps {
  flavor: FlavorId;
  reduced: boolean;
  hint: boolean;
  onInteract(): void;
  onPoke(x: number, y: number): void;
}

interface FruitCfg {
  id: string; x: number; y: number; s: number;
  layer: "fg" | "bg"; o?: number; dur: number; hideMobile?: boolean;
}
interface LeafCfg {
  id: string; x: number; y: number; s: number;
  kind: "leaf" | "leaves"; r: number; o: number; dur: number; hideMobile?: boolean;
}

const FRUITS: FruitCfg[] = [
  { id: "b1", x: 27, y: 24, s: 185, layer: "fg", dur: 6 },
  { id: "b2", x: 40, y: 64, s: 105, layer: "fg", dur: 7 },
  { id: "b3", x: 63, y: 26, s: 200, layer: "fg", dur: 6.5, hideMobile: true },
  { id: "b4", x: 47, y: 12, s: 115, layer: "fg", dur: 8 },
  { id: "b5", x: 22, y: 74, s: 125, layer: "fg", dur: 5.5 },
  { id: "b6", x: 75, y: 50, s: 150, layer: "fg", dur: 7.5, hideMobile: true },
  { id: "b7", x: 37, y: 16, s: 78, layer: "bg", o: 0.6, dur: 9 },
  { id: "b8", x: 57, y: 52, s: 64, layer: "bg", o: 0.5, dur: 10, hideMobile: true },
  { id: "b9", x: 33, y: 81, s: 76, layer: "bg", o: 0.6, dur: 9.5 },
];

const LEAVES: LeafCfg[] = [
  { id: "l1", x: 13, y: 14, s: 120, kind: "leaf", r: -25, o: 0.9, dur: 11 },
  { id: "l2", x: 82, y: 36, s: 170, kind: "leaves", r: 10, o: 0.5, dur: 13, hideMobile: true },
  { id: "l3", x: 77, y: 76, s: 95, kind: "leaf", r: 150, o: 0.85, dur: 10 },
  { id: "l4", x: 16, y: 86, s: 150, kind: "leaves", r: -15, o: 0.45, dur: 14, hideMobile: true },
  { id: "l5", x: 62, y: 7, s: 85, kind: "leaf", r: 65, o: 0.7, dur: 12 },
];

const posStyle = (c: { x: number; y: number; s: number }): CSSProperties => ({
  left: `calc(${c.x}% - ${(c.s / 2).toFixed(1)}px * var(--ss))`,
  top: `calc(${c.y}% - ${(c.s / 2).toFixed(1)}px * var(--ss))`,
  width: `calc(${c.s}px * var(--ss))`,
  height: `calc(${c.s}px * var(--ss))`,
});

export const Stage = forwardRef<StageHandle, StageProps>(function Stage(
  { flavor, reduced, hint, onInteract, onPoke },
  ref
) {
  const canRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const flavorRef = useRef(flavor);
  const reducedRef = useRef(reduced);
  const interactRef = useRef(onInteract);
  useEffect(() => { flavorRef.current = flavor; }, [flavor]);
  useEffect(() => { reducedRef.current = reduced; }, [reduced]);
  useEffect(() => { interactRef.current = onInteract; }, [onInteract]);

  const S = useRef({
    mx: 0, my: 0, smx: 0, smy: 0, px: -9999, py: -9999,
    zoom: 1, zoomT: 1, dragX: 0, vel: 0, dragging: false,
    lastPX: 0, lastPY: 0, lastPT: 0, moved: 0,
    tilt: FLAVORS[flavor].tiltExtra, t: 0,
    switching: false,
    spin: { deg: 0, blur: 0 },
    punch: { s: 1 },
    ent: { y: 130, s: 0.82, o: 0, b: 22 },
    sprites: FRUITS.map((_, i) => ({ rx: 0, ry: 0, ang: (i * 47) % 360, phase: i * 0.9 })),
  }).current;

  /* ---------------- main animation loop ---------------- */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      S.px = e.clientX; S.py = e.clientY;
      S.mx = e.clientX / window.innerWidth - 0.5;
      S.my = e.clientY / window.innerHeight - 0.5;
    };
    const onWheel = (e: WheelEvent) => {
      const t = e.target as Element | null;
      if (t && typeof t.closest === "function" && t.closest("[data-sheet],[data-dock]")) return;
      S.zoomT = Math.min(1.35, Math.max(0.7, S.zoomT - e.deltaY * 0.0012));
      interactRef.current();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("wheel", onWheel, { passive: true });

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const can = canRef.current;
      if (!can) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      S.t += dt;
      const RM = reducedRef.current ? 0 : 1;
      const k = 1 - Math.exp(-dt * 6);
      S.smx += (S.mx * RM - S.smx) * k;
      S.smy += (S.my * RM - S.smy) * k;
      if (!S.dragging) {
        S.vel *= Math.exp(-dt * 2.4);
        S.dragX += S.vel * dt;
        S.dragX += (0 - S.dragX) * (1 - Math.exp(-dt * 2.2));
      }
      S.zoom += (S.zoomT - S.zoom) * (1 - Math.exp(-dt * 7));
      S.tilt += (FLAVORS[flavorRef.current].tiltExtra - S.tilt) * (1 - Math.exp(-dt * 4));

      const e = S.ent, sp = S.spin;
      const floatY = Math.sin(S.t * 0.9) * 12 * RM;
      const wob = Math.sin(S.t * 0.6) * 1.7 * RM;
      can.style.transform =
        `translate3d(0, ${(floatY + e.y).toFixed(2)}px, 0) perspective(1150px) ` +
        `rotateX(${(-S.smy * 9).toFixed(2)}deg) rotateY(${(S.smx * 15 + S.dragX + sp.deg).toFixed(2)}deg) ` +
        `rotateZ(${(S.tilt + wob).toFixed(2)}deg) scale(${(S.zoom * e.s * S.punch.s).toFixed(4)})`;
      can.style.opacity = e.o.toFixed(3);
      const blur = sp.blur + e.b;
      can.style.filter = blur > 0.25 ? `blur(${blur.toFixed(1)}px)` : "none";

      if (sheenRef.current) {
        sheenRef.current.style.backgroundPosition = `${50 + S.smx * 45 + Math.sin(S.t * 0.5) * 6 * RM}% 0%`;
      }
      const fgx = S.smx * 60, fgy = S.smy * 60;
      if (fgRef.current) fgRef.current.style.transform = `translate3d(${fgx.toFixed(1)}px, ${fgy.toFixed(1)}px, 0)`;
      if (bgRef.current) bgRef.current.style.transform = `translate3d(${(-S.smx * 32).toFixed(1)}px, ${(-S.smy * 32).toFixed(1)}px, 0)`;
      if (leavesRef.current) leavesRef.current.style.transform = `translate3d(${(-S.smx * 16).toFixed(1)}px, ${(-S.smy * 16).toFixed(1)}px, 0)`;

      const W = window.innerWidth, H = window.innerHeight;
      const kk = 1 - Math.exp(-dt * 7);
      for (let i = 0; i < FRUITS.length; i++) {
        const inner = innerRefs.current[i];
        const wrap = wrapRefs.current[i];
        if (!inner || !wrap) continue;
        const f = FRUITS[i], st = S.sprites[i];
        const wx = Number(gsap.getProperty(wrap, "x")) || 0;
        const wy = Number(gsap.getProperty(wrap, "y")) || 0;
        const cx = (f.x / 100) * W + (f.layer === "fg" ? fgx : -S.smx * 32) + wx;
        const cy = (f.y / 100) * H + (f.layer === "fg" ? fgy : -S.smy * 32) + wy;
        const dx = S.px - cx, dy = S.py - cy;
        const dist = Math.max(1, Math.hypot(dx, dy));
        let tx = 0, ty = 0, mult = 1;
        if (!S.switching && RM === 1 && dist < 380) {
          const force = (380 - dist) / 380;
          tx = -(dx / dist) * force * 85;
          ty = -(dy / dist) * force * 85;
          mult = 1 + force * 4;
        }
        st.rx += (tx - st.rx) * kk;
        st.ry += (ty - st.ry) * kk;
        st.ang += dt * 9 * mult * RM;
        const ph = S.t * ((Math.PI * 2) / f.dur) + st.phase;
        const fy = Math.sin(ph) * 13 * RM;
        const fa = Math.cos(ph) * 6 * RM;
        inner.style.transform = `translate3d(${st.rx.toFixed(1)}px, ${(st.ry + fy).toFixed(1)}px, 0) rotate(${(st.ang + fa).toFixed(1)}deg)`;
      }
      for (let i = 0; i < LEAVES.length; i++) {
        const el = leafRefs.current[i];
        if (!el) continue;
        const l = LEAVES[i];
        const ph = S.t * ((Math.PI * 2) / l.dur) + i * 1.3;
        el.style.transform =
          `translate3d(${(Math.cos(ph * 0.5) * 14 * RM).toFixed(1)}px, ${(Math.sin(ph) * 18 * RM).toFixed(1)}px, 0) ` +
          `rotate(${(l.r + Math.sin(ph * 0.3) * 14 * RM).toFixed(1)}deg)`;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("wheel", onWheel);
      tlRef.current?.kill();
      gsap.killTweensOf([S.ent, S.spin, S.punch]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- imperative API ---------------- */
  useImperativeHandle(ref, () => ({
    entrance() {
      if (reducedRef.current) {
        Object.assign(S.ent, { y: 0, s: 1, o: 1, b: 0 });
        wrapRefs.current.forEach((el, i) => el && gsap.set(el, { opacity: FRUITS[i].o ?? 1, scale: 1 }));
        return;
      }
      gsap.to(S.ent, { y: 0, s: 1, o: 1, b: 0, duration: 1.3, ease: "expo.out", delay: 0.15 });
      wrapRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(el, { scale: 0, opacity: 0 },
          { scale: 1, opacity: FRUITS[i].o ?? 1, duration: 0.85, delay: 0.5 + i * 0.055, ease: "back.out(1.7)", overwrite: "auto" });
      });
    },
    switchTo(next, cb) {
      S.switching = true;
      const done = () => {
        S.switching = false;
        S.spin.deg = 0;
        S.spin.blur = 0;
        cb.onDone();
      };
      tlRef.current?.kill();
      if (reducedRef.current) {
        const tl = gsap.timeline({ onComplete: done });
        tlRef.current = tl;
        tl.to(S.spin, { blur: 10, duration: 0.18, ease: "power1.in", onComplete: cb.onMid });
        tl.to(S.spin, { blur: 0, duration: 0.28 });
        return;
      }
      const tl = gsap.timeline({ onComplete: done });
      tlRef.current = tl;
      tl.to(S.spin, { deg: 95, blur: 16, duration: 0.42, ease: "power2.in" }, 0);
      tl.add(() => cb.onMid(), 0.46);
      tl.to(S.spin, { deg: 360, blur: 0, duration: 1.05, ease: "back.out(0.7)" }, 0.46);
      const W = window.innerWidth, H = window.innerHeight;
      FRUITS.forEach((f, i) => {
        const el = wrapRefs.current[i];
        if (!el) return;
        const cx = W / 2 - (f.x / 100) * W;
        const cy = H / 2 - (f.y / 100) * H;
        tl.to(el, { x: cx, y: cy, scale: 0.1, opacity: 0, rotation: "+=45", duration: 0.38, ease: "power2.in", overwrite: "auto" }, i * 0.012);
        tl.to(el, {
          x: (Math.random() - 0.5) * 230,
          y: (Math.random() - 0.5) * 210,
          scale: 1, opacity: f.o ?? 1, rotation: "+=50",
          duration: 0.9, ease: "back.out(1.5)", overwrite: "auto",
        }, 0.56 + i * 0.02);
      });
      void next;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  /* ---------------- drag / poke ---------------- */
  const dragProps = {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      S.dragging = true;
      S.lastPX = e.clientX; S.lastPY = e.clientY;
      S.lastPT = performance.now();
      S.moved = 0; S.vel = 0;
      interactRef.current();
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!S.dragging) return;
      const nowT = performance.now();
      const dx = e.clientX - S.lastPX;
      const dy = e.clientY - S.lastPY;
      const dts = Math.max(8, nowT - S.lastPT) / 1000;
      S.dragX += dx * 0.4;
      S.vel = Math.max(-620, Math.min(620, (dx * 0.4) / dts));
      S.moved += Math.abs(dx) + Math.abs(dy);
      S.lastPX = e.clientX; S.lastPY = e.clientY; S.lastPT = nowT;
    },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!S.dragging) return;
      S.dragging = false;
      if (S.moved < 8) {
        gsap.fromTo(S.punch, { s: 0.94 }, { s: 1, duration: 0.5, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
        onPoke(e.clientX, e.clientY);
      }
    },
    onPointerCancel: () => { S.dragging = false; },
    onDoubleClick: () => { S.zoomT = 1; S.vel = 0; },
  };

  const f = FLAVORS[flavor];

  const renderFruit = (cfg: FruitCfg, i: number) => (
    <div key={cfg.id} className={cn("absolute", cfg.hideMobile && "hidden md:block")} style={posStyle(cfg)}>
      <div ref={(el) => { wrapRefs.current[i] = el; }} className="h-full w-full will-change-transform" style={{ opacity: cfg.o ?? 1 }}>
        <div ref={(el) => { innerRefs.current[i] = el; }} className="h-full w-full will-change-transform">
          <img
            src={f.sprite}
            alt=""
            draggable={false}
            className="h-full w-full object-contain drop-shadow-[0_16px_26px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="zs-stage pointer-events-none absolute inset-0 z-[2] select-none" aria-hidden="true">
      {/* leaves — far layer */}
      <div ref={leavesRef} className="absolute inset-0 z-[1] will-change-transform">
        {LEAVES.map((l, i) => (
          <div key={l.id} className={cn("absolute", l.hideMobile && "hidden md:block")} style={posStyle(l)}>
            <div ref={(el) => { leafRefs.current[i] = el; }} className="h-full w-full will-change-transform" style={{ opacity: l.o }}>
              <img
                src={l.kind === "leaf" ? ASSETS.leaf : ASSETS.leaves}
                alt=""
                draggable={false}
                className="h-full w-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* background fruit */}
      <div ref={bgRef} className="absolute inset-0 z-[2] will-change-transform">
        {FRUITS.map((cfg, i) => (cfg.layer === "bg" ? renderFruit(cfg, i) : null))}
      </div>

      {/* glow + can */}
      <div className="absolute inset-0 z-[4] flex items-center justify-center pt-24 pb-8 max-md:pt-36 max-md:pb-64">
        <div
          className="zs-glow absolute h-[44vw] w-[44vw] rounded-full blur-[110px] max-md:h-[86vw] max-md:w-[86vw]"
          style={{ backgroundColor: "var(--glow)" }}
        />
        <div
          {...dragProps}
          className="pointer-events-auto relative cursor-grab touch-none outline-none active:cursor-grabbing"
          role="img"
          aria-label={`${f.name} can — drag to spin, scroll to zoom, tap for fizz`}
        >
          <div ref={canRef} className="relative will-change-transform" style={{ opacity: 0 }}>
            <img
              src={f.can}
              alt=""
              draggable={false}
              className="h-[min(76vh,800px)] w-auto object-contain drop-shadow-[0_50px_80px_rgba(0,0,0,0.55)] max-md:h-[min(44vh,400px)]"
            />
            <div
              ref={sheenRef}
              className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.16) 50%, transparent 60%)",
                backgroundSize: "250% 100%",
                maskImage: `url(${f.can})`,
                WebkitMaskImage: `url(${f.can})`,
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
          </div>
        </div>
      </div>

      {/* foreground fruit */}
      <div ref={fgRef} className="absolute inset-0 z-[5] will-change-transform">
        {FRUITS.map((cfg, i) => (cfg.layer === "fg" ? renderFruit(cfg, i) : null))}
      </div>

      {/* interaction hint */}
      <div
        className={cn(
          "absolute bottom-[6%] left-1/2 z-[6] -translate-x-1/2 transition-opacity duration-700 max-md:bottom-[236px]",
          hint ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="glass zs-bob flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-semibold tracking-[0.22em] whitespace-nowrap text-white/60 uppercase">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 6a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0Z" />
            <path d="M12 3v4" />
            <path d="M5 12H2m20 0h-3" />
          </svg>
          <span className="hidden md:inline">Drag to spin · Scroll to zoom</span>
          <span className="md:hidden">Drag to spin · Tap for fizz</span>
        </div>
      </div>
    </div>
  );
});
