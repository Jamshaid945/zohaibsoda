import { CupSoda, ShoppingBag, Volume2, VolumeX } from "lucide-react";
import { NAV_ITEMS, type PanelId } from "../lib/data";
import { cn } from "../utils/cn";

interface HeaderProps {
  panel: PanelId | null;
  soundOn: boolean;
  cartCount: number;
  onNav(id: PanelId | null): void;
  onSound(): void;
  onCart(): void;
}

function NavButtons({ panel, onNav, includeContact }: { panel: PanelId | null; onNav(id: PanelId | null): void; includeContact?: boolean }) {
  const items = includeContact ? [...NAV_ITEMS, { id: "contact" as PanelId, label: "Contact" }] : NAV_ITEMS;
  return (
    <>
      {items.map((item) => {
        const active = item.id === null ? panel === null : panel === item.id;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onNav(item.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300",
              active ? "bg-blush text-[#052e22] shadow-[0_4px_18px_rgba(251,207,232,0.35)]" : "text-white/65 hover:bg-white/10 hover:text-white"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </>
  );
}

export function Header({ panel, soundOn, cartCount, onNav, onSound, onCart }: HeaderProps) {
  return (
    <header data-enter-top className="fixed inset-x-0 top-0 z-50 px-[4%] pt-4 md:pt-6">
      <div className="relative flex items-center justify-between gap-3">
        <button type="button" onClick={() => onNav(null)} className="group flex items-center gap-2.5" aria-label="Zohaib Soda home">
          <span className="glass grid h-10 w-10 place-items-center rounded-xl text-blush transition-transform duration-300 group-hover:-rotate-12">
            <CupSoda size={18} strokeWidth={2.2} />
          </span>
          <span className="flex flex-col items-start">
            <span className="font-display text-[22px] leading-none text-cream">Zohaib Soda</span>
            <span className="mt-1 text-[8px] font-bold tracking-[0.32em] text-white/45">ZERO SUGAR SODA CO.</span>
          </span>
        </button>

        <nav aria-label="Primary" className="glass absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full p-1 md:flex">
          <NavButtons panel={panel} onNav={onNav} />
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSound}
            aria-pressed={soundOn}
            title={soundOn ? "Sound on — click to mute" : "Sound off — click to unmute"}
            className="glass grid h-10 w-10 place-items-center rounded-full text-white/75 transition-all hover:text-white active:scale-90"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            onClick={onCart}
            aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            className="glass relative grid h-10 w-10 place-items-center rounded-full text-white/75 transition-all hover:text-white active:scale-90"
          >
            <ShoppingBag size={16} />
            {cartCount > 0 && (
              <span key={cartCount} className="anim-pop absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-blush px-1 text-[10px] font-extrabold text-[#052e22]">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onNav("contact")}
            className={cn(
              "hidden items-center rounded-full px-6 py-2.5 text-[12.5px] font-bold transition-all duration-300 hover:-translate-y-0.5 md:inline-flex",
              panel === "contact" ? "bg-blush text-[#052e22]" : "bg-black/45 text-white hover:bg-black/65"
            )}
          >
            Contact Us
          </button>
        </div>
      </div>

      <nav
        aria-label="Primary mobile"
        className="glass zs-scroll-x mt-3 flex items-center gap-1 overflow-x-auto rounded-full p-1 md:hidden [mask-image:linear-gradient(90deg,black_88%,transparent_100%)]"
      >
        <NavButtons panel={panel} onNav={onNav} includeContact />
      </nav>
    </header>
  );
}
