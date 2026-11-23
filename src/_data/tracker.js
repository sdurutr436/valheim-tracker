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
  // Alquimista: la base hecha en el caldero de aguamiel y luego fermentada
  brew: { k: 'brew', label: { en: 'Prepared', es: 'Preparada' } },
  ferment: { k: 'ferment', label: { en: 'Fermented', es: 'Fermentada' } },
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
  { id: 'blacksmith', ns: 'blacksmith', icon: 'forge', view: 'cards', cols: ['done'], title: { en: 'Blacksmith', es: 'Herrero' },
    done: { en: 'Crafted', es: 'Creado' },
    guide: [{ en: 'Craft every weapon on the list once: melee weapons, bows, crossbows, staffs, shields, arrows, bolts and bombs. Upgrading is not needed.',
      es: 'Fabrica una vez cada arma de la lista: cuerpo a cuerpo, arcos, ballestas, bastones, escudos, flechas, virotes y bombas. No hace falta mejorarlas.' },
    { en: "Weapons are grouped by age: the most advanced material in the recipe decides it. The achievement doesn't say exactly what counts, so the list follows the wiki's weapons page.",
      es: 'Las armas van por edades: la decide el material más avanzado de la receta. El logro no detalla qué cuenta, así que la lista sigue la página de armas de la wiki.' },
    { en: 'Anything you mark here also counts for Artisan, and the other way round.', es: 'Lo que marques aquí también cuenta para Artesano, y al revés.' }] },
  // No es un logro: parte Artesano en un trozo manejable. No suma al total global (las bases ya cuentan en Artesano)
  { id: 'alchemist', ns: 'alchemist', icon: 'fermenter', view: 'cards', cols: ['brew', 'ferment'], noTotal: true,
    title: { en: 'Professional Alchemist', es: 'Alquimista profesional' },
    guide: [{ en: 'Not an achievement: a way to split Artisan. Each base you prepare here counts as crafted there, and the other way round.',
      es: 'No es un logro: una forma de partir Artesano. Cada base que prepares aquí cuenta como creada allí, y al revés.' },
    { en: 'Prepared: make the base at the Mead Ketill. Fermented: leave it in a Fermenter for 2 in-game days (48 h) and take the drinks out.',
      es: 'Preparada: haz la base en el caldero de aguamiel. Fermentada: déjala 2 días del juego (48 h) en un fermentador y saca las bebidas.' },
    { en: 'Drinks are grouped by age: the most advanced ingredient of the base decides it.', es: 'Las bebidas van por edades: la decide el ingrediente más avanzado de la base.' }] },
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
// Herrero va por edades: cada edad es un bioma, y la de un arma la marca lo más avanzado que pide su receta
// (materiales y estación: una Forja negra ya es de las Tierras Nubladas).
// ages.json dice en qué bioma se consigue cada cosa por primera vez; una que falte rompe el build a propósito
const ages = load('ages');
const firstBiome = new Map([ages.stations, ages.materials].flatMap(o => Object.entries(o).flatMap(([b, ms]) => ms.map(m => [m, b]))));
const order = b => biomes.findIndex(x => x.en === b);
// also = lo que pide además de la receta (el fermentador de Alquimista)
const ageOf = (w, also = []) => [w.recipe.station, ...also, ...w.recipe.ingredients.map(i => i.name)].map(n => firstBiome.get(n)
  ?? (() => { throw new Error(`ages.json: falta "${n}" (receta de ${w.name})`); })())
  .reduce((a, b) => order(b) > order(a) ? b : a, 'Meadows');

// blacksmith.json nombra objetos de Artesano y solo trae enteros los que Artesano no tiene (los que se hacen a mano…);
// alchemist.json, la base de Artesano de la que sale cada bebida
const artisanItem = new Map(load('artisan').map(a => [a.name, a]));
const fromArtisan = (ns, e) => artisanItem.get(e) ?? (() => { throw new Error(`${ns}.json: "${e}" no está en artisan.json`); })();
// Cada bebida lleva la receta de su base y se fermenta: el fermentador también cuenta para la edad, aunque hoy no
// cambia ninguna (sale de la Forja con bronce, como el caldero de aguamiel)
const mead = m => {
  const b = fromArtisan('alchemist', m.base);
  return { ...m, recipe: b.recipe, biome: ageOf(b, ['Fermenter']), baseImage: b.image, // la card enseña la base hasta prepararla
    note: `Makes “${b.name}”. Leave it in a Fermenter for 2 in-game days (48 h): it yields ${m.makes}.`,
    noteEs: `Se obtiene «${b.nameEs}». Déjala 2 días del juego (48 h) en un fermentador: rinde ${m.makes}.` };
};
const raw = ns => ns === 'blacksmith' ? load(ns).map(e => typeof e !== 'string' ? e : fromArtisan(ns, e)).map(w => ({ ...w, biome: ageOf(w) }))
  : ns === 'alchemist' ? load(ns).map(mead) : load(ns);
const lists = Object.fromEntries(['hunter', 'trophy', 'fish', 'chef', 'artisan', 'carpenter', 'blacksmith', 'alchemist']
  .map(ns => [ns, prep(raw(ns), ns)]));

// El mismo objeto en dos listas: marcarlo en la de destino (en esas columnas) lo da por hecho en la de origen,
// en su columna k (Hecho, si no se dice). Lo aplica model.js. Se emparejan por nombre; una bebida, por el de su base
const same = r => r.base ?? r.name;
const link = (from, to, cols, k = 'done') => {
  const key = new Map(lists[to].map(r => [same(r), r.key]));
  lists[from].forEach(r => { if (key.has(same(r))) (r.links ||= []).push({ ns: to, key: key.get(same(r)), cols, k }); });
};
link('artisan', 'chef', ['prep', 'cook']);       // comida cocinada o preparada
link('artisan', 'blacksmith', ['done']);         // arma creada
link('blacksmith', 'artisan', ['done']);
link('artisan', 'alchemist', ['brew']);          // base preparada
link('alchemist', 'artisan', ['done'], 'brew');  // base creada: cuenta como Preparada

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
const byAge = ['blacksmith', 'alchemist'];
const sections = Object.fromEntries(Object.entries(lists).map(([ns, rows]) => [ns, biomes
  .map(b => ({ biome: byAge.includes(ns) ? { ...b, ...ages.ages[b.en] } : b, // en Herrero y Alquimista la sección lleva el nombre de la edad
    rows: rows.filter(r => r.bi === b.i).sort((x, y) => x.name.localeCompare(y.name)) }))
  .filter(s => s.rows.length)
  .map(s => ns === 'chef' ? { ...s, items: plan[s.biome.en]?.items ?? [], steps: plan[s.biome.en]?.steps ?? [] }
    : ['artisan', 'carpenter', ...byAge].includes(ns) ? { ...s, items: materials(s.rows), steps: [] } : s)]));

// Al navegador solo lo necesario para progreso, filtros y búsqueda
const lite = ({ key, bi, name, nameEs, cook, eat, intermediate, links }) => ({ key, bi, name, nameEs, cook, eat, intermediate, links });
const client = {
  biomes: biomes.map(({ en, es, slug }) => ({ en, es, slug })),
  cols,
  tabs: tabs.map(({ guide, ...t }) => t),
  rows: Object.fromEntries(Object.entries(lists).map(([ns, rows]) => [ns, rows.map(lite)])),
};

// Texto de la casilla "hecho" de cada lista (Cazado, Conseguido, Creado…)
const done = Object.fromEntries(tabs.filter(t => t.done).map(t => [t.ns, t.done]));
// Casillas de las cards de cada lista: las columnas de sus logros, en el orden de cols
// (cocina: Preparado, Cocinado y Comido; el CSS esconde las que no son del logro actual)
const pills = Object.fromEntries(Object.keys(lists).map(ns => [ns, Object.values(cols)
  .filter(c => tabs.some(t => t.ns === ns && t.cols.includes(c.k)))
  .map(c => c.k === 'done' ? { ...c, label: done[ns] } : c)]));

export default { biomes, cols, tabs, sections, done, pills, client };
