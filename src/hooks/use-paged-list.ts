"use client";

import { useCallback, useEffect, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { getErrorMessage } from "@/lib/firebase/errors";
import type { Page } from "@/services/admin-service";

/**
 * Lista paginada con "Cargar más". `loader` trae una página a partir del cursor.
 * `deps` reinicia la lista (ej. al cambiar de pestaña) y `reload()` la vuelve a pedir.
 */
export function usePagedList<T>(loader: (cursor: QueryDocumentSnapshot | null) => Promise<Page<T>>, deps: unknown[]) {
  const [items, setItems] = useState<Page<T>["items"]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loader(null).then(
      (page) => {
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setError(null);
        setLoading(false);
      },
      (e: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(e));
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` decide cuándo reiniciar
  }, [...deps, version]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const page = await loader(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }, [loader, cursor]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { items, hasMore, loading, loadingMore, error, loadMore, reload };
}
