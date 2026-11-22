// Idioma (en | es) de cualquier página: textos con data-en/data-es, aria-label con data-en-label/data-es-label,
// y bloques largos con lang="en" / lang="es" (los oculta el CSS). Cada página escucha el evento 'lang' para lo suyo
const LANG_KEY = 'valheim-tracker-lang';
let lang = localStorage.getItem(LANG_KEY) || 'en';

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  document.querySelectorAll('[data-en]').forEach(el => { el.textContent = (lang === 'es' && el.dataset.es) || el.dataset.en; });
  document.querySelectorAll('[data-en-label]').forEach(el => { el.setAttribute('aria-label', (lang === 'es' && el.dataset.esLabel) || el.dataset.enLabel); });
  document.dispatchEvent(new Event('lang'));
}

document.querySelector('.lang').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (b) { lang = b.dataset.lang; localStorage.setItem(LANG_KEY, lang); applyLang(); }
});
applyLang();
