import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CupSoda, Loader2, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Sheet } from "./Sheet";
import {
  FLAVORS, FLAVOR_ORDER, FREE_SHIP_AT, money, packById, PACKS,
  type CartItem, type FlavorId, type PackId,
} from "../lib/data";
import { cn } from "../utils/cn";

export type DrawerView = "shop" | "cart";

interface ShopDrawerProps {
  view: DrawerView | null;
  cart: CartItem[];
  onView(v: DrawerView | null): void;
  onAdd(f: FlavorId, p: PackId, qty: number): void;
  onQty(index: number, qty: number): void;
  onRemove(index: number): void;
  onClear(): void;
  onToast(msg: string, kind?: "cart" | "check" | "trash"): void;
}

function Stepper({ value, onChange, min = 1 }: { value: number; onChange(v: number): void; min?: number }) {
  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="grid h-7 w-7 place-items-center rounded-full bg-white/8 text-white/80 transition-all hover:bg-white/15 active:scale-90 disabled:opacity-30"
      >
        <Minus size={12} />
      </button>
      <span className="w-6 text-center text-sm font-extrabold text-white">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= 24}
        onClick={() => onChange(value + 1)}
        className="grid h-7 w-7 place-items-center rounded-full bg-white/8 text-white/80 transition-all hover:bg-white/15 active:scale-90 disabled:opacity-30"
      >
        <Plus size={12} />
      </button>
    </span>
  );
}

function ShopRow({ flavor, onAdd }: { flavor: FlavorId; onAdd(f: FlavorId, p: PackId, q: number): void }) {
  const f = FLAVORS[flavor];
  const [pack, setPack] = useState<PackId>("single");
  const [qty, setQty] = useState(1);
  const price = packById(pack).price * qty;
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex gap-4">
        <img src={f.can} alt={`${f.name} can`} className="h-24 w-14 shrink-0 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]" draggable={false} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-white">{f.name}</p>
          <p className="text-[11px] font-semibold text-white/45">{f.sub}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {PACKS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPack(p.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all",
                  pack === p.id ? "border-blush/70 bg-blush/15 text-blush" : "border-white/15 text-white/55 hover:border-white/35 hover:text-white"
                )}
              >
                {p.short} · {money(p.price)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Stepper value={qty} onChange={setQty} />
        <span className="ml-auto text-[15px] font-extrabold text-cream">{money(price)}</span>
        <button
          type="button"
          onClick={() => { onAdd(flavor, pack, qty); setQty(1); }}
          className="flex items-center gap-1.5 rounded-full bg-blush px-4 py-2.5 text-[12px] font-extrabold text-[#052e22] transition-all hover:brightness-105 active:scale-95"
        >
          <ShoppingBag size={13} /> Add
        </button>
      </div>
    </div>
  );
}

export function ShopDrawer({ view, cart, onView, onAdd, onQty, onRemove, onClear, onToast }: ShopDrawerProps) {
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [order, setOrder] = useState<{ no: string; total: number; cans: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastView = useRef<DrawerView>("shop");
  if (view) lastView.current = view;
  const shown = view ?? lastView.current;

  useEffect(() => {
    if (view === null) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("idle");
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [view]);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const cans = cart.reduce((s, i) => s + i.qty * packById(i.pack).cans, 0);
  const subtotal = cart.reduce((s, i) => s + i.qty * packById(i.pack).price, 0);
  const freeShip = subtotal >= FREE_SHIP_AT;
  const shipping = cart.length === 0 || freeShip ? 0 : 4.9;
  const total = subtotal + shipping;

  const checkout = () => {
    if (phase !== "idle" || cart.length === 0) return;
    setPhase("processing");
    timerRef.current = setTimeout(() => {
      setOrder({ no: `ZS-${Math.floor(1000 + Math.random() * 9000)}`, total, cans });
      setPhase("done");
      onClear();
      onToast("Order confirmed — the crate is on its way", "check");
    }, 1300);
  };

  return (
    <Sheet
      open={view !== null}
      onClose={() => onView(null)}
      title="Shop the fizz"
      subtitle={`Free shipping over ${money(FREE_SHIP_AT)} · Ships cold in 48 h`}
      icon={<ShoppingBag size={17} />}
    >
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-white/6 p-1">
        {(["shop", "cart"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onView(v)}
            className={cn(
              "rounded-full py-2 text-[12px] font-extrabold transition-all",
              shown === v ? "bg-blush text-[#052e22]" : "text-white/60 hover:text-white"
            )}
          >
            {v === "shop" ? "Shop" : `Cart${count > 0 ? ` · ${count}` : ""}`}
          </button>
        ))}
      </div>

      {shown === "shop" && (
        <div className="anim-fade-up space-y-3">
          {FLAVOR_ORDER.map((id) => (
            <ShopRow key={id} flavor={id} onAdd={onAdd} />
          ))}
          <p className="pt-1 text-center text-[11px] font-medium text-white/40">
            Every order ships in a plastic-free, fully recyclable crate.
          </p>
        </div>
      )}

      {shown === "cart" && phase === "done" && order && (
        <div className="anim-fade-up flex flex-col items-center py-10 text-center">
          <CheckCircle2 size={52} className="anim-pop text-mint" />
          <h3 className="mt-4 font-display text-2xl text-cream">Order {order.no} confirmed</h3>
          <p className="mt-2 text-sm font-semibold text-white/70">{order.cans} cans · {money(order.total)}</p>
          <p className="mt-1 max-w-[280px] text-[12px] leading-relaxed text-white/45">
            Your crate leaves the Soda Works within 48 hours, packed cold and plastic-free.
          </p>
          <button
            type="button"
            onClick={() => { setPhase("idle"); onView("shop"); }}
            className="mt-6 rounded-full bg-blush px-6 py-2.5 text-[12.5px] font-extrabold text-[#052e22] transition-all hover:brightness-105 active:scale-95"
          >
            Back to the fizz
          </button>
          <p className="mt-4 text-[10px] font-medium text-white/30">Demo checkout — no payment was taken.</p>
        </div>
      )}

      {shown === "cart" && phase !== "done" && (
        cart.length === 0 ? (
          <div className="anim-fade-up flex flex-col items-center py-12 text-center">
            <CupSoda size={44} className="text-white/20" />
            <p className="mt-4 text-[15px] font-extrabold text-white/70">Your crate is empty</p>
            <p className="mt-1 text-[12.5px] text-white/40">That's no way to hydrate. Let's fix it.</p>
            <button
              type="button"
              onClick={() => onView("shop")}
              className="mt-5 rounded-full bg-blush px-6 py-2.5 text-[12.5px] font-extrabold text-[#052e22] transition-all hover:brightness-105 active:scale-95"
            >
              Browse the fizz
            </button>
          </div>
        ) : (
          <div className="anim-fade-up space-y-3">
            {cart.map((item, i) => {
              const f = FLAVORS[item.flavor];
              const p = packById(item.pack);
              return (
                <div key={`${item.flavor}-${item.pack}`} className="glass flex items-center gap-3 rounded-2xl p-3">
                  <img src={f.can} alt="" className="h-16 w-10 shrink-0 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]" draggable={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold text-white">{f.name}</p>
                    <p className="text-[11px] font-semibold text-white/45">{p.label} · {money(p.price)}</p>
                    <div className="mt-1.5">
                      <Stepper value={item.qty} onChange={(q) => onQty(i, q)} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[13.5px] font-extrabold text-cream">{money(p.price * item.qty)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.name} ${p.short} from cart`}
                      onClick={() => onRemove(i)}
                      className="grid h-7 w-7 place-items-center rounded-full text-white/40 transition-all hover:bg-danger/15 hover:text-danger active:scale-90"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
              {freeShip ? (
                <p className="flex items-center gap-2 text-[12px] font-extrabold text-mint">
                  <Truck size={14} /> Free shipping unlocked
                </p>
              ) : (
                <p className="text-[12px] font-bold text-white/65">
                  <Truck size={13} className="mr-1.5 inline text-zest" />
                  {money(FREE_SHIP_AT - subtotal)} away from free shipping
                </p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mint to-zest transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIP_AT) * 100)}%` }}
                />
              </div>
              <div className="mt-3 space-y-1.5 text-[12.5px] font-semibold text-white/60">
                <p className="flex justify-between"><span>Subtotal · {cans} cans</span><span>{money(subtotal)}</span></p>
                <p className="flex justify-between"><span>Cold-chain shipping</span><span className={freeShip ? "text-mint" : ""}>{freeShip ? "Free" : money(shipping)}</span></p>
                <p className="flex justify-between border-t border-white/10 pt-2 text-[15px] font-extrabold text-cream"><span>Total</span><span>{money(total)}</span></p>
              </div>
            </div>

            <button
              type="button"
              onClick={checkout}
              disabled={phase === "processing"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blush py-3.5 text-[13.5px] font-extrabold text-[#052e22] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-80"
            >
              {phase === "processing" ? (
                <><Loader2 size={15} className="animate-spin" /> Cracking the crate…</>
              ) : (
                <>Checkout · {money(total)}</>
              )}
            </button>
            <p className="text-center text-[10px] font-medium text-white/30">Demo checkout — no payment is taken.</p>
          </div>
        )
      )}
    </Sheet>
  );
}
