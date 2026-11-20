// Vistas en cards (Chef × Gourmet, Artisan, Carpenter). El HTML de cada card lo genera 11ty en el
// orden de los datos; aquí se sincroniza el estado, se filtra/ordena y se despliega la receta.
for (const t of TABS.filter(t => t.view === 'cards')) {
  t.grid = $('#grid-' + t.ns);
  const els = [...t.grid.children];
  // card i = fila i. La clave (con #n en los nombres repetidos) se pone aquí para no repetir la lógica en 11ty
  t.els = new Map(t.rows.map((r, i) => {
    els[i].querySelectorAll('input').forEach(x => { x.dataset.key = r.key; });
    return [r.key, els[i]];
  }));
}

function syncCard(tab, r) {
  const el = tab.els.get(r.key);
  el.querySelectorAll('input[data-k]').forEach(i => { i.checked = checked(tab, r, i.dataset.k); });
  el.classList.toggle('done', complete(tab, r));
}

// rows ya vienen filtradas y ordenadas
// grouped: cabecera antes de cada bioma (groupHead está en table.js)
function renderCards(tab, rows, grouped) {
  const visible = new Set(rows);
  for (const r of tab.rows) { syncCard(tab, r); tab.els.get(r.key).hidden = !visible.has(r); }
  tab.grid.classList.toggle('grouped', grouped);
  tab.grid.querySelectorAll('.grp').forEach(h => h.remove());
  let g;
  rows.forEach(r => {
    if (grouped && r.bi !== g && BIOMES[r.bi])
      tab.grid.insertAdjacentHTML('beforeend', `<h2 class="grp b-${slug(BIOMES[r.bi])}" data-grp="${g = r.bi}">${groupHead(tab, r.bi)}</h2>`);
    tab.grid.append(tab.els.get(r.key));
  });
}

// Textos, nombres y biomas según el idioma (el HTML estático viene en inglés).
// data-en/data-es cambian el texto; data-en-label/data-es-label, el aria-label
function applyLang() {
  document.querySelectorAll('[data-en]').forEach(el => { el.textContent = (lang === 'es' && el.dataset.es) || el.dataset.en; });
  document.querySelectorAll('[data-en-label]').forEach(el => { el.setAttribute('aria-label', (lang === 'es' && el.dataset.esLabel) || el.dataset.enLabel); });
  document.querySelectorAll('.badge[data-biome]').forEach(el => { el.textContent = biomeText(el.dataset.biome); });
}

// Pulsar la card (menos sus checks y enlaces) despliega/pliega la receta
$('main').addEventListener('click', e => {
  const card = e.target.closest('.food');
  if (!card || e.target.closest('label, input, a')) return;
  const open = card.classList.toggle('open');
  card.querySelector('.food-head').setAttribute('aria-expanded', open);
  card.querySelector('.food-detail').hidden = !open;
});
