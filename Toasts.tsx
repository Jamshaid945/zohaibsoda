import { Check, ShoppingBag, Trash2, X } from "lucide-react";

export interface ToastData {
  id: number;
  msg: string;
  kind?: "cart" | "check" | "trash";
  action?: { label: string; fn(): void };
}

export function Toasts({ items, onDismiss }: { items: ToastData[]; onDismiss(id: number): void }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[120] flex w-full -translate-x-1/2 flex-col items-center gap-2 px-4 max-md:bottom-[236px]">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="anim-toast glass-deep pointer-events-auto flex max-w-full items-center gap-3 rounded-full py-2.5 pr-2.5 pl-4 text-[13px] font-semibold text-white shadow-2xl"
        >
          {t.kind === "cart" && <ShoppingBag size={15} className="shrink-0 text-blush" />}
          {t.kind === "check" && <Check size={15} className="shrink-0 text-mint" />}
          {t.kind === "trash" && <Trash2 size={15} className="shrink-0 text-danger" />}
          <span className="truncate">{t.msg}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => { t.action?.fn(); onDismiss(t.id); }}
              className="shrink-0 text-[12px] font-bold whitespace-nowrap text-blush underline underline-offset-2 transition-colors hover:text-white"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(t.id)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
