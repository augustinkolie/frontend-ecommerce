"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "danger";
type Item = { id: number; text: string; tone: Tone };

const Ctx = createContext<{ show: (text: string, tone?: Tone) => void }>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const show = useCallback((text: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-2), { id, text, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), tone === "danger" ? 7000 : 3500);
  }, []);
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "danger" ? "alert" : "status"}
            className={cn("flex animate-modal-in items-start gap-2 rounded-sm py-1 pr-1 pl-3 text-sm shadow-overlay", t.tone === "danger" ? "bg-danger text-on-ink" : "bg-ink text-on-ink")}
          >
            <p className="flex-1 py-2">{t.text}</p>
            <button type="button" aria-label="Fermer" onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))} className="inline-flex size-9 shrink-0 items-center justify-center">
              <X aria-hidden size={16} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
