// Navegación, filtros y eventos. Une model + table + cards.
let cur = TABS.find(t => t.id === location.hash.slice(1)) || TABS[0];
let sort = defaultSort(cur), biome = '';

const pctOf = (d, n) => n ? Math.round(d / n * 100) : 0;

function renderNav() {
  let done = 0, total = 0;
  $('#cards').innerHTML = TABS.map(t => {
    const [d, n] = progress(t);
    if (!t.noTotal) { done += d; total += n; }
    return `<button class="card ${t === cur ? 'active' : ''} ${d === n ? 'full' : ''}" data-tab="${t.id}" aria-current="${t === cur ? 'page' : 'false'}">
      <img src="assets/img/items/${t.icon}.png" alt="" width="40" height="40">
      <span class="t">${t.title}</span>
      <span class="n">${d}<small>/${n}</small></span>
      <span class="bar" style="--p:${pctOf(d, n)}%"></span></button>`;
  }).join('');
  $('#total').textContent = `${done} de ${total} completados`;
  $('#total-pct').textContent = `${(total ? done / total * 100 : 0).toFixed(1)} %`;
  // Un tramo por bioma con algo que hacer
  const bp = biomeProgress();
  $('#saga').innerHTML = BIOMES.map((b, j) => bp[j][1] && `<li class="b-${slug(b)} ${bp[j][0] === bp[j][1] ? 'full' : ''}" style="--p:${pctOf(...bp[j])}%;--i:${j}">
    <span class="nm">${biomeText(b)}</span><span class="bar"></span><small>${bp[j][0]}/${bp[j][1]}</small></li>`).filter(Boolean).join('');
}

function renderChips() {
  $('#chips').innerHTML = !cur.biome ? '' : BIOMES.filter(b => cur.rows.some(r => r.biome.includes(b))).map(b => {
    const rs = cur.rows.filter(r => r.biome.includes(b));
    return `<button class="chip b-${slug(b)} ${biome === b ? 'on' : ''}" data-biome="${b}">${biomeText(b)}<small>${rs.filter(r => complete(cur, r)).length}/${rs.length}</small></button>`;
  }).join('');
}

// Desplegable de ingredientes: solo en Chef × Gourmet. Sin filtro enseña todo; con un bioma
// elegido solo la lista de ese bioma, en horizontal (el CSS lo reparte según .filtered)
function renderShopping(show) {
  const sh = $('#shopping'), sections = [...sh.querySelectorAll('.shop')];
  sections.forEach(s => { s.hidden = !!biome && s.dataset.biome !== biome; });
  sh.classList.toggle('filtered', !!biome);
  $('#shop-biome').textContent = biome ? biomeText(biome) : '';
  sh.hidden = !show ||(!!biome && sections.every(s => s.hidden)); // p. ej. Console no tiene lista
}

function renderView() {
  const f = { q: fold($('#q').value.trim()), status: $('#status').value, biome };
  const rows = cur.rows.filter(r => matches(cur, r, f)).sort(compare(cur, sort));
  const cards = cur.view === 'cards';
  $('#table').hidden = cards;
  document.querySelectorAll('.food-grid').forEach(g => { g.hidden = g !== cur.grid; });
  const order = $('#order');
  order.hidden = !cards;
  order.querySelector('[value=biome]').hidden = !cur.biome;
  order.value = sort.k;
  renderShopping(cur.id === 'both');
  $('#count').textContent = `${rows.length} de ${cur.rows.length}`;
  if (cards) renderCards(cur, rows); else renderTable($('#table'), cur, rows, sort);
}

function renderAll() { renderNav(); renderChips(); renderView(); }

function selectTab(t) {
  cur = t; location.hash = t.id;
  sort = defaultSort(t); biome = '';
  renderAll();
}

$('#cards').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]');
  if (b) selectTab(TABS.find(t => t.id === b.dataset.tab));
});
$('#chips').addEventListener('click', e => {
  const b = e.target.closest('[data-biome]');
  if (!b) return;
  biome = biome === b.dataset.biome ? '' : b.dataset.biome;
  renderChips(); renderView();
});
$('#table').addEventListener('click', e => {
  const b = e.target.closest('[data-sort]');
  if (!b) return;
  const k = b.dataset.sort;
  sort = { k, dir: sort.k === k ? -sort.dir : 1 };
  renderView();
});
$('#order').addEventListener('change', e => { sort = { k: e.target.value, dir: 1 }; renderView(); });
$('#q').addEventListener('input', renderView);
$('#status').addEventListener('change', renderView);

function renderLang() {
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  applyLang(); renderNav(); renderChips(); renderView();
}
$('.lang').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (b) { setLang(b.dataset.lang); renderLang(); }
});

// Marcar/desmarcar (tabla y cards). No se reordena ni refiltra: la fila no salta bajo el ratón
document.addEventListener('change', e => {
  const i = e.target;
  if (!i.dataset.key) return;
  setChecked(cur.ns, i.dataset.key, i.dataset.k, i.checked);
  const r = cur.rows.find(r => r.key === i.dataset.key);
  i.closest('tr, .food').classList.toggle('done', complete(cur, r));
  renderNav(); renderChips();
});

renderLang();
setTimeout(() => $('#saga').classList.remove('intro'), 1800); // solo se llena animada al cargar
