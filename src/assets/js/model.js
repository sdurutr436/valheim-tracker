// Datos, definición de logros y lógica de progreso/filtrado/orden. Sin DOM.
const DATA = JSON.parse(document.getElementById('tracker-data').textContent);
const BIOMES = DATA.biomes.map(b => b.en);
const BIOME_ES = Object.fromEntries(DATA.biomes.map(b => [b.en, b.es]));
// Nombre según idioma; si no hay traducción se queda el inglés
const nameOf = r => (lang === 'es' && r.nameEs) || r.name;
// Traduce los biomas dentro de un texto ("Meadows, Black Forest")
const biomeText = s => lang === 'es' ? BIOMES.reduce((t, b) => BIOME_ES[b] ? t.replace(b, BIOME_ES[b]) : t, s || '') : s;
// Minúsculas y sin tildes, para que "cecina" encuentre "Cecina" y "arandanos" encuentre "Arándanos"
const fold = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = s => s.toLowerCase().replace(/\W+/g, '-'); // igual que el filtro slugify de 11ty

// i = orden original, key = id único dentro del logro (los nombres repetidos llevan #n), bi = orden de bioma
function prep(rows) {
  const seen = {};
  return rows.map((r, i) => {
    const o = { ...r, i: i + 1, key: r.name + (seen[r.name] ? '#' + seen[r.name] : '') };
    seen[r.name] = (seen[r.name] || 0) + 1;
    o.bi = Math.min(99, ...BIOMES.map((b, j) => (o.biome || '').includes(b) ? j : 99));
    return o;
  });
}

const chef = prep(DATA.chef);
const COL = {
  prep: { k: 'prep', label: 'Preparado', ap: r => r.intermediate, extra: true }, // no cuenta para el progreso
  cook: { k: 'cook', label: 'Cocinado', ap: r => r.cook },
  eat:  { k: 'eat',  label: 'Comido',   ap: r => r.eat },
  done: { k: 'done', label: 'Hecho',    ap: () => true },
};
const simple = (id, icon, title, rows, o = {}) =>
  ({ id, ns: id, icon, title, rows: prep(rows), cols: [COL.done], label: 'Nombre', ...o });

const TABS = [
  simple('hunter', '🏹', 'Master Hunter', DATA.hunter, { biome: true, label: 'Criatura' }),
  simple('trophy', '🏆', 'Trophy Collector', DATA.trophy, { biome: true, label: 'Trofeo' }),
  { id: 'cook', ns: 'chef', icon: '🍳', title: 'Master Chef', rows: chef.filter(r => r.cook), cols: [COL.prep, COL.cook], biome: true, label: 'Plato' },
  { id: 'eat', ns: 'chef', icon: '🍽️', title: 'Gourmet', rows: chef.filter(r => r.eat), cols: [COL.eat], biome: true, label: 'Comida' },
  simple('fish', '🎣', 'Fisherman', DATA.fish, { biome: true, label: 'Pez', extraCol: { k: 'bait', label: 'Cebo' } }),
  simple('artisan', '⚒️', 'Artisan', DATA.artisan, { label: 'Objeto', num: true }),
  simple('carpenter', '🪵', 'Carpenter', DATA.carpenter, { label: 'Estructura', num: true }),
  // Vista combinada en cards. No suma al total global (ya cuenta en Chef y Gourmet)
  { id: 'both', ns: 'chef', icon: '🥘', title: 'Chef × Gourmet', rows: chef, cols: [COL.prep, COL.cook, COL.eat], biome: true, label: 'Plato / Comida', noTotal: true, view: 'cards' },
];

const checked = (tab, r, col) => isChecked(tab.ns, r.key, col);
const complete = (tab, r) => tab.cols.filter(c => c.ap(r)).every(c => checked(tab, r, c.k));

function progress(tab) {
  let done = 0, total = 0;
  for (const r of tab.rows) for (const c of tab.cols) if (!c.extra && c.ap(r)) { total++; done += checked(tab, r, c.k); }
  return [done, total];
}

// Filtros: { q, status: all|todo|done, biome }
const matches = (tab, r, f) =>
  (!f.biome || r.biome.includes(f.biome)) &&
  (!f.q || fold(r.name).includes(f.q) || fold(r.nameEs).includes(f.q)) &&
  (f.status === 'all' || complete(tab, r) === (f.status === 'done'));

// Orden: { k, dir }. k = i | biome | name | bait | status | <columna>
function sortValue(tab, r, k) {
  if (k === 'biome') return r.bi;
  if (k === 'name') return nameOf(r);
  if (k === 'bait') return r.bait || '';
  if (k === 'status') return +complete(tab, r);
  if (k === 'i') return r.i;
  const c = tab.cols.find(c => c.k === k);
  return c.ap(r) ? +checked(tab, r, k) : -1; // las celdas que no aplican van al final
}
function compare(tab, sort) {
  return (a, b) => {
    const x = sortValue(tab, a, sort.k), y = sortValue(tab, b, sort.k);
    const d = typeof x === 'string' ? x.localeCompare(y, 'es') : x - y;
    return sort.dir * d || a.bi - b.bi || nameOf(a).localeCompare(nameOf(b), 'es');
  };
}
const defaultSort = tab => tab.biome ? { k: 'biome', dir: 1 } : { k: 'i', dir: 1 };
