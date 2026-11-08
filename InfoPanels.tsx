import { useMemo, useRef, useState } from "react";
import {
  Citrus, CheckCircle2, Droplets, FlaskConical, GlassWater, Leaf, Mail, MapPin,
  PenLine, Recycle, Send, Star, Thermometer,
} from "lucide-react";
import { Sheet } from "./Sheet";
import { FLAVORS, FLAVOR_ORDER, SEED_REVIEWS, type FlavorId, type PanelId, type Review } from "../lib/data";
import { cn } from "../utils/cn";

/* ---------------------------------- shared ---------------------------------- */

const inputCls =
  "w-full rounded-xl border border-white/12 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-blush/60 focus:bg-white/8";

function Chip({ children, tone = "mint" }: { children: React.ReactNode; tone?: "mint" | "blush" | "zest" | "cobalt" }) {
  const tones = {
    mint: "bg-mint/12 text-mint border-mint/25",
    blush: "bg-blush/12 text-blush border-blush/25",
    zest: "bg-zest/12 text-zest border-zest/25",
    cobalt: "bg-cobalt/12 text-cobalt border-cobalt/25",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold", tones[tone])}>
      {children}
    </span>
  );
}

function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= value ? "fill-warn text-warn" : "fill-white/15 text-white/15"} />
      ))}
    </span>
  );
}

/* -------------------------------- ingredients ------------------------------- */

function IngredientsPanel({ flavor }: { flavor: FlavorId }) {
  const f = FLAVORS[flavor];
  return (
    <div key={flavor} className="anim-fade-up space-y-5">
      <div className="flex flex-wrap gap-2">
        <Chip tone="mint">0 g sugar</Chip>
        <Chip tone="blush">4 kcal</Chip>
        <Chip tone="zest">Caffeine-free</Chip>
        <Chip tone="cobalt">Vegan</Chip>
      </div>
      <div>
        <h3 className="text-[13px] font-extrabold tracking-[0.18em] text-white/45 uppercase">Inside the {f.name} can</h3>
        <ul className="mt-3 space-y-2.5">
          {f.ingredients.map((ing, i) => (
            <li key={ing} className="flex items-center gap-3 text-sm font-medium text-white/85">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-[10px] font-extrabold text-blush">
                {i + 1}
              </span>
              {ing}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-cream p-4 text-[#0b2b20]">
        <p className="border-b-4 border-[#0b2b20] pb-1 text-lg font-extrabold">Nutrition Facts</p>
        <p className="border-b border-[#0b2b20]/30 py-1 text-[11px] font-semibold">Per 330 ml can · 1 serving</p>
        {[
          ["Energy", "4 kcal"],
          ["Fat", "0 g"],
          ["Carbohydrate", "0 g"],
          ["— of which sugars", "0 g"],
          ["Protein", "0 g"],
          ["Salt", "0.01 g"],
        ].map(([k, v]) => (
          <p key={k} className="flex justify-between border-b border-[#0b2b20]/20 py-1.5 text-[12.5px] font-semibold">
            <span>{k}</span>
            <span className="font-extrabold">{v}</span>
          </p>
        ))}
        <p className="pt-2 text-[10.5px] font-medium opacity-70">
          Sweetened with stevia leaf. No artificial colors, no preservatives, no compromise.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------- taste ---------------------------------- */

function TastePanel({ flavor }: { flavor: FlavorId }) {
  const f = FLAVORS[flavor];
  return (
    <div key={flavor} className="anim-fade-up space-y-5">
      <p className="text-sm leading-relaxed text-white/75">{f.description}</p>
      <div className="flex flex-wrap gap-2">
        <Chip tone="cobalt"><Thermometer size={11} /> Serve at 4 °C</Chip>
        <Chip tone="blush"><GlassWater size={11} /> Pour over clear ice</Chip>
      </div>
      <div>
        <h3 className="text-[13px] font-extrabold tracking-[0.18em] text-white/45 uppercase">Flavor profile · {f.name}</h3>
        <div className="mt-3 space-y-3.5">
          {f.meters.map((m, i) => (
            <div key={m.label}>
              <div className="mb-1.5 flex items-baseline justify-between text-[12px] font-bold">
                <span className="text-white/80">{m.label}</span>
                <span className="text-white/45">{m.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="zs-meter h-full rounded-full"
                  style={{
                    width: `${m.value}%`,
                    background: `linear-gradient(90deg, ${f.colors.chip}, #fbcfe8)`,
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-[13px] font-extrabold tracking-[0.18em] text-white/45 uppercase">Tasting notes</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {f.notes.map((n) => (
            <span key={n} className="rounded-full border border-white/15 bg-white/6 px-3.5 py-1.5 text-[12px] font-semibold text-cream">
              {n}
            </span>
          ))}
        </div>
      </div>
      <p className="rounded-2xl border border-white/10 bg-white/4 p-4 text-[12.5px] leading-relaxed text-white/60">
        <span className="font-display text-base text-blush">Sommelier's tip — </span>
        crack the can, wait four seconds for the fizz to settle, then sip across the tongue. The {f.fruit.toLowerCase()} lands
        first, the spring-water finish cleans up after it.
      </p>
    </div>
  );
}

/* ------------------------------------ eco ----------------------------------- */

function EcoPanel() {
  const stats = [
    { icon: <Recycle size={18} />, big: "100%", label: "Infinitely recyclable aluminum, back on shelves in 60 days", tone: "text-mint" },
    { icon: <Leaf size={18} />, big: "75%", label: "Recycled content already inside every single can", tone: "text-zest" },
    { icon: <Droplets size={18} />, big: "1%", label: "Of revenue flows to clean-water projects worldwide", tone: "text-cobalt" },
  ];
  return (
    <div className="anim-fade-up space-y-5">
      <p className="text-sm leading-relaxed text-white/75">
        Zero sugar is a promise to your body. Zero waste is a promise to the planet. Our cans are minted from
        three-quarters recycled aluminum and can be reborn forever — no downcycling, no landfill epilogue.
      </p>
      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.big} className="glass flex items-center gap-4 rounded-2xl p-4">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/8", s.tone)}>{s.icon}</span>
            <div>
              <p className={cn("text-xl leading-none font-extrabold", s.tone)}>{s.big}</p>
              <p className="mt-1 text-[12.5px] leading-snug font-medium text-white/70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-zest/25 bg-zest/8 p-4">
        <p className="text-[13px] font-extrabold text-zest">The Can-Back Club</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">
          Return 12 empty Zohaib cans to any partner point and your 13th can is on us. Crushed, dented, label-free —
          we take them all. Aluminum doesn't hold grudges.
        </p>
      </div>
      <p className="text-[11px] leading-relaxed text-white/40">
        Packaging audit 2025 · Certified plastic-free shipping · Carbon-neutral cold chain across all 14 markets.
      </p>
    </div>
  );
}

/* ---------------------------------- reviews --------------------------------- */

const REVIEWS_KEY = "zs-reviews-v1";

function loadUserReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Review[];
    return Array.isArray(parsed) ? parsed.filter((r) => r && r.id && r.text) : [];
  } catch {
    return [];
  }
}

function ReviewsPanel({ flavor, onToast }: { flavor: FlavorId; onToast(msg: string, kind?: "cart" | "check" | "trash"): void }) {
  const [userReviews, setUserReviews] = useState<Review[]>(loadUserReviews);
  const [filter, setFilter] = useState<"all" | FlavorId>("all");
  const [writing, setWriting] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [revFlavor, setRevFlavor] = useState<FlavorId>(flavor);
  const [error, setError] = useState("");

  const all = useMemo(() => [...userReviews, ...SEED_REVIEWS], [userReviews]);
  const shown = filter === "all" ? all : all.filter((r) => r.flavor === filter);
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;

  const submit = () => {
    if (name.trim().length < 2) return setError("Tell us your name (2+ characters).");
    if (rating === 0) return setError("Pick a star rating first.");
    if (text.trim().length < 10) return setError("Give us at least 10 characters of fizz feedback.");
    const review: Review = {
      id: `u${Date.now()}`,
      name: name.trim(),
      rating,
      flavor: revFlavor,
      text: text.trim(),
      date: "Just now",
    };
    const next = [review, ...userReviews];
    setUserReviews(next);
    try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    setWriting(false); setName(""); setText(""); setRating(0); setError("");
    onToast("Review published — cheers!", "check");
  };

  return (
    <div className="anim-fade-up space-y-4">
      <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
        <p className="font-display text-4xl text-cream">{avg.toFixed(1)}</p>
        <div>
          <Stars value={Math.round(avg)} size={14} />
          <p className="mt-1 text-[11.5px] font-semibold text-white/50">{(2314 + userReviews.length).toLocaleString()} verified sippers</p>
        </div>
        <button
          type="button"
          onClick={() => setWriting((w) => !w)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-blush px-4 py-2 text-[11.5px] font-extrabold text-[#052e22] transition-all hover:brightness-105 active:scale-95"
        >
          <PenLine size={12} /> Write
        </button>
      </div>

      {writing && (
        <div className="anim-fade-up space-y-3 rounded-2xl border border-blush/25 bg-blush/6 p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} maxLength={40} />
          <div className="flex items-center gap-2">
            {FLAVOR_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setRevFlavor(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all",
                  revFlavor === id ? "border-blush/70 bg-blush/15 text-blush" : "border-white/15 text-white/60 hover:border-white/35"
                )}
              >
                {FLAVORS[id].name}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i} star${i > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  className="p-0.5 transition-transform hover:scale-125"
                >
                  <Star size={16} className={i <= (hover || rating) ? "fill-warn text-warn" : "fill-white/15 text-white/15"} />
                </button>
              ))}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How did it fizz?"
            rows={3}
            maxLength={400}
            className={cn(inputCls, "resize-none")}
          />
          {error && <p className="text-[12px] font-semibold text-danger">{error}</p>}
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-full bg-blush py-2.5 text-[12.5px] font-extrabold text-[#052e22] transition-all hover:brightness-105 active:scale-[0.98]"
          >
            Publish review
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {(["all", ...FLAVOR_ORDER] as const).map((id) => {
          const count = id === "all" ? all.length : all.filter((r) => r.flavor === id).length;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-all",
                filter === id ? "border-blush/70 bg-blush/15 text-blush" : "border-white/15 text-white/55 hover:border-white/35 hover:text-white"
              )}
            >
              {id === "all" ? "All" : FLAVORS[id].name} · {count}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {shown.map((r) => {
          const f = FLAVORS[r.flavor];
          return (
            <article key={r.id} className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-extrabold"
                  style={{ backgroundColor: `${f.colors.chip}26`, color: f.colors.chip }}
                >
                  {r.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold text-white">{r.name}</p>
                  <p className="text-[10.5px] font-medium text-white/40">{r.date}</p>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <Stars value={r.rating} />
                  <span className="text-[9.5px] font-bold tracking-wider uppercase" style={{ color: f.colors.chip }}>{f.name}</span>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-white/75">{r.text}</p>
            </article>
          );
        })}
        {shown.length === 0 && <p className="py-6 text-center text-sm text-white/40">No reviews for this flavor yet — be the first.</p>}
      </div>
    </div>
  );
}

/* ---------------------------------- contact --------------------------------- */

function ContactPanel({ onToast }: { onToast(msg: string, kind?: "cart" | "check" | "trash"): void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (name.trim().length < 2) return setError("Your name needs at least 2 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("That email doesn't look quite right.");
    if (msg.trim().length < 10) return setError("Tell us a little more (10+ characters).");
    setError("");
    setSent(true);
    onToast("Message sent — we'll fizz back within 24 h", "check");
  };

  if (sent) {
    return (
      <div className="anim-fade-up flex flex-col items-center py-10 text-center">
        <CheckCircle2 size={52} className="anim-pop text-mint" />
        <h3 className="mt-4 font-display text-2xl text-cream">Message cracked open!</h3>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-white/60">
          Thanks, {name.trim().split(" ")[0]}. A real human from the soda works will reply within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => { setSent(false); setName(""); setEmail(""); setMsg(""); }}
          className="mt-6 rounded-full bg-white/10 px-6 py-2.5 text-[12.5px] font-bold text-white transition-all hover:bg-white/15 active:scale-95"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="anim-fade-up space-y-4">
      <a
        href="mailto:hello@zohaibsoda.com"
        className="glass flex items-center gap-3 rounded-2xl p-4 transition-all hover:border-blush/40"
      >
        <Mail size={17} className="text-blush" />
        <div>
          <p className="text-[13px] font-extrabold text-white">hello@zohaibsoda.com</p>
          <p className="text-[11px] font-medium text-white/45">Wholesale, press & love letters</p>
        </div>
      </a>
      <p className="flex items-center gap-2 text-[11.5px] font-semibold text-white/45">
        <MapPin size={13} className="text-zest" /> The Soda Works · Karachi · Dubai · London
      </p>
      <div className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} maxLength={60} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" className={inputCls} maxLength={80} />
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="What's on your mind?" rows={4} maxLength={800} className={cn(inputCls, "resize-none")} />
        {error && <p className="text-[12px] font-semibold text-danger">{error}</p>}
        <button
          type="button"
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-blush py-3 text-[13px] font-extrabold text-[#052e22] transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <Send size={14} /> Send it over
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- wrapper --------------------------------- */

const META: Record<PanelId, { title: string; subtitle: string; icon: React.ReactNode }> = {
  ingredients: { title: "Ingredients", subtitle: "Six things. Nothing to hide.", icon: <FlaskConical size={17} /> },
  taste: { title: "Taste", subtitle: "The anatomy of a clean fizz", icon: <Citrus size={17} /> },
  eco: { title: "Eco", subtitle: "Zero sugar, zero waste", icon: <Recycle size={17} /> },
  reviews: { title: "Reviews", subtitle: "Word on the street (and the fridge)", icon: <Star size={17} /> },
  contact: { title: "Contact Us", subtitle: "The Soda Works is listening", icon: <Mail size={17} /> },
};

interface InfoPanelsProps {
  panel: PanelId | null;
  flavor: FlavorId;
  onClose(): void;
  onToast(msg: string, kind?: "cart" | "check" | "trash"): void;
}

export function InfoPanels({ panel, flavor, onClose, onToast }: InfoPanelsProps) {
  const lastRef = useRef<PanelId>("ingredients");
  if (panel) lastRef.current = panel;
  const shown = panel ?? lastRef.current;
  const meta = META[shown];

  return (
    <Sheet open={panel !== null} onClose={onClose} title={meta.title} subtitle={meta.subtitle} icon={meta.icon}>
      {shown === "ingredients" && <IngredientsPanel flavor={flavor} />}
      {shown === "taste" && <TastePanel flavor={flavor} />}
      {shown === "eco" && <EcoPanel />}
      {shown === "reviews" && <ReviewsPanel flavor={flavor} onToast={onToast} />}
      {shown === "contact" && <ContactPanel onToast={onToast} />}
    </Sheet>
  );
}
