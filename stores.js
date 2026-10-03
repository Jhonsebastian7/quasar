/* Quasar — stores.js
 * Construye el enlace oficial de compra/consulta para cada juego.
 * Quasar NO aloja ni enlaza archivos de juegos: solo redirige a la
 * tienda oficial de la plataforma correspondiente (o a una búsqueda
 * general de compra oficial cuando la plataforma ya no tiene tienda
 * digital vigente, como consolas retro).
 */
(function (global) {
  "use strict";

  function q(str) {
    return encodeURIComponent(String(str || "").trim());
  }

  // Plantillas de búsqueda por tienda oficial vigente.
  var STORE_SEARCH = {
    "nintendo switch": "https://www.nintendo.com/us/search/#q={q}&p=1&sort=df&ff=corePlatforms:Nintendo%20Switch",
    "switch": "https://www.nintendo.com/us/search/#q={q}",
    "nes": "https://www.nintendo.com/us/search/#q={q}",
    "snes": "https://www.nintendo.com/us/search/#q={q}",
    "n64": "https://www.nintendo.com/us/search/#q={q}",
    "gamecube": "https://www.nintendo.com/us/search/#q={q}",
    "game boy": "https://www.nintendo.com/us/search/#q={q}",
    "gba": "https://www.nintendo.com/us/search/#q={q}",
    "nds": "https://www.nintendo.com/us/search/#q={q}",
    "3ds": "https://www.nintendo.com/us/search/#q={q}",
    "wii": "https://www.nintendo.com/us/search/#q={q}",
    "wii u": "https://www.nintendo.com/us/search/#q={q}",

    "ps1": "https://store.playstation.com/en-us/search/{q}",
    "ps2": "https://store.playstation.com/en-us/search/{q}",
    "ps3": "https://store.playstation.com/en-us/search/{q}",
    "ps4": "https://store.playstation.com/en-us/search/{q}",
    "ps5": "https://store.playstation.com/en-us/search/{q}",
    "psp": "https://store.playstation.com/en-us/search/{q}",
    "psvita": "https://store.playstation.com/en-us/search/{q}",
    "playstation": "https://store.playstation.com/en-us/search/{q}",

    "xbox": "https://www.xbox.com/en-us/games/store/search?q={q}",
    "xbox 360": "https://www.xbox.com/en-us/games/store/search?q={q}",
    "xbox one": "https://www.xbox.com/en-us/games/store/search?q={q}",
    "xbox series": "https://www.xbox.com/en-us/games/store/search?q={q}",

    "pc": "https://store.steampowered.com/search/?term={q}",
    "windows": "https://store.steampowered.com/search/?term={q}",
    "steam": "https://store.steampowered.com/search/?term={q}",

    "genesis": "https://www.google.com/search?q={q}+comprar+oficial+Sega",
    "mega drive": "https://www.google.com/search?q={q}+comprar+oficial+Sega",
    "sega": "https://www.google.com/search?q={q}+comprar+oficial+Sega",
    "dreamcast": "https://www.google.com/search?q={q}+comprar+oficial+Sega",
    "saturn": "https://www.google.com/search?q={q}+comprar+oficial+Sega",
    "arcade": "https://www.google.com/search?q={q}+comprar+version+oficial"
  };

  var FALLBACK = "https://www.google.com/search?q={q}+comprar+version+oficial";

  function norm(s) {
    return (s || "").toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  /**
   * Devuelve la URL oficial de compra/consulta para un juego.
   * @param {string} title  Título del juego.
   * @param {string} system Sistema/plataforma tal como viene en los datos (it.ty).
   * @param {string} tag    Etiqueta de la sección (window.CATALOG_TAG), como respaldo.
   */
  function buildStoreLink(title, system, tag) {
    var key = norm(system) || norm(tag);
    var template = STORE_SEARCH[key];
    if (!template) {
      // intenta por coincidencia parcial (p. ej. "Nintendo Switch 2" -> "nintendo switch")
      for (var k in STORE_SEARCH) {
        if (STORE_SEARCH.hasOwnProperty(k) && key.indexOf(k) !== -1) {
          template = STORE_SEARCH[k];
          break;
        }
      }
    }
    if (!template) template = FALLBACK;
    return template.replace("{q}", q(title));
  }

  global.QuasarStores = { buildStoreLink: buildStoreLink };
})(window);
