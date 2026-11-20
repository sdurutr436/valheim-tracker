// Datos y lógica de progreso y filtros. Logros, columnas y claves vienen de _data/tracker.js
const DATA = JSON.parse(document.getElementById('tracker-data').textContent);
// Texto de la interfaz según idioma: { en, es }
const tx = o => (lang === 'es' && o.es) || o.en;
// Minúsculas y sin tildes, para que "cecina" encuentre "Cecina" y "arandanos" encuentre "Arándanos"
const fold = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const $ = s => document.querySelector(s);

// Una columna aplica a una fila si la fila tiene su campo (Cocinado solo en lo que se cocina…)
const applies = (c, r) => !c.field || !!r[c.field];
const TABS = DATA.tabs.map(t => ({
  ...t, cols: t.cols.map(k => DATA.cols[k]), rows: DATA.rows[t.ns].filter(r => !t.filter || r[t.filter]),
}));

const checked = (tab, r, k) => isChecked(tab.ns, r.key, k);
const complete = (tab, r) => tab.cols.filter(c => applies(c, r)).every(c => checked(tab, r, c.k));

// Casillas marcadas / casillas que cuentan (Preparado no cuenta)
function progress(tab) {
  let done = 0, total = 0;
  for (const r of tab.rows) for (const c of tab.cols) if (!c.extra && applies(c, r)) { total++; done += checked(tab, r, c.k); }
  return [done, total];
}

// Filtros: { q, status: all|todo|done }
const matches = (tab, r, f) =>
  (!f.q || fold(r.name).includes(f.q) || fold(r.nameEs).includes(f.q)) &&
  (f.status === 'all' || complete(tab, r) === (f.status === 'done'));
