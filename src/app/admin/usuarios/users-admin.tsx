"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePagedList } from "@/hooks/use-paged-list";
import { changeUserRole, getUsersPage } from "@/services/admin-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { ROLE_LABELS, type UserProfile } from "@/types/user";
import { ListStates } from "../list-states";

export function UsersAdmin() {
  const { user: me } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const loader = useCallback((cursor: QueryDocumentSnapshot | null) => getUsersPage(cursor), []);
  const list = usePagedList<UserProfile>(loader, []);

  async function change(uid: string, role: "user" | "admin", name: string) {
    const msg =
      role === "admin"
        ? `¿Dar permisos de administrador a ${name}? Podrá ver datos de todos y cambiar roles.`
        : `¿Dejar a ${name} como usuario normal? Si administraba un local, lo perderá.`;
    if (!confirm(msg)) return;
    setBusy(uid);
    try {
      await changeUserRole(uid, role);
      toast.success("Rol actualizado. La persona debe volver a iniciar sesión.");
      list.reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="grid gap-4">
      <h1 className="text-3xl">Usuarios</h1>
      <ListStates
        loading={list.loading}
        error={list.error}
        empty={list.items.length === 0}
        emptyText="Todavía no hay usuarios."
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
        onLoadMore={list.loadMore}
        onRetry={list.reload}
      >
        <ul className="grid gap-2">
          {list.items.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u.displayName} {u.id === me?.uid ? <span className="text-xs text-muted-foreground">(tú)</span> : null}
                </p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
              </div>
              <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                {ROLE_LABELS[u.role]}
                {u.role === "venue" && u.venueId ? ` · ${u.venueId}` : ""}
              </Badge>
              {u.id !== me?.uid ? (
                u.role === "admin" ? (
                  <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => change(u.id, "user", u.displayName)}>
                    Quitar admin
                  </Button>
                ) : (
                  <>
                    {u.role === "venue" ? (
                      <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => change(u.id, "user", u.displayName)}>
                        Quitar local
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" disabled={busy === u.id} onClick={() => change(u.id, "admin", u.displayName)}>
                      Hacer admin
                    </Button>
                  </>
                )
              ) : null}
            </li>
          ))}
        </ul>
      </ListStates>
    </main>
  );
}
