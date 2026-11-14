/**
 * Pruebas automáticas de las Security Rules de Firestore.
 * Requieren el emulador de Firestore corriendo:
 *   npm run test:emu   (lo enciende, corre las pruebas y lo apaga)
 *   npm test           (si ya tienes `npm run emulators` abierto)
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { Geo, list, read, remove, resetEmulator, SERVER_TIME, Ts, write, type TestUser } from "./firestore-rest";

const ana: TestUser = { uid: "ana", email: "ana@prueba.test" };
const anaSinVerificar: TestUser = { uid: "ana", email: "ana@prueba.test", verified: false };
const dueno: TestUser = { uid: "dueno", email: "dueno@prueba.test", role: "venue", venueId: "neon41" };
const admin: TestUser = { uid: "admin", email: "admin@prueba.test", role: "admin" };

const week = { lun: null, mar: null, mie: null, jue: { open: "21:00", close: "03:00" }, vie: null, sab: null, dom: null };

const venueBase = {
  name: "Neón 41", slug: "neon41", type: "discoteca", genres: ["Reggaetón"], city: "Montería", zone: "norte",
  address: "Calle 41", location: new Geo(8.78, -75.87), coverPrice: 20000, drinkPriceFrom: 15000, schedule: week,
  description: "La discoteca más prendida del norte.", ambience: "Joven", dressCode: "Casual", photos: [],
  verified: true, ownerUid: null, status: "active",
  live: { level: 0, queue: false, nowPlaying: null, userReports1h: 0, updatedAt: null },
  rating: { avg: 0, count: 0 },
};

const profile = (u: TestUser, extra: Record<string, unknown> = {}) => ({
  displayName: "Ana", email: u.email, photoURL: null, role: "user", venueId: null, favoriteGenres: [],
  createdAt: SERVER_TIME, updatedAt: SERVER_TIME, ...extra,
});

beforeAll(async () => {
  await resetEmulator(readFileSync("firestore.rules", "utf8"));
  // Datos de base escritos "como servidor" (se saltan las reglas).
  await write("admin-sdk", "venues/neon41", venueBase);
  await write("admin-sdk", "venues/oculto", { ...venueBase, slug: "oculto", status: "hidden" });
  await write("admin-sdk", "venues/otro", { ...venueBase, slug: "otro" });
  await write("admin-sdk", "venues/neon41/reports/r1", { uid: "beto", level: 3, queue: true, onSite: true, source: "user" });
  await write("admin-sdk", "venues/neon41/reviews/beto", { uid: "beto", authorName: "Beto", rating: 5, comment: "Bueno" });
  await write("admin-sdk", "venues/neon41/promos/activa", { title: "2x1", detail: "", active: true });
  await write("admin-sdk", "venues/neon41/promos/pausada", { title: "Vieja", detail: "", active: false });
  await write("admin-sdk", "settings/app", { demoMode: false });
  await write("admin-sdk", "users/beto", { displayName: "Beto", email: "beto@prueba.test", role: "user" });
  await write("admin-sdk", "venueClaims/deBeto", { uid: "beto", venueId: "neon41", status: "pending" });
  await write("admin-sdk", "sharedLocations/tokenDeBetoMuyLargo12345", {
    uid: "beto", name: "Beto", location: new Geo(8.78, -75.87), active: true, expiresAt: new Ts(new Date(Date.now() + 3600_000)),
  });
});

describe("users", () => {
  it("permite crear el propio perfil con rol user", async () => {
    expect(await write(ana, "users/ana", profile(ana), { exists: false })).toBe(true);
  });
  it("NO permite crearse como admin", async () => {
    expect(await write(admin, "users/admin", profile(admin, { role: "admin" }), { exists: false })).toBe(false);
  });
  it("NO permite crear el perfil de otra persona", async () => {
    expect(await write(ana, "users/carla", profile(ana), { exists: false })).toBe(false);
  });
  it("permite cambiar el propio nombre", async () => {
    expect(await write(ana, "users/ana", { displayName: "Ana M", updatedAt: SERVER_TIME }, { mask: ["displayName", "updatedAt"] })).toBe(true);
  });
  it("NO permite cambiarse el rol", async () => {
    expect(await write(ana, "users/ana", { role: "admin", updatedAt: SERVER_TIME }, { mask: ["role", "updatedAt"] })).toBe(false);
  });
  it("NO permite asignarse un local", async () => {
    expect(await write(ana, "users/ana", { venueId: "neon41", updatedAt: SERVER_TIME }, { mask: ["venueId", "updatedAt"] })).toBe(false);
  });
  it("NO permite leer perfiles ajenos", async () => {
    expect(await read(ana, "users/beto")).toBe(false);
  });
  it("el admin sí puede leer perfiles ajenos", async () => {
    expect(await read(admin, "users/beto")).toBe(true);
  });
  it("NO permite borrar el perfil desde el cliente", async () => {
    expect(await remove(ana, "users/ana")).toBe(false);
  });
});

describe("favoritos", () => {
  it("NO permite guardar favoritos sin verificar el correo", async () => {
    expect(await write(anaSinVerificar, "users/ana/favorites/neon41", { venueName: "Neón 41", createdAt: SERVER_TIME })).toBe(false);
  });
  it("permite guardar un local existente", async () => {
    expect(await write(ana, "users/ana/favorites/neon41", { venueName: "Neón 41", createdAt: SERVER_TIME })).toBe(true);
  });
  it("NO permite guardar un local que no existe", async () => {
    expect(await write(ana, "users/ana/favorites/inventado", { venueName: "X", createdAt: SERVER_TIME })).toBe(false);
  });
  it("NO permite tocar los favoritos de otra persona", async () => {
    expect(await write(ana, "users/beto/favorites/neon41", { venueName: "Neón 41", createdAt: SERVER_TIME })).toBe(false);
  });
});

describe("locales", () => {
  it("cualquiera (sin cuenta) ve un local activo", async () => {
    expect(await read(null, "venues/neon41")).toBe(true);
  });
  it("nadie sin permiso ve un local oculto", async () => {
    expect(await read(ana, "venues/oculto")).toBe(false);
  });
  it("la lista pública exige filtrar por activos y poner límite", async () => {
    expect(await list(null, "", "venues", { status: "active", zone: "norte" }, 50)).toBe(true);
    expect(await list(null, "", "venues", { zone: "norte" }, 50)).toBe(false);
    expect(await list(null, "", "venues", { status: "active" })).toBe(false);
  });
  it("un usuario normal NO puede editar un local", async () => {
    expect(await write(ana, "venues/neon41", { coverPrice: 0, updatedAt: SERVER_TIME }, { mask: ["coverPrice", "updatedAt"] })).toBe(false);
  });
  it("el dueño edita el cover de su local", async () => {
    expect(await write(dueno, "venues/neon41", { coverPrice: 25000, updatedAt: SERVER_TIME }, { mask: ["coverPrice", "updatedAt"] })).toBe(true);
  });
  it("el dueño NO puede inventarse el semáforo ni la calificación", async () => {
    expect(await write(dueno, "venues/neon41", { live: { level: 3 }, updatedAt: SERVER_TIME }, { mask: ["live", "updatedAt"] })).toBe(false);
    expect(await write(dueno, "venues/neon41", { rating: { avg: 5, count: 999 }, updatedAt: SERVER_TIME }, { mask: ["rating", "updatedAt"] })).toBe(false);
  });
  it("el dueño NO puede cambiar si el local está verificado", async () => {
    expect(await write(dueno, "venues/neon41", { verified: false, updatedAt: SERVER_TIME }, { mask: ["verified", "updatedAt"] })).toBe(false);
  });
  it("el dueño NO puede editar otro local", async () => {
    expect(await write(dueno, "venues/otro", { coverPrice: 0, updatedAt: SERVER_TIME }, { mask: ["coverPrice", "updatedAt"] })).toBe(false);
  });
  it("el dueño NO puede poner un precio negativo", async () => {
    expect(await write(dueno, "venues/neon41", { coverPrice: -5, updatedAt: SERVER_TIME }, { mask: ["coverPrice", "updatedAt"] })).toBe(false);
  });
  it("nadie crea locales desde el cliente, ni siquiera el admin (va por la API)", async () => {
    expect(await write(admin, "venues/nuevo", { ...venueBase, slug: "nuevo" }, { exists: false })).toBe(false);
  });
});

describe("reportes y reseñas", () => {
  it("los reportes son privados", async () => {
    expect(await read(null, "venues/neon41/reports/r1")).toBe(false);
    expect(await read(ana, "venues/neon41/reports/r1")).toBe(false);
  });
  it("el dueño del local sí ve sus reportes", async () => {
    expect(await read(dueno, "venues/neon41/reports/r1")).toBe(true);
  });
  it("nadie escribe reportes directo (van por la API)", async () => {
    expect(await write(ana, "venues/neon41/reports/falso", { uid: "ana", level: 3 })).toBe(false);
  });
  it("las reseñas son públicas pero no se escriben desde el cliente", async () => {
    expect(await read(null, "venues/neon41/reviews/beto")).toBe(true);
    expect(await write(ana, "venues/neon41/reviews/ana", { uid: "ana", rating: 5, comment: "x" })).toBe(false);
  });
});

describe("promociones", () => {
  it("las activas son públicas y las pausadas no", async () => {
    expect(await read(null, "venues/neon41/promos/activa")).toBe(true);
    expect(await read(null, "venues/neon41/promos/pausada")).toBe(false);
  });
  const promo = { title: "Shots a 5 mil", detail: "Solo hoy", active: true, startsAt: null, endsAt: null, createdAt: SERVER_TIME, updatedAt: SERVER_TIME };
  it("el dueño crea promociones en su local", async () => {
    expect(await write(dueno, "venues/neon41/promos/nueva", promo, { exists: false })).toBe(true);
  });
  it("un usuario normal NO crea promociones", async () => {
    expect(await write(ana, "venues/neon41/promos/hack", promo, { exists: false })).toBe(false);
  });
  it("NO acepta campos extra", async () => {
    expect(await write(dueno, "venues/neon41/promos/rara", { ...promo, script: "<script>" }, { exists: false })).toBe(false);
  });
});

describe("solicitudes para administrar un local", () => {
  const claim = (extra: Record<string, unknown> = {}) => ({
    uid: "ana", venueId: "neon41", applicantName: "Ana María", phone: "+57 300 123 4567",
    message: "Soy la administradora del local.", status: "pending", reviewedBy: null,
    createdAt: SERVER_TIME, updatedAt: SERVER_TIME, ...extra,
  });
  it("se puede pedir como pendiente", async () => {
    expect(await write(ana, "venueClaims/c1", claim(), { exists: false })).toBe(true);
  });
  it("NO se puede crear ya aprobada", async () => {
    expect(await write(ana, "venueClaims/c2", claim({ status: "approved" }), { exists: false })).toBe(false);
  });
  it("NO se puede pedir a nombre de otra persona", async () => {
    expect(await write(ana, "venueClaims/c3", claim({ uid: "beto" }), { exists: false })).toBe(false);
  });
  it("NO se puede leer la solicitud de otra persona", async () => {
    expect(await read(ana, "venueClaims/deBeto")).toBe(false);
  });
  it("nadie se aprueba a sí mismo", async () => {
    expect(await write(ana, "venueClaims/c1", { status: "approved", updatedAt: SERVER_TIME }, { mask: ["status", "updatedAt"] })).toBe(false);
  });
});

describe("ubicación compartida", () => {
  const share = (hours: number) => ({
    uid: "ana", name: "Ana", location: new Geo(8.78, -75.87), active: true,
    expiresAt: new Ts(new Date(Date.now() + hours * 3600_000)), createdAt: SERVER_TIME, updatedAt: SERVER_TIME,
  });
  it("se puede compartir hasta 4 horas", async () => {
    expect(await write(ana, "sharedLocations/tokenDeAnaMuyLargo123456", share(2), { exists: false })).toBe(true);
  });
  it("NO se puede compartir por más de 4 horas", async () => {
    expect(await write(ana, "sharedLocations/tokenDeAnaMuyLargo999999", share(10), { exists: false })).toBe(false);
  });
  it("quien tiene el enlace la ve, pero nadie puede listarlas", async () => {
    expect(await read(null, "sharedLocations/tokenDeBetoMuyLargo12345")).toBe(true);
    expect(await list(null, "", "sharedLocations", { uid: "beto" }, 10)).toBe(false);
  });
  it("otra persona NO puede mover la ubicación ajena", async () => {
    expect(
      await write(ana, "sharedLocations/tokenDeBetoMuyLargo12345", { location: new Geo(0, 0), updatedAt: SERVER_TIME }, { mask: ["location", "updatedAt"] })
    ).toBe(false);
  });
});

describe("configuración y registros", () => {
  it("la configuración es pública pero solo la cambia el admin", async () => {
    expect(await read(null, "settings/app")).toBe(true);
    expect(await write(ana, "settings/app", { demoMode: false, updatedAt: SERVER_TIME })).toBe(false);
    expect(await write(admin, "settings/app", { demoMode: true, updatedAt: SERVER_TIME })).toBe(true);
  });
  it("los registros de administración no los ve un usuario", async () => {
    expect(await read(ana, "adminLogs/x")).toBe(false);
  });
});

describe("fase 4: paneles", () => {
  it("el admin cambia el modo demo aunque el servidor haya guardado otros campos", async () => {
    await write("admin-sdk", "settings/app", { demoMode: false, lastDemoTick: new Ts(new Date()) });
    expect(await write(admin, "settings/app", { demoMode: true, updatedAt: SERVER_TIME }, { mask: ["demoMode", "updatedAt"] })).toBe(true);
    expect(await write(admin, "settings/app", { lastDemoTick: null, updatedAt: SERVER_TIME }, { mask: ["lastDemoTick", "updatedAt"] })).toBe(false);
  });
  it("el dueño actualiza las fotos de su local (máximo 6)", async () => {
    const fotos = (n: number) => Array.from({ length: n }, (_, i) => `https://res.cloudinary.com/demo/${i}.jpg`);
    expect(await write(dueno, "venues/neon41", { photos: fotos(2), updatedAt: SERVER_TIME }, { mask: ["photos", "updatedAt"] })).toBe(true);
    expect(await write(dueno, "venues/neon41", { photos: fotos(7), updatedAt: SERVER_TIME }, { mask: ["photos", "updatedAt"] })).toBe(false);
  });
  it("el dueño consulta la lista de reportes de su local, pero no la de otro", async () => {
    expect(await list({ ...dueno }, "venues/neon41", "reports", {}, 15)).toBe(true);
    expect(await list({ ...dueno }, "venues/otro", "reports", {}, 15)).toBe(false);
  });
  it("cualquiera puede consultar reseñas de todos los locales (moderación), pero no escribirlas", async () => {
    expect(await list(null, "venues/neon41", "reviews", {}, 20)).toBe(true);
  });
  it("el admin lista solicitudes pendientes; un usuario solo las suyas", async () => {
    expect(await list(admin, "", "venueClaims", { status: "pending" }, 20)).toBe(true);
    expect(await list(ana, "", "venueClaims", { status: "pending" }, 20)).toBe(false);
    expect(await list(ana, "", "venueClaims", { uid: "ana" }, 10)).toBe(true);
  });
  it("un usuario no puede listar a todos los usuarios; el admin sí", async () => {
    expect(await list(ana, "", "users", {}, 20)).toBe(false);
    expect(await list(admin, "", "users", {}, 20)).toBe(true);
  });
});
