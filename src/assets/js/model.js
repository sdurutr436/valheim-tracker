// Datos, definición de logros y lógica de progreso/filtrado/orden. Sin DOM.
const DATA = JSON.parse(document.getElementById('tracker-data').textContent);
const BIOMES = DATA.biomes.map(b => b.en);
const BIOME_ES = Object.fromEntries(DATA.biomes.map(b => [b.en, b.es]));
// Campo de una fila según idioma (name/nameEs, bait/baitEs, note/noteEs); sin traducción se queda el inglés
const loc = (r, k) => (lang === 'es' && r[k + 'Es']) || r[k];
const nameOf = r => loc(r, 'name');
// Texto de la interfaz según idioma: { en, es }
const tx = o => (lang === 'es' && o.es) || o.en;
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
    const o = { biome: '', ...r, i: i + 1, key: r.name + (seen[r.name] ? '#' + seen[r.name] : '') };
    seen[r.name] = (seen[r.name] || 0) + 1;
    o.bi = Math.min(99, ...BIOMES.map((b, j) => (o.biome || '').includes(b) ? j : 99));
    return o;
  });
}

const chef = prep(DATA.chef);
const COL = {
  prep: { k: 'prep', label: { en: 'Prepared', es: 'Preparado' }, ap: r => r.intermediate, extra: true }, // no cuenta para el progreso
  cook: { k: 'cook', label: { en: 'Cooked', es: 'Cocinado' }, ap: r => r.cook },
  eat:  { k: 'eat',  label: { en: 'Eaten', es: 'Comido' },   ap: r => r.eat },
  done: { k: 'done', label: { en: 'Done', es: 'Hecho' },     ap: () => true },
};
// icon = imagen de la wiki (assets/img/items/<icon>.png). Títulos en español sin fuente oficial (Steam no los da)
const simple = (id, icon, title, rows, o = {}) =>
  ({ id, ns: id, icon, title, rows: prep(rows), cols: [COL.done], label: { en: 'Name', es: 'Nombre' }, ...o });

const TABS = [
  simple('hunter', 'huntsman-bow', { en: 'Master Hunter', es: 'Maestro cazador' }, DATA.hunter, { biome: true, label: { en: 'Creature', es: 'Criatura' } }),
  simple('trophy', 'deer-trophy', { en: 'Trophy Collector', es: 'Coleccionista de trofeos' }, DATA.trophy, { biome: true, label: { en: 'Trophy', es: 'Trofeo' } }),
  { id: 'cook', ns: 'chef', icon: 'cooking-station', title: { en: 'Master Chef', es: 'Maestro chef' }, rows: chef.filter(r => r.cook), cols: [COL.prep, COL.cook], biome: true, label: { en: 'Dish', es: 'Plato' } },
  { id: 'eat', ns: 'chef', icon: 'ashlands-gourmet-bowl', title: { en: 'Gourmet', es: 'Gourmet' }, rows: chef.filter(r => r.eat), cols: [COL.eat], biome: true, label: { en: 'Food', es: 'Comida' } },
  simple('fish', 'any-fish', { en: 'Fisherman', es: 'Pescador' }, DATA.fish, { biome: true, label: { en: 'Fish', es: 'Pez' }, extraCol: { k: 'bait', label: { en: 'Bait', es: 'Cebo' } } }),
  simple('artisan', 'artisan-table', { en: 'Artisan', es: 'Artesano' }, DATA.artisan, { biome: true, label: { en: 'Item', es: 'Objeto' }, num: true, view: 'cards' }),
  simple('carpenter', 'workbench', { en: 'Carpenter', es: 'Carpintero' }, DATA.carpenter, { biome: true, label: { en: 'Structure', es: 'Estructura' }, num: true, view: 'cards' }),
  // Vista combinada en cards. No suma al total global (ya cuenta en Chef y Gourmet)
  { id: 'both', ns: 'chef', icon: 'cauldron', title: { en: 'Chef × Gourmet', es: 'Chef × Gourmet' }, rows: chef, cols: [COL.prep, COL.cook, COL.eat], biome: true, label: { en: 'Dish / Food', es: 'Plato / Comida' }, noTotal: true, view: 'cards' },
];

const checked = (tab, r, col) => isChecked(tab.ns, r.key, col);
const complete = (tab, r) => tab.cols.filter(c => c.ap(r)).every(c => checked(tab, r, c.k));

// Progreso por bioma (el primero de cada fila) de todos los logros que suman al total
function biomeProgress() {
  const p = BIOMES.map(() => [0, 0]);
  for (const t of TABS) if (!t.noTotal) for (const r of t.rows) for (const c of t.cols)
    if (!c.extra && c.ap(r) && p[r.bi]) { p[r.bi][1]++; p[r.bi][0] += checked(t, r, c.k); }
  return p;
}

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
  if (k === 'bait') return loc(r, 'bait') || '';
  if (k === 'status') return +complete(tab, r);
  if (k === 'i') return r.i;
  const c = tab.cols.find(c => c.k === k);
  return c.ap(r) ? +checked(tab, r, k) : -1; // las celdas que no aplican van al final
}
function compare(tab, sort) {
  return (a, b) => {
    const x = sortValue(tab, a, sort.k), y = sortValue(tab, b, sort.k);
    const d = typeof x === 'string' ? x.localeCompare(y, lang) : x - y;
    return sort.dir * d || a.bi - b.bi || nameOf(a).localeCompare(nameOf(b), lang);
  };
}
const defaultSort = tab => tab.biome ? { k: 'biome', dir: 1 } : { k: 'i', dir: 1 };
