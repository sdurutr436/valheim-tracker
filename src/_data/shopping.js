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

// Ingredientes base que se consiguen pescando
const FISHED = new Set(['anglerfish']);
const chefIndex = new Map(chef.map((c, i) => [key(c.name), i]));
const label = o => ({ name: o.name, nameEs: o.nameEs ?? null });

// Un paso de fabricación con todo lo que se hace en ese nivel (group = [{ k, crafts }])
function makeStep(group, baking) {
  const tables = group.filter(m => recipes.get(m.k).station === 'Food Preparation Table').length;
  const step = {
    kind: 'make',
    verb: baking ? { en: 'Bake', es: 'Hornea' } : tables === 0 ? { en: 'Cook', es: 'Cocina' }
      : tables === group.length ? { en: 'Prepare', es: 'Prepara' } : { en: 'Cook or prepare', es: 'Cocina o prepara' },
    items: group.map(m => {
      const r = recipes.get(m.k);
      // Cocinar un ingrediente suelto (carne cruda, masa…): se nombra lo que se mete, con su cantidad
      if (r.station !== 'Food Preparation Table' && r.ingredients.length === 1 && r.ingredients[0].qty === 1 && (r.yield ?? 1) === 1)
        return { ...label(info.get(key(r.ingredients[0].name))), qty: m.crafts };
      // Si la receta rinde varias unidades (ej. 4 salchichas por tanda) se indican las tandas, no las unidades
      const batches = (r.yield ?? 1) > 1;
      return {
        ...label(info.get(m.k)),
        qty: !batches && m.crafts > 1 ? m.crafts : null,
        hint: batches ? { en: `${m.crafts} ${m.crafts > 1 ? 'batches' : 'batch'} of ${r.yield}`, es: `${m.crafts} ${m.crafts > 1 ? 'tandas' : 'tanda'} de ${r.yield}` }
          : r.hint ? { en: r.hint, es: r.hintEs ?? r.hint } : null,
      };
    }),
  };
  if (baking) step.result = group.map(m => label(info.get(m.k)));
  return step;
}

// "Prepara pescado crudo con 4× Cualquier pez": se nombra el pescado que se trocea, no el resultado
const RAW_FISH = key('Raw Fish');
function rawFishStep(m) {
  const i = recipes.get(m.k).ingredients[0];
  return { kind: 'make', verb: { en: 'Prepare raw fish from', es: 'Prepara pescado crudo con' }, items: [{ ...label(info.get(key(i.name))), qty: i.qty * m.crafts }] };
}

// Plan de un bioma: ingredientes base + pasos en orden. En el juego solo caben 3 comidas a la vez,
// así que se come en tandas de 3 y se vomita después de cada una. Se avanza por "niveles" de receta:
// primero lo que se come tal cual, luego lo que se cocina con ingredientes base (carnes…), se come eso,
// luego los platos que gastan esos cocinados, se comen, y así hasta el final.
function plan(biome) {
  const targets = chef.filter(c => c.biome === biome && !(c.intermediate && !c.eat));
  const demand = new Map(), made = [];
  const add = (k, q) => demand.set(k, (demand.get(k) ?? 0) + q);
  targets.forEach(c => add(key(c.name), 1));
  // Se expande primero lo más "alto" (platos) y al final lo más básico, para redondear tandas una sola vez
  for (;;) {
    const k = [...demand.keys()].filter(k => recipes.has(k)).sort((a, b) => depthOf(b) - depthOf(a))[0];
    if (!k) break;
    const r = recipes.get(k), crafts = Math.ceil(demand.get(k) / (r.yield ?? 1));
    made.push({ k, crafts, depth: depthOf(k) });
    demand.delete(k);
    r.ingredients.forEach(i => add(key(i.name), i.qty * crafts));
  }
  const items = [...demand].map(([k, qty]) => ({ ...info.get(k), qty }))
    .map(({ name, nameEs, image, qty }) => ({ name, nameEs: nameEs ?? null, image: image ?? null, qty }))
    .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));

  const steps = [];
  const maxDepth = Math.max(0, ...made.map(m => m.depth));
  for (let d = 0; d <= maxDepth; d++) {
    const group = made.filter(m => m.depth === d).sort((a, b) => (chefIndex.get(a.k) ?? 999) - (chefIndex.get(b.k) ?? 999));
    // Trocear pescado en la mesa de preparación es su propio paso, antes de cocinar nada de ese nivel
    const fish = group.find(m => m.k === RAW_FISH);
    if (fish) steps.push(rawFishStep(fish));
    // Lo que va al horno se separa en su propio paso ("Hornea") y dice qué se obtiene al hornearlo
    const oven = group.filter(m => recipes.get(m.k).station === 'Stone Oven');
    [group.filter(m => m !== fish && !oven.includes(m)), oven].filter(g => g.length).forEach(g => steps.push(makeStep(g, g === oven)));
    const eat = targets.filter(t => depthOf(key(t.name)) === d);
    for (let i = 0; i < eat.length; i += 3) steps.push({ kind: 'eat', verb: { en: 'Eat', es: 'Come' }, items: eat.slice(i, i + 3).map(label) });
  }
  // Lo que no se recolecta sino que se pesca va al principio de la guía
  const fished = items.filter(i => FISHED.has(key(i.name)));
  if (fished.length) steps.unshift({ kind: 'fish', verb: { en: 'Fish', es: 'Pesca' }, items: fished.map(i => ({ ...label(i), qty: i.qty })) });
  return { items, steps };
}

// Ingredientes y pasos revisados en todos los biomas (Deep North, el último, el 2026-11-23)
const perBiome = biomes.filter(b => b.en !== 'Console')
  .map(b => ({ ...b, ...plan(b.en) }))
  .filter(b => b.items.length);

export default perBiome;
