"use client";

import { useEffect, useState } from "react";

/**
 * Hora actual que se actualiza cada `intervalMs` (para "hace 5 min" y el semáforo).
 * Empieza en 0 y toma la hora real ya en el navegador: así la página se puede
 * prerenderizar sin congelar una hora del servidor.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}
