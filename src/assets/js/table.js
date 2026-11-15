// Vista en tabla (todos los logros salvo Chef × Gourmet)
const badges = s => s ? s.split(', ').map(p => {
  const b = BIOMES.find(b => p.includes(b));
  return `<span class="badge ${b ? 'b-' + slug(b) : ''}">${esc(biomeText(p))}</span>`;
}).join('') : '';

function renderTable(el, tab, rows, sort) {
  if (!rows.length) { el.innerHTML = '<div class="empty">Nada que mostrar con estos filtros.</div>'; return; }
  const th = (k, label, cls = '') => `<th class="${cls}" aria-sort="${sort.k === k ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}">
    <button data-sort="${k}">${label}<i>${sort.k === k ? (sort.dir > 0 ? '▲' : '▼') : '↕'}</i></button></th>`;
  const head = (tab.num ? th('i', '#') : '') + (tab.biome ? th('biome', 'Bioma') : '') + th('name', tab.label) +
    (tab.extraCol ? th(tab.extraCol.k, tab.extraCol.label) : '') + tab.cols.map(c => th(c.k, c.label, 'c')).join('');
  const body = rows.map(r => {
    const cells = tab.cols.map(c => c.ap(r)
      ? `<td class="c"><input type="checkbox" data-key="${esc(r.key)}" data-k="${c.k}" ${checked(tab, r, c.k) ? 'checked' : ''} aria-label="${c.label}: ${esc(nameOf(r))}"></td>`
      : '<td class="c"></td>').join('');
    return `<tr class="${complete(tab, r) ? 'done' : ''}">${tab.num ? `<td class="i">${r.i}</td>` : ''}` +
      (tab.biome ? `<td class="bio">${badges(r.biome)}</td>` : '') +
      `<td class="name">${esc(nameOf(r))}${r.note ? ` <span class="note">${esc(r.note)}</span>` : ''}</td>` +
      (tab.extraCol ? `<td class="x">${esc(r[tab.extraCol.k])}</td>` : '') + cells + '</tr>';
  }).join('');
  el.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
