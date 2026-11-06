<?php
declare(strict_types=1);
require __DIR__ . '/../src/logica.php';
$token = preg_replace('/[^a-f0-9]/', '', $_GET['t'] ?? '');
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0b0714">
    <title>Ubicación en vivo · Borra2</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <link rel="stylesheet" href="assets/app.css">
</head>
<body class="pagina">
<header class="barra">
    <a class="logo" href="./">Borra<span>2</span></a>
    <div class="ciudad">Ubicación compartida</div>
    <a class="boton-local" href="./">Abrir Borra2</a>
</header>
<div class="cuerpo">
    <div class="caja">
        <h2 id="titulo">Buscando…</h2>
        <p id="estado">Cargando la ubicación.</p>
        <div id="mapa-amigo"></div>
        <br>
        <a class="boton secundario" id="como-llegar" target="_blank" rel="noopener" href="#">🧭 Cómo llegar</a>
    </div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(() => {
    const token = <?= json_encode($token) ?>;
    const mapa = L.map('mapa-amigo').setView(<?= json_encode(centro_mapa()) ?>, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19,
    }).addTo(mapa);
    const icono = L.divIcon({ className: 'pin-wrap', iconSize: [0, 0], html: '<div class="yo-pin"></div>' });
    let marcador = null;
    const hace = (s) => (s < 60 ? 'hace un momento' : s < 3600 ? `hace ${Math.round(s / 60)} min` : `hace ${Math.floor(s / 3600)} h`);

    async function actualizar() {
        try {
            const r = await fetch(`api.php?accion=compartido&t=${token}`);
            const u = await r.json();
            if (u.error) throw new Error(u.error);
            document.getElementById('titulo').textContent = `📍 ${u.nombre}`;
            document.getElementById('estado').textContent = u.activo
                ? `Compartiendo en vivo · última actualización ${hace(u.hace)}`
                : 'Dejó de compartir su ubicación. Esta fue la última posición conocida.';
            document.getElementById('como-llegar').href = `https://www.google.com/maps/dir/?api=1&destination=${u.lat},${u.lng}`;
            if (marcador) marcador.setLatLng([u.lat, u.lng]);
            else { marcador = L.marker([u.lat, u.lng], { icon: icono }).addTo(mapa); mapa.setView([u.lat, u.lng], 17); }
        } catch (e) {
            document.getElementById('titulo').textContent = 'Enlace no válido';
            document.getElementById('estado').textContent = e.message;
        }
    }
    actualizar();
    setInterval(actualizar, 15000);
})();
</script>
</body>
</html>
