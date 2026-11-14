"use client";

import { useCallback, useEffect, useState } from "react";

const COOLDOWN_SECONDS = 60;
const MAX_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

interface ResendState {
  sentAt: number[];
}

function read(key: string): ResendState {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as ResendState) : { sentAt: [] };
    return { sentAt: parsed.sentAt.filter((t) => Date.now() - t < HOUR_MS) };
  } catch {
    return { sentAt: [] };
  }
}

/**
 * Limita los reenvíos del correo de verificación: 1 cada 60 s y máximo 5 por hora.
 * Firebase además aplica su propio límite en el servidor (auth/too-many-requests).
 */
export function useResendLimit(key: string) {
  // Se lee al montar (este hook solo se usa en componentes que ya están en el navegador).
  const [state, setState] = useState<ResendState>(() =>
    typeof window === "undefined" ? { sentAt: [] } : read(key)
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const last = state.sentAt.at(-1) ?? 0;
  const secondsLeft = Math.max(0, Math.ceil((last + COOLDOWN_SECONDS * 1000 - now) / 1000));
  const remaining = Math.max(0, MAX_PER_HOUR - state.sentAt.length);

  const register = useCallback(() => {
    const next = { sentAt: [...read(key).sentAt, Date.now()] };
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Sin almacenamiento (modo privado): el límite queda solo en memoria.
    }
    setState(next);
  }, [key]);

  return { canSend: secondsLeft === 0 && remaining > 0, secondsLeft, remaining, register };
}
