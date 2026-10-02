"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";

type Options = { title: string; message: string; confirmLabel?: string; danger?: boolean };

const Ctx = createContext<(o: Options) => Promise<boolean>>(async () => false);

/** Confirmation obligatoire avant toute action destructive (tracée ensuite dans l'audit). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<Options | null>(null);
  const resolver = useRef<(v: boolean) => void>(() => {});
  const confirm = useCallback(
    (o: Options) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOpts(o);
      }),
    [],
  );
  const close = (v: boolean) => {
    resolver.current(v);
    setOpts(null);
  };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onOpenChange={(o) => !o && close(false)}
        title={opts?.title ?? ""}
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => close(false)}>Annuler</Button>
            <Button size="admin" variant={opts?.danger ? "danger" : "accent"} onClick={() => close(true)}>
              {opts?.confirmLabel ?? "Confirmer"}
            </Button>
          </>
        }
      >
        <p className="text-sm">{opts?.message}</p>
      </Modal>
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);
