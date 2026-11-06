<?php
declare(strict_types=1);

require __DIR__ . '/../src/logica.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function responder(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function entrada(): array
{
    $j = json_decode(file_get_contents('php://input') ?: '[]', true);
    return is_array($j) ? $j : [];
}

function buscar_local(PDO $pdo, $id): array
{
    $st = $pdo->prepare('SELECT * FROM locales WHERE id = ?');
    $st->execute([(int) $id]);
    $l = $st->fetch();
    if (!$l) {
        responder(['error' => 'Ese local no existe.'], 404);
    }
    return $l;
}

/** Quita los datos privados (usuario y clave del panel). */
function publico(array $l): array
{
    unset($l['usuario'], $l['clave_hash'], $l['popularidad']);
    foreach (['id', 'cover', 'precio_trago', 'verificado'] as $k) {
        $l[$k] = (int) $l[$k];
    }
    $l['lat'] = (float) $l['lat'];
    $l['lng'] = (float) $l['lng'];
    return $l;
}

try {
    $pdo = db();
    $accion = $_GET['accion'] ?? '';
    $post = $_SERVER['REQUEST_METHOD'] === 'POST';

    switch ($accion) {
        case 'locales': {
            simular_estados($pdo);
            $sem = semaforos($pdo);
            $notas = [];
            foreach ($pdo->query('SELECT local_id, AVG(estrellas) AS prom, COUNT(*) AS n FROM resenas GROUP BY local_id') as $r) {
                $notas[(int) $r['local_id']] = ['prom' => round((float) $r['prom'], 1), 'n' => (int) $r['n']];
            }
            $promos = [];
            foreach ($pdo->query('SELECT local_id, titulo FROM promos WHERE activa = 1 ORDER BY creado DESC') as $p) {
                $promos[(int) $p['local_id']] ??= $p['titulo'];
            }
            $lista = [];
            foreach ($pdo->query('SELECT * FROM locales ORDER BY nombre') as $l) {
                $id = (int) $l['id'];
                $lista[] = publico($l) + [
                    'semaforo' => $sem[$id] ?? sin_datos(),
                    'nota' => $notas[$id] ?? ['prom' => null, 'n' => 0],
                    'promo' => $promos[$id] ?? null,
                ];
            }
            responder(['locales' => $lista, 'demo' => demo(), 'hora' => date('g:i a')]);
        }

        case 'local': {
            $l = buscar_local($pdo, $_GET['id'] ?? 0);
            $id = (int) $l['id'];
            $st = $pdo->prepare('SELECT titulo, detalle FROM promos WHERE local_id = ? AND activa = 1 ORDER BY creado DESC');
            $st->execute([$id]);
            $promos = $st->fetchAll();

            $st = $pdo->prepare('SELECT autor, estrellas, comentario, verificada, creado FROM resenas WHERE local_id = ? ORDER BY creado DESC LIMIT 15');
            $st->execute([$id]);
            $resenas = array_map(fn($r) => [
                'autor' => $r['autor'], 'estrellas' => (int) $r['estrellas'], 'comentario' => $r['comentario'],
                'verificada' => (bool) $r['verificada'], 'hace' => time() - (int) $r['creado'],
            ], $st->fetchAll());

            $st = $pdo->prepare('SELECT nivel, fuente, verificado, creado FROM estados WHERE local_id = ? AND creado >= ? ORDER BY creado DESC LIMIT 8');
            $st->execute([$id, time() - VENTANA]);
            $historial = array_map(fn($h) => [
                'nivel' => (int) $h['nivel'], 'fuente' => $h['fuente'], 'verificado' => (bool) $h['verificado'],
                'hace' => time() - (int) $h['creado'],
            ], $st->fetchAll());

            responder(['local' => publico($l) + [
                'semaforo' => semaforos($pdo, $id)[$id] ?? sin_datos(),
                'promos' => $promos,
                'resenas' => $resenas,
                'historial' => $historial,
            ]]);
        }

        case 'reportar': {
            if (!$post) responder(['error' => 'Método no permitido.'], 405);
            $in = entrada();
            $l = buscar_local($pdo, $in['id'] ?? 0);
            $nivel = (int) ($in['nivel'] ?? 0);
            if (!isset(NIVELES[$nivel])) responder(['error' => 'Elige cómo está el sitio.'], 422);

            $disp = dispositivo();
            $st = $pdo->prepare("SELECT COUNT(*) FROM estados WHERE local_id = ? AND dispositivo = ? AND fuente = 'usuario' AND creado > ?");
            $st->execute([$l['id'], $disp, time() - 600]);
            if ((int) $st->fetchColumn() > 0) {
                responder(['error' => 'Ya reportaste este sitio hace poco. Puedes volver a hacerlo en 10 minutos.'], 429);
            }

            $verificado = esta_en_sitio($l, $in['lat'] ?? null, $in['lng'] ?? null);
            $pdo->prepare("INSERT INTO estados (local_id, nivel, fila, fuente, verificado, dispositivo, creado) VALUES (?, ?, ?, 'usuario', ?, ?, ?)")
                ->execute([$l['id'], $nivel, !empty($in['fila']) ? 1 : 0, $verificado ? 1 : 0, $disp, time()]);

            responder([
                'ok' => true,
                'verificado' => $verificado,
                'mensaje' => $verificado
                    ? '¡Gracias! Tu reporte quedó verificado porque estás en el sitio.'
                    : '¡Gracias! Como no estás en el sitio, tu reporte cuenta menos.',
            ]);
        }

        case 'resena': {
            if (!$post) responder(['error' => 'Método no permitido.'], 405);
            $in = entrada();
            $l = buscar_local($pdo, $in['id'] ?? 0);
            $estrellas = (int) ($in['estrellas'] ?? 0);
            $comentario = trim((string) ($in['comentario'] ?? ''));
            $autor = trim((string) ($in['autor'] ?? '')) ?: 'Anónimo';
            if ($estrellas < 1 || $estrellas > 5) responder(['error' => 'Elige de 1 a 5 estrellas.'], 422);
            if (mb_strlen($comentario) < 3) responder(['error' => 'Escribe un comentario corto.'], 422);

            $disp = dispositivo();
            $st = $pdo->prepare('SELECT COUNT(*) FROM resenas WHERE local_id = ? AND dispositivo = ? AND creado > ?');
            $st->execute([$l['id'], $disp, time() - 3600]);
            if ((int) $st->fetchColumn() > 0) responder(['error' => 'Ya dejaste una reseña de este sitio hace poco.'], 429);

            $verificada = esta_en_sitio($l, $in['lat'] ?? null, $in['lng'] ?? null);
            $pdo->prepare('INSERT INTO resenas (local_id, autor, estrellas, comentario, verificada, dispositivo, creado) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$l['id'], mb_substr($autor, 0, 40), $estrellas, mb_substr($comentario, 0, 300), $verificada ? 1 : 0, $disp, time()]);
            responder(['ok' => true, 'verificada' => $verificada]);
        }

        case 'compartir': {
            if (!$post) responder(['error' => 'Método no permitido.'], 405);
            $in = entrada();
            if (!is_numeric($in['lat'] ?? null) || !is_numeric($in['lng'] ?? null)) {
                responder(['error' => 'No pudimos leer tu ubicación.'], 422);
            }
            $token = bin2hex(random_bytes(6));
            $clave = bin2hex(random_bytes(16));
            $nombre = mb_substr(trim((string) ($in['nombre'] ?? '')) ?: 'Tu parcero', 0, 40);
            $pdo->prepare('INSERT INTO ubicaciones (token, clave, nombre, lat, lng, actualizado, expira) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$token, $clave, $nombre, (float) $in['lat'], (float) $in['lng'], time(), time() + 4 * 3600]);
            responder(['token' => $token, 'clave' => $clave]);
        }

        case 'compartir_actualizar': {
            if (!$post) responder(['error' => 'Método no permitido.'], 405);
            $in = entrada();
            $st = $pdo->prepare('UPDATE ubicaciones SET lat = ?, lng = ?, actualizado = ? WHERE token = ? AND clave = ? AND expira > ?');
            $st->execute([(float) ($in['lat'] ?? 0), (float) ($in['lng'] ?? 0), time(), (string) ($in['token'] ?? ''), (string) ($in['clave'] ?? ''), time()]);
            responder(['ok' => $st->rowCount() > 0]);
        }

        case 'compartir_detener': {
            if (!$post) responder(['error' => 'Método no permitido.'], 405);
            $in = entrada();
            $pdo->prepare('UPDATE ubicaciones SET expira = ? WHERE token = ? AND clave = ?')
                ->execute([time(), (string) ($in['token'] ?? ''), (string) ($in['clave'] ?? '')]);
            responder(['ok' => true]);
        }

        case 'compartido': {
            $st = $pdo->prepare('SELECT nombre, lat, lng, actualizado, expira FROM ubicaciones WHERE token = ?');
            $st->execute([(string) ($_GET['t'] ?? '')]);
            $u = $st->fetch();
            if (!$u) responder(['error' => 'Este enlace no existe.'], 404);
            responder([
                'nombre' => $u['nombre'], 'lat' => (float) $u['lat'], 'lng' => (float) $u['lng'],
                'hace' => time() - (int) $u['actualizado'], 'activo' => (int) $u['expira'] > time(),
            ]);
        }

        default:
            responder(['error' => 'Acción desconocida.'], 404);
    }
} catch (Throwable $ex) {
    error_log('Borra2 API: ' . $ex->getMessage());
    responder(['error' => 'Algo falló en el servidor. Intenta de nuevo.'], 500);
}
