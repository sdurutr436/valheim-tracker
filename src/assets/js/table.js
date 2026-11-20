// Vista en tabla (todos los logros salvo Chef × Gourmet)
// skip: bioma que ya dice la cabecera del grupo
const badges = (s, skip) => s ? s.split(', ').filter(p => !skip || !p.includes(skip)).map(p => {
  const b = BIOMES.find(b => p.includes(b));
  return `<span class="badge ${b ? 'b-' + slug(b) : ''}">${esc(biomeText(p))}</span>`;
}).join('') : '';

// Cuenta sobre todo el logro, no sobre lo filtrado (igual que los chips)
function groupHead(tab, bi) {
  const rs = tab.rows.filter(r => r.bi === bi), d = rs.filter(r => complete(tab, r)).length;
  return `<span class="grp-name">${esc(biomeText(BIOMES[bi]))}</span><span class="grp-n">${d}/${rs.length}</span>`;
}
const groupRow = (tab, bi, ncol) => `<tr class="grp b-${slug(BIOMES[bi])}"><th colspan="${ncol}" scope="colgroup" data-grp="${bi}">${groupHead(tab, bi)}</th></tr>`;

function renderTable(el, tab, rows, sort) {
  if (!rows.length) { el.innerHTML = '<div class="empty">Nada coincide. Prueba otro nombre, otro estado o quita el filtro de bioma.</div>'; return; }
  const th = (k, label, cls = '') => `<th class="${cls}" aria-sort="${sort.k === k ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}">
    <button data-sort="${k}">${label}<i>${sort.k === k ? (sort.dir > 0 ? '▲' : '▼') : '↕'}</i></button></th>`;
  const head = (tab.num ? th('i', '#') : '') + (tab.biome ? th('biome', 'Bioma') : '') + th('name', tab.label) +
    (tab.extraCol ? th(tab.extraCol.k, tab.extraCol.label) : '') + tab.cols.map(c => th(c.k, c.label, 'c')).join('');
  // Ordenado por bioma: una fila de cabecera antes de cada bioma (por el primero de la fila)
  const ncol = !!tab.num + !!tab.biome + 1 + !!tab.extraCol + tab.cols.length;
  let g;
  const body = rows.map(r => {
    const grp = sort.k === 'biome' && r.bi !== g && BIOMES[r.bi] ? groupRow(tab, (g = r.bi), ncol) : '';
    const cells = tab.cols.map(c => c.ap(r)
      ? `<td class="c"><input type="checkbox" data-key="${esc(r.key)}" data-k="${c.k}" ${checked(tab, r, c.k) ? 'checked' : ''} aria-label="${c.label}: ${esc(nameOf(r))}"></td>`
      : '<td class="c"></td>').join('');
    return grp + `<tr class="${complete(tab, r) ? 'done' : ''}">${tab.num ? `<td class="i">${r.i}</td>` : ''}` +
      (tab.biome ? `<td class="bio">${badges(r.biome, g != null && BIOMES[g])}</td>` : '') +
      `<td class="name">${esc(nameOf(r))}${r.note ? ` <span class="note">${esc(r.note)}</span>` : ''}</td>` +
      (tab.extraCol ? `<td class="x">${esc(r[tab.extraCol.k])}</td>` : '') + cells + '</tr>';
  }).join('');
  el.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
