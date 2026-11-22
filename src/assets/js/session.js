// Inicio de sesión: continuar, empezar de cero, cargar un archivo de partida o descargarlo. Todo se queda en este navegador
const saved = hasSave();
document.querySelectorAll('[data-if]').forEach(el => { el.hidden = (el.dataset.if === 'save') !== saved; });
const say = (en, es) => { document.getElementById('msg').textContent = lang === 'es' ? es : en; };
const go = () => location.assign('index.html');

document.getElementById('new').addEventListener('click', () => { localStorage.setItem(STORE_KEY, '{}'); go(); });

document.getElementById('download').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([saveFile()], { type: 'application/json' }));
  a.download = `valheim-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href));
});

document.getElementById('file').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = ''; // así se puede volver a elegir el mismo archivo
  if (!f) return;
  let p;
  try {
    if (f.size > 1e6) throw new Error('Too big'); // una partida real ocupa unos pocos KB
    p = readSaveFile(await f.text());
  } catch {
    return say("That file isn't a save file from this tracker.", 'Ese archivo no es una partida de este tracker.');
  }
  if (saved && !confirm(lang === 'es' ? 'Esto sustituye el progreso guardado en este navegador. ¿Seguir?'
    : 'This replaces the progress saved in this browser. Continue?')) return;
  localStorage.setItem(STORE_KEY, JSON.stringify(p));
  go();
});

document.addEventListener('lang', () => say('', ''));
