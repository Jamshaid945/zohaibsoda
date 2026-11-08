import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../utils/cn";

interface SheetProps {
  open: boolean;
  onClose(): void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, subtitle, icon, children }: SheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, [open]);

  return (
    <>
      <div
        data-sheet
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[70] bg-black/55 backdrop-blur-[6px] transition-opacity duration-500",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        data-sheet
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "glass-deep fixed z-[80] flex flex-col overflow-hidden rounded-[28px] transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          "md:top-24 md:right-5 md:bottom-5 md:w-[460px]",
          "max-md:inset-x-2 max-md:bottom-2 max-md:max-h-[84vh]",
          open
            ? "translate-x-0 translate-y-0 opacity-100"
            : "pointer-events-none opacity-0 max-md:translate-y-10 md:translate-x-10"
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/8 text-blush">{icon}</span>}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-extrabold tracking-tight text-white">{title}</h2>
            {subtitle && <p className="truncate text-[11px] font-medium text-white/50">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/8 text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-90"
          >
            <X size={16} />
          </button>
        </div>
        <div className="zs-scroll flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
      </aside>
    </>
  );
}
