<?php
declare(strict_types=1);
require __DIR__ . '/../src/logica.php';
dispositivo();
$config = ['centro' => centro_mapa(), 'demo' => demo()];
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#0b0714">
    <title>Borra2 · Tu noche, mejor dirigida</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <link rel="stylesheet" href="assets/app.css">
</head>
<body class="app">
<header class="barra">
    <a class="logo" href="./">Borra<span>2</span></a>
    <div class="ciudad">📍 Montería · Zona Norte</div>
    <a class="boton-local" href="panel.php">Soy un local</a>
</header>

<?php if ($config['demo']): ?>
    <div class="aviso-demo">Modo demo · datos simulados para la presentación</div>
<?php endif; ?>

<nav class="filtros" id="filtros" aria-label="Filtros"></nav>

<main class="contenedor">
    <div id="mapa" aria-label="Mapa de bares y discotecas"></div>

    <div class="leyenda">
        <span><i class="punto verde"></i>Tranquilo</span>
        <span><i class="punto amarillo"></i>Animado</span>
        <span><i class="punto rojo"></i>A reventar</span>
        <span><i class="punto gris"></i>Sin datos</span>
    </div>

    <div class="flotantes">
        <button class="fab" id="btn-ubicarme" title="Mi ubicación" aria-label="Mi ubicación">🎯</button>
        <button class="fab" id="btn-compartir" title="Compartir mi ubicación" aria-label="Compartir mi ubicación">📡</button>
        <button class="fab sos" id="btn-sos" title="Seguridad" aria-label="Seguridad">SOS</button>
    </div>

    <section class="hoja" id="hoja">
        <button class="asa" id="asa" aria-label="Expandir o contraer"><span></span></button>
        <div class="hoja-contenido" id="hoja-contenido">
            <p class="cargando">Cargando la noche…</p>
        </div>
    </section>
</main>

<div class="compartiendo oculto" id="compartiendo">
    <span class="latido"></span> Compartiendo tu ubicación
    <button id="btn-detener">Detener</button>
</div>

<div class="modal oculto" id="modal" role="dialog" aria-modal="true">
    <div class="modal-caja">
        <button class="cerrar" id="modal-cerrar" aria-label="Cerrar">✕</button>
        <div id="modal-contenido"></div>
    </div>
</div>

<div class="toast oculto" id="toast"></div>

<script>window.BORRA2 = <?= json_encode($config) ?>;</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="assets/mapa.js"></script>
</body>
</html>
