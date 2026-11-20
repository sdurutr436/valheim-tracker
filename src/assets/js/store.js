// Persistencia del progreso. Forma: state[logro][clave][columna] = true
const STORE_KEY = 'valheim-tracker-v2';

// Si no hay estado v2 se migra el de la primera versión (solo Chef/Gourmet)
const state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
  || { chef: JSON.parse(localStorage.getItem('valheim-mc-gourmet-v1') || '{}') };

// Nombres que estaban mal escritos en los datos (perdieron la ö, la á o el guion). El progreso se guarda
// por nombre, así que lo marcado con el nombre viejo pasa al nuevo
const RENAMED = {
  artisan: { 'Nidhgg': 'Nidhögg', 'Nidhgg the Bleeding': 'Nidhögg the Bleeding', 'Nidhgg the Thundering': 'Nidhögg the Thundering',
    'Nidhgg the Primal': 'Nidhögg the Primal', 'Mushrooms Galore  la Mistlands': 'Mushrooms Galore á la Mistlands', 'Jrmundling': 'Jörmundling' },
  carpenter: { 'Portal  Stone': 'Portal – Stone' },
};
for (const [ns, m] of Object.entries(RENAMED)) for (const [from, to] of Object.entries(m))
  if (state[ns]?.[from]) { state[ns][to] = state[ns][from]; delete state[ns][from]; }

// Idioma de los nombres (en | es)
const LANG_KEY = 'valheim-tracker-lang';
let lang = localStorage.getItem(LANG_KEY) || 'en';
function setLang(l) { lang = l; localStorage.setItem(LANG_KEY, l); }

const isChecked = (ns, key, col) => !!state[ns]?.[key]?.[col];

function setChecked(ns, key, col, value) {
  ((state[ns] ||= {})[key] ||= {})[col] = value;
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
