"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePagedList } from "@/hooks/use-paged-list";
import { getVenuesPage, setVenueFlags } from "@/services/admin-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { VENUE_TYPE_LABELS, type Venue } from "@/types/venue";
import { ListStates } from "../list-states";

export function VenuesAdmin() {
  const [busy, setBusy] = useState<string | null>(null);
  const loader = useCallback((cursor: QueryDocumentSnapshot | null) => getVenuesPage(cursor), []);
  const list = usePagedList<Venue>(loader, []);

  async function flag(id: string, patch: { status?: "active" | "hidden"; verified?: boolean }, message: string) {
    setBusy(id);
    try {
      await setVenueFlags(id, patch);
      toast.success(message);
      list.reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Locales</h1>
        <Link href="/admin/locales/nuevo" className={buttonVariants()}>
          <PlusIcon aria-hidden="true" /> Nuevo local
        </Link>
      </div>
      <ListStates
        loading={list.loading}
        error={list.error}
        empty={list.items.length === 0}
        emptyText="Todavía no hay locales. Crea el primero."
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
        onLoadMore={list.loadMore}
        onRetry={list.reload}
      >
        <ul className="grid gap-2">
          {list.items.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  <Link href={`/locales/${v.id}`} className="hover:underline">
                    {v.name}
                  </Link>
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {VENUE_TYPE_LABELS[v.type]} · {v.address} · {v.ownerUid ? "Con dueño" : "Sin dueño"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={v.status === "active" ? "secondary" : "outline"}>{v.status === "active" ? "Visible" : "Oculto"}</Badge>
                <Badge variant={v.verified ? "secondary" : "outline"}>{v.verified ? "Verificado" : "Sin verificar"}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === v.id}
                  onClick={() => flag(v.id, { verified: !v.verified }, v.verified ? "Verificación quitada." : "Local verificado.")}
                >
                  {v.verified ? "Quitar verificación" : "Verificar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === v.id}
                  onClick={() =>
                    flag(
                      v.id,
                      { status: v.status === "active" ? "hidden" : "active" },
                      v.status === "active" ? "Local oculto del mapa." : "Local visible en el mapa."
                    )
                  }
                >
                  {v.status === "active" ? "Ocultar" : "Mostrar"}
                </Button>
                <Link href={`/admin/locales/${v.id}`} className={buttonVariants({ size: "sm", variant: "ghost" })}>
                  Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </ListStates>
    </main>
  );
}
