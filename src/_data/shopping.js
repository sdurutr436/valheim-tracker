// Ingredientes base necesarios por bioma para cocinar y comer todo una vez.
// Se expande cada receta hasta llegar a ingredientes sin receta (carne cruda, bayas, hierbas…).
// Reglas:
//  - Cada plato del bioma cuenta una vez, con todos sus ingredientes. Un "Cocido de ciervo" gasta su propia
//    carne cocinada, y la "Carne de ciervo cocinada" que hay que comer es otra más.
//  - Los intermedios (masas, "sin cocinar"…) no cuentan aparte: se fabrican para el plato final, que los gasta.
//  - Si una receta rinde más de 1 (ej. 2 masas por tanda), se redondea hacia arriba el número de tandas.
import { readFileSync } from 'node:fs';
const load = f => JSON.parse(readFileSync(new URL(`./${f}.json`, import.meta.url), 'utf8'));

const chef = load('chef');
const biomes = load('biomes');
const key = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// nombre (en/es) e imagen de cada objeto, venga de un plato o de un ingrediente
const info = new Map();
const remember = o => { if (!info.has(key(o.name)) || (!info.get(key(o.name)).nameEs && o.nameEs)) info.set(key(o.name), o); };
chef.forEach(c => { remember(c); (c.recipe?.ingredients ?? []).forEach(remember); });

const recipes = new Map(chef.filter(c => c.recipe).map(c => [key(c.name), c.recipe]));
const depth = new Map();
const depthOf = k => {
  if (!recipes.has(k)) return 0;
  if (!depth.has(k)) depth.set(k, 1 + Math.max(...recipes.get(k).ingredients.map(i => depthOf(key(i.name)))));
  return depth.get(k);
};

function totalsFor(biome) {
  const demand = new Map();
  const add = (k, q) => demand.set(k, (demand.get(k) ?? 0) + q);
  chef.filter(c => c.biome === biome && !(c.intermediate && !c.eat)).forEach(c => add(key(c.name), 1));
  // Se expande primero lo más "alto" (platos) y al final lo más básico, para redondear tandas una sola vez
  for (;;) {
    const k = [...demand.keys()].filter(k => recipes.has(k)).sort((a, b) => depthOf(b) - depthOf(a))[0];
    if (!k) break;
    const r = recipes.get(k), crafts = Math.ceil(demand.get(k) / (r.yield ?? 1));
    demand.delete(k);
    r.ingredients.forEach(i => add(key(i.name), i.qty * crafts));
  }
  return [...demand].map(([k, qty]) => ({ ...info.get(k), qty }))
    .map(({ name, nameEs, image, qty }) => ({ name, nameEs: nameEs ?? null, image: image ?? null, qty }))
    .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
}

const perBiome = biomes.filter(b => b.en !== 'Console')
  .map(b => ({ ...b, items: totalsFor(b.en) }))
  .filter(b => b.items.length);

export default perBiome;
