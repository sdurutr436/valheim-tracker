// Persistencia del progreso. Forma: state[logro][clave][columna] = true
const STORE_KEY = 'valheim-tracker-v2', LEGACY_KEY = 'valheim-mc-gourmet-v1';
const hasSave = () => localStorage.getItem(STORE_KEY) !== null || localStorage.getItem(LEGACY_KEY) !== null;

// Si no hay estado v2 se migra el de la primera versión (solo Chef/Gourmet)
const state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
  || { chef: JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}') };

// Nombres que estaban mal escritos en los datos (perdieron la ö, la á o el guion). El progreso se guarda
// por nombre, así que lo marcado con el nombre viejo pasa al nuevo
const RENAMED = {
  artisan: { 'Nidhgg': 'Nidhögg', 'Nidhgg the Bleeding': 'Nidhögg the Bleeding', 'Nidhgg the Thundering': 'Nidhögg the Thundering',
    'Nidhgg the Primal': 'Nidhögg the Primal', 'Mushrooms Galore  la Mistlands': 'Mushrooms Galore á la Mistlands', 'Jrmundling': 'Jörmundling' },
  carpenter: { 'Portal  Stone': 'Portal – Stone' },
};
for (const [ns, m] of Object.entries(RENAMED)) for (const [from, to] of Object.entries(m))
  if (state[ns]?.[from]) { state[ns][to] = state[ns][from]; delete state[ns][from]; }

const isChecked = (ns, key, col) => !!state[ns]?.[key]?.[col];

function setChecked(ns, key, col, value) {
  ((state[ns] ||= {})[key] ||= {})[col] = value;
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

// Archivo de partida (.json) para llevar el progreso a otro navegador o PC
const saveFile = () => JSON.stringify({ app: 'valheim-tracker', version: 2, savedAt: new Date().toISOString(), progress: state }, null, 2);

// El archivo viene de fuera: solo se acepta { app: 'valheim-tracker', progress: { logro: { clave: { columna: bool } } } }
const isObj = o => !!o && typeof o === 'object' && !Array.isArray(o);
function readSaveFile(text) {
  const d = JSON.parse(text), p = d?.app === 'valheim-tracker' && d.progress;
  const ok = isObj(p) && Object.values(p).every(ns => isObj(ns) &&
    Object.values(ns).every(r => isObj(r) && Object.values(r).every(v => typeof v === 'boolean')));
  if (!ok) throw new Error('Not a valheim-tracker save file');
  return p;
}
