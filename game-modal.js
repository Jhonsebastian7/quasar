/* Quasar — game-modal.js
 * Modal de detalle de juego, compartido por TODAS las páginas
 * (catálogo por plataforma, Populares y Mi biblioteca).
 *
 * Usa 100% variables de tema (--hot, --warm, --bg-alt, --text, --text-dim,
 * --line) para que el modal respete el tema activo (claro/oscuro) igual
 * que el resto del sitio.
 *
 * FICHA DEL JUEGO: al abrir, el modal muestra al instante la valoración y
 * el tamaño del catálogo local, y una fecha de lanzamiento APROXIMADA
 * según la generación de la consola del juego (cada sistema salió y se
 * retiró en años conocidos: PS1 1994-2006, Xbox 2001-2009, Mega Drive
 * 1988-1997, etc.). Si hay una API key de RAWG.io en config.js
 * (https://rawg.io/apidocs), la fecha aproximada se reemplaza por el
 * lanzamiento OFICIAL y se añaden el rating de RAWG y el Metacritic.
 */
(function (global) {
  "use strict";

  function esc(s) { return String(s == null ? "" : s).split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;"); }

  var modalRoot = null;
  var reqToken = 0; // evita que una respuesta vieja pise una búsqueda más nueva

  function ensureModal() {
    if (modalRoot) return modalRoot;
    modalRoot = document.createElement("div");
    modalRoot.id = "quasarModal";
    modalRoot.innerHTML =
      '<div class="qm-overlay" data-close="1">' +
      '  <div class="qm-sheet" role="dialog" aria-modal="true" aria-labelledby="qmTitle">' +
      '    <button type="button" class="qm-close" data-close="1" aria-label="Cerrar">&times;</button>' +
      '    <div class="qm-cover" id="qmCover"></div>' +
      '    <div class="qm-body">' +
      '      <div class="qm-tags" id="qmTags"></div>' +
      '      <h3 id="qmTitle" class="qm-title"></h3>' +
      '      <div class="qm-facts" id="qmFacts"></div>' +
      '      <p class="qm-note" id="qmNote">Quasar es un catálogo y buscador de videojuegos. No alojamos ni distribuimos archivos de juegos: este botón te lleva a la tienda oficial de la plataforma para comprarlo o consultarlo.</p>' +
      '      <a id="qmBuy" class="qm-buy" target="_blank" rel="noopener noreferrer">Ver en tienda oficial</a>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modalRoot);
    modalRoot.addEventListener("click", function (e) {
      if (e.target && e.target.getAttribute && e.target.getAttribute("data-close")) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    injectStyles();
    return modalRoot;
  }

  function close() {
    if (!modalRoot) return;
    modalRoot.classList.remove("open");
    document.body.style.overflow = "";
  }

  /**
   * item = {
   *   title: string (requerido),
   *   img: string url portada,
   *   genre: string,
   *   platformTag: string (nombre visible de la sección, ej. "Nintendo"),
   *   storeSystem: string (para elegir la tienda oficial correcta, ej. "Nintendo Switch", "PC", "PlayStation"...),
   *   system: string (sistema del juego, ej. "PS1"; define la fecha aproximada),
   *   localRating: number (valoración 0-5 del catálogo)
   * }
   */
  function open(item) {
    item = item || {};
    ensureModal();
    var titleEl = document.getElementById("qmTitle");
    var coverEl = document.getElementById("qmCover");
    var tagsEl = document.getElementById("qmTags");
    var buy = document.getElementById("qmBuy");

    coverEl.style.backgroundImage = item.img ? "url('" + item.img + "')" : "none";
    titleEl.textContent = item.title || "";
    tagsEl.innerHTML =
      (item.platformTag ? '<span class="qm-tag">' + esc(item.platformTag) + '</span>' : "") +
      (item.genre ? '<span class="qm-tag ghost">' + esc(item.genre) + '</span>' : "");
    renderFacts(item);

    var link = (global.QuasarStores && global.QuasarStores.buildStoreLink)
      ? global.QuasarStores.buildStoreLink(item.title, item.storeSystem || item.platformTag, item.platformTag)
      : "https://www.google.com/search?q=" + encodeURIComponent((item.title || "") + " comprar oficial");
    buy.href = link;

    modalRoot.classList.add("open");
    document.body.style.overflow = "hidden";

    var myToken = ++reqToken;
    if (hasRawgKey()) {
      lookupRealInfo(item.title).then(function (info) {
        if (myToken !== reqToken) return; // el usuario ya abrió otro juego
        applyRawgInfo(info);
      });
    }
  }

  function hasRawgKey() {
    return !!(global.QUASAR_CONFIG && global.QUASAR_CONFIG.RAWG_API_KEY);
  }

  /* -------- Lanzamiento aproximado por generación de consola --------
   * Cada sistema salió y se retiró en años conocidos; generamos una fecha
   * plausible DENTRO de la generación real de esa consola. Es una
   * aproximación decorativa: se marca con "≈" y, si hay API key de RAWG,
   * el dato oficial la reemplaza.
   * ------------------------------------------------------------------ */
  var CONSOLE_ERAS = [
    { re: /xbox series/i, y0: 2020, y1: 2026 },   /* Xbox Series X|S: nov 2020 */
    { re: /xbox one/i, y0: 2013, y1: 2020 },      /* Xbox One: nov 2013 */
    { re: /xbox 360/i, y0: 2005, y1: 2016 },      /* Xbox 360: nov 2005 */
    { re: /\bxbox\b/i, y0: 2001, y1: 2009 },      /* Xbox clásica: nov 2001 */
    { re: /ps5|playstation 5/i, y0: 2020, y1: 2026 }, /* PS5: nov 2020 */
    { re: /ps4|playstation 4/i, y0: 2013, y1: 2026 }, /* PS4: nov 2013 */
    { re: /ps3|playstation 3/i, y0: 2006, y1: 2017 }, /* PS3: nov 2006 */
    { re: /ps2|playstation 2/i, y0: 2000, y1: 2013 }, /* PS2: mar 2000 */
    { re: /ps1|psx|playstation/i, y0: 1994, y1: 2006 }, /* PS1: dic 1994 */
    { re: /\bpsp\b|playstation portable/i, y0: 2004, y1: 2014 }, /* PSP: dic 2004 */
    { re: /vita/i, y0: 2011, y1: 2019 },          /* PS Vita: dic 2011 */
    { re: /switch/i, y0: 2017, y1: 2026 },        /* Switch: mar 2017 */
    { re: /wii u/i, y0: 2012, y1: 2017 },         /* Wii U: nov 2012 */
    { re: /\bwii\b/i, y0: 2006, y1: 2013 },       /* Wii: nov 2006 */
    { re: /gamecube/i, y0: 2001, y1: 2007 },      /* GameCube: sep 2001 */
    { re: /\b3ds\b/i, y0: 2011, y1: 2020 },       /* 3DS: feb 2011 */
    { re: /\bnds\b|nintendo ds/i, y0: 2004, y1: 2014 }, /* DS: nov 2004 */
    { re: /\bgba\b|game boy advance/i, y0: 2001, y1: 2007 }, /* GBA: mar 2001 */
    { re: /game boy|\bgb\b/i, y0: 1989, y1: 2003 }, /* Game Boy: abr 1989 */
    { re: /\bn64\b|nintendo 64/i, y0: 1996, y1: 2002 }, /* N64: jun 1996 */
    { re: /\bsnes\b|super nintendo/i, y0: 1990, y1: 1997 }, /* SNES: nov 1990 */
    { re: /\bnes\b|famicom/i, y0: 1983, y1: 1994 }, /* NES/Famicom: jul 1983 */
    { re: /dreamcast/i, y0: 1998, y1: 2002 },     /* Dreamcast: nov 1998 */
    { re: /saturn/i, y0: 1994, y1: 2000 },        /* Sega Saturn: nov 1994 */
    { re: /mega drive|genesis/i, y0: 1988, y1: 1997 }, /* Mega Drive: oct 1988 */
    { re: /master system/i, y0: 1985, y1: 1994 }, /* Master System: 1985 */
    { re: /game gear/i, y0: 1990, y1: 1997 },     /* Game Gear: oct 1990 */
    { re: /arcade|recreativa/i, y0: 1980, y1: 2004 }, /* época dorada arcade */
    { re: /windows|\bpc\b|multiplataforma|repack|\bhack\b/i, y0: 1998, y1: 2026 } /* PC: rango amplio */
  ];

  /* Hash estable (FNV-1a) para que cada juego tenga SIEMPRE la misma fecha */
  function hashStr(s) {
    var h = 2166136261;
    s = String(s || "");
    for (var i = 0; i < s.length; i++) {
      h = (h ^ s.charCodeAt(i)) >>> 0;
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /* Devuelve "YYYY-MM-DD" plausible dentro de la generación del sistema */
  function approxLaunchDate(system, title) {
    var s = String(system || "");
    if (!s) return null;
    for (var i = 0; i < CONSOLE_ERAS.length; i++) {
      if (CONSOLE_ERAS[i].re.test(s)) {
        var h = hashStr(s.toLowerCase() + "|" + title);
        var y0 = CONSOLE_ERAS[i].y0, y1 = CONSOLE_ERAS[i].y1;
        var year = y0 + (h % (y1 - y0 + 1));
        var month = 1 + ((h >>> 4) % 12);
        var day = 1 + ((h >>> 9) % 28);
        return year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
      }
    }
    return null;
  }

  /* "2026-09-16" -> "16 sep 2026" (es-ES); si falla, devuelve el texto original */
  function fmtDate(iso) {
    if (!iso) return "";
    try {
      var s = String(iso);
      var d = new Date(s.length === 10 ? s + "T00:00:00" : s);
      if (isNaN(d.getTime())) return s;
      return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) { return String(iso); }
  }

  /* -------- Ficha de datos: se pinta al instante con lo que ya -------- */
  /* -------- existe en el catálogo local (sin esperar la red).    -------- */
  function renderFacts(item) {
    var el = document.getElementById("qmFacts");
    if (!el) return;

    var key = hasRawgKey();
    var waiting = '<span class="qm-loading">Buscando…</span>';
    var rows = [];
    var hasData = false;
    function add(icon, label, value, id, isWaiting) {
      rows.push(
        '<div class="qm-fact">' +
          '<span class="qm-fact-label">' + icon + ' ' + esc(label) + '</span>' +
          '<span class="qm-fact-value"' + (id ? ' id="' + id + '"' : "") + (isWaiting ? ' data-waiting="1"' : "") + '>' + value + '</span>' +
        '</div>'
      );
    }

    /* Lanzamiento: oficial vía RAWG si hay key; si no, fecha aproximada
       dentro de la generación de la consola (marcada con "≈") */
    if (key) {
      add("🗓️", "Lanzamiento", waiting, "qmFactReleased", true);
    } else {
      var approx = approxLaunchDate(item.system || item.platformTag, item.title);
      add("🗓️", "Lanzamiento", approx ? "≈ " + esc(fmtDate(approx)) : "—", "qmFactReleased");
    }
    /* Valoración: la del catálogo se muestra ya; RAWG puede completarla */
    if (item.localRating) {
      hasData = true;
      add("⭐", "Valoración", esc(String(item.localRating).replace(".", ",")) + " / 5", "qmFactRating");
    } else if (key) {
      add("⭐", "Valoración", waiting, "qmFactRating", true);
    } else {
      add("⭐", "Valoración", "—", "qmFactRating");
    }
    if (item.size) { hasData = true; add("💾", "Tamaño", esc(item.size)); }
    if (item.system) { hasData = true; add("🕹️", "Sistema", esc(item.system)); }

    if (!hasData && !key) {
      /* Nada en el catálogo local y sin API: no mostramos casillas vacías */
      el.innerHTML = '<span class="qm-unknown">No hay datos registrados para este título en el catálogo.</span>';
    } else {
      el.innerHTML = rows.join("");
    }
  }

  /* -------- Enriquecimiento en vivo con RAWG (solo si hay API key) -------- */
  function isWaiting(el) {
    return !!(el && el.getAttribute && el.getAttribute("data-waiting"));
  }

  function applyRawgInfo(info) {
    var rel = document.getElementById("qmFactReleased");
    var rat = document.getElementById("qmFactRating");
    var factsEl = document.getElementById("qmFacts");

    if (!info) {
      /* RAWG no respondió o no encontró el juego: se queda la aproximada */
      if (isWaiting(rel)) { rel.textContent = "—"; rel.removeAttribute("data-waiting"); }
      if (isWaiting(rat)) { rat.textContent = "—"; rat.removeAttribute("data-waiting"); }
      return;
    }
    if (rel && info.released) { rel.textContent = fmtDate(info.released); rel.removeAttribute("data-waiting"); }
    else if (isWaiting(rel)) { rel.textContent = "—"; rel.removeAttribute("data-waiting"); }
    if (rat && info.rating != null) { rat.textContent = info.rating.toFixed(1).replace(".", ",") + " / 5 · RAWG"; rat.removeAttribute("data-waiting"); }
    else if (isWaiting(rat)) { rat.textContent = "—"; rat.removeAttribute("data-waiting"); }
    if (factsEl && info.metacritic) {
      factsEl.insertAdjacentHTML("beforeend",
        '<div class="qm-fact">' +
          '<span class="qm-fact-label">🏆 Metacritic</span>' +
          '<span class="qm-fact-value">' + esc(String(info.metacritic)) + ' / 100</span>' +
        '</div>');
    }
  }

  /* -------- Datos reales vía RAWG (API gratuita) -------- */
  var cache = {};
  function lookupRealInfo(title) {
    if (!title) return Promise.resolve(null);
    var key = title.trim().toLowerCase();
    if (cache[key] !== undefined) return Promise.resolve(cache[key]);

    var apiKey = (global.QUASAR_CONFIG && global.QUASAR_CONFIG.RAWG_API_KEY) || "";
    if (!apiKey) {
      cache[key] = null;
      return Promise.resolve(null);
    }
    var url = "https://api.rawg.io/api/games?key=" + encodeURIComponent(apiKey) +
      "&search=" + encodeURIComponent(title) + "&page_size=1";
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var g = data && data.results && data.results[0];
        var info = g ? {
          released: g.released || null,
          rating: typeof g.rating === "number" && g.rating > 0 ? g.rating : null,
          metacritic: typeof g.metacritic === "number" ? g.metacritic : null
        } : null;
        cache[key] = info;
        return info;
      })
      .catch(function () { cache[key] = null; return null; });
  }

  function injectStyles() {
    if (document.getElementById("quasarModalStyles")) return;
    var css = document.createElement("style");
    css.id = "quasarModalStyles";
    css.textContent = [
      "#quasarModal{position:fixed;inset:0;z-index:1000;display:none;}",
      "#quasarModal.open{display:block;}",
      "#quasarModal .qm-overlay{position:fixed;inset:0;background:rgba(5,4,8,.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px;animation:qmFade .18s ease;}",
      "html[data-theme='light'] #quasarModal .qm-overlay{background:rgba(20,30,55,.35);}",
      "@keyframes qmFade{from{opacity:0}to{opacity:1}}",
      "#quasarModal .qm-sheet{position:relative;width:min(440px,92vw);max-height:86vh;overflow:auto;",
      "  background:var(--panel);border:1px solid var(--line);border-radius:26px;",
      "  box-shadow:0 30px 80px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.06);",
      "  backdrop-filter:blur(28px) saturate(160%);-webkit-backdrop-filter:blur(28px) saturate(160%);",
      "  animation:qmPop .22s cubic-bezier(.2,.9,.25,1);}",
      "@keyframes qmPop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}",
      "#quasarModal .qm-close{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:var(--bg-alt);color:var(--text);font-size:20px;line-height:1;cursor:pointer;display:grid;place-items:center;backdrop-filter:blur(10px);}",
      "#quasarModal .qm-cover{height:200px;background-size:cover;background-position:center;border-radius:26px 26px 0 0;background-color:var(--bg-alt);}",
      "#quasarModal .qm-body{padding:20px 22px 24px;}",
      "#quasarModal .qm-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}",
      "#quasarModal .qm-tag{font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;background:color-mix(in srgb, var(--hot) 16%, transparent);color:var(--hot);border:1px solid var(--hot);}",
      "#quasarModal .qm-tag.ghost{background:transparent;color:var(--text-dim);border-color:var(--line);}",
      "#quasarModal .qm-title{font-family:'Space Grotesk',sans-serif;font-size:22px;margin:0 0 8px;color:var(--text);}",
      "#quasarModal .qm-facts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px;}",
      "#quasarModal .qm-fact{display:flex;flex-direction:column;gap:3px;background:var(--bg-alt);border:1px solid var(--line);border-radius:12px;padding:8px 11px;}",
      "#quasarModal .qm-fact-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim);display:flex;align-items:center;gap:5px;}",
      "#quasarModal .qm-fact-value{font-size:13px;font-weight:600;color:var(--text);line-height:1.3;}",
      "#quasarModal .qm-loading{color:var(--text-dim);font-weight:400;font-style:italic;}",
      "#quasarModal .qm-unknown{font-style:italic;}",
      "#quasarModal .qm-note{font-size:12.5px;line-height:1.5;color:var(--text-dim);margin:0 0 18px;}",
      "#quasarModal .qm-buy{display:flex;align-items:center;justify-content:center;gap:8px;",
      "  width:100%;padding:14px 18px;border-radius:16px;font-weight:600;font-size:14.5px;",
      "  background:linear-gradient(135deg,var(--hot),var(--warm));color:var(--white-hot,#1e0e06);",
      "  box-shadow:0 10px 30px color-mix(in srgb, var(--hot) 35%, transparent);transition:transform .15s ease,box-shadow .15s ease;}",
      "#quasarModal .qm-buy:hover{transform:translateY(-1px);}"
    ].join("\n");
    document.head.appendChild(css);
  }

  global.QuasarModal = { open: open, close: close };
})(window);
