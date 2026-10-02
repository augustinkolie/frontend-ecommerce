"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/confirm";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { api, errorMessage } from "@/lib/api/browser";
import { useApi, useApiMutation, useLocalPage } from "@/lib/admin/hooks";
import { ROLE_LABEL } from "@/lib/admin/labels";
import type { StaffMember } from "@/lib/admin/types";

const ROLE_SCOPE: Record<string, string> = {
  OWNER: "Tout, y compris paramètres et équipe",
  MANAGER: "Produits, stock, commandes, promotions, contenu",
  SUPPORT: "Commandes (remboursement plafonné), clients, avis",
  STOCK: "Stock et préparation des commandes",
};

export default function TeamPage() {
  const query = useApi<StaffMember[]>("/admin/team");
  const update = useApiMutation(["/admin/team"], "Membre mis à jour");
  const paged = useLocalPage(query.data ?? [], "equipe");
  const confirm = useConfirm();
  const [invite, setInvite] = useState<{ email: string; name: string; role: string } | null>(null);
  const [created, setCreated] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Équipe" description="Comptes admin et rôles. Chaque rôle ne voit que ses modules." actions={<Button size="admin" variant="accent" onClick={() => setInvite({ email: "", name: "", role: "SUPPORT" })}>Ajouter un membre</Button>} />
      {created && (
        <div className="mb-4">
          <Alert tone="success" title={`Compte créé pour ${created.email}`}>
            Mot de passe provisoire, affiché une seule fois : <code className="font-semibold">{created.temporaryPassword}</code>. Transmettez-le de façon sûre.
          </Alert>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <QueryState query={query}>
            {(rows) => (
              <Panel title={`Membres (${rows.length})`}>
                <ul>
                  {paged.items.map((m) => (
                    <li key={m.id} className="flex min-h-10 items-center gap-3 border-b border-line py-1 last:border-b-0">
                      <span className="flex-1"><span className="font-medium">{m.name ?? m.email}</span><br /><span className="text-xs text-ink-muted">{m.email}</span></span>
                      {!m.active && <Badge tone="danger">Désactivé</Badge>}
                      <label htmlFor={`role-${m.id}`} className="sr-only">Rôle</label>
                      <div className="w-40">
                        <Select
                          id={`role-${m.id}`}
                          density="admin"
                          value={m.role}
                          onChange={async (e) => {
                            const role = e.target.value;
                            if (await confirm({ title: "Changer le rôle", message: `${m.name ?? m.email} deviendra ${ROLE_LABEL[role]} et sera déconnecté.` })) {
                              update.mutate({ path: `/admin/team/${m.id}`, method: "PATCH", json: { role } });
                            }
                          }}
                        >
                          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </Select>
                      </div>
                      <Button
                        size="admin"
                        variant="ghost"
                        onClick={async () => {
                          const active = !m.active;
                          if (!active && !(await confirm({ title: "Désactiver le compte", message: `${m.email} ne pourra plus se connecter.`, confirmLabel: "Désactiver", danger: true }))) return;
                          update.mutate({ path: `/admin/team/${m.id}`, method: "PATCH", json: { active } });
                        }}
                      >
                        {m.active ? "Désactiver" : "Réactiver"}
                      </Button>
                    </li>
                  ))}
                </ul>
                {rows.length > 0 && <Pagination density="admin" noun="membres" className="mt-3 border-t border-line pt-3" {...paged.pagination} />}
              </Panel>
            )}
          </QueryState>
        </div>
        <Panel title="Rôles">
          <dl className="flex flex-col gap-3">
            {Object.entries(ROLE_SCOPE).map(([k, v]) => (
              <div key={k}><dt className="font-medium">{ROLE_LABEL[k]}</dt><dd className="text-ink-muted">{v}</dd></div>
            ))}
          </dl>
        </Panel>
      </div>

      <Modal
        open={!!invite}
        onOpenChange={(o) => !o && setInvite(null)}
        title="Ajouter un membre"
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setInvite(null)}>Annuler</Button>
            <Button
              size="admin"
              variant="accent"
              onClick={async () => {
                if (!invite) return;
                setError(null);
                try {
                  const res = await api<{ email: string; temporaryPassword: string }>("/admin/team", { method: "POST", json: invite });
                  setCreated(res);
                  setInvite(null);
                  void query.refetch();
                } catch (err) {
                  setError(errorMessage(err));
                }
              }}
            >
              Créer le compte
            </Button>
          </>
        }
      >
        {invite && (
          <div className="flex flex-col gap-4">
            <Field id="t-email" label="E-mail"><Input id="t-email" density="admin" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /></Field>
            <Field id="t-name" label="Nom"><Input id="t-name" density="admin" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></Field>
            <Field id="t-role" label="Rôle" hint={ROLE_SCOPE[invite.role]}>
              <Select id="t-role" density="admin" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
