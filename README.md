# Borra2 · Tu noche, mejor dirigida

App web para ver en vivo qué tan llenos están los bares y discotecas de la zona norte de Montería, cuánto cuesta entrar y qué música suena, antes de salir.

> La versión anterior (PHP + PostgreSQL, para la clase) está guardada en la etiqueta [`v1-php`](https://github.com/DIVI1401/borra2/tree/v1-php).

## Stack (todo en planes gratuitos)

| Parte | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript estricto, Tailwind CSS v4, shadcn/ui (Base UI) |
| Formularios | React Hook Form + Zod |
| Autenticación | Firebase Authentication (correo/contraseña y Google) |
| Base de datos | Cloud Firestore (plan Spark) |
| Lógica de servidor | Rutas de API de Next.js con Firebase Admin SDK (reemplazan a Cloud Functions, que exigen plan de pago) |
| Protección | Security Rules + App Check (reCAPTCHA v3) |
| Despliegue | Vercel (plan Hobby) |

## Estado por fases

- [x] **Fase 1 · Autenticación:** registro con contraseña segura, verificación de correo obligatoria (con límite de reenvíos), inicio de sesión con "recordarme", Google, recuperar contraseña, cambio de correo y contraseña con reautenticación, eliminar cuenta y datos, roles por custom claims, rutas protegidas, página propia en español para los enlaces de los correos.
- [x] **Fase 2 · Datos y seguridad:** modelo completo de Firestore, Security Rules de todas las colecciones (42 pruebas automáticas), índices, semáforo y calificación calculados en el servidor, API de reportes, reseñas y estado del local, carga de los 12 locales de ejemplo. Detalle en [docs/modelo-de-datos.md](docs/modelo-de-datos.md).
- [ ] Fase 3 · Mapa, fichas, reportes y reseñas
- [ ] Fase 4 · Panel del local y panel de administración
- [ ] Fase 5 · Pulido, guía de despliegue y lista de verificación

## Correr en local con los emuladores (sin cuenta de Firebase)

Requisitos: Node.js 20 o más y Java 21 o más (los emuladores lo necesitan).

```bash
npm install
cp .env.example .env.local   # ya viene preparado para emuladores en este repo de desarrollo
```

En `.env.local` usa estos valores para los emuladores:

```
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-borra2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-borra2
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:demo
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_EMULATORS=true
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085
```

Luego, en dos terminales (y la primera vez, `npm run seed` para cargar los locales):

```bash
npm run emulators   # Auth :9099, Firestore :8085, panel en http://localhost:4000
npm run dev         # la app en http://localhost:3000
```

Los correos (verificación, recuperación) no se envían de verdad: aparecen en el panel de emuladores, pestaña **Authentication**, y en la terminal de los emuladores.

### Dar rol de administrador

Nadie puede darse permisos a sí mismo desde la app. El primer admin se crea con:

```bash
npm run set-role -- correo@ejemplo.com admin
```

La persona debe cerrar sesión y volver a entrar para ver el cambio.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run lint` | Revisión de código (ESLint) |
| `npm run typecheck` | Revisión de tipos (TypeScript) |
| `npm run emulators` | Emuladores de Firebase (guardan los datos en `.emulator-data/` al cerrar) |
| `npm run set-role` | Asigna rol `user`, `venue` o `admin` a una cuenta |
| `npm run seed` | Carga los 12 locales de ejemplo (`-- --force` para recargarlos) |
| `npm test` | Pruebas (necesita `npm run emulators` abierto) |
| `npm run test:emu` | Enciende el emulador, corre las pruebas y lo apaga |

## Estructura

```
src/
  app/                 Páginas (App Router) y rutas de API
    (cuenta)/          Registro, entrar, recuperar, verificar correo, /auth/accion
    api/               Lógica sensible en el servidor (Admin SDK)
  components/          Componentes reutilizables (ui/ = shadcn)
  hooks/               Hooks de React
  lib/
    firebase/          Cliente, Admin SDK y traducción de errores al español
    server/            Verificación de peticiones (token, App Check, rol)
  schemas/             Validaciones con Zod (compartidas cliente/servidor)
  services/            Acceso a Firebase (los componentes no llaman a Firebase directo)
  types/               Tipos de TypeScript
firestore.rules        Security Rules
scripts/               Scripts de administración
```

La guía completa para crear el proyecto en la consola de Firebase y desplegar en Vercel se agrega en la fase 5.
