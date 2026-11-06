<?php
declare(strict_types=1);

date_default_timezone_set('America/Bogota');

/**
 * Conexión a la base de datos.
 * - En Render (o cualquier servidor) se usa PostgreSQL leyendo la variable DATABASE_URL.
 * - En el computador, si no hay DATABASE_URL, se usa un archivo SQLite en /data
 *   para poder probar sin instalar PostgreSQL.
 */
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $url = getenv('DATABASE_URL');
    if ($url) {
        $p = parse_url($url);
        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s',
            $p['host'],
            $p['port'] ?? 5432,
            ltrim($p['path'] ?? '', '/')
        );
        $pdo = new PDO($dsn, urldecode($p['user'] ?? ''), urldecode($p['pass'] ?? ''));
    } else {
        $dir = __DIR__ . '/../data';
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $pdo = new PDO('sqlite:' . $dir . '/borra2.sqlite');
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');
    }

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    preparar_bd($pdo);
    return $pdo;
}

function es_pg(PDO $pdo): bool
{
    return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql';
}

/** Crea las tablas si no existen y carga los datos de ejemplo la primera vez. */
function preparar_bd(PDO $pdo): void
{
    $pg = es_pg($pdo);
    $id = $pg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $real = $pg ? 'DOUBLE PRECISION' : 'REAL';
    $big = $pg ? 'BIGINT' : 'INTEGER';

    $pdo->beginTransaction();
    if ($pg) {
        // Evita que dos visitas simultáneas creen los datos dos veces.
        $pdo->exec('SELECT pg_advisory_xact_lock(424242)');
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS locales (
        id $id,
        slug TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        musica TEXT NOT NULL,
        lat $real NOT NULL,
        lng $real NOT NULL,
        direccion TEXT NOT NULL,
        cover INTEGER NOT NULL DEFAULT 0,
        precio_trago INTEGER NOT NULL DEFAULT 0,
        horario TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        ambiente TEXT NOT NULL,
        vestimenta TEXT NOT NULL,
        popularidad INTEGER NOT NULL DEFAULT 2,
        verificado INTEGER NOT NULL DEFAULT 1,
        usuario TEXT NOT NULL UNIQUE,
        clave_hash TEXT NOT NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS estados (
        id $id,
        local_id INTEGER NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
        nivel INTEGER NOT NULL,
        fila INTEGER NOT NULL DEFAULT 0,
        musica_ahora TEXT,
        fuente TEXT NOT NULL,
        verificado INTEGER NOT NULL DEFAULT 0,
        dispositivo TEXT,
        creado $big NOT NULL
    )");
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_estados_creado ON estados (creado)');

    $pdo->exec("CREATE TABLE IF NOT EXISTS promos (
        id $id,
        local_id INTEGER NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        detalle TEXT NOT NULL DEFAULT '',
        activa INTEGER NOT NULL DEFAULT 1,
        creado $big NOT NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS resenas (
        id $id,
        local_id INTEGER NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
        autor TEXT NOT NULL,
        estrellas INTEGER NOT NULL,
        comentario TEXT NOT NULL,
        verificada INTEGER NOT NULL DEFAULT 0,
        dispositivo TEXT,
        creado $big NOT NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS ubicaciones (
        token TEXT PRIMARY KEY,
        clave TEXT NOT NULL,
        nombre TEXT NOT NULL,
        lat $real NOT NULL,
        lng $real NOT NULL,
        actualizado $big NOT NULL,
        expira $big NOT NULL
    )");

    $hay = (int) $pdo->query('SELECT COUNT(*) FROM locales')->fetchColumn();
    if ($hay === 0) {
        cargar_datos_demo($pdo);
    }
    $pdo->commit();
}

function cargar_datos_demo(PDO $pdo): void
{
    $demo = require __DIR__ . '/datos_demo.php';
    $t = time();
    $hash = password_hash($demo['clave_demo'], PASSWORD_DEFAULT);

    $insLocal = $pdo->prepare('INSERT INTO locales
        (slug, nombre, tipo, musica, lat, lng, direccion, cover, precio_trago, horario, descripcion, ambiente, vestimenta, popularidad, verificado, usuario, clave_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id');
    $insPromo = $pdo->prepare('INSERT INTO promos (local_id, titulo, detalle, activa, creado) VALUES (?, ?, ?, 1, ?)');
    $insResena = $pdo->prepare('INSERT INTO resenas (local_id, autor, estrellas, comentario, verificada, creado) VALUES (?, ?, ?, ?, ?, ?)');
    $insEstado = $pdo->prepare('INSERT INTO estados (local_id, nivel, fila, musica_ahora, fuente, verificado, creado) VALUES (?, ?, ?, ?, ?, ?, ?)');

    foreach ($demo['locales'] as $l) {
        $insLocal->execute([
            $l['slug'], $l['nombre'], $l['tipo'], $l['musica'], $l['lat'], $l['lng'], $l['direccion'],
            $l['cover'], $l['precio_trago'], $l['horario'], $l['descripcion'], $l['ambiente'], $l['vestimenta'],
            $l['popularidad'], $l['verificado'] ?? 1, $l['slug'], $hash,
        ]);
        $localId = (int) $insLocal->fetchColumn();
        $insLocal->closeCursor();

        foreach ($l['promos'] ?? [] as $p) {
            $insPromo->execute([$localId, $p[0], $p[1], $t - 3600 * 5]);
        }
        foreach ($l['resenas'] ?? [] as $i => $r) {
            $insResena->execute([$localId, $r[0], $r[1], $r[2], $r[3], $t - 86400 * ($i + 1) - 3600 * 3]);
        }
        // Un par de reportes recientes para que el mapa arranque con vida.
        $insEstado->execute([$localId, $l['popularidad'], 0, null, 'local', 1, $t - 900]);
        $insEstado->execute([$localId, $l['popularidad'], $l['popularidad'] === 3 ? 1 : 0, null, 'usuario', 1, $t - 420]);
    }
}
