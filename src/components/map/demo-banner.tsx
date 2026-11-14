"use client";

import { useEffect, useState } from "react";
import { FlaskConicalIcon } from "lucide-react";
import { subscribeToSettings } from "@/services/social-service";

/**
 * Si el admin activó el modo demo: muestra el aviso y, mientras la página
 * esté abierta, pide al servidor simular reportes cada 5 minutos.
 */
export function DemoBanner() {
  const [demo, setDemo] = useState(false);

  useEffect(() => subscribeToSettings((s) => setDemo(s.demoMode)), []);

  useEffect(() => {
    if (!demo) return;
    const tick = () => fetch("/api/demo/tick", { method: "POST" }).catch(() => undefined);
    tick();
    const id = setInterval(tick, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [demo]);

  if (!demo) return null;
  return (
    <p className="flex items-center justify-center gap-2 border-b bg-wine/15 px-4 py-1.5 text-center text-xs text-foreground">
      <FlaskConicalIcon className="size-3.5 text-gold" aria-hidden="true" />
      Modo demo: parte de los datos son simulados para la presentación.
    </p>
  );
}
