# Lista de verificación antes de publicar

Marca cada punto antes de compartir el enlace de producción.

## A. Seguridad

### Claves y configuración
- [ ] `.env.local`, `.env.production.local` y el `.json` de la cuenta de servicio **no** están en GitHub. Revísalo con `git ls-files | grep -i env`: solo debe salir `.env.example`.
- [ ] `FIREBASE_SERVICE_ACCOUNT_BASE64` y `CLOUDINARY_API_SECRET` solo están en Vercel, **sin** el prefijo `NEXT_PUBLIC_`.
- [ ] Vercel **no** tiene `NEXT_PUBLIC_USE_EMULATORS` ni variables `*_EMULATOR_HOST`.
- [ ] Borraste del computador el `.json` de la cuenta de servicio después de convertirlo a base64.

### Firebase
- [ ] Las Security Rules publicadas son las del repositorio (`npm run deploy:rules`). La consola de Firestore → Reglas muestra el mismo texto.
- [ ] Los índices están en estado **Habilitado** (Firestore → Índices).
- [ ] Authentication → Dominios autorizados: solo `localhost` y tu dominio de Vercel. Quita cualquier otro.
- [ ] Protección contra la enumeración de correos: **activada**.
- [ ] App Check: las métricas muestran más del 95 % de solicitudes verificadas. Entonces aplica **Enforce** en Firestore y Authentication y pon `APP_CHECK_ENFORCE=true`.
- [ ] Alerta de presupuesto: el plan Spark no cobra, pero revisa **Uso y facturación** para ver que estás lejos de los límites gratis.
- [ ] El primer admin se creó con `set-role:prod`, y solo las personas del equipo son admin (Admin → Usuarios).

### Comportamiento (comprobado con pruebas automáticas, `npm run test:emu`)
- [ ] Nadie puede darse el rol de admin ni asignarse un local (pruebas de `users`).
- [ ] Un dueño solo edita la vitrina de **su** local; no puede tocar el semáforo, la calificación ni la verificación.
- [ ] Los reportes son privados; las reseñas y el semáforo solo los escribe el servidor.
- [ ] Una solicitud de dueño no se puede crear ya aprobada ni a nombre de otra persona.
- [ ] La ubicación compartida no dura más de 4 horas y no se puede listar.
- [ ] La lista pública de locales exige `status == active` y un límite.
- [ ] Todas las rutas `/api/admin/*` responden 403 a un usuario normal.

### Protección del navegador
- [ ] Las respuestas traen los encabezados `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` y `Strict-Transport-Security`. Revísalo con `curl -I https://TU-DOMINIO`.
- [ ] El texto que escriben los usuarios se muestra escapado. Una reseña con `<script>alert(1)</script>` se ve como texto y no se ejecuta (comprobado).
- [ ] No se usa `dangerouslySetInnerHTML` en ninguna parte del código.
- [ ] El parámetro `?next=` solo acepta rutas internas: `/entrar?next=https://otro-sitio.com` lleva a `/`.

### Pendientes recomendados (fuera del alcance actual)
- [ ] Una Content-Security-Policy estricta. Requiere listar con cuidado los dominios de Firebase, reCAPTCHA, OpenStreetMap y Cloudinary.
- [ ] Límite de peticiones por IP en las rutas públicas de la API (por ejemplo con Vercel Firewall o Upstash).

## B. Pruebas manuales (en producción, con una cuenta nueva)

### Cuenta
- [ ] Registro con contraseña débil: la app la rechaza y muestra qué falta.
- [ ] Registro válido: llega el correo **en español** y el enlace abre `/auth/accion` con el diseño de Borra2.
- [ ] Sin verificar el correo, al reportar o reseñar la app lleva a "Verifica tu correo".
- [ ] Reenviar la verificación: espera de 60 s entre envíos y máximo 5 por hora.
- [ ] Iniciar sesión con contraseña incorrecta: mensaje claro en español.
- [ ] "Recordarme" desmarcado: al cerrar el navegador se cierra la sesión.
- [ ] Iniciar sesión con Google.
- [ ] Recuperar la contraseña: llega el correo, se crea la nueva y se entra con ella.
- [ ] Cambiar la contraseña y el correo desde el perfil (pide la contraseña actual).
- [ ] Eliminar la cuenta: desaparecen el perfil, las reseñas (el promedio del local se ajusta) y los favoritos.

### Funciones principales
- [ ] El mapa carga los locales sin iniciar sesión, en el celular y en el computador.
- [ ] Los filtros y "ordenar por cercanía" funcionan (este último pide permiso de ubicación).
- [ ] Reportar desde el local: sale "verificado"; reportar otra vez antes de 10 minutos queda bloqueado.
- [ ] Reseñar, editar la reseña y borrarla.
- [ ] Guardar y quitar favoritos.
- [ ] Compartir ubicación: el enlace abre en otro celular y se actualiza; "Dejar de compartir" funciona.
- [ ] El botón SOS abre la llamada al 123.

### Paneles
- [ ] Pedir acceso a un local → un admin lo aprueba → la persona vuelve a entrar y ve **su** panel.
- [ ] Publicar el estado desde el panel y verlo en el mapa en menos de un minuto.
- [ ] Crear, pausar y borrar promociones.
- [ ] Subir una foto (con Cloudinary configurado).
- [ ] Admin: crear un local nuevo, editarlo, ocultarlo y verificarlo.
- [ ] Admin: borrar una reseña; queda en el registro de acciones.
- [ ] Modo demo: activarlo antes de la presentación y **desactivarlo** cuando haya datos reales.

### Calidad
- [ ] Lighthouse (Chrome → DevTools → Lighthouse, modo móvil): accesibilidad y SEO en 100 y buenas prácticas en 96 o más (resultado local).
- [ ] Navegación solo con teclado: Tab llega a todos los botones y el foco se ve.
- [ ] Modo claro y modo oscuro se ven bien.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test:emu` y `npm run build` terminan sin errores.
