/* Quasar — catalog-engine.js
 * Motor compartido de catálogo: filtros, orden, paginación y ficha de detalle.
 * Al hacer clic en un juego se abre un modal que enlaza a la tienda OFICIAL
 * de esa plataforma (ver stores.js). Quasar no aloja ni distribuye archivos
 * de juegos bajo ninguna circunstancia.
 */
(function () {
  "use strict";
  var DATA = (window.CATALOG_ROMS || window.PC_ROMS || []).slice();
  var PLATFORM_TAG = window.CATALOG_TAG || "Windows";

  var grid = document.getElementById("latestGrid");
  var latestPag = document.getElementById("latestPag");
  var randGrid = document.getElementById("randomGrid");
  var randPag = document.getElementById("randomPag");
  var list = document.getElementById("rankList");
  var popPag = document.getElementById("popPag");
  var emptyMsg = document.getElementById("rankEmpty");
  var search = document.getElementById("rankSearch");
  var pills = Array.prototype.slice.call(document.querySelectorAll("#pcTypePills .filter-pill"));
  var fGenero = document.getElementById("fGenero");
  var fColeccion = document.getElementById("fColeccion");
  var fTipo = document.getElementById("fTipo");
  var fOrden = document.getElementById("fOrden");
  var btnClear = document.getElementById("pcClear");
  var btnShuffle = document.getElementById("pcShuffle");
  var latestCount = document.getElementById("latestCount");
  var randCount = document.getElementById("randomCount");
  var popCount = document.getElementById("popCount");

  var state = { type: "todos", genre: "", col: "", tipo: "", order: "recientes", q: "", randPage: 1, latestPage: 1, popPage: 1 };
  function norm(s) { return (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function esc(s) { return String(s == null ? "" : s).split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;"); }
  function fmtDl(n) { n = +n || 0; if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + "M"; if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(".", ",") + "K"; return String(n); }

  function fillSelect(sel, values, allLabel) {
    if (!sel) return;
    var i, has = false;
    for (i = 0; i < sel.options.length; i++) if (sel.options[i].value === "") has = true;
    if (!has) { var o0 = document.createElement("option"); o0.value = ""; o0.textContent = allLabel; sel.appendChild(o0); }
    values.forEach(function (v) { var o = document.createElement("option"); o.value = v; o.textContent = v; sel.appendChild(o); });
  }
  function uniq(key) {
    var out = [];
    DATA.forEach(function (it) { if (it[key] && out.indexOf(it[key]) < 0) out.push(it[key]); });
    out.sort(function (a, b) { return norm(a) < norm(b) ? -1 : (norm(a) > norm(b) ? 1 : 0); });
    return out;
  }
  if (fGenero) fillSelect(fGenero, uniq("g"), "Todos los géneros");
  if (fTipo) fillSelect(fTipo, uniq("ty"), "Todos los sistemas");
  if (fColeccion) fillSelect(fColeccion, uniq("col"), "Todas las colecciones");

  function passFilters(it) {
    if (state.type !== "todos" && norm(it.ty) !== norm(state.type)) return false;
    if (state.tipo && norm(it.ty) !== norm(state.tipo)) return false;
    if (state.genre && norm(it.g) !== norm(state.genre)) return false;
    if (state.col && norm(it.col) !== norm(state.col)) return false;
    if (state.q) {
      var hay = norm(it.t + " " + it.g + " " + it.ty + " " + it.col);
      if (hay.indexOf(state.q) < 0) return false;
    }
    return true;
  }
  function sortList(arr) {
    var a = arr.slice();
    if (state.order === "descargas") a.sort(function (x, y) { return y.dl - x.dl; });
    else if (state.order === "nombre") a.sort(function (x, y) { return norm(x.t) < norm(y.t) ? -1 : (norm(x.t) > norm(y.t) ? 1 : 0); });
    else if (state.order === "nombre-desc") a.sort(function (x, y) { return norm(x.t) > norm(y.t) ? -1 : (norm(x.t) < norm(y.t) ? 1 : 0); });
    else if (state.order === "tamano") a.sort(function (x, y) { return (y.szn || 0) - (x.szn || 0); });
    else if (state.order === "tamano-asc") a.sort(function (x, y) { return (x.szn || 0) - (y.szn || 0); });
    else if (state.order === "rating") a.sort(function (x, y) { return (y.rt || 0) - (x.rt || 0); });
    else if (state.order === "antiguos") a.sort(function (x, y) { return (x.date || "") < (y.date || "") ? -1 : 1; });
    else a.sort(function (x, y) { return (y.date || "") < (x.date || "") ? -1 : 1; });
    return a;
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var LATEST_PER = 10, RAND_PER = 5, POP_PER = 10;
  var shuffleCtr = 0;
  var randCache = { sig: "", arr: [] };
  var latestCache = { sig: "", arr: null };
  function sigBase(arr) { return arr.map(function (x) { return x.t; }).join("|"); }
  function getBase() { return DATA.filter(passFilters); }
  function getRandom() {
    var base = getBase();
    var sig = shuffleCtr + "::" + sigBase(base);
    if (randCache.sig !== sig) { randCache.sig = sig; randCache.arr = shuffle(base); latestCache.sig = ""; latestCache.arr = null; }
    return randCache.arr.slice();
  }
  function getOrdered() {
    var base = getBase();
    if (state.order === "aleatorio") {
      var sig = shuffleCtr + "::" + sigBase(base);
      if (randCache.sig !== sig) { randCache.sig = sig; randCache.arr = shuffle(base); latestCache.sig = ""; latestCache.arr = null; }
      return randCache.arr.slice();
    }
    randCache.sig = "";
    var s2 = "ord:" + state.order + "::" + sigBase(base);
    if (latestCache.sig !== s2) { latestCache.sig = s2; latestCache.arr = sortList(base); }
    return latestCache.arr.slice();
  }
  function getPopular() {
    var base = getBase();
    if (state.order === "aleatorio") { return getOrdered(); }
    var a = base.slice();
    a.sort(function (x, y) { return (y.dl || 0) - (x.dl || 0); });
    return a;
  }

  /* Icono de "interés"/popularidad (no implica descarga de archivos). */
  var ICO_DL = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21c-4-4.2-8-7.6-8-11.6A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 20 9.4C20 13.4 16 16.8 12 21Z"/></svg>';
  var ICO_SZ = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/></svg>';

  function cardHTML(it, idx) {
    return '<article class="pc-card" tabindex="0" role="button" data-qidx="' + idx + '" aria-label="Ver ' + esc(it.t) + '">'
      + '<div class="pc-cover" data-cover="' + esc(it.img || "") + '" style="background-image:url(\'' + esc(it.img || "") + '\'),url(\'game-placeholder.jpg\')"></div>'
      + '<div class="pc-body"><div class="pc-name">' + esc(it.t) + '</div>'
      + '<div class="pc-tags"><span class="pc-tag">' + esc(PLATFORM_TAG) + '</span><span class="pc-tag ghost">' + esc(it.ty || "") + '</span></div>'
      + '<div class="pc-meta"><span>' + ICO_DL + esc(fmtDl(it.dl)) + '</span><span>' + ICO_SZ + esc(it.sz || "") + '</span></div>'
      + '</div></article>';
  }
  function rowHTML(it, n, idx) {
    var nn = String(n).padStart(2, "0");
    return '<div class="rank-row" tabindex="0" role="button" data-qidx="' + idx + '" aria-label="Ver ' + esc(it.t) + '">'
      + '<span class="rank-num">' + nn + '</span>'
      + '<div class="rank-cover" data-cover="' + esc(it.img || "") + '" style="background-image:url(\'' + esc(it.img || "") + '\'),url(\'game-placeholder.jpg\')"></div>'
      + '<div><div class="rank-title">' + esc(it.t) + '</div>'
      + '<div class="rank-sub">' + esc(it.g || "") + ' <span class="platform-pill">' + esc(it.ty || "PC") + '</span></div></div>'
      + '<div class="rank-stat">' + ICO_DL + esc(fmtDl(it.dl)) + '</div>'
      + '<div class="rank-stat hide-mobile">' + ICO_SZ + esc(it.sz || "") + '</div>'
      + '</div>';
  }
  function pag(el, total, cur, cb) {
    if (!el) return;
    el.innerHTML = "";
    if (total <= 1) return;
    function nav(label, page, dis, aria) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "pc-page"; b.innerHTML = label;
      if (dis) b.disabled = true; else b.addEventListener("click", function () { cb(page); });
      if (aria) b.setAttribute("aria-label", aria);
      el.appendChild(b);
    }
    nav("&lsaquo;", Math.max(1, cur - 1), cur <= 1, "Anterior");
    var p = 1;
    while (p <= total) {
      if (p === 1 || p === total || Math.abs(p - cur) <= 1) {
        (function (pg) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "pc-page" + (pg === cur ? " active" : ""); b.textContent = pg;
          if (pg !== cur) b.addEventListener("click", function () { cb(pg); });
          el.appendChild(b);
        })(p);
        p++;
      } else {
        var s = document.createElement("span"); s.textContent = "…";
        s.style.cssText = "color:var(--text-dim);padding:0 4px;";
        el.appendChild(s);
        if (p < cur) p = cur - 1; else p = total;
      }
    }
    nav("&rsaquo;", Math.min(total, cur + 1), cur >= total, "Siguiente");
  }

  /* ---------- referencia de índice -> item, para el modal ---------- */
  var indexMap = [];
  function track(it) { indexMap.push(it); return indexMap.length - 1; }

  function renderAll() {
    indexMap = [];
    var ordered = getOrdered();
    var randoms = getRandom();
    var popular = getPopular();
    var rt = Math.max(1, Math.ceil(randoms.length / RAND_PER));
    var lt = Math.max(1, Math.ceil(ordered.length / LATEST_PER));
    var pt = Math.max(1, Math.ceil(popular.length / POP_PER));
    if (state.randPage > rt) state.randPage = rt;
    if (state.latestPage > lt) state.latestPage = lt;
    if (state.popPage > pt) state.popPage = pt;
    if (randCount) randCount.textContent = randoms.length ? "(" + randoms.length + ")" : "";
    if (latestCount) latestCount.textContent = ordered.length ? "(" + ordered.length + ")" : "";
    if (popCount) popCount.textContent = popular.length ? "(" + popular.length + ")" : "";
    if (emptyMsg) emptyMsg.hidden = (ordered.length + randoms.length + popular.length) > 0;
    if (randGrid) {
      randGrid.innerHTML = "";
      var rs = randoms.slice((state.randPage - 1) * RAND_PER, state.randPage * RAND_PER);
      for (var r = 0; r < rs.length; r++) randGrid.insertAdjacentHTML("beforeend", cardHTML(rs[r], track(rs[r])));
    }
    if (grid) {
      grid.innerHTML = "";
      var gs = ordered.slice((state.latestPage - 1) * LATEST_PER, state.latestPage * LATEST_PER);
      for (var i = 0; i < gs.length; i++) grid.insertAdjacentHTML("beforeend", cardHTML(gs[i], track(gs[i])));
    }
    if (list) {
      list.innerHTML = "";
      var ps = popular.slice((state.popPage - 1) * POP_PER, state.popPage * POP_PER);
      for (var j = 0; j < ps.length; j++) list.insertAdjacentHTML("beforeend", rowHTML(ps[j], (state.popPage - 1) * POP_PER + j + 1, track(ps[j])));
    }
    pag(randPag, rt, state.randPage, function (pg) { state.randPage = pg; renderAll(); });
    pag(latestPag, lt, state.latestPage, function (pg) { state.latestPage = pg; renderAll(); });
    pag(popPag, pt, state.popPage, function (pg) { state.popPage = pg; renderAll(); });
    wireCardClicks();
    repairCovers();
  }
  function repairCovers() {
    var nodes = document.querySelectorAll(".pc-cover[data-cover],.rank-cover[data-cover]");
    nodes.forEach(function (el) {
      var url = el.getAttribute("data-cover");
      if (!url) return;
      var tries = 0;
      var probe = new Image();
      probe.onload = function () { el.style.backgroundImage = "url('" + url + "')"; };
      probe.onerror = function () {
        tries++;
        if (tries < 3) { setTimeout(function () { probe.src = url + (url.indexOf("?") < 0 ? "?" : "&") + "retry=" + tries; }, 1200 * tries); }
        else { el.style.backgroundImage = "url('game-placeholder.jpg')"; }
      };
      probe.src = url;
    });
  }
  function resetPages() { state.randPage = 1; state.latestPage = 1; state.popPage = 1; }
  var k = 0;
  for (k = 0; k < pills.length; k++) {
    (function (p) {
      p.addEventListener("click", function () {
        var m = 0;
        for (m = 0; m < pills.length; m++) pills[m].classList.remove("active");
        p.classList.add("active");
        state.type = p.getAttribute("data-filter") || "todos";
        resetPages(); renderAll();
      });
    })(pills[k]);
  }
  if (fGenero) fGenero.addEventListener("change", function () { state.genre = this.value; resetPages(); renderAll(); });
  if (fColeccion) fColeccion.addEventListener("change", function () { state.col = this.value; resetPages(); renderAll(); });
  if (fTipo) fTipo.addEventListener("change", function () { state.tipo = this.value; resetPages(); renderAll(); });
  if (fOrden) {
    var hasRand = false;
    for (var o = 0; o < fOrden.options.length; o++) if (fOrden.options[o].value === "aleatorio") hasRand = true;
    if (!hasRand) {
      var ro = document.createElement("option"); ro.value = "aleatorio"; ro.textContent = "Aleatorio";
      fOrden.appendChild(ro);
    }
    fOrden.addEventListener("change", function () { state.order = this.value || "recientes"; resetPages(); renderAll(); });
  }
  if (search) {
    var deb = null;
    search.addEventListener("input", function () {
      var v = this.value;
      if (deb) clearTimeout(deb);
      deb = setTimeout(function () { state.q = norm(v.trim()); resetPages(); renderAll(); }, 160);
    });
  }
  if (btnClear) btnClear.addEventListener("click", function () {
    state.type = "todos"; state.genre = ""; state.col = ""; state.tipo = "";
    state.order = "recientes"; state.q = "";
    state.randPage = 1; state.latestPage = 1; state.popPage = 1; shuffleCtr++; randCache.sig = "";
    for (var m = 0; m < pills.length; m++) pills[m].classList.toggle("active", (pills[m].getAttribute("data-filter") || "todos") === "todos");
    if (search) search.value = "";
    if (fGenero) fGenero.value = ""; if (fColeccion) fColeccion.value = "";
    if (fTipo) fTipo.value = ""; if (fOrden) fOrden.value = "recientes";
    renderAll();
  });
  if (btnShuffle) btnShuffle.addEventListener("click", function () { shuffleCtr++; renderAll(); });

  (function () {
    try {
      var mq = (location.search || "").match(/[?&]q=([^&]+)/);
      if (mq && search) {
        var q0 = decodeURIComponent(mq[1].replace(/\+/g, " "));
        search.value = q0;
        state.q = norm(q0.trim());
      }
    } catch (e) { }
  })();

  /* =========================================================
   *  MODAL DE DETALLE — delega en game-modal.js (compartido con
   *  Populares y Mi biblioteca). Enlaza a la tienda oficial,
   *  nunca descarga nada.
   * ========================================================= */
  function wireCardClicks() {
    var nodes = document.querySelectorAll("[data-qidx]");
    nodes.forEach(function (node) {
      node.addEventListener("click", function () { openByIdx(node); });
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openByIdx(node); }
      });
    });
  }
  function openByIdx(node) {
    var idx = +node.getAttribute("data-qidx");
    var it = indexMap[idx];
    if (!it || !window.QuasarModal) return;
    window.QuasarModal.open({
      title: it.t,
      img: it.img,
      genre: it.g,
      platformTag: PLATFORM_TAG,
      storeSystem: it.ty,
      system: it.ty,
      localRating: it.rt
    });
  }

  var cardCSS = document.createElement("style");
  cardCSS.textContent = ".pc-card{cursor:pointer;} .rank-row{cursor:pointer;}";
  document.head.appendChild(cardCSS);

  renderAll();
})();
