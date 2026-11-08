import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { FLAVORS, FLAVOR_ORDER, money, PACKS, type FlavorId } from "../lib/data";
import { cn } from "../utils/cn";

interface CardsProps {
  flavor: FlavorId;
  compact?: boolean;
  onSelect(f: FlavorId): void;
  onQuickAdd(f: FlavorId): void;
}

export function FlavorCards({ flavor, compact, onSelect, onQuickAdd }: CardsProps) {
  return (
    <div className={cn("flex", compact ? "gap-3" : "gap-4")}>
      {FLAVOR_ORDER.map((id) => {
        const f = FLAVORS[id];
        const active = flavor === id;
        return (
          <div key={id} className="group relative">
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(id)}
              className={cn(
                "glass flex cursor-pointer flex-col items-center rounded-[26px] px-3 text-center transition-all duration-300",
                compact ? "w-[116px] pt-11 pb-3" : "w-[132px] pt-14 pb-4",
                active
                  ? "-translate-y-1 border-blush/70 bg-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
                  : "hover:-translate-y-1 hover:border-white/40 hover:bg-white/10"
              )}
            >
              <span className="absolute top-3 left-3.5 text-[8px] font-bold tracking-[0.25em] text-white/40">{f.num}</span>
              <img
                src={f.can}
                alt={`${f.name} can`}
                draggable={false}
                className={cn(
                  "pointer-events-none w-auto object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-3 group-hover:scale-110 group-hover:-rotate-[10deg]",
                  compact ? "-mt-[72px] h-24" : "-mt-24 h-32"
                )}
              />
              <span className={cn("mt-2 text-xs font-bold", active ? "text-cream" : "text-white/85")}>{f.name}</span>
              <span className="mt-0.5 text-[11px] font-medium text-white/55">{money(PACKS[0].price)}</span>
            </button>
            <button
              type="button"
              aria-label={`Add one ${f.name} to cart`}
              title="Quick add a single can"
              onClick={() => onQuickAdd(id)}
              className={cn(
                "absolute top-2.5 right-2.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/80 transition-all duration-300 hover:bg-blush hover:text-[#052e22] active:scale-90",
                compact ? "" : "md:opacity-0 md:group-hover:opacity-100"
              )}
            >
              <Plus size={14} strokeWidth={2.6} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ArrowButton({ dir, onClick }: { dir: "prev" | "next"; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous flavor" : "Next flavor"}
      className="glass grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/75 transition-all duration-300 hover:bg-white/15 hover:text-white active:scale-90"
    >
      {dir === "prev" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
    </button>
  );
}
