/**
 * Ayudas para probar las Security Rules contra el emulador de Firestore
 * usando su API REST, sin depender de librerías extra.
 * El emulador acepta tokens JWT sin firmar, así que podemos simular cualquier usuario.
 */
export const PROJECT = "demo-borra2-rules";
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8085";
const BASE = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;

export interface TestUser {
  uid: string;
  email?: string;
  verified?: boolean;
  role?: "user" | "venue" | "admin";
  venueId?: string;
}

const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");

/** Token falso de Firebase Auth (solo válido en el emulador). */
export function tokenFor(user: TestUser | null): string | null {
  if (!user) return null;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: `https://securetoken.google.com/${PROJECT}`,
    aud: PROJECT,
    iat: now,
    exp: now + 3600,
    auth_time: now,
    sub: user.uid,
    user_id: user.uid,
    email: user.email ?? `${user.uid}@prueba.test`,
    email_verified: user.verified ?? true,
    firebase: { sign_in_provider: "password", identities: {} },
    ...(user.role ? { role: user.role } : {}),
    ...(user.venueId ? { venueId: user.venueId } : {}),
  };
  return `${b64({ alg: "none", typ: "JWT" })}.${b64(payload)}.`;
}

// ---- Conversión de valores JS al formato REST de Firestore ----

export class ServerTime {}
export const SERVER_TIME = new ServerTime();
export class Geo {
  constructor(public lat: number, public lng: number) {}
}
export class Ts {
  constructor(public date: Date) {}
}

type Value = Record<string, unknown>;

function toValue(v: unknown): Value {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (v instanceof Geo) return { geoPointValue: { latitude: v.lat, longitude: v.lng } };
  if (v instanceof Ts) return { timestampValue: v.date.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === "object") return { mapValue: { fields: toFields(v as Record<string, unknown>) } };
  throw new Error(`Tipo no soportado: ${typeof v}`);
}

function toFields(obj: Record<string, unknown>): Record<string, Value> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => !(v instanceof ServerTime))
      .map(([k, v]) => [k, toValue(v)])
  );
}

function headers(user: TestUser | null | "admin-sdk"): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  // "owner" es el token especial del emulador que se salta las reglas (como el Admin SDK).
  if (user === "admin-sdk") h.Authorization = "Bearer owner";
  else {
    const t = tokenFor(user);
    if (t) h.Authorization = `Bearer ${t}`;
  }
  return h;
}

/**
 * Escribe un documento. Los campos con SERVER_TIME se envían como request.time.
 * `mask` = actualizar solo esos campos; `exists` = exigir que exista (update) o no (create).
 */
export async function write(
  user: TestUser | null | "admin-sdk",
  path: string,
  data: Record<string, unknown>,
  opts: { mask?: string[]; exists?: boolean } = {}
): Promise<boolean> {
  const serverTimeFields = Object.entries(data)
    .filter(([, v]) => v instanceof ServerTime)
    .map(([k]) => k);
  const writeOp: Record<string, unknown> = {
    update: { name: `projects/${PROJECT}/databases/(default)/documents/${path}`, fields: toFields(data) },
    updateTransforms: serverTimeFields.map((f) => ({ fieldPath: f, setToServerValue: "REQUEST_TIME" })),
  };
  if (opts.mask) writeOp.updateMask = { fieldPaths: opts.mask.filter((f) => !serverTimeFields.includes(f)) };
  if (opts.exists !== undefined) writeOp.currentDocument = { exists: opts.exists };

  const res = await fetch(`${BASE}:commit`, {
    method: "POST",
    headers: headers(user),
    body: JSON.stringify({ writes: [writeOp] }),
  });
  return res.ok;
}

export async function remove(user: TestUser | null | "admin-sdk", path: string): Promise<boolean> {
  const res = await fetch(`${BASE}/${path}`, { method: "DELETE", headers: headers(user) });
  return res.ok;
}

export async function read(user: TestUser | null | "admin-sdk", path: string): Promise<boolean> {
  const res = await fetch(`${BASE}/${path}`, { headers: headers(user) });
  return res.ok;
}

/** Consulta simple sobre una colección: filtros de igualdad y límite opcional. */
export async function list(
  user: TestUser | null,
  parent: string,
  collectionId: string,
  filters: Record<string, unknown>,
  limit?: number
): Promise<boolean> {
  const where = Object.entries(filters).map(([field, value]) => ({
    fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: toValue(value) },
  }));
  const structuredQuery: Record<string, unknown> = { from: [{ collectionId }] };
  if (where.length === 1) structuredQuery.where = where[0];
  if (where.length > 1) structuredQuery.where = { compositeFilter: { op: "AND", filters: where } };
  if (limit) structuredQuery.limit = limit;

  const url = parent ? `${BASE}/${parent}:runQuery` : `${BASE}:runQuery`;
  const res = await fetch(url, { method: "POST", headers: headers(user), body: JSON.stringify({ structuredQuery }) });
  return res.ok;
}

/** Carga las reglas del archivo en el proyecto de pruebas y borra los datos. */
export async function resetEmulator(rules: string) {
  const root = `http://${HOST}/emulator/v1/projects/${PROJECT}`;
  const put = await fetch(`${root}:securityRules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rules: { files: [{ name: "firestore.rules", content: rules }] } }),
  });
  if (!put.ok) throw new Error(`No se pudieron cargar las reglas: ${await put.text()}`);
  await fetch(`${root}/databases/(default)/documents`, { method: "DELETE" });
}
