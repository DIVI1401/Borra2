"use client";

import { useCallback, useState } from "react";

export interface Position {
  lat: number;
  lng: number;
}

const messages: Record<number, string> = {
  1: "No diste permiso para usar tu ubicación. Puedes activarlo en los ajustes del navegador.",
  2: "No pudimos saber dónde estás. Revisa que el GPS esté encendido.",
  3: "Tardamos demasiado en ubicarte. Intenta de nuevo.",
};

/** Pide la ubicación solo cuando la persona lo decide (nunca al cargar la página). */
export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locate = useCallback(
    (timeout = 10_000): Promise<Position | null> =>
      new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
          setError("Tu navegador no permite usar la ubicación.");
          return resolve(null);
        }
        setLoading(true);
        let done = false;
        const finish = (pos: Position | null, message: string | null) => {
          if (done) return;
          done = true;
          clearTimeout(guard);
          if (pos) setPosition(pos);
          setError(message);
          setLoading(false);
          resolve(pos);
        };
        // El `timeout` del navegador no corre mientras el aviso de permiso está abierto:
        // si la persona no responde, seguimos sin ubicación en vez de quedarnos esperando.
        const guard = setTimeout(() => finish(null, messages[3]), timeout + 2000);
        navigator.geolocation.getCurrentPosition(
          (p) => finish({ lat: p.coords.latitude, lng: p.coords.longitude }, null),
          (e) => finish(null, messages[e.code] ?? "No pudimos acceder a tu ubicación."),
          { enableHighAccuracy: true, timeout, maximumAge: 30_000 }
        );
      }),
    []
  );

  return { position, error, loading, locate };
}
