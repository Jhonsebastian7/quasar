/* Quasar — cards-wire.js
 * Conecta las tarjetas/filas que NO pasan por catalog-engine.js
 * (la sección "Populares" y "Mi biblioteca" del perfil) al mismo
 * modal de detalle + tienda oficial que usa el catálogo por
 * plataforma.
 */
(function () {
  "use strict";
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function text(el) { return el ? el.textContent.trim() : ""; }
  function bgUrl(el) {
    if (!el) return "";
    var m = /url\((['"]?)(.*?)\1\)/.exec(el.style.backgroundImage || "");
    return m ? m[2] : "";
  }

  /* ---- Top 50 / Populares: filas .rank-row[data-platform] ---- */
  function wireRankRows() {
    var rows = document.querySelectorAll(".rank-row[data-platform]");
    rows.forEach(function (row) {
      if (row.__quasarWired) return;
      row.__quasarWired = true;
      row.style.cursor = "pointer";
      row.setAttribute("tabindex", "0");
      row.setAttribute("role", "button");
      var titleEl = row.querySelector(".rank-title");
      var coverEl = row.querySelector(".rank-cover");
      var subEl = row.querySelector(".rank-sub");
      var platformPill = row.querySelector(".platform-pill");
      var genre = "";
      if (subEl) {
        var clone = subEl.cloneNode(true);
        var pill = clone.querySelector(".platform-pill");
        if (pill) pill.remove();
        genre = clone.textContent.trim();
      }
      function openIt() {
        if (!window.QuasarModal) return;
        window.QuasarModal.open({
          title: text(titleEl),
          img: bgUrl(coverEl),
          genre: genre,
          platformTag: text(platformPill) || row.getAttribute("data-platform"),
          storeSystem: row.getAttribute("data-platform") || text(platformPill)
        });
      }
      row.addEventListener("click", openIt);
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIt(); }
      });
    });
  }

  /* ---- Mi biblioteca (perfil.html): <figure><img><figcaption> ---- */
  function wireLibraryCards() {
    var figs = document.querySelectorAll(".g-grid figure");
    figs.forEach(function (fig) {
      if (fig.__quasarWired) return;
      fig.__quasarWired = true;
      fig.style.cursor = "pointer";
      fig.setAttribute("tabindex", "0");
      fig.setAttribute("role", "button");
      var img = fig.querySelector("img");
      var cap = fig.querySelector("figcaption");
      function openIt() {
        if (!window.QuasarModal) return;
        window.QuasarModal.open({
          title: text(cap),
          img: img ? img.getAttribute("src") : "",
          genre: "",
          platformTag: "Mi biblioteca",
          storeSystem: "PC" // las portadas de la biblioteca vienen de Steam; si tu juego es de otra plataforma, ajusta esto manualmente en el HTML con data-store="xbox|playstation|nintendo"
        });
      }
      fig.addEventListener("click", openIt);
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIt(); }
      });
    });
  }

  ready(function () {
    wireRankRows();
    wireLibraryCards();
    // Por si el contenido se inyecta dinámicamente más tarde
    var mo = new MutationObserver(function () { wireRankRows(); wireLibraryCards(); });
    mo.observe(document.body, { childList: true, subtree: true });
  });
})();
