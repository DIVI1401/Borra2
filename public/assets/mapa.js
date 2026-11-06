(() => {
    const CONFIG = window.BORRA2;
    const EMOJI = { 0: '❔', 1: '🍸', 2: '🎶', 3: '🔥' };
    const ETIQUETA = { 1: 'Tranquilo', 2: 'Animado', 3: 'A reventar' };

    const estado = {
        locales: [],
        filtros: { musica: 'Todas', cover: 'todos', ambiente: false },
        abierto: null,        // id del local con la ficha abierta
        yo: null,             // { lat, lng } si la persona compartió su GPS
        compartir: null,      // { token, clave, watchId }
        marcadores: new Map(),
    };

    const $ = (s) => document.querySelector(s);
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pesos = (n) => (n === 0 ? 'Gratis' : '$' + Number(n).toLocaleString('es-CO'));
    const hace = (s) => (s == null ? 'sin datos' : s < 60 ? 'hace un momento' : s < 3600 ? `hace ${Math.round(s / 60)} min` : `hace ${Math.floor(s / 3600)} h`);
    const estrellas = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
    const metros = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);

    function distancia(a, b) {
        const r = 6371000, rad = Math.PI / 180;
        const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
        const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
        return 2 * r * Math.asin(Math.min(1, Math.sqrt(x)));
    }

    async function api(accion, datos, extra = '') {
        const opciones = datos
            ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }
            : {};
        const r = await fetch(`api.php?accion=${accion}${extra}`, opciones);
        const j = await r.json().catch(() => ({ error: 'El servidor no respondió bien.' }));
        if (!r.ok || j.error) throw new Error(j.error || 'Algo falló.');
        return j;
    }

    function toast(texto, error = false) {
        const t = $('#toast');
        t.textContent = texto;
        t.className = 'toast' + (error ? ' error' : '');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => t.classList.add('oculto'), 3800);
    }

    /** Pide el GPS sin bloquear: si la persona no da permiso, sigue sin él. */
    function posicion(timeout = 6000) {
        return new Promise((resolve) => {
            if (!navigator.geolocation) return resolve(null);
            navigator.geolocation.getCurrentPosition(
                (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
                () => resolve(null),
                { enableHighAccuracy: true, timeout, maximumAge: 30000 }
            );
        });
    }

    // ---------------- Mapa ----------------
    const mapa = L.map('mapa', { zoomControl: false }).setView(CONFIG.centro, 15);
    // Mapa de OpenStreetMap (gratis, sin clave); el CSS lo oscurece para el estilo nocturno.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(mapa);
    L.control.zoom({ position: 'topright' }).addTo(mapa);
    let marcadorYo = null;

    function icono(l) {
        const n = l.semaforo.nivel;
        const sel = estado.abierto === l.id ? ' seleccionado' : '';
        return L.divIcon({
            className: 'pin-wrap',
            iconSize: [0, 0],
            html: `<div class="pin n${n}${sel}">${EMOJI[n]}</div><div class="pin-nombre">${esc(l.nombre)}</div>`,
        });
    }

    // ---------------- Filtros ----------------
    function visibles() {
        const f = estado.filtros;
        let lista = estado.locales.filter((l) =>
            (f.musica === 'Todas' || l.musica === f.musica) &&
            (f.cover === 'todos' || (f.cover === 'gratis' ? l.cover === 0 : l.cover <= 20000)) &&
            (!f.ambiente || l.semaforo.nivel >= 2)
        );
        if (estado.yo) {
            lista.forEach((l) => (l.distancia = distancia(estado.yo, l)));
            lista.sort((a, b) => a.distancia - b.distancia);
        } else {
            lista.sort((a, b) => b.semaforo.nivel - a.semaforo.nivel || a.nombre.localeCompare(b.nombre));
        }
        return lista;
    }

    function pintarFiltros() {
        const musicas = ['Todas', ...new Set(estado.locales.map((l) => l.musica).sort())];
        const f = estado.filtros;
        $('#filtros').innerHTML =
            `<button class="chip ${f.ambiente ? 'activo' : ''}" data-ambiente>🔥 Con ambiente</button>` +
            `<button class="chip ${f.cover === 'gratis' ? 'activo' : ''}" data-cover="gratis">Sin cover</button>` +
            `<button class="chip ${f.cover === 'barato' ? 'activo' : ''}" data-cover="barato">Cover ≤ $20 mil</button>` +
            '<span class="separador"></span>' +
            musicas.map((m) => `<button class="chip ${f.musica === m ? 'activo' : ''}" data-musica="${esc(m)}">${esc(m)}</button>`).join('');
    }

    $('#filtros').addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        const f = estado.filtros;
        if (b.dataset.musica) f.musica = b.dataset.musica;
        if (b.dataset.cover) f.cover = f.cover === b.dataset.cover ? 'todos' : b.dataset.cover;
        if ('ambiente' in b.dataset) f.ambiente = !f.ambiente;
        pintarFiltros();
        pintar();
    });

    // ---------------- Lista + marcadores ----------------
    function pintar() {
        const lista = visibles();
        const ids = new Set(lista.map((l) => l.id));

        for (const [id, m] of estado.marcadores) {
            if (!ids.has(id)) { m.remove(); estado.marcadores.delete(id); }
        }
        for (const l of lista) {
            let m = estado.marcadores.get(l.id);
            if (!m) {
                m = L.marker([l.lat, l.lng], { icon: icono(l), riseOnHover: true }).addTo(mapa);
                m.on('click', () => abrirFicha(l.id));
                estado.marcadores.set(l.id, m);
            } else {
                m.setIcon(icono(l));
            }
            m.setZIndexOffset(estado.abierto === l.id ? 1000 : l.semaforo.nivel * 100);
        }

        if (estado.abierto === null) pintarLista(lista);
    }

    function pintarLista(lista) {
        const conAmbiente = estado.locales.filter((l) => l.semaforo.nivel >= 2).length;
        $('#hoja-contenido').innerHTML = `
            <div class="resumen">
                <h2>Esta noche</h2>
                <small>${estado.locales.length} sitios · ${conAmbiente} con ambiente</small>
            </div>
            ${lista.length ? lista.map(tarjeta).join('') : '<p class="vacio">Ningún sitio coincide con esos filtros.</p>'}`;
    }

    function tarjeta(l) {
        const s = l.semaforo;
        const dist = l.distancia != null && estado.yo ? ` · ${metros(l.distancia)}` : '';
        const nota = l.nota.prom ? ` · ★ ${l.nota.prom}` : '';
        return `
            <button class="tarjeta-local" data-id="${l.id}">
                <div class="indicador n${s.nivel}">${EMOJI[s.nivel]}</div>
                <div class="info">
                    <strong>${esc(l.nombre)}</strong>
                    <div class="meta">${esc(l.musica)} · Cover ${pesos(l.cover)}${nota}${dist}</div>
                    <div class="meta"><span class="estado-txt c${s.nivel}">${esc(s.etiqueta)}${s.fila ? ' · hay fila' : ''}</span> · ${hace(s.hace)}</div>
                    ${l.promo ? `<div class="promo">🎁 ${esc(l.promo)}</div>` : ''}
                </div>
            </button>`;
    }

    $('#hoja-contenido').addEventListener('click', (ev) => {
        const t = ev.target.closest('.tarjeta-local');
        if (t) abrirFicha(Number(t.dataset.id));
    });

    // ---------------- Ficha del local ----------------
    async function abrirFicha(id, mover = true) {
        estado.abierto = id;
        pintar();
        abrirHoja(true);
        try {
            const { local: l } = await api('local', null, `&id=${id}`);
            if (estado.abierto !== id) return;
            if (mover) mapa.flyTo([l.lat, l.lng], 17, { duration: 0.6 });
            $('#hoja-contenido').innerHTML = ficha(l);
            prepararFicha(l);
        } catch (e) {
            toast(e.message, true);
        }
    }

    function cerrarFicha() {
        estado.abierto = null;
        abrirHoja(false);
        pintar();
    }

    function ficha(l) {
        const s = l.semaforo;
        const fuentes = { local: 'El local', usuario: 'Un usuario', simulado: 'Sensor (demo)' };
        const detalle = s.nivel
            ? `Actualizado ${hace(s.hace)}${s.reportes_usuarios ? ` · ${s.reportes_usuarios} reporte${s.reportes_usuarios > 1 ? 's' : ''} de usuarios en la última hora` : ''}`
            : 'Nadie ha reportado en la última hora y media';
        return `
        <div class="ficha">
            <button class="volver" data-volver>← Todos los sitios</button>
            <h2>${esc(l.nombre)} ${l.verificado ? '<span class="sello">✔ Aliado verificado</span>' : '<span class="sello no">Sin verificar</span>'}</h2>
            <div class="sub">${esc(l.tipo)} · ${esc(l.musica)} · ${esc(l.direccion)}</div>

            <div class="semaforo n${s.nivel}">
                <div class="grande">${EMOJI[s.nivel]}</div>
                <div>
                    <strong class="c${s.nivel}">${esc(s.etiqueta)}${s.fila ? ' · hay fila en la puerta' : ''}</strong>
                    <small>${detalle}</small>
                </div>
            </div>

            <div class="datos">
                <div class="dato"><span>Cover</span><b>${pesos(l.cover)}</b></div>
                <div class="dato"><span>Trago desde</span><b>${pesos(l.precio_trago)}</b></div>
                <div class="dato"><span>Sonando ahora</span><b>${esc(s.musica_ahora || l.musica)}</b></div>
                <div class="dato"><span>Vestimenta</span><b>${esc(l.vestimenta)}</b></div>
                <div class="dato ancho"><span>Horario</span><b>${esc(l.horario)}</b></div>
                <div class="dato ancho"><span>Ambiente</span><b>${esc(l.ambiente)}</b></div>
            </div>
            <p class="sub">${esc(l.descripcion)}</p>

            ${l.promos.length ? `<h3 class="seccion">🎁 Promociones</h3>` + l.promos.map((p) => `<div class="promo-caja"><b>${esc(p.titulo)}</b><small>${esc(p.detalle)}</small></div>`).join('') : ''}

            <h3 class="seccion">¿Cómo está esto ahora?</h3>
            <div class="reportar">
                ${[1, 2, 3].map((n) => `<button class="r${n}" data-nivel="${n}"><span>${EMOJI[n]}</span>${ETIQUETA[n]}</button>`).join('')}
            </div>
            <label class="check"><input type="checkbox" id="rep-fila"> Hay fila para entrar</label>
            <button class="boton" id="btn-reportar" disabled>Enviar reporte</button>

            <div class="fila-botones">
                <a class="boton secundario" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}">🧭 Cómo llegar</a>
                <button class="boton secundario" data-compartir-local>📤 Invitar al parche</button>
            </div>

            ${l.historial.length ? `<h3 class="seccion">Últimos reportes</h3><ul class="historial">` +
                l.historial.map((h) => `<li><span>${fuentes[h.fuente] || h.fuente}${h.fuente === 'usuario' && h.verificado ? ' ✔ en el sitio' : ''}</span><span class="c${h.nivel}">${ETIQUETA[h.nivel]} · ${hace(h.hace)}</span></li>`).join('') + '</ul>' : ''}

            <h3 class="seccion">Reseñas</h3>
            ${l.resenas.length ? l.resenas.map((r) => `
                <div class="resena">
                    <div class="cab"><b>${esc(r.autor)}${r.verificada ? ' <span class="sello">✔ Estuvo aquí</span>' : ''}</b><span>${hace(r.hace)}</span></div>
                    <div class="estrellas">${estrellas(r.estrellas)}</div>
                    <p>${esc(r.comentario)}</p>
                </div>`).join('') : '<p class="vacio">Todavía no hay reseñas. ¡Deja la primera!</p>'}

            <form class="form-resena" id="form-resena">
                <div class="elegir-estrellas">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-estrella="${n}">★</button>`).join('')}</div>
                <input class="campo" name="autor" maxlength="40" placeholder="Tu nombre (opcional)">
                <textarea class="campo" name="comentario" rows="2" maxlength="300" placeholder="¿Qué tal estuvo?" required></textarea>
                <button class="boton secundario" type="submit">Publicar reseña</button>
            </form>
        </div>`;
    }

    function prepararFicha(l) {
        const cont = $('#hoja-contenido');
        let nivel = 0, nota = 0;

        cont.querySelector('[data-volver]').onclick = cerrarFicha;

        cont.querySelectorAll('[data-nivel]').forEach((b) => (b.onclick = () => {
            nivel = Number(b.dataset.nivel);
            cont.querySelectorAll('[data-nivel]').forEach((x) => x.classList.toggle('elegido', x === b));
            $('#btn-reportar').disabled = false;
        }));

        $('#btn-reportar').onclick = async (ev) => {
            const b = ev.currentTarget;
            b.disabled = true;
            b.textContent = 'Enviando…';
            const pos = await posicion();
            try {
                const r = await api('reportar', { id: l.id, nivel, fila: $('#rep-fila').checked, ...(pos || {}) });
                toast(r.mensaje);
                await cargar();
                abrirFicha(l.id, false);
            } catch (e) {
                toast(e.message, true);
                b.disabled = false;
                b.textContent = 'Enviar reporte';
            }
        };

        cont.querySelectorAll('[data-estrella]').forEach((b) => (b.onclick = () => {
            nota = Number(b.dataset.estrella);
            cont.querySelectorAll('[data-estrella]').forEach((x) => x.classList.toggle('on', Number(x.dataset.estrella) <= nota));
        }));

        $('#form-resena').onsubmit = async (ev) => {
            ev.preventDefault();
            if (!nota) return toast('Elige cuántas estrellas le das.', true);
            const f = new FormData(ev.currentTarget);
            const pos = await posicion();
            try {
                await api('resena', { id: l.id, estrellas: nota, autor: f.get('autor'), comentario: f.get('comentario'), ...(pos || {}) });
                toast('¡Gracias por tu reseña!');
                await cargar();
                abrirFicha(l.id, false);
            } catch (e) {
                toast(e.message, true);
            }
        };

        cont.querySelector('[data-compartir-local]').onclick = () => {
            const texto = `¿Caemos a ${l.nombre}? Ahora está "${l.semaforo.etiqueta}" según Borra2 🔥 ${location.origin}${location.pathname}?local=${l.id}`;
            window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
        };
    }

    // ---------------- Hoja inferior ----------------
    function abrirHoja(abrir) {
        $('#hoja').classList.toggle('abierta', abrir);
        document.body.classList.toggle('hoja-abierta', abrir);
    }
    $('#asa').onclick = () => abrirHoja(!$('#hoja').classList.contains('abierta'));

    // ---------------- Mi ubicación ----------------
    $('#btn-ubicarme').onclick = async () => {
        toast('Buscando tu ubicación…');
        const pos = await posicion(10000);
        if (!pos) return toast('No pudimos acceder a tu ubicación. Revisa los permisos del navegador.', true);
        estado.yo = pos;
        const ico = L.divIcon({ className: 'pin-wrap', iconSize: [0, 0], html: '<div class="yo-pin"></div>' });
        marcadorYo ? marcadorYo.setLatLng(pos) : (marcadorYo = L.marker(pos, { icon: ico, zIndexOffset: 2000 }).addTo(mapa));
        const lejos = distancia(pos, { lat: CONFIG.centro[0], lng: CONFIG.centro[1] }) > 15000;
        mapa.flyTo(lejos ? CONFIG.centro : pos, 15);
        toast(lejos ? 'Estás lejos de la zona norte de Montería: te mostramos la zona igual.' : 'Ordenamos los sitios por cercanía.');
        pintar();
    };

    // ---------------- Modal (compartir y SOS) ----------------
    function modal(html) {
        $('#modal-contenido').innerHTML = html;
        $('#modal').classList.remove('oculto');
    }
    const cerrarModal = () => $('#modal').classList.add('oculto');
    $('#modal-cerrar').onclick = cerrarModal;
    $('#modal').onclick = (ev) => { if (ev.target.id === 'modal') cerrarModal(); };

    function modalCompartir() {
        if (estado.compartir) return mostrarEnlace();
        modal(`
            <h3>📡 Compartir mi ubicación</h3>
            <p>Tus amigos verán dónde estás en un mapa durante las próximas 4 horas, mientras tengas Borra2 abierta. Puedes detenerlo cuando quieras.</p>
            <div class="opciones">
                <input class="campo" id="nombre-compartir" maxlength="40" placeholder="Tu nombre (ej. Sami)">
                <button class="boton" id="btn-iniciar-compartir">Generar enlace</button>
            </div>`);
        $('#btn-iniciar-compartir').onclick = iniciarCompartir;
    }

    async function iniciarCompartir() {
        const b = $('#btn-iniciar-compartir');
        b.disabled = true;
        b.textContent = 'Obteniendo ubicación…';
        const pos = await posicion(10000);
        if (!pos) {
            b.disabled = false;
            b.textContent = 'Generar enlace';
            return toast('Necesitamos permiso de ubicación para compartirla.', true);
        }
        try {
            const r = await api('compartir', { nombre: $('#nombre-compartir').value, ...pos });
            estado.compartir = { token: r.token, clave: r.clave, ultimo: 0 };
            estado.compartir.watchId = navigator.geolocation.watchPosition((p) => {
                const c = estado.compartir;
                if (!c || Date.now() - c.ultimo < 20000) return;
                c.ultimo = Date.now();
                api('compartir_actualizar', { token: c.token, clave: c.clave, lat: p.coords.latitude, lng: p.coords.longitude }).catch(() => {});
            }, () => {}, { enableHighAccuracy: true });
            $('#compartiendo').classList.remove('oculto');
            mostrarEnlace();
        } catch (e) {
            toast(e.message, true);
        }
    }

    function enlaceCompartido() {
        return `${location.origin}${location.pathname.replace(/[^/]*$/, '')}compartir.php?t=${estado.compartir.token}`;
    }

    function mostrarEnlace() {
        const url = enlaceCompartido();
        modal(`
            <h3>✅ Enlace listo</h3>
            <p>Mándaselo a tu parche. Verán tu ubicación en vivo mientras la sigas compartiendo.</p>
            <div class="enlace-copiar">
                <input class="campo" id="enlace" readonly value="${esc(url)}">
                <button class="mini" id="btn-copiar">Copiar</button>
            </div>
            <a class="boton" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Esta es mi ubicación en vivo 📍 ' + url)}">Enviar por WhatsApp</a>`);
        $('#btn-copiar').onclick = async () => {
            try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
            catch { $('#enlace').select(); }
        };
    }

    async function detenerCompartir() {
        const c = estado.compartir;
        if (!c) return;
        navigator.geolocation.clearWatch(c.watchId);
        estado.compartir = null;
        $('#compartiendo').classList.add('oculto');
        api('compartir_detener', { token: c.token, clave: c.clave }).catch(() => {});
        toast('Dejaste de compartir tu ubicación.');
    }

    $('#btn-compartir').onclick = modalCompartir;
    $('#btn-detener').onclick = detenerCompartir;

    $('#btn-sos').onclick = () => {
        modal(`
            <h3>🛟 ¿Necesitas ayuda?</h3>
            <p>Si estás en peligro, llama a la línea de emergencias. También puedes mandarle tu ubicación a alguien de confianza.</p>
            <div class="opciones">
                <a class="boton" href="tel:123" style="background:var(--rojo)">📞 Llamar al 123</a>
                <button class="boton secundario" id="sos-compartir">📡 Compartir mi ubicación</button>
            </div>
            <ul class="consejos">
                <li>No recibas bebidas de desconocidos ni dejes tu trago solo.</li>
                <li>Pide el transporte desde una app y comparte la placa.</li>
                <li>Acuerda con tu parche un punto de encuentro.</li>
            </ul>`);
        $('#sos-compartir').onclick = modalCompartir;
    };

    // ---------------- Carga de datos ----------------
    async function cargar() {
        try {
            const r = await api('locales');
            estado.locales = r.locales;
            if (!$('#filtros').children.length) pintarFiltros();
            pintar();
        } catch (e) {
            toast(e.message, true);
        }
    }

    cargar().then(() => {
        const pedido = Number(new URLSearchParams(location.search).get('local'));
        if (pedido && estado.locales.some((l) => l.id === pedido)) abrirFicha(pedido);
    });
    // Refresca el semáforo cada 30 segundos (sin tocar la ficha abierta).
    setInterval(cargar, 30000);
})();
