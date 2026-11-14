# Borra2 · Tu noche, mejor dirigida

App web para ver en vivo qué tan llenos están los bares y discotecas de la zona norte de Montería, cuánto cuesta entrar y qué música suena, antes de salir.

> La versión anterior (PHP + PostgreSQL, para la clase) está guardada en la etiqueta [`v1-php`](https://github.com/DIVI1401/borra2/tree/v1-php).

## Stack (todo en planes gratuitos)

| Parte | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript estricto, Tailwind CSS v4, shadcn/ui (Base UI) |
| Formularios | React Hook Form + Zod (los mismos esquemas en el cliente y en el servidor) |
| Autenticación | Firebase Authentication: correo/contraseña y Google |
| Base de datos | Cloud Firestore (plan Spark, gratis) |
| Lógica de servidor | Rutas de API de Next.js con Firebase Admin SDK (reemplazan a Cloud Functions, que exigen plan de pago) |
| Protección | Security Rules + App Check (reCAPTCHA v3) + encabezados de seguridad |
| Mapa | Leaflet + OpenStreetMap |
| Fotos | Cloudinary (plan gratis) |
| Despliegue | Vercel (plan Hobby, gratis) |

## Funciones

- **Público:** mapa en vivo con semáforo (tranquilo, animado, a reventar), filtros, ficha de cada local con SEO propio, promociones, horario y reseñas.
- **Con cuenta verificada:** reportar "¿cómo está esto?", reseñar, guardar favoritos, compartir ubicación en vivo y botón SOS.
- **Dueños de locales:** pedir acceso; panel para publicar el estado, promociones, precios, horario y fotos.
- **Administradores:** aprobar dueños, gestionar locales, roles y reseñas, y activar el modo demo.
- **Cuenta:** registro con contraseña segura, verificación de correo obligatoria, "recordarme", recuperar contraseña, cambiar correo y contraseña, eliminar la cuenta con todos sus datos.

Documentación técnica:
- [docs/modelo-de-datos.md](docs/modelo-de-datos.md): colecciones, reglas, semáforo y roles.
- [docs/lista-de-verificacion.md](docs/lista-de-verificacion.md): seguridad y pruebas antes de publicar.

---

## 1. Correr en local con los emuladores (sin cuenta de Firebase)

Requisitos: **Node.js 20 o más** y **Java 21 o más** (los emuladores de Firebase lo necesitan).

```bash
npm install
```

Crea `.env.local` con estos valores (apuntan a los emuladores, no a un proyecto real):

```
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-borra2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-borra2
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:demo
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_EMULATORS=true
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085
APP_CHECK_ENFORCE=false
```

En una terminal, enciende los emuladores (Auth en el puerto 9099, Firestore en el 8085 y el panel en http://localhost:4000):

```bash
npm run emulators
```

En otra terminal, carga los 12 locales de ejemplo (solo la primera vez) y arranca la app en http://localhost:3000:

```bash
npm run seed
npm run dev
```

- Los correos (verificación, recuperación) no se envían de verdad: aparecen en el panel de emuladores, pestaña **Authentication**.
- Para tener un administrador, regístrate en la app y luego corre `npm run set-role -- tu@correo.com admin`. Cierra sesión y vuelve a entrar.

---

## 2. Crear el proyecto real en Firebase (plan Spark, gratis)

### 2.1 Proyecto y app web
1. Entra a https://console.firebase.google.com y crea un proyecto (por ejemplo `borra2`). Google Analytics es opcional.
2. En **Configuración del proyecto → General → Tus apps**, agrega una **app web** (ícono `</>`). No marques "Firebase Hosting".
3. Copia los valores de `firebaseConfig`: los usarás como variables `NEXT_PUBLIC_FIREBASE_*`.

### 2.2 Authentication
1. **Authentication → Comenzar → Método de inicio de sesión**: activa **Correo electrónico/contraseña** y **Google** (elige un correo de soporte).
2. **Authentication → Configuración → Dominios autorizados**: agrega el dominio de Vercel (por ejemplo `borra2.vercel.app`). `localhost` ya viene incluido.
3. **Authentication → Configuración → Acciones de usuario**: deja activada la **protección contra la enumeración de correos**.

### 2.3 Correos en español
En **Authentication → Plantillas**:
1. Con el ícono del lápiz de cualquier plantilla, pon como **nombre del remitente** `Borra2`.
2. Abajo, en **Idioma de la plantilla**, elige **Español**. Así quedan en español la verificación, el restablecimiento de contraseña y el cambio de correo.
3. Toca **Personalizar URL de acción** y escribe `https://TU-DOMINIO/auth/accion`. Los enlaces abrirán la página de Borra2, en español y con su diseño, en lugar de la página genérica de Firebase.
4. Si quieres, cambia también los asuntos. Por ejemplo: "Verifica tu correo en Borra2", "Crea una contraseña nueva para Borra2" y "Tu correo en Borra2 cambió".

> Por seguridad (anti-spam), Firebase no deja editar el cuerpo de algunos correos. Sí deja cambiar el idioma, el remitente, el asunto y la URL de acción.

### 2.4 Firestore
1. **Firestore Database → Crear base de datos**, en **modo de producción**.
2. Ubicación: `nam5` (Estados Unidos). Desde Colombia suele responder más rápido que São Paulo y queda cerca de los servidores de Vercel. **No se puede cambiar después.**
3. Publica las reglas y los índices de este repositorio:

```bash
npx firebase login
```

```bash
npx firebase use --add
```

```bash
npm run deploy:rules
```

> `firebase login` abre el navegador para que inicies sesión con tu cuenta de Google. Los índices pueden tardar unos minutos en quedar listos.

### 2.5 Cuenta de servicio (para el servidor)
1. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.** Se descarga un `.json`.
2. Conviértelo a base64. En PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\ruta\a\la-clave.json"))
```

3. Ese texto es `FIREBASE_SERVICE_ACCOUNT_BASE64`. **Nunca subas el `.json` a GitHub.** Bórralo cuando termines de configurar.

### 2.6 App Check (protección contra bots)
1. Crea las claves de **reCAPTCHA v3** en https://www.google.com/recaptcha/admin. Agrega tu dominio de Vercel y `localhost`.
2. En **App Check → Apps**, registra la app web con el proveedor **reCAPTCHA v3** y pega la **clave secreta**.
3. La **clave del sitio** va en `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
4. Usa la app unos días y revisa en **App Check → APIs** que las solicitudes salgan como verificadas. Luego pulsa **Aplicar (Enforce)** para **Cloud Firestore** y **Authentication**, y pon `APP_CHECK_ENFORCE=true` en Vercel.
5. En desarrollo, la consola del navegador muestra un *debug token*: regístralo en **App Check → Administrar tokens de depuración**.

### 2.7 Datos iniciales y primer admin
Crea `.env.production.local` (no se sube a GitHub) con las variables reales y `FIREBASE_SERVICE_ACCOUNT_BASE64`. Luego carga los locales de ejemplo:

```bash
npm run seed:prod
```

Regístrate en la app ya publicada y vuelve tu cuenta administradora:

```bash
npm run set-role:prod -- tu@correo.com admin
```

---

## 3. Fotos con Cloudinary (opcional, gratis)

1. Crea una cuenta en https://cloudinary.com (plan Free).
2. En el **Dashboard** copia **Cloud name**, **API Key** y **API Secret**.
3. Agrégalos como `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en Vercel. El secreto solo lo usa el servidor.

Sin estas variables, todo funciona menos la subida de fotos.

---

## 4. Desplegar en Vercel (plan Hobby, gratis)

1. Entra a https://vercel.com con tu cuenta de GitHub y elige **Add New → Project → `DIVI1401/borra2`**.
2. Framework: **Next.js** (se detecta solo). La rama de producción es `main`; mientras pruebas puedes desplegar `next-firebase` como *preview*.
3. En **Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | de `firebaseConfig` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | de `firebaseConfig` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | de `firebaseConfig` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | de `firebaseConfig` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | de `firebaseConfig` |
| `NEXT_PUBLIC_APP_URL` | `https://TU-DOMINIO` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | clave del sitio de reCAPTCHA v3 |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | cuenta de servicio en base64 (**secreta**) |
| `APP_CHECK_ENFORCE` | `false` al principio, `true` cuando App Check esté aplicado |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | de Cloudinary (opcional) |

**No** agregues `NEXT_PUBLIC_USE_EMULATORS` ni las variables `*_EMULATOR_HOST` en Vercel.

4. **Deploy.** Al terminar, agrega el dominio que te dio Vercel en:
   - Firebase → Authentication → **Dominios autorizados**;
   - las claves de **reCAPTCHA**;
   - la **URL de acción** de las plantillas de correo (paso 2.3);
   - la variable `NEXT_PUBLIC_APP_URL` (y vuelve a desplegar).

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run lint` / `npm run typecheck` | Revisión de código y de tipos |
| `npm run emulators` | Emuladores de Firebase (guardan los datos en `.emulator-data/` al cerrar) |
| `npm test` | Pruebas (necesita los emuladores encendidos) |
| `npm run test:emu` | Enciende el emulador, corre las pruebas y lo apaga |
| `npm run seed` / `npm run seed:prod` | Carga los 12 locales de ejemplo (`-- --force` para recargarlos) |
| `npm run set-role` / `npm run set-role:prod` | Asigna rol `user`, `venue` o `admin` |
| `npm run deploy:rules` | Publica las Security Rules y los índices en Firebase |

## Estructura

```
src/
  app/                 Páginas (App Router) y rutas de API
    (cuenta)/          Registro, entrar, recuperar, verificar correo, /auth/accion
    admin/             Panel de administración
    panel/             Panel del dueño del local y solicitud de acceso
    locales/[slug]/    Ficha pública de cada local
    api/               Lógica sensible en el servidor (Admin SDK)
  components/          Componentes reutilizables (ui/ = shadcn)
  hooks/               Hooks de React
  lib/
    firebase/          Cliente, Admin SDK y traducción de errores al español
    server/            Verificación de peticiones, semáforo, reseñas, admin
  schemas/             Validaciones con Zod (compartidas cliente/servidor)
  services/            Acceso a Firebase (los componentes no llaman a Firebase directo)
  types/               Tipos de TypeScript
firestore.rules        Security Rules
firestore.indexes.json Índices compuestos
scripts/               Carga de datos y asignación de roles
tests/                 Pruebas de las reglas y del semáforo
docs/                  Modelo de datos y lista de verificación
```
