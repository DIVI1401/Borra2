"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEVEL_BG_CLASS, LEVEL_ICON, LEVEL_TEXT_CLASS } from "@/components/venues/level-badge";
import { useGeolocation } from "@/hooks/use-geolocation";
import { reportVenue } from "@/services/venue-service";
import { getErrorMessage } from "@/lib/firebase/errors";
import { cn } from "@/lib/utils";
import { LEVEL_LABELS } from "@/types/venue";

const OPTIONS = [1, 2, 3] as const;

/** "¿Cómo está esto ahora?": el usuario reporta en un toque. */
export function ReportPanel({ venueId }: { venueId: string }) {
  const { user, isVerified } = useAuth();
  const { locate } = useGeolocation();
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [queue, setQueue] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!level) return;
    setBusy(true);
    try {
      // El GPS es opcional: si lo da, el servidor verifica que esté en el sitio y su reporte pesa más.
      const position = await locate(6000);
      const res = await reportVenue(venueId, { level, queue, position });
      toast.success(res.message);
      setLevel(null);
      setQueue(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl">¿Cómo está esto ahora?</h2>
        </CardTitle>
        <CardDescription>Si estás aquí, ayuda a los demás. Si nos dejas ver tu ubicación, tu reporte cuenta más.</CardDescription>
      </CardHeader>
      <CardContent>
        {!user ? (
          <Link href={`/entrar?next=/locales/${venueId}`} className={buttonVariants({ className: "w-full" })}>
            Inicia sesión para reportar
          </Link>
        ) : !isVerified ? (
          <Link href="/verificar-correo" className={buttonVariants({ className: "w-full" })}>
            Verifica tu correo para reportar
          </Link>
        ) : (
          <div className="grid gap-3">
            <div role="radiogroup" aria-label="Qué tan lleno está" className="grid grid-cols-3 gap-2">
              {OPTIONS.map((n) => {
                const Icon = LEVEL_ICON[n];
                const checked = level === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setLevel(n)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                      checked ? cn(LEVEL_BG_CLASS[n], LEVEL_TEXT_CLASS[n], "border-current") : "hover:bg-accent/60"
                    )}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                    {LEVEL_LABELS[n]}
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={queue} onCheckedChange={(c) => setQueue(c === true)} aria-label="Hay fila para entrar" />
              Hay fila para entrar
            </label>
            <Button onClick={submit} disabled={!level || busy}>
              {busy ? "Enviando…" : "Enviar reporte"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
