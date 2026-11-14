"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import { toast } from "sonner";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { usePagedList } from "@/hooks/use-paged-list";
import { useNow } from "@/hooks/use-now";
import { getLatestReviewsPage } from "@/services/admin-service";
import { deleteReview } from "@/services/venue-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { timeAgo } from "@/lib/format";
import type { Review } from "@/types/venue";
import { ListStates } from "../list-states";

/** Moderación: últimas reseñas de todos los locales, con opción de borrar las que incumplan las reglas. */
export function ReviewsAdmin() {
  const [busy, setBusy] = useState<string | null>(null);
  const now = useNow();
  const loader = useCallback((cursor: QueryDocumentSnapshot | null) => getLatestReviewsPage(cursor), []);
  const list = usePagedList<Review>(loader, []);

  async function remove(venueId: string, uid: string, author: string) {
    if (!confirm(`¿Borrar la reseña de ${author}? Se recalcula el promedio del local.`)) return;
    setBusy(`${venueId}/${uid}`);
    try {
      await deleteReview(venueId, uid);
      toast.success("Reseña borrada.");
      list.reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="grid gap-4">
      <h1 className="text-3xl">Reseñas recientes</h1>
      <ListStates
        loading={list.loading}
        error={list.error}
        empty={list.items.length === 0}
        emptyText="Todavía no hay reseñas."
        hasMore={list.hasMore}
        loadingMore={list.loadingMore}
        onLoadMore={list.loadMore}
        onRetry={list.reload}
      >
        <ul className="grid gap-2">
          {list.items.map((r) => {
            // La ruta es venues/{venueId}/reviews/{uid}
            const venueId = r.path.split("/")[1];
            const key = `${venueId}/${r.id}`;
            return (
              <li key={key} className="grid gap-1 rounded-xl border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    <strong>{r.authorName}</strong> en{" "}
                    <Link href={`/locales/${venueId}`} className="underline underline-offset-4">
                      {venueId}
                    </Link>{" "}
                    · <StarIcon className="inline size-3.5 -translate-y-px fill-gold text-gold" aria-hidden="true" /> {r.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(r.updatedAt?.toMillis() ?? null, now)}</span>
                </div>
                <p className="text-sm">{r.comment}</p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="justify-self-start"
                  disabled={busy === key}
                  onClick={() => remove(venueId, r.id, r.authorName)}
                >
                  Borrar reseña
                </Button>
              </li>
            );
          })}
        </ul>
      </ListStates>
    </main>
  );
}
