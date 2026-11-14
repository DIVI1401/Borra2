"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl">Algo salió mal</h1>
      <p className="text-muted-foreground">Tuvimos un problema al cargar esta página. Intenta de nuevo en un momento.</p>
      <Button size="lg" onClick={reset}>
        Intentar de nuevo
      </Button>
    </main>
  );
}
