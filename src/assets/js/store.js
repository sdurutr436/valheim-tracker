// Persistencia del progreso. Forma: state[logro][clave][columna] = true
const STORE_KEY = 'valheim-tracker-v2';

// Si no hay estado v2 se migra el de la primera versión (solo Chef/Gourmet)
const state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
  || { chef: JSON.parse(localStorage.getItem('valheim-mc-gourmet-v1') || '{}') };

// Idioma de los nombres (en | es)
const LANG_KEY = 'valheim-tracker-lang';
let lang = localStorage.getItem(LANG_KEY) || 'en';
function setLang(l) { lang = l; localStorage.setItem(LANG_KEY, l); }

const isChecked = (ns, key, col) => !!state[ns]?.[key]?.[col];

function setChecked(ns, key, col, value) {
  ((state[ns] ||= {})[key] ||= {})[col] = value;
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
