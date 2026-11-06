<?php
declare(strict_types=1);
require __DIR__ . '/../src/logica.php';

session_start();
$pdo = db();
$_SESSION['csrf'] ??= bin2hex(random_bytes(16));
$csrf = $_SESSION['csrf'];
$error = null;

function volver(string $mensaje, bool $esError = false): never
{
    $_SESSION['flash'] = ['texto' => $mensaje, 'error' => $esError];
    header('Location: panel.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accion = $_POST['accion'] ?? '';

    if ($accion === 'entrar') {
        $st = $pdo->prepare('SELECT id, clave_hash FROM locales WHERE usuario = ?');
        $st->execute([strtolower(trim($_POST['usuario'] ?? ''))]);
        $l = $st->fetch();
        if ($l && password_verify($_POST['clave'] ?? '', $l['clave_hash'])) {
            session_regenerate_id(true);
            $_SESSION['local_id'] = (int) $l['id'];
            volver('¡Hola! Ya estás en el panel de tu local.');
        }
        $error = 'Usuario o clave incorrectos.';
    } elseif (!hash_equals($csrf, $_POST['csrf'] ?? '')) {
        volver('La sesión venció. Intenta de nuevo.', true);
    } elseif ($accion === 'salir') {
        unset($_SESSION['local_id']);
        volver('Cerraste sesión.');
    } elseif (!empty($_SESSION['local_id'])) {
        $id = (int) $_SESSION['local_id'];
        switch ($accion) {
            case 'estado':
                $nivel = (int) ($_POST['nivel'] ?? 0);
                if (!isset(NIVELES[$nivel])) volver('Elige un nivel.', true);
                $musica = mb_substr(trim($_POST['musica_ahora'] ?? ''), 0, 40) ?: null;
                $pdo->prepare("INSERT INTO estados (local_id, nivel, fila, musica_ahora, fuente, verificado, creado) VALUES (?, ?, ?, ?, 'local', 1, ?)")
                    ->execute([$id, $nivel, isset($_POST['fila']) ? 1 : 0, $musica, time()]);
                volver('Listo: ahora tu local aparece como "' . NIVELES[$nivel] . '" en el mapa.');

            case 'datos':
                $pdo->prepare('UPDATE locales SET cover = ?, precio_trago = ?, horario = ?, musica = ? WHERE id = ?')
                    ->execute([
                        max(0, (int) ($_POST['cover'] ?? 0)),
                        max(0, (int) ($_POST['precio_trago'] ?? 0)),
                        mb_substr(trim($_POST['horario'] ?? ''), 0, 80),
                        mb_substr(trim($_POST['musica'] ?? ''), 0, 30) ?: 'Crossover',
                        $id,
                    ]);
                volver('Datos del local actualizados.');

            case 'promo_nueva':
                $titulo = mb_substr(trim($_POST['titulo'] ?? ''), 0, 80);
                if ($titulo === '') volver('Escribe el título de la promoción.', true);
                $pdo->prepare('INSERT INTO promos (local_id, titulo, detalle, activa, creado) VALUES (?, ?, ?, 1, ?)')
                    ->execute([$id, $titulo, mb_substr(trim($_POST['detalle'] ?? ''), 0, 160), time()]);
                volver('Promoción publicada.');

            case 'promo_alternar':
                $pdo->prepare('UPDATE promos SET activa = 1 - activa WHERE id = ? AND local_id = ?')
                    ->execute([(int) ($_POST['promo_id'] ?? 0), $id]);
                volver('Promoción actualizada.');

            case 'promo_borrar':
                $pdo->prepare('DELETE FROM promos WHERE id = ? AND local_id = ?')
                    ->execute([(int) ($_POST['promo_id'] ?? 0), $id]);
                volver('Promoción eliminada.');
        }
    }
}

$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);

$local = null;
if (!empty($_SESSION['local_id'])) {
    $st = $pdo->prepare('SELECT * FROM locales WHERE id = ?');
    $st->execute([$_SESSION['local_id']]);
    $local = $st->fetch() ?: null;
}

if ($local) {
    $id = (int) $local['id'];
    $sem = semaforos($pdo, $id)[$id] ?? sin_datos();
    $st = $pdo->prepare('SELECT * FROM promos WHERE local_id = ? ORDER BY creado DESC');
    $st->execute([$id]);
    $promos = $st->fetchAll();
    $st = $pdo->prepare("SELECT nivel, fila, verificado, creado FROM estados WHERE local_id = ? AND fuente = 'usuario' AND creado >= ? ORDER BY creado DESC LIMIT 10");
    $st->execute([$id, time() - 3 * 3600]);
    $reportes = $st->fetchAll();
    $st = $pdo->prepare('SELECT COUNT(*) AS n, AVG(estrellas) AS prom FROM resenas WHERE local_id = ?');
    $st->execute([$id]);
    $notas = $st->fetch();
}
$emoji = [0 => '❔', 1 => '🍸', 2 => '🎶', 3 => '🔥'];
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#120b0b">
    <title>Panel del local · Borra2</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/app.css?v=2">
</head>
<body class="pagina">
<header class="barra">
    <a class="logo" href="./">Borra<span>2</span></a>
    <div class="ciudad">Panel para locales aliados</div>
    <a class="boton-local" href="./">Ver el mapa</a>
</header>

<div class="cuerpo">
<?php if ($flash): ?>
    <div class="mensaje <?= $flash['error'] ? 'error' : '' ?>"><?= e($flash['texto']) ?></div>
<?php endif; ?>

<?php if (!$local): ?>
    <div class="caja login">
        <h2>Entra a tu local</h2>
        <p>Actualiza en un toque qué tan lleno está tu sitio, tus precios y tus promociones.</p>
        <?php if ($error): ?><div class="mensaje error"><?= e($error) ?></div><?php endif; ?>
        <form method="post">
            <input type="hidden" name="accion" value="entrar">
            <label class="etiqueta" for="usuario">Usuario</label>
            <input class="campo" id="usuario" name="usuario" autocomplete="username" required>
            <label class="etiqueta" for="clave">Clave</label>
            <input class="campo" id="clave" name="clave" type="password" autocomplete="current-password" required>
            <br><br>
            <button class="boton">Entrar</button>
        </form>
    </div>
<?php else: ?>
    <div class="caja">
        <h2><?= e($local['nombre']) ?></h2>
        <p><?= e($local['tipo']) ?> · <?= e($local['direccion']) ?>
            <?php if ($notas['n']): ?> · ★ <?= number_format((float) $notas['prom'], 1) ?> (<?= (int) $notas['n'] ?> reseñas)<?php endif; ?></p>
        <div class="semaforo n<?= $sem['nivel'] ?>">
            <div class="grande"><?= $emoji[$sem['nivel']] ?></div>
            <div>
                <strong class="c<?= $sem['nivel'] ?>"><?= e($sem['etiqueta']) ?><?= $sem['fila'] ? ' · hay fila' : '' ?></strong>
                <small>Así te ven los usuarios ahora · <?= e(hace_texto($sem['hace'])) ?></small>
            </div>
        </div>
    </div>

    <div class="caja">
        <h2>¿Cómo está el local ahora?</h2>
        <p>Un toque y el mapa se actualiza para todos. Tu reporte pesa más que el de un usuario.</p>
        <form method="post">
            <input type="hidden" name="accion" value="estado">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <label class="check"><input type="checkbox" name="fila"> Hay fila en la puerta</label>
            <label class="etiqueta" for="musica_ahora">¿Qué está sonando? (opcional)</label>
            <input class="campo" id="musica_ahora" name="musica_ahora" maxlength="40" placeholder="Ej. Reggaetón viejo, DJ invitado">
            <br><br>
            <div class="reportar niveles-panel">
                <?php foreach (NIVELES as $n => $txt): ?>
                    <button class="r<?= $n ?>" name="nivel" value="<?= $n ?>"><span><?= $emoji[$n] ?></span><?= e($txt) ?></button>
                <?php endforeach; ?>
            </div>
        </form>
    </div>

    <div class="caja">
        <h2>Lo que reportan los usuarios</h2>
        <p>Últimas 3 horas. "En el sitio" significa que su GPS confirmó que estaban en tu local.</p>
        <?php if (!$reportes): ?>
            <p class="vacio">Todavía no hay reportes de usuarios.</p>
        <?php else: ?>
            <ul class="historial">
                <?php foreach ($reportes as $r): ?>
                    <li>
                        <span><?= $r['verificado'] ? '✔ En el sitio' : 'Fuera del sitio' ?><?= $r['fila'] ? ' · hay fila' : '' ?></span>
                        <span class="c<?= (int) $r['nivel'] ?>"><?= e(NIVELES[(int) $r['nivel']]) ?> · <?= e(hace_texto(time() - (int) $r['creado'])) ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>

    <div class="caja">
        <h2>Promociones</h2>
        <p>Aparecen en tu ficha y en la lista del mapa.</p>
        <ul class="lista-promos">
            <?php foreach ($promos as $p): ?>
                <li class="<?= $p['activa'] ? '' : 'apagada' ?>">
                    <div class="txt"><b><?= e($p['titulo']) ?></b><br><small><?= e($p['detalle']) ?></small></div>
                    <form method="post">
                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                        <input type="hidden" name="promo_id" value="<?= (int) $p['id'] ?>">
                        <button class="mini" name="accion" value="promo_alternar"><?= $p['activa'] ? 'Pausar' : 'Activar' ?></button>
                        <button class="mini" name="accion" value="promo_borrar" onclick="return confirm('¿Eliminar esta promoción?')">🗑</button>
                    </form>
                </li>
            <?php endforeach; ?>
        </ul>
        <form method="post">
            <input type="hidden" name="accion" value="promo_nueva">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <input class="campo" name="titulo" maxlength="80" placeholder="Ej. 2x1 en cervezas hasta las 10 p. m." required>
            <br><br>
            <input class="campo" name="detalle" maxlength="160" placeholder="Detalle (opcional)">
            <br><br>
            <button class="boton">Publicar promoción</button>
        </form>
    </div>

    <div class="caja">
        <h2>Datos del local</h2>
        <form method="post">
            <input type="hidden" name="accion" value="datos">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <div class="rejilla">
                <div>
                    <label class="etiqueta" for="cover">Cover (COP, 0 = gratis)</label>
                    <input class="campo" id="cover" name="cover" type="number" min="0" step="1000" value="<?= (int) $local['cover'] ?>">
                </div>
                <div>
                    <label class="etiqueta" for="precio_trago">Trago desde (COP)</label>
                    <input class="campo" id="precio_trago" name="precio_trago" type="number" min="0" step="500" value="<?= (int) $local['precio_trago'] ?>">
                </div>
                <div>
                    <label class="etiqueta" for="musica">Género principal</label>
                    <input class="campo" id="musica" name="musica" maxlength="30" value="<?= e($local['musica']) ?>">
                </div>
                <div>
                    <label class="etiqueta" for="horario">Horario</label>
                    <input class="campo" id="horario" name="horario" maxlength="80" value="<?= e($local['horario']) ?>">
                </div>
            </div>
            <br>
            <button class="boton secundario">Guardar datos</button>
        </form>
    </div>

    <form method="post">
        <input type="hidden" name="accion" value="salir">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <button class="boton secundario">Cerrar sesión</button>
    </form>
<?php endif; ?>
</div>
</body>
</html>
