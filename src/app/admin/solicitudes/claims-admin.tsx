"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { usePagedList } from "@/hooks/use-paged-list";
import { useNow } from "@/hooks/use-now";
import { decideClaim, getClaimsPage } from "@/services/admin-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VenueClaim } from "@/types/venue";
import { ListStates } from "../list-states";

const TABS: { value: VenueClaim["status"]; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

export function ClaimsAdmin() {
  const [status, setStatus] = useState<VenueClaim["status"]>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const now = useNow();
  const loader = useCallback((cursor: QueryDocumentSnapshot | null) => getClaimsPage(status, cursor), [status]);
  const list = usePagedList<VenueClaim>(loader, [status]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusy(id);
    try {
      await decideClaim(id, decision);
      toast.success(
        decision === "approved"
          ? "Solicitud aprobada. La persona debe volver a iniciar sesión para ver su panel."
          : "Solicitud rechazada."
      );
      list.reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="grid gap-4">
      <h1 className="text-3xl">Solicitudes de dueños</h1>
      <div role="tablist" aria-label="Estado" className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={status === t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              status === t.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ListStates
        loading={list.loading}
        error={list.error}
        empty={list.items.length === 0}
        emptyText="No hay solicitudes aquí."
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
        onLoadMore={list.loadMore}
        onRetry={list.reload}
      >
        {list.items.map((c) => (
          <article key={c.id} className="grid gap-2 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {c.applicantName} <span className="font-normal text-muted-foreground">quiere administrar</span> {c.venueId}
              </p>
              <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt?.toMillis() ?? null, now)}</span>
            </div>
            <p className="text-sm">{c.message}</p>
            <p className="text-sm text-muted-foreground">
              Teléfono: <a className="underline" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a> · Cuenta: {c.uid}
            </p>
            {c.status === "pending" ? (
              <div className="flex gap-2">
                <Button onClick={() => decide(c.id, "approved")} disabled={busy === c.id}>
                  Aprobar
                </Button>
                <Button variant="outline" onClick={() => decide(c.id, "rejected")} disabled={busy === c.id}>
                  Rechazar
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </ListStates>
    </main>
  );
}
