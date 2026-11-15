// Vista en cards (Chef × Gourmet). El HTML de cada card lo genera 11ty; aquí solo se
// sincroniza el estado, se filtra/ordena y se despliega la receta.
const grid = $('#food-grid');
const foodEls = new Map([...grid.querySelectorAll('.food')].map(el => [el.dataset.key, el]));

function syncCard(tab, r) {
  const el = foodEls.get(r.key);
  el.querySelectorAll('input[data-k]').forEach(i => { i.checked = checked(tab, r, i.dataset.k); });
  el.classList.toggle('done', complete(tab, r));
}

// rows ya vienen filtradas y ordenadas
function renderCards(tab, rows) {
  const visible = new Set(rows);
  for (const r of tab.rows) { syncCard(tab, r); foodEls.get(r.key).hidden = !visible.has(r); }
  rows.forEach(r => grid.append(foodEls.get(r.key)));
}

// Nombres y biomas según el idioma (el HTML estático viene en inglés)
function applyLang() {
  document.querySelectorAll('[data-en]').forEach(el => { el.textContent = (lang === 'es' && el.dataset.es) || el.dataset.en; });
  document.querySelectorAll('.badge[data-biome]').forEach(el => { el.textContent = biomeText(el.dataset.biome); });
}

// Pulsar la card (menos sus checks) despliega/pliega la receta
grid.addEventListener('click', e => {
  const card = e.target.closest('.food');
  if (!card || e.target.closest('label, input, a')) return;
  const open = card.classList.toggle('open');
  card.querySelector('.food-head').setAttribute('aria-expanded', open);
  card.querySelector('.food-detail').hidden = !open;
});
