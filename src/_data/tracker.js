// Todo lo que pintan las plantillas y lo que viaja al navegador (#tracker-data), en un solo sitio.
// Las claves de progreso (nombre + #n si se repite) se calculan aquí igual que antes, para no perder lo guardado.
import { readFileSync, existsSync } from 'node:fs';
import shopping from './shopping.js';

const load = f => JSON.parse(readFileSync(new URL(`./${f}.json`, import.meta.url), 'utf8'));
const slug = s => s.toLowerCase().replace(/\W+/g, '-');
const img = name => existsSync(new URL(`./assets/${name}.png`, import.meta.url)) ? `assets/img/items/${name}.png` : null;

const RUNES = { Meadows: 'ᛗ', 'Black Forest': 'ᛒ', Swamp: 'ᛋ', Mountain: 'ᛖ', Plains: 'ᛈ', Mistlands: 'ᛚ', Ashlands: 'ᚨ', 'Deep North': 'ᛞ', Ocean: 'ᛟ', Console: 'ᚲ' };
// Las filas sin bioma (3 expositores de Carpenter) van a un grupo final
const biomes = [...load('biomes'), { en: 'Other', es: 'Otros' }]
  .map((b, i) => ({ ...b, i, slug: slug(b.en), rune: RUNES[b.en] ?? 'ᛜ' }));
const OTHER = biomes.length - 1;

// Columnas de progreso. field = campo de la fila que dice si aplica (sin field aplica siempre). extra = no suma al progreso
const cols = {
  prep: { k: 'prep', field: 'intermediate', extra: true, label: { en: 'Prepared', es: 'Preparado' } },
  cook: { k: 'cook', field: 'cook', label: { en: 'Cooked', es: 'Cocinado' } },
  eat: { k: 'eat', field: 'eat', label: { en: 'Eaten', es: 'Comido' } },
  done: { k: 'done', label: { en: 'Done', es: 'Hecho' } },
};

// Títulos en español sin fuente oficial (Steam no los da). view: table = filas por bioma, cards = con receta
const tabs = [
  { id: 'hunter', ns: 'hunter', icon: 'huntsman-bow', view: 'table', cols: ['done'], title: { en: 'Master Hunter', es: 'Maestro cazador' },
    done: { en: 'Killed', es: 'Cazado' },
    guide: [{ en: 'Set the combat difficulty to Hard or higher.', es: 'Pon la dificultad de combate en Difícil o superior.' },
      { en: 'Kill every creature on the list at least once. Bosses count when you defeat them.', es: 'Mata al menos una vez a cada criatura de la lista. Los jefes cuentan al derrotarlos.' }] },
  { id: 'trophy', ns: 'trophy', icon: 'deer-trophy', view: 'table', cols: ['done'], title: { en: 'Trophy Collector', es: 'Coleccionista de trofeos' },
    done: { en: 'Collected', es: 'Conseguido' },
    guide: [{ en: 'Collect the trophy of every creature on the list.', es: 'Consigue el trofeo de cada criatura de la lista.' },
      { en: 'Bosses always drop theirs; other creatures only sometimes, so you may need several kills.', es: 'Los jefes siempre sueltan el suyo; el resto solo a veces, así que puede tocar matar varias.' }] },
  { id: 'cook', ns: 'chef', filter: 'cook', icon: 'cooking-station', view: 'cards', cols: ['prep', 'cook'], title: { en: 'Master Chef', es: 'Maestro chef' },
    guide: [{ en: 'Cook every dish at its station: cooking station, cauldron, oven or preparation table.', es: 'Cocina cada plato en su estación: fogón, caldero, horno o mesa de preparación.' },
      { en: 'Prepared marks intermediate steps, such as doughs. It does not count towards progress.', es: 'Preparado marca los pasos intermedios, como las masas. No cuenta para el progreso.' }] },
  { id: 'eat', ns: 'chef', filter: 'eat', icon: 'ashlands-gourmet-bowl', view: 'cards', cols: ['eat'], title: { en: 'Gourmet', es: 'Gourmet' },
    guide: [{ en: 'Eat every food on the list at least once.', es: 'Come al menos una vez cada comida de la lista.' },
      { en: 'Only three foods fit at a time: eat in rounds of three and vomit between rounds.', es: 'Solo caben tres comidas a la vez: come en tandas de tres y vomita entre tandas.' }] },
  { id: 'fish', ns: 'fish', icon: 'any-fish', view: 'table', cols: ['done'], extra: 'bait', title: { en: 'Fisherman', es: 'Pescador' },
    done: { en: 'Caught', es: 'Pescado' },
    guide: [{ en: 'Catch every kind of fish.', es: 'Pesca cada tipo de pez.' },
      { en: 'Each fish takes the bait shown next to it, used in its biome.', es: 'Cada pez necesita el cebo que aparece a su lado, usado en su bioma.' }] },
  { id: 'artisan', ns: 'artisan', icon: 'artisan-table', view: 'cards', cols: ['done'], title: { en: 'Artisan', es: 'Artesano' },
    done: { en: 'Crafted', es: 'Creado' },
    guide: [{ en: 'Craft every item on the list once. Upgrading is not needed.', es: 'Fabrica una vez cada objeto de la lista. No hace falta mejorarlos.' },
      { en: 'Under each biome you have every material its items need.', es: 'Bajo cada bioma tienes todos los materiales que piden sus objetos.' }] },
  { id: 'carpenter', ns: 'carpenter', icon: 'workbench', view: 'cards', cols: ['done'], title: { en: 'Carpenter', es: 'Carpintero' },
    done: { en: 'Built', es: 'Construido' },
    guide: [{ en: 'Build every structure on the list once.', es: 'Construye una vez cada estructura de la lista.' },
      { en: 'You need the station shown on each card nearby.', es: 'Necesitas cerca la estación que indica cada tarjeta.' }] },
  // Vista combinada. No suma al total global (ya cuenta en Master Chef y Gourmet)
  { id: 'both', ns: 'chef', icon: 'cauldron', view: 'cards', cols: ['prep', 'cook', 'eat'], noTotal: true, title: { en: 'Chef × Gourmet', es: 'Chef × Gourmet' },
    guide: [{ en: 'Master Chef and Gourmet together: cook and eat every dish once.', es: 'Master Chef y Gourmet a la vez: cocina y come cada plato una vez.' },
      { en: 'Under each biome you have the base ingredients and the steps in order.', es: 'Bajo cada bioma tienes los ingredientes base y los pasos en orden.' }] },
];

function prep(rows, ns) {
  const seen = {};
  return rows.map(r => {
    const key = r.name + (seen[r.name] ? '#' + seen[r.name] : '');
    seen[r.name] = (seen[r.name] || 0) + 1;
    const bi = Math.min(OTHER, ...biomes.map((b, j) => (r.biome || '').includes(b.en) ? j : OTHER));
    // Las tablas no traen imagen: la del trofeo (Hunter) o la del propio objeto, si se descargó
    const image = r.image ?? img(ns === 'hunter' ? slug(r.name) + '-trophy' : slug(r.name));
    return { ...r, key, bi, image };
  });
}
const lists = Object.fromEntries(['hunter', 'trophy', 'fish', 'chef', 'artisan', 'carpenter'].map(ns => [ns, prep(load(ns), ns)]));
// Comidas que también pide Artesano: cada una apunta a su fila de cocina (app.js la da por creada al cocinarla o prepararla)
const chefKey = new Map(lists.chef.map(r => [r.name, r.key]));
lists.artisan.forEach(r => { r.chef = chefKey.get(r.name); });

// Materiales de un bioma: suma de los ingredientes de todas sus recetas (Artisan, Carpenter)
function materials(rows) {
  const m = new Map();
  for (const r of rows) for (const i of r.recipe?.ingredients ?? []) {
    const o = m.get(i.name) ?? { name: i.name, nameEs: i.nameEs ?? null, image: i.image ?? null, qty: 0 };
    o.qty += i.qty; m.set(i.name, o);
  }
  return [...m.values()].sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
}
const plan = Object.fromEntries(shopping.map(b => [b.en, b]));

// Secciones por bioma de cada lista, en orden de progresión; dentro, por nombre
const sections = Object.fromEntries(Object.entries(lists).map(([ns, rows]) => [ns, biomes
  .map(b => ({ biome: b, rows: rows.filter(r => r.bi === b.i).sort((x, y) => x.name.localeCompare(y.name)) }))
  .filter(s => s.rows.length)
  .map(s => ns === 'chef' ? { ...s, items: plan[s.biome.en]?.items ?? [], steps: plan[s.biome.en]?.steps ?? [] }
    : ['artisan', 'carpenter'].includes(ns) ? { ...s, items: materials(s.rows), steps: [] } : s)]));

// Al navegador solo lo necesario para progreso, filtros y búsqueda
const lite = ({ key, bi, name, nameEs, cook, eat, intermediate, chef }) => ({ key, bi, name, nameEs, cook, eat, intermediate, chef });
const client = {
  biomes: biomes.map(({ en, es, slug }) => ({ en, es, slug })),
  cols,
  tabs: tabs.map(({ guide, ...t }) => t),
  rows: Object.fromEntries(Object.entries(lists).map(([ns, rows]) => [ns, rows.map(lite)])),
};

// Texto de la casilla "hecho" de cada lista (Cazado, Conseguido, Creado…)
const done = { chef: cols.done.label, ...Object.fromEntries(tabs.filter(t => t.done).map(t => [t.ns, t.done])) };

export default { biomes, cols, tabs, sections, done, client };
