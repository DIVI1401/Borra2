# Modelo de datos y seguridad (Firestore)

## Colecciones

| Ruta | Qué guarda | Quién lee | Quién escribe |
|---|---|---|---|
| `users/{uid}` | Perfil: nombre, correo, foto, géneros favoritos, rol (copia del claim) | La persona y los admin | La persona (solo nombre, foto y géneros). Rol y local: solo el servidor |
| `users/{uid}/favorites/{venueId}` | Locales favoritos | La persona | La persona (con correo verificado) |
| `venues/{venueId}` | Local: datos, horario, ubicación, `live` (semáforo), `rating` | Todos, si está activo | Dueño: solo su vitrina (precios, horario, géneros, descripción, fotos). Crear, ocultar, verificar, semáforo y calificación: solo el servidor |
| `venues/{id}/reports/{reportId}` | Reportes "¿cómo está esto?" (con uid) | Dueño del local y admin | Solo el servidor (`/api/locales/{id}/reportes` y `/estado`) |
| `venues/{id}/reviews/{uid}` | Reseñas (una por persona) | Todos | Solo el servidor (`/api/locales/{id}/resena`) |
| `venues/{id}/promos/{promoId}` | Promociones | Todos si está activa | Dueño del local y admin |
| `venueClaims/{claimId}` | Solicitudes para administrar un local | La persona que la hizo y los admin | La persona la crea "pendiente"; aprobar o rechazar: solo el servidor |
| `sharedLocations/{token}` | Ubicación compartida con amigos (máx. 4 h) | Quien tenga el enlace (no se pueden listar) | Quien la creó |
| `settings/app` | Configuración global (`demoMode`) | Todos | Admin |
| `adminLogs/{logId}` | Registro de acciones de administración | Admin | Solo el servidor |

Todas las escrituras guardan `createdAt` y `updatedAt` con la hora del servidor (`serverTimestamp`), y las reglas exigen que sea así.

## Semáforo (`venues/{id}.live`)

Se recalcula en el servidor cada vez que llega un reporte (`src/lib/live.ts`):

- Cuentan los reportes de los últimos **90 minutos**.
- Peso: el local **3**, usuario en el sitio (a menos de 200 m, según el GPS) **2**, usuario fuera del sitio **1**.
- Los reportes más viejos pesan menos.
- Un usuario puede reportar el mismo local una vez cada **10 minutos**.
- En la app, si el último reporte tiene más de 90 minutos se muestra "Sin datos recientes" (así no hace falta un proceso programado, que en Firebase exige plan de pago).

## Calificación (`venues/{id}.rating`)

Guarda `sum` (suma exacta de estrellas), `count` y `avg` (promedio redondeado). Se actualiza en una **transacción** al crear, editar o borrar una reseña, así el promedio nunca se descuadra.

## Roles (custom claims)

| Rol | Claim | Cómo se obtiene |
|---|---|---|
| Usuario | `role: "user"` (o sin claim) | Al registrarse |
| Local aliado | `role: "venue"`, `venueId` | Un admin aprueba su solicitud |
| Administrador | `role: "admin"` | Script `npm run set-role` (el primero) o un admin desde el panel |

Nadie puede asignarse un rol: los claims solo los escribe el Admin SDK en el servidor, y las reglas impiden tocar `role` y `venueId` en `users/{uid}`.

## Eliminar cuenta

`POST /api/cuenta/eliminar` (exige haber confirmado la contraseña hace menos de 5 minutos):

1. Borra sus reseñas una por una, recalculando el promedio de cada local.
2. Anonimiza sus reportes (`uid: "eliminado"`): el historial del local se mantiene pero ya no apunta a la persona.
3. Borra sus ubicaciones compartidas y solicitudes.
4. Borra su perfil, sus favoritos y su cuenta de acceso.

## Índices

Están en `firestore.indexes.json` y se publican con `firebase deploy --only firestore:indexes`.

## Pruebas

`tests/firestore.rules.test.ts` tiene 42 pruebas automáticas de las reglas, entre ellas los intentos de escalar permisos. Se corren con `npm run test:emu`.
