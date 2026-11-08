import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { Award, Plus } from "lucide-react";
import { PRELOAD } from "./assets";
import { audio } from "./lib/audio";
import {
  FLAVORS, FLAVOR_ORDER, otherFlavor, packById,
  type CartItem, type FlavorId, type PackId, type PanelId,
} from "./lib/data";
import { Bubbles, type BubblesHandle } from "./components/Bubbles";
import { Stage, type StageHandle } from "./components/Stage";
import { Header } from "./components/Header";
import { FlavorCards, ArrowButton } from "./components/FlavorCards";
import { InfoPanels } from "./components/InfoPanels";
import { ShopDrawer, type DrawerView } from "./components/ShopDrawer";
import { Toasts, type ToastData } from "./components/Toasts";
import { cn } from "./utils/cn";

const CART_KEY = "zs-cart-v1";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => i && FLAVORS[i.flavor] && ["single", "six", "twelve"].includes(i.pack) && Number.isFinite(i.qty) && i.qty > 0
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [flavor, setFlavor] = useState<FlavorId>("classic");
  const [visual, setVisual] = useState<FlavorId>("classic");
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [drawer, setDrawer] = useState<DrawerView | null>(null);
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [ready, setReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hintSeen, setHintSeen] = useState(false);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const stageRef = useRef<StageHandle>(null);
  const bubblesRef = useRef<BubblesHandle>(null);
  const switchingRef = useRef(false);
  const flavorRef = useRef(flavor);
  const toastId = useRef(0);
  const toastTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => { flavorRef.current = flavor; }, [flavor]);
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private mode */ }
  }, [cart]);

  /* ------------------------------- toasts ------------------------------- */
  const dismissToast = useCallback((id: number) => {
    const t = toastTimers.current.get(id);
    if (t) clearTimeout(t);
    toastTimers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addToast = useCallback((msg: string, kind?: ToastData["kind"], action?: ToastData["action"]) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, msg, kind, action }]);
    toastTimers.current.set(id, setTimeout(() => dismissToast(id), 4200));
  }, [dismissToast]);

  useEffect(() => () => { toastTimers.current.forEach((t) => clearTimeout(t)); }, []);

  /* ----------------------------- asset preload ---------------------------- */
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const bump = () => {
      if (cancelled) return;
      loaded++;
      setProgress(loaded / PRELOAD.length);
      if (loaded >= PRELOAD.length) setTimeout(() => { if (!cancelled) setReady(true); }, 250);
    };
    PRELOAD.forEach((src) => {
      const img = new Image();
      img.onload = bump;
      img.onerror = bump;
      img.src = src;
    });
    const fallback = setTimeout(() => { if (!cancelled) setReady(true); }, 4500);
    return () => { cancelled = true; clearTimeout(fallback); };
  }, []);

  /* ------------------------------- entrance ------------------------------- */
  useLayoutEffect(() => {
    if (reduced) return;
    gsap.set("[data-enter]", { opacity: 0, y: 36 });
    gsap.set("[data-enter-top]", { opacity: 0, y: -28 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    audio.setEnabled(soundOn);
    stageRef.current?.entrance();
    let tl: gsap.core.Timeline | null = null;
    if (!reduced) {
      tl = gsap.timeline()
        .to("[data-enter-top]", { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" }, 0.15)
        .to("[data-enter]", { opacity: 1, y: 0, duration: 0.95, stagger: 0.07, ease: "expo.out" }, 0.25);
    }
    const t = setTimeout(() => setLoaderGone(true), 800);
    return () => { tl?.kill(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* ------------------------------ audio unlock ----------------------------- */
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  /* ------------------------------ flavor switch ---------------------------- */
  const switchFlavor = useCallback((next: FlavorId) => {
    if (switchingRef.current || next === flavorRef.current) return;
    if (!stageRef.current) { setFlavor(next); setVisual(next); return; }
    switchingRef.current = true;
    audio.unlock();
    audio.crack();
    setFlavor(next);
    stageRef.current.switchTo(next, {
      onMid: () => { setVisual(next); audio.fizz(); },
      onDone: () => {
        switchingRef.current = false;
        bubblesRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.45);
      },
    });
  }, []);

  /* -------------------------------- keyboard ------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (drawer) setDrawer(null);
        else if (panel) setPanel(null);
        return;
      }
      if (panel || drawer) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        switchFlavor(otherFlavor(flavorRef.current));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, drawer, switchFlavor]);

  /* --------------------------------- cart ops ------------------------------- */
  const addToCart = useCallback((f: FlavorId, p: PackId, qty: number) => {
    audio.pop();
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.flavor === f && i.pack === p);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(24, next[idx].qty + qty) };
        return next;
      }
      return [...prev, { flavor: f, pack: p, qty }];
    });
    addToast(`${qty} × ${FLAVORS[f].name} (${packById(p).short}) added`, "cart", {
      label: "View cart",
      fn: () => { setPanel(null); setDrawer("cart"); },
    });
  }, [addToast]);

  const updateQty = useCallback((index: number, qty: number) => {
    audio.tick();
    setCart((prev) => prev.map((it, i) => (i === index ? { ...it, qty: Math.max(1, Math.min(24, qty)) } : it)));
  }, []);

  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const removeItem = useCallback((index: number) => {
    const item = cartRef.current[index];
    if (!item) return;
    audio.tick();
    setCart((prev) => prev.filter((_, i) => i !== index));
    addToast(`${FLAVORS[item.flavor].name} ${packById(item.pack).short} removed`, "trash", {
      label: "Undo",
      fn: () => setCart((cur) => {
        const next = [...cur];
        next.splice(Math.min(index, next.length), 0, item);
        return next;
      }),
    });
  }, [addToast]);

  /* --------------------------------- nav ops -------------------------------- */
  const navigate = useCallback((id: PanelId | null) => {
    audio.tick();
    setDrawer(null);
    setPanel(id);
  }, []);

  const openDrawer = useCallback((v: DrawerView | null) => {
    audio.tick();
    setPanel(null);
    setDrawer(v);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    audio.unlock();
    audio.setEnabled(next);
    if (next) audio.tick();
    setSoundOn(next);
  }, [soundOn]);

  const f = FLAVORS[flavor];
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="fixed inset-0 overflow-hidden font-sans text-white" style={{ "--glow": f.colors.glow } as CSSProperties}>
      {/* flavor gradient fields */}
      {FLAVOR_ORDER.map((id) => {
        const c = FLAVORS[id].colors;
        return (
          <div
            key={id}
            className={cn("absolute inset-0 transition-opacity duration-[1400ms] ease-in-out", flavor === id ? "opacity-100" : "opacity-0")}
            style={{ background: `radial-gradient(120% 95% at 50% 40%, ${c.inner} 0%, ${c.mid} 52%, ${c.outer} 100%)` }}
          />
        );
      })}
      {/* drifting aurora accents */}
      <div className="zs-drift absolute -top-[12%] -left-[6%] h-[46vw] w-[46vw] rounded-full opacity-20 blur-[130px]" style={{ backgroundColor: f.colors.chip }} />
      <div className="zs-drift absolute -right-[6%] -bottom-[16%] h-[42vw] w-[42vw] rounded-full opacity-15 blur-[130px]" style={{ backgroundColor: f.colors.glow, animationDelay: "-8s" }} />

      <Bubbles ref={bubblesRef} flavor={flavor} />

      <Stage
        ref={stageRef}
        flavor={visual}
        reduced={reduced}
        hint={!hintSeen && ready}
        onInteract={() => setHintSeen(true)}
        onPoke={(x, y) => { audio.pop(); bubblesRef.current?.burst(x, y); }}
      />

      {/* vignette + grain */}
      <div className="pointer-events-none absolute inset-0 z-[3]" style={{ background: "radial-gradient(closest-side, transparent 58%, rgba(0,0,0,0.5) 100%)" }} />
      <div className="zs-grain pointer-events-none absolute inset-0 z-[3] opacity-[0.05]" />

      {/* current flavor tag */}
      <div key={flavor} className="anim-tag absolute top-[104px] left-1/2 z-10 hidden -translate-x-1/2 md:block">
        <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.35em] text-white/50 uppercase">
          <span className="h-px w-8 bg-white/25" />
          <span>{f.num} — {f.name}</span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.colors.chip }} />
          <span className="h-px w-8 bg-white/25" />
        </div>
      </div>

      {/* left column — desktop */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-[4%] z-20 hidden max-w-[32vw] flex-col gap-6 pt-36 pb-10 md:flex">
        <h1 data-enter className="font-display text-[clamp(4rem,8.2vw,9rem)] leading-[0.92] text-white drop-shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          Zohaib
          <br />
          Soda
        </h1>
        <div data-enter>
          <p key={flavor} className="anim-fade-up font-body max-w-[360px] text-[15px] leading-relaxed text-white/70">
            {f.description}
          </p>
        </div>
        <div data-enter className="pointer-events-auto">
          <button
            type="button"
            onClick={() => openDrawer("shop")}
            className="group flex items-center gap-6 rounded-full bg-black/50 py-1.5 pr-1.5 pl-7 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:bg-black/70"
          >
            Shop Now
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-[#052e22] transition-transform duration-300 group-hover:rotate-90">
              <Plus size={18} strokeWidth={2.8} />
            </span>
          </button>
        </div>
        <div data-enter className="mt-auto flex items-center gap-3">
          <span className="glass grid h-12 w-12 place-items-center rounded-xl text-blush">
            <Award size={20} />
          </span>
          <span className="flex flex-col">
            <span className="text-[9px] font-bold tracking-[0.28em] text-white/45">DESIGN AWARDS</span>
            <span className="mt-0.5 text-[12px] font-bold text-white/90">PREMIUM BEVERAGE 2025</span>
          </span>
        </div>
      </div>

      {/* right column — desktop */}
      <div className="pointer-events-none absolute top-0 right-[4%] bottom-0 z-20 hidden flex-col items-end justify-between pt-40 pb-10 md:flex">
        <div data-enter className="pointer-events-auto">
          <FlavorCards
            flavor={flavor}
            onSelect={switchFlavor}
            onQuickAdd={(id) => addToCart(id, "single", 1)}
          />
          <div className="mt-5 flex justify-end gap-3">
            <ArrowButton dir="prev" onClick={() => switchFlavor(otherFlavor(flavor))} />
            <ArrowButton dir="next" onClick={() => switchFlavor(otherFlavor(flavor))} />
          </div>
        </div>
        <h2 data-enter className="font-display text-right text-[clamp(2.4rem,4.4vw,5.2rem)] leading-[0.98] text-cream drop-shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          Refreshingly
          <br />
          Clean
        </h2>
      </div>

      {/* vertical side motto */}
      <div className="absolute bottom-44 left-7 z-10 hidden rotate-180 text-[9px] font-bold tracking-[0.4em] text-white/30 uppercase [writing-mode:vertical-rl] lg:block">
        Zero Sugar — Zero Calories — Full Fizz
      </div>

      {/* mobile title */}
      <div data-enter className="pointer-events-none absolute top-[122px] left-5 z-20 md:hidden">
        <h1 className="font-display text-[13.5vw] leading-[0.92] text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          Zohaib Soda
        </h1>
        <p key={flavor} className="anim-fade-up mt-2 text-[10px] font-bold tracking-[0.3em] text-white/55 uppercase">
          {f.num} · {f.name} · Zero Sugar
        </p>
      </div>

      {/* mobile dock */}
      <div data-dock className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pt-6 pb-[max(14px,env(safe-area-inset-bottom))] md:hidden">
        <div data-enter className="flex items-end justify-center gap-2.5">
          <ArrowButton dir="prev" onClick={() => switchFlavor(otherFlavor(flavor))} />
          <FlavorCards compact flavor={flavor} onSelect={switchFlavor} onQuickAdd={(id) => addToCart(id, "single", 1)} />
          <ArrowButton dir="next" onClick={() => switchFlavor(otherFlavor(flavor))} />
        </div>
        <div data-enter className="mt-3">
          <button
            type="button"
            onClick={() => openDrawer("shop")}
            className="flex w-full items-center justify-between rounded-full bg-black/55 py-1.5 pr-1.5 pl-6 text-sm font-bold backdrop-blur transition-all active:scale-[0.98]"
          >
            Shop Now · from $2.99
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-[#052e22]">
              <Plus size={18} strokeWidth={2.8} />
            </span>
          </button>
        </div>
      </div>

      <Header
        panel={panel}
        soundOn={soundOn}
        cartCount={cartCount}
        onNav={navigate}
        onSound={toggleSound}
        onCart={() => openDrawer(drawer === "cart" ? null : "cart")}
      />

      <InfoPanels panel={panel} flavor={flavor} onClose={() => setPanel(null)} onToast={addToast} />
      <ShopDrawer
        view={drawer}
        cart={cart}
        onView={openDrawer}
        onAdd={addToCart}
        onQty={updateQty}
        onRemove={removeItem}
        onClear={() => setCart([])}
        onToast={addToast}
      />
      <Toasts items={toasts} onDismiss={dismissToast} />

      {/* loader */}
      {!loaderGone && (
        <div className={cn("fixed inset-0 z-[200] grid place-items-center bg-[#03140e] transition-opacity duration-700", ready && "pointer-events-none opacity-0")}>
          <div className="flex flex-col items-center gap-5">
            <p className="font-display text-4xl text-cream">Zohaib Soda</p>
            <div className="h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-blush transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="text-[10px] font-bold tracking-[0.35em] text-white/40 uppercase">Chilling the cans…</p>
          </div>
        </div>
      )}
    </div>
  );
}
