/**
 * Cálculo del semáforo ("qué tan lleno está"). Es código puro, sin Firebase,
 * para poder usarlo en el servidor y probarlo fácil.
 *
 * - Cuentan los reportes de los últimos 90 minutos.
 * - Peso: el local 3, un usuario en el sitio 2, uno fuera del sitio 1, la demo 2.
 * - Los reportes viejos pesan menos (decaen con el tiempo).
 */
export const LIVE_WINDOW_MS = 90 * 60 * 1000;

export interface ReportSample {
  level: 1 | 2 | 3;
  queue: boolean;
  onSite: boolean;
  source: "user" | "venue" | "demo";
  createdAtMs: number;
  nowPlaying?: string | null;
}

export interface LiveResult {
  level: 0 | 1 | 2 | 3;
  queue: boolean;
  nowPlaying: string | null;
  userReports1h: number;
  lastReportMs: number | null;
}

function weight(r: ReportSample): number {
  if (r.source === "venue") return 3;
  if (r.source === "demo") return 2;
  return r.onSite ? 2 : 1;
}

export function computeLive(reports: ReportSample[], nowMs: number): LiveResult {
  const recent = reports
    .filter((r) => nowMs - r.createdAtMs <= LIVE_WINDOW_MS && r.createdAtMs <= nowMs + 60_000)
    .sort((a, b) => a.createdAtMs - b.createdAtMs);

  if (recent.length === 0) {
    return { level: 0, queue: false, nowPlaying: null, userReports1h: 0, lastReportMs: null };
  }

  let sum = 0;
  let total = 0;
  for (const r of recent) {
    const decay = Math.max(0.1, 1 - (nowMs - r.createdAtMs) / LIVE_WINDOW_MS);
    const w = weight(r) * decay;
    sum += w * r.level;
    total += w;
  }

  const latest = recent[recent.length - 1];
  const latestVenue = [...recent].reverse().find((r) => r.source === "venue" && r.nowPlaying);
  const level = Math.min(3, Math.max(1, Math.round(sum / total))) as 1 | 2 | 3;

  return {
    level,
    queue: latest.queue,
    nowPlaying: latestVenue?.nowPlaying ?? null,
    userReports1h: recent.filter((r) => r.source === "user" && nowMs - r.createdAtMs <= 60 * 60 * 1000).length,
    lastReportMs: latest.createdAtMs,
  };
}

/** En el cliente: si el último reporte tiene más de 90 min, se muestra "sin datos". */
export function isStale(updatedAtMs: number | null, nowMs: number): boolean {
  return updatedAtMs === null || nowMs - updatedAtMs > LIVE_WINDOW_MS;
}

/** Distancia en metros entre dos coordenadas (fórmula de Haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Radio para considerar que alguien "está en el sitio". */
export const ON_SITE_RADIUS_M = 200;
