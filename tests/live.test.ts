import { describe, expect, it } from "vitest";
import { computeLive, distanceMeters, isStale, LIVE_WINDOW_MS, type ReportSample } from "@/lib/live";

const now = 1_800_000_000_000;
const min = 60_000;
const rep = (level: 1 | 2 | 3, minutesAgo: number, extra: Partial<ReportSample> = {}): ReportSample => ({
  level,
  queue: false,
  onSite: true,
  source: "user",
  createdAtMs: now - minutesAgo * min,
  ...extra,
});

describe("computeLive (semáforo)", () => {
  it("sin reportes recientes queda en 0 (sin datos)", () => {
    expect(computeLive([], now).level).toBe(0);
    expect(computeLive([rep(3, 120)], now).level).toBe(0);
  });

  it("el reporte del local pesa más que uno de un usuario fuera del sitio", () => {
    // Local dice "tranquilo" (peso 3) y un usuario fuera del sitio dice "a reventar" (peso 1): gana el local.
    const live = computeLive([rep(1, 5, { source: "venue" }), rep(3, 5, { onSite: false })], now);
    expect(live.level).toBeLessThanOrEqual(2);
    const live2 = computeLive([rep(1, 5, { source: "venue" }), rep(1, 5, { source: "venue" }), rep(3, 5, { onSite: false })], now);
    expect(live2.level).toBe(1);
  });

  it("los reportes recientes pesan más que los viejos", () => {
    const live = computeLive([rep(1, 85), rep(3, 1)], now);
    expect(live.level).toBe(3);
  });

  it("la fila y la música salen del reporte más reciente", () => {
    const live = computeLive(
      [rep(2, 30, { source: "venue", nowPlaying: "Salsa brava" }), rep(3, 2, { queue: true })],
      now
    );
    expect(live.queue).toBe(true);
    expect(live.nowPlaying).toBe("Salsa brava");
  });

  it("cuenta solo los reportes de usuarios de la última hora", () => {
    const live = computeLive([rep(2, 10), rep(2, 70), rep(2, 5, { source: "venue" })], now);
    expect(live.userReports1h).toBe(1);
  });

  it("isStale marca como viejo lo que pasa de 90 minutos", () => {
    expect(isStale(now - LIVE_WINDOW_MS - 1, now)).toBe(true);
    expect(isStale(now - 10 * min, now)).toBe(false);
    expect(isStale(null, now)).toBe(true);
  });

  it("distanceMeters calcula bien distancias cortas", () => {
    const d = distanceMeters({ lat: 8.7838, lng: -75.8689 }, { lat: 8.7847, lng: -75.8689 });
    expect(d).toBeGreaterThan(95);
    expect(d).toBeLessThan(105);
  });
});
