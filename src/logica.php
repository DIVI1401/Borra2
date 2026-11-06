<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

const NIVELES = [1 => 'Tranquilo', 2 => 'Animado', 3 => 'A reventar'];
/** Un reporte deja de contar después de 90 minutos ("si no está actualizado, no se muestra"). */
const VENTANA = 5400;
/** Distancia máxima (metros) para que un reporte o reseña cuente como "verificado en el sitio". */
const RADIO_VERIFICADO = 200;

/** Modo demo: activo por defecto. Simula reportes para que el mapa siempre tenga vida. */
function demo(): bool
{
    $v = getenv('DEMO_MODO');
    return $v === false || $v === '' || in_array(strtolower($v), ['1', 'true', 'si', 'sí'], true);
}

function centro_mapa(): array
{
    return (require __DIR__ . '/datos_demo.php')['centro'];
}

function distancia_m(float $lat1, float $lng1, float $lat2, float $lng2): float
{
    $r = 6371000;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
    return 2 * $r * asin(min(1, sqrt($a)));
}

/** ¿La persona está físicamente en el local? (según el GPS que manda el celular) */
function esta_en_sitio(array $local, $lat, $lng): bool
{
    if (!is_numeric($lat) || !is_numeric($lng)) {
        return false;
    }
    return distancia_m((float) $local['lat'], (float) $local['lng'], (float) $lat, (float) $lng) <= RADIO_VERIFICADO;
}

/**
 * En modo demo, cada 20 minutos se genera un reporte simulado por local
 * (según su popularidad y algo de azar), así la demo se ve viva a cualquier hora.
 */
function simular_estados(PDO $pdo): void
{
    if (!demo()) {
        return;
    }
    $t = time();
    $ultimos = $pdo->query('SELECT local_id, MAX(creado) AS u FROM estados GROUP BY local_id')
        ->fetchAll(PDO::FETCH_KEY_PAIR);
    $locales = $pdo->query('SELECT id, popularidad FROM locales')->fetchAll();
    $ins = $pdo->prepare('INSERT INTO estados (local_id, nivel, fila, fuente, verificado, creado) VALUES (?, ?, ?, ?, 1, ?)');
    $bloque = intdiv($t, 1200);

    foreach ($locales as $l) {
        $id = (int) $l['id'];
        if ((int) ($ultimos[$id] ?? 0) > $t - 1200) {
            continue;
        }
        $ruido = crc32("$id-$bloque") % 3 - 1;
        $nivel = max(1, min(3, (int) $l['popularidad'] + $ruido));
        $fila = $nivel === 3 && crc32("fila-$id-$bloque") % 2 === 0 ? 1 : 0;
        $ins->execute([$id, $nivel, $fila, 'simulado', $t - crc32("min-$id-$bloque") % 600]);
    }
}

/**
 * El "semáforo" de cada local: combina lo que reporta el local (pesa más),
 * lo que reportan los usuarios verificados en el sitio y los no verificados.
 * Los reportes viejos pesan menos y después de 90 min ya no cuentan.
 */
function semaforos(PDO $pdo, ?int $soloLocal = null): array
{
    $t = time();
    $sql = 'SELECT local_id, nivel, fila, musica_ahora, fuente, verificado, creado FROM estados WHERE creado >= ?';
    $params = [$t - VENTANA];
    if ($soloLocal !== null) {
        $sql .= ' AND local_id = ?';
        $params[] = $soloLocal;
    }
    $st = $pdo->prepare($sql . ' ORDER BY creado ASC');
    $st->execute($params);

    $acc = [];
    foreach ($st->fetchAll() as $e) {
        $id = (int) $e['local_id'];
        $edad = max(0, $t - (int) $e['creado']);
        $peso = match ($e['fuente']) {
            'local' => 3.0,
            'simulado' => 2.0,
            default => $e['verificado'] ? 2.0 : 1.0,
        } * max(0.1, 1 - $edad / VENTANA);

        $a = $acc[$id] ?? ['suma' => 0.0, 'peso' => 0.0, 'fila' => 0, 'musica_ahora' => null, 'ultimo' => 0, 'usuarios' => 0];
        $a['suma'] += $peso * (int) $e['nivel'];
        $a['peso'] += $peso;
        $a['fila'] = (int) $e['fila'];
        $a['ultimo'] = max($a['ultimo'], (int) $e['creado']);
        if ($e['fuente'] === 'local' && $e['musica_ahora']) {
            $a['musica_ahora'] = $e['musica_ahora'];
        }
        if ($e['fuente'] === 'usuario' && $edad <= 3600) {
            $a['usuarios']++;
        }
        $acc[$id] = $a;
    }

    $res = [];
    foreach ($acc as $id => $a) {
        $nivel = (int) max(1, min(3, round($a['suma'] / $a['peso'])));
        $res[$id] = [
            'nivel' => $nivel,
            'etiqueta' => NIVELES[$nivel],
            'fila' => (bool) $a['fila'],
            'musica_ahora' => $a['musica_ahora'],
            'hace' => $t - $a['ultimo'],
            'reportes_usuarios' => $a['usuarios'],
        ];
    }
    return $res;
}

function sin_datos(): array
{
    return ['nivel' => 0, 'etiqueta' => 'Sin datos recientes', 'fila' => false, 'musica_ahora' => null, 'hace' => null, 'reportes_usuarios' => 0];
}

/** Identificador anónimo del celular (cookie), para evitar reportes repetidos. */
function dispositivo(): string
{
    $d = $_COOKIE['b2_dispositivo'] ?? '';
    if (!preg_match('/^[a-f0-9]{32}$/', $d)) {
        $d = bin2hex(random_bytes(16));
        setcookie('b2_dispositivo', $d, ['expires' => time() + 86400 * 365, 'path' => '/', 'samesite' => 'Lax', 'httponly' => true]);
    }
    return $d;
}

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function pesos(int $n): string
{
    return $n === 0 ? 'Gratis' : '$' . number_format($n, 0, ',', '.');
}

function hace_texto(?int $seg): string
{
    if ($seg === null) {
        return 'sin datos';
    }
    if ($seg < 60) {
        return 'hace un momento';
    }
    if ($seg < 3600) {
        return 'hace ' . round($seg / 60) . ' min';
    }
    return 'hace ' . floor($seg / 3600) . ' h';
}
