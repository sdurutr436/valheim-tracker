// Descarga a src/_data/assets las imágenes de la wiki que todavía no están en local.
// Uso: npm run images. Lee las rutas "assets/img/items/<fichero>.png" de los JSON de _data,
// busca cada objeto en la wiki (File:<Nombre>.png) y lo baja a 128 px, sin prisas.
// Sale con código 1 si la wiki corta (rate limit / challenge): basta con relanzarlo más tarde.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const DIR = 'src/_data/assets/', PREFIX = 'assets/img/items/';
const API = 'https://valheim.fandom.com/api.php?';
const UA = 'valheim-tracker-local/1.0 (descarga puntual de iconos)';
const PAUSE = 700; // ms entre peticiones
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ponytail: curl y no fetch, porque la CDN de la wiki le pone un challenge de Cloudflare a fetch.
// Ojo: el curl de Git Bash pasa, el de Windows (System32) no; lánzalo desde Git Bash.
function get(url) {
  const out = execFileSync('curl', ['-s', '-A', UA, '-D', '-', url], { maxBuffer: 1e8 });
  const i = out.indexOf('\r\n\r\n');
  const head = out.subarray(0, i).toString();
  return { status: +head.split(' ')[1] || 0, retry: +(/retry-after: *(\d+)/i.exec(head)?.[1] ?? 0), body: out.subarray(i + 4) };
}

// null = no existe; lanza 'blocked' si la wiki nos frena varias veces seguidas
async function fetchOk(url) {
  for (let t = 0; t < 4; t++) {
    const r = get(url);
    if (r.status === 200) return r.body;
    if (r.status === 404) return null;
    await sleep((r.retry || 10 * 2 ** t) * 1000); // 403 (challenge), 429, 5xx: esperar y reintentar
  }
  throw new Error('blocked');
}

// fichero -> nombres que lo usan (Bronze y "Bronze (duplicate, bug?)" comparten bronze.png)
const wanted = new Map();
const walk = o => {
  if (Array.isArray(o)) return o.forEach(walk);
  if (!o || typeof o !== 'object') return;
  const file = o.image?.startsWith(PREFIX) && o.image.slice(PREFIX.length);
  // "wiki" = nombre del objeto en la wiki cuando no coincide con el del juego ("Leather pants" ↔ "Leather Trousers")
  if (file) [o.wiki, o.name].filter(Boolean).forEach(n => (wanted.get(file) ?? wanted.set(file, new Set()).get(file)).add(n));
  Object.values(o).forEach(walk);
};
for (const f of ['chef', 'artisan', 'carpenter', 'blacksmith']) walk(JSON.parse(readFileSync(`src/_data/${f}.json`, 'utf8')));
mkdirSync(DIR, { recursive: true });
const todo = [...wanted].filter(([file]) => !existsSync(DIR + file));
console.log(`${wanted.size} imágenes, ${todo.length} por descargar`);

// En la wiki los iconos se llaman como el objeto ("Fenris Coat.png") o en minúsculas ("Wood wall 1x1.png");
// las variantes de mayúsculas suelen ser redirecciones, así que se prueban las dos
const candidates = name => [...new Set([name, name[0] + name.slice(1).toLowerCase()])].map(n => `File:${n}.png`);

// título -> url de la imagen (50 títulos por consulta, siguiendo redirecciones)
async function resolve(titles) {
  const urls = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const q = JSON.parse(await fetchOk(API + new URLSearchParams({
      action: 'query', format: 'json', formatversion: 2, redirects: 1, prop: 'imageinfo', iiprop: 'url', titles: batch.join('|'),
    }))).query;
    const found = new Map(q.pages.filter(p => p.imageinfo).map(p => [p.title, p.imageinfo[0].url]));
    const follow = t => [q.normalized, q.redirects].reduce((t, m) => m?.find(x => x.from === t)?.to ?? t, t);
    batch.forEach(t => { const u = found.get(follow(t)); if (u) urls.set(t, u); });
    await sleep(PAUSE);
  }
  return urls;
}

const missing = [], pending = [];
try {
  const urls = await resolve([...new Set(todo.flatMap(([, names]) => [...names].flatMap(candidates)))]);
  for (const [file, names] of todo) {
    const url = [...names].flatMap(candidates).map(t => urls.get(t)).find(Boolean);
    if (!url) { missing.push(file); continue; }
    const png = await fetchOk(url.replace('/revision/latest?', '/revision/latest/scale-to-width-down/128?') + '&format=original');
    if (png?.subarray(1, 4).toString() === 'PNG') writeFileSync(DIR + file, png); else missing.push(file);
    await sleep(PAUSE);
  }
} catch (e) {
  if (e.message !== 'blocked') throw e;
  pending.push(...todo.map(([f]) => f).filter(f => !existsSync(DIR + f) && !missing.includes(f)));
}

if (missing.length) console.log(`\nSin imagen en la wiki (${missing.length}), añádelas a mano en ${DIR}:\n` + missing.join('\n'));
if (pending.length) { console.log(`\nLa wiki ha cortado; quedan ${pending.length} por bajar. Relanza más tarde.`); process.exit(1); }
