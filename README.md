# Borra2 · Tu noche, mejor dirigida

Prototipo de clase: mapa en vivo de bares y discotecas de la zona norte de Montería.
Hecho con PHP, HTML, CSS, JavaScript y PostgreSQL (o SQLite al probarlo en el computador).

> Los locales son **inventados** y las coordenadas son aproximadas. Todo se cambia en `src/datos_demo.php`.

## Qué hace

- **Mapa** con los locales en colores según qué tan lleno está: 🍸 Tranquilo, 🎶 Animado, 🔥 A reventar.
- **Filtros** por música, cover y "con ambiente".
- **Ficha del local**: cover, precios, horario, promos, reseñas y hace cuánto se actualizó.
- **"¿Cómo está esto?"**: los usuarios reportan en un toque. Si el GPS confirma que están en el sitio, el reporte queda verificado y pesa más.
- **Panel de la discoteca** (`panel.php`): el local actualiza su estado, sus promociones y sus precios.
- **Compartir ubicación** en vivo con los amigos y botón **SOS** (llama al 123).

### Cómo se calcula el semáforo

Se combinan los reportes de los últimos 90 minutos: el del local pesa 3, el de un usuario en el sitio 2 y el de un usuario fuera del sitio 1. Los reportes viejos pesan menos y, pasados 90 minutos, ya no cuentan ("si no está actualizado, no se muestra").

**Modo demo** (`DEMO_MODO=1`, activado por defecto): cada 20 minutos se genera un reporte simulado por local para que el mapa se vea vivo a cualquier hora del día. Para apagarlo, pon `DEMO_MODO=0`.

## Credenciales de prueba del panel

- Usuario: el código del local, por ejemplo `neon41`, `distritonorte`, `corralvallenato`, `altura` (todos están en `src/datos_demo.php`, campo `slug`).
- Clave: `borra2demo`

## Probarlo en el computador

Necesitas PHP 8 (XAMPP sirve). Desde la carpeta del proyecto:

```bash
C:/xampp/php/php.exe -S localhost:8000 -t public
```

Abre http://localhost:8000. La primera vez crea `data/borra2.sqlite` con los datos de ejemplo.
Para empezar de cero, borra la carpeta `data`.

## Subirlo a Render

1. Sube esta carpeta a un repositorio de GitHub.
2. En Render: **New → Blueprint**, elige el repositorio. Render lee `render.yaml` y crea la app y la base de datos PostgreSQL gratis.
3. Espera a que termine el despliegue y abre la URL `https://borra2-xxxx.onrender.com`.

Las tablas y los datos de ejemplo se crean solos en la primera visita.

**Para el día de la clase:**
- En el plan gratis la app "se duerme" si nadie la usa: ábrela unos minutos antes para que despierte (la primera carga puede tardar casi un minuto).
- La base de datos gratis de Render vence a los 30 días: créala cerca de la fecha de la presentación.
- El GPS del celular solo funciona en páginas `https://`, así que en Render funciona sin problema.

## Idea para la demo en clase

1. Proyecta el mapa en el computador.
2. Desde un celular, entra a `/panel.php` con `neon41` y marca "A reventar" con fila.
3. En 30 segundos el pin de Neón 41 en el proyector se pone rojo con la animación de pulso.

## Estructura

```
public/            Lo que ve el navegador
  index.php        Mapa principal
  panel.php        Panel de la discoteca
  compartir.php    Página para ver la ubicación de un amigo
  api.php          API en JSON que usa el mapa
  assets/          CSS y JavaScript
src/
  db.php           Conexión (PostgreSQL o SQLite) y creación de tablas
  logica.php       Semáforo, verificación por GPS y modo demo
  datos_demo.php   Locales, promos y reseñas de ejemplo
Dockerfile         Imagen PHP + Apache para Render
render.yaml        Configuración de Render (app + base de datos)
```
