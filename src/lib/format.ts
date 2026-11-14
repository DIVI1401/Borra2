import { DAYS, type Day, type Schedule } from "@/types/venue";

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/** $20.000, o "Gratis" si es 0. */
export function formatCOP(value: number): string {
  return value === 0 ? "Gratis" : cop.format(value);
}

/** "hace un momento", "hace 12 min", "hace 2 h", "hace 3 días". */
export function timeAgo(ms: number | null, nowMs: number): string {
  if (ms === null) return "sin datos";
  const s = Math.max(0, Math.round((nowMs - ms) / 1000));
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

/** "21:00" → "9 p. m.", "03:30" → "3:30 a. m." */
export function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${suffix}`;
}

/** Día y hora actuales en Colombia, sin importar la zona horaria del dispositivo. */
function bogotaNow(date: Date): { day: Day; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const map: Record<string, Day> = { Mon: "lun", Tue: "mar", Wed: "mie", Thu: "jue", Fri: "vie", Sat: "sab", Sun: "dom" };
  return { day: map[get("weekday")] ?? "lun", minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * ¿Está abierto ahora? Tiene en cuenta horarios que pasan de medianoche
 * (ej. viernes 21:00 a 03:00 sigue abierto el sábado a la 1 a. m.).
 */
export function isOpenNow(schedule: Schedule, date = new Date()): boolean {
  const { day, minutes } = bogotaNow(date);
  const idx = DAYS.indexOf(day);
  const today = schedule[day];
  const yesterday = schedule[DAYS[(idx + 6) % 7]];

  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (close > open ? minutes >= open && minutes < close : minutes >= open) return true;
  }
  if (yesterday) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    if (close <= open && minutes < close) return true;
  }
  return false;
}

/** Resumen corto del horario: "Jue a sáb · 9 p. m. – 3 a. m." agrupando días iguales. */
export function scheduleSummary(schedule: Schedule): string {
  const short: Record<Day, string> = { lun: "lun", mar: "mar", mie: "mié", jue: "jue", vie: "vie", sab: "sáb", dom: "dom" };
  const groups: { days: Day[]; hours: string }[] = [];
  for (const d of DAYS) {
    const h = schedule[d];
    if (!h) continue;
    const label = `${formatHour(h.open)} – ${formatHour(h.close)}`;
    const last = groups.at(-1);
    const prevDay = last ? last.days.at(-1) : undefined;
    if (last && last.hours === label && prevDay && DAYS.indexOf(prevDay) === DAYS.indexOf(d) - 1) last.days.push(d);
    else groups.push({ days: [d], hours: label });
  }
  if (!groups.length) return "Sin horario publicado";
  return groups
    .map((g) => {
      const name =
        g.days.length === 7 ? "Todos los días" : g.days.length === 1 ? short[g.days[0]] : `${short[g.days[0]]} a ${short[g.days.at(-1)!]}`;
      return `${name.charAt(0).toUpperCase()}${name.slice(1)} · ${g.hours}`;
    })
    .join(" / ");
}
