/* TEMP: verificacion de codificacion UTF-8 real (salida ASCII-safe) */
const fs = require('fs');
function tag(f) {
  const s = fs.readFileSync(f, 'utf8');
  const m = s.match(/window\.CATALOG_TAG = "([^"]+)"/);
  return m ? m[1] : null;
}
const expect = {
  'accion': 'Acción', 'aventura': 'Aventura', 'rpg': 'RPG', 'estrategia': 'Estrategia',
  'deportes-carreras': 'Deportes y Carreras', 'simulacion': 'Simulación', 'terror-supervivencia': 'Terror y Supervivencia'
};
let allOk = true;
for (const [slug, label] of Object.entries(expect)) {
  const t = tag(slug + '-roms.js');
  const ok = t === label;
  if (!ok) allOk = false;
  console.log(slug.padEnd(22), 'len=' + (t ? t.length : 'null'), 'match=' + ok,
    'codes=' + (t ? [...t].map(c => c.codePointAt(0).toString(16)).join(',') : '-'));
}
const idx = fs.readFileSync('index.html', 'utf8');
console.log('index dropdown accion link ok:', idx.includes('<a href="accion.html">Acción</a>'));
const rpg = fs.readFileSync('rpg.html', 'utf8');
console.log('rpg h1 ok:', rpg.includes('<h1><span class="grad">RPG</span></h1>'));
console.log('rpg script ok:', rpg.includes('<script src="rpg-roms.js"></script>'));
console.log('rpg aria ok:', rpg.includes('aria-label="Buscar ROMs de RPG"'));
console.log('rpg popTitle ok:', rpg.includes('RPG Popular ROMs'));
console.log('rpg eyebrow ok:', rpg.includes('<div class="top-eyebrow">Catálogo · <b>RPG</b></div>'));
console.log('ALL TAGS OK:', allOk);
