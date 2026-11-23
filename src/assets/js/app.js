// Vista: pestañas de logro, índice de biomas con spy-scroll, filtros, casillas e idioma.
// Todo el HTML lo genera 11ty; aquí solo se sincroniza el estado y se enseña/oculta.
const ROWS = Object.fromEntries(Object.entries(DATA.rows).map(([ns, rs]) => [ns, new Map(rs.map(r => [r.key, r]))]));
const pct = (d, n) => n ? d / n * 100 : 0;
let cur = TABS.find(t => t.id === location.hash.slice(1)) || TABS[0];

const panel = () => $('#panel-' + cur.ns);
const sections = () => [...panel().querySelectorAll('.biome')];
const inBiome = sec => cur.rows.filter(r => r.bi === +sec.dataset.bi);
const spyItem = sec => $(`.spy [data-bi="${sec.dataset.bi}"]`);

function renderTabs() {
  let done = 0, total = 0;
  for (const t of TABS) {
    const [d, n] = progress(t);
    if (!t.noTotal) { done += d; total += n; }
    const b = $(`[data-tab="${t.id}"]`);
    b.setAttribute('aria-current', t === cur);
    b.classList.toggle('full', d === n);
    b.querySelector('[data-n]').textContent = `${d}/${n}`;
    b.style.setProperty('--p', pct(d, n) + '%');
  }
  const p = pct(done, total);
  $('#total').innerHTML = `${done}<small> / ${total}</small>`;
  $('#total-pct').textContent = `Total · ${p.toLocaleString(lang, { maximumFractionDigits: 1 })}${lang === 'es' ? ' %' : '%'}`;
  $('#total-bar').style.width = p + '%';
}

// Recuento de cada bioma (cabecera e índice): objetos completos del logro actual, sin filtros
function renderBiomes() {
  document.querySelectorAll('.spy li').forEach(li => { li.hidden = true; });
  for (const sec of sections()) {
    const rs = inBiome(sec), d = rs.filter(r => complete(cur, r)).length, li = spyItem(sec);
    sec.classList.toggle('complete', rs.length > 0 && d === rs.length);
    sec.querySelector('[data-count]').textContent = `${d}/${rs.length}`;
    li.hidden = !rs.length;
    li.querySelector('[data-count]').textContent = `${d}/${rs.length}`;
    li.style.setProperty('--p', pct(d, rs.length) + '%');
  }
}

function syncChecks() {
  for (const el of panel().querySelectorAll('[data-key]')) {
    const r = ROWS[cur.ns].get(el.dataset.key);
    el.querySelectorAll('input[data-k]').forEach(i => {
      i.checked = checked(cur, r, i.dataset.k);
      // Marcada porque ya se cocinó o preparó: se cambia desde cocina, no aquí
      i.disabled = i.dataset.k === 'done' && fromChef(r);
      i.parentElement.title = i.disabled ? tx({ en: 'Marked from Master Chef', es: 'Marcado desde Maestro chef' }) : '';
    });
    el.classList.toggle('done', complete(cur, r));
  }
}

// Búsqueda y estado. Un bioma sin nada visible se oculta entero
function renderFilter() {
  const f = { q: fold($('#q').value.trim()), status: $('[name=status]:checked').value };
  const inTab = new Set(cur.rows);
  for (const el of panel().querySelectorAll('[data-key]')) {
    const r = ROWS[cur.ns].get(el.dataset.key);
    el.hidden = !inTab.has(r) || !matches(cur, r, f);
  }
  let any = false;
  for (const sec of sections()) {
    sec.hidden = !sec.querySelector('[data-key]:not([hidden])');
    any ||= !sec.hidden;
  }
  $('#empty').hidden = any;
  spy();
}

function selectTab(t) {
  cur = t;
  history.replaceState(null, '', '#' + t.id);
  document.body.dataset.ach = t.id; // el CSS enseña solo las casillas de este logro
  document.querySelectorAll('.panel').forEach(p => { p.hidden = p.dataset.ns !== t.ns; });
  document.querySelectorAll('[data-guide]').forEach(g => { g.hidden = g.dataset.guide !== t.id; });
  $('#q').placeholder = tx({ en: `Search in ${t.title.en}…`, es: `Buscar en ${t.title.es}…` });
  syncChecks(); renderTabs(); renderBiomes(); renderFilter();
  // Los biomas ya completos empiezan plegados
  sections().forEach(sec => { sec.open = !sec.classList.contains('complete'); });
}

// Spy-scroll: el bioma activo es el último cuya cabecera ya pasó bajo la barra fija
function spy() {
  const secs = sections().filter(s => !s.hidden);
  let on = secs[0];
  for (const s of secs) if (s.getBoundingClientRect().top < 150) on = s;
  document.querySelectorAll('.spy li').forEach(li => li.classList.toggle('on', !!on && li === spyItem(on)));
}
addEventListener('scroll', () => requestAnimationFrame(spy), { passive: true });

$('.spy').addEventListener('click', e => {
  const b = e.target.closest('[data-jump]');
  const sec = b && document.getElementById(`${cur.ns}-${b.dataset.jump}`);
  if (!sec) return;
  sec.open = true;
  sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});

$('.tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  selectTab(TABS.find(t => t.id === b.dataset.tab));
  scrollTo({ top: 0 });
});

$('#q').addEventListener('input', renderFilter);

// Casillas (y el filtro de estado). No se refiltra al marcar: la fila no salta bajo el ratón
document.addEventListener('change', e => {
  const i = e.target;
  if (i.name === 'status') return renderFilter();
  if (!i.dataset.k) return;
  const el = i.closest('[data-key]'), r = ROWS[cur.ns].get(el.dataset.key);
  setChecked(cur.ns, r.key, i.dataset.k, i.checked);
  el.classList.toggle('done', complete(cur, r));
  renderTabs(); renderBiomes();
});

// Pulsar una card (menos sus casillas y enlaces) despliega o pliega la receta
$('main').addEventListener('click', e => {
  const card = e.target.closest('.food');
  if (!card || e.target.closest('label, input, a')) return;
  const open = card.classList.toggle('open');
  card.querySelector('.food-head').setAttribute('aria-expanded', open);
  card.querySelector('.food-detail').hidden = !open;
});

// Idioma: los textos los cambia lang.js; aquí el orden por nombre, el placeholder y los porcentajes
function renderLang() {
  for (const box of document.querySelectorAll('.rows')) [...box.children]
    .sort((a, b) => a.querySelector('.nm').textContent.localeCompare(b.querySelector('.nm').textContent, lang))
    .forEach(el => box.append(el));
  $('#q').placeholder = tx({ en: `Search in ${cur.title.en}…`, es: `Buscar en ${cur.title.es}…` });
  syncChecks(); renderTabs();
}
document.addEventListener('lang', renderLang);

renderLang();
selectTab(cur);
