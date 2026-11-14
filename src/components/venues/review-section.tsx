"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { BadgeCheckIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase/client";
import { getErrorMessage } from "@/lib/firebase/errors";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useNow } from "@/hooks/use-now";
import { deleteReview, getReviewsPage, saveReview } from "@/services/venue-service";
import type { RatingSummary, Review } from "@/types/venue";

const PAGE_SIZE = 5;

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={cn("size-4", n <= value ? "fill-gold text-gold" : "text-muted-foreground/40")} aria-hidden="true" />
      ))}
    </span>
  );
}

function ReviewForm({ venueId, onSaved }: { venueId: string; onSaved: () => void }) {
  const { user } = useAuth();
  const { locate } = useGeolocation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hasReview, setHasReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya dejó reseña, se carga para editarla (una reseña por persona y local).
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "venues", venueId, "reviews", user.uid)).then((snap) => {
      if (!snap.exists()) return;
      const r = snap.data() as Review;
      setRating(r.rating);
      setComment(r.comment);
      setHasReview(true);
    });
  }, [user, venueId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Elige de 1 a 5 estrellas.");
    if (comment.trim().length < 3) return setError("Escribe un comentario corto.");
    setError(null);
    setBusy(true);
    try {
      const position = await locate(5000);
      const res = await saveReview(venueId, { rating, comment, position });
      toast.success(res.verifiedVisit ? "Reseña publicada como visita verificada." : "Reseña publicada.");
      setHasReview(true);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteReview(venueId);
      setRating(0);
      setComment("");
      setHasReview(false);
      toast.success("Borraste tu reseña.");
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4" noValidate>
      <p className="font-medium">{hasReview ? "Tu reseña" : "Deja tu reseña"}</p>
      <div role="radiogroup" aria-label="Calificación" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="rounded-md p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <StarIcon className={cn("size-7", n <= rating ? "fill-gold text-gold" : "text-muted-foreground/50")} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="comentario">Comentario</Label>
        <Textarea
          id="comentario"
          maxLength={500}
          rows={3}
          placeholder="¿Qué tal la música, el ambiente, los precios?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "error-resena" : undefined}
        />
        {error ? (
          <p id="error-resena" role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando…" : hasReview ? "Actualizar reseña" : "Publicar reseña"}
        </Button>
        {hasReview ? (
          <Button type="button" variant="ghost" onClick={remove} disabled={busy}>
            Borrar mi reseña
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function ReviewSection({ venueId, rating }: { venueId: string; rating: RatingSummary }) {
  const { user, isVerified } = useAuth();
  const [reviews, setReviews] = useState<(Review & { id: string })[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const now = useNow(60_000);

  // Al cambiar `reloadKey` (después de guardar o borrar tu reseña) se recarga la primera página.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    getReviewsPage(venueId, PAGE_SIZE).then(
      (page) => {
        if (cancelled) return;
        setReviews(page.reviews);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setLoading(false);
      },
      (e: unknown) => {
        if (cancelled) return;
        toast.error(getErrorMessage(e));
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [venueId, reloadKey]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await getReviewsPage(venueId, PAGE_SIZE, cursor);
      setReviews((prev) => [...prev, ...page.reviews]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">Reseñas</h2>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {rating.count ? (
            <>
              <Stars value={Math.round(rating.avg)} />
              <span>
                {rating.avg.toFixed(1).replace(".", ",")} de 5 · {rating.count} reseña{rating.count === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            "Todavía no hay reseñas."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!user ? (
          <Link href={`/entrar?next=/locales/${venueId}`} className={buttonVariants({ variant: "outline" })}>
            Inicia sesión para dejar tu reseña
          </Link>
        ) : !isVerified ? (
          <Link href="/verificar-correo" className={buttonVariants({ variant: "outline" })}>
            Verifica tu correo para dejar tu reseña
          </Link>
        ) : (
          <ReviewForm venueId={venueId} onSaved={reload} />
        )}

        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sé parte de las primeras reseñas de este sitio.</p>
        ) : (
          <ul className="grid gap-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl bg-muted/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    {r.authorName}
                    {r.verifiedVisit ? (
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-level-1">
                        <BadgeCheckIcon className="size-3.5" aria-hidden="true" /> Estuvo aquí
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(r.updatedAt?.toMillis() ?? null, now)}</span>
                </div>
                <Stars value={r.rating} className="mt-1" />
                {/* React escapa el texto: un comentario con <script> se muestra como texto, no se ejecuta. */}
                <p className="mt-1 text-sm">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}

        {hasMore ? (
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Cargando…" : "Ver más reseñas"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
