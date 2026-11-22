// Comprobación del archivo de partida de store.js (lo que se descarga se vuelve a cargar; lo ajeno se rechaza).
// Uso: npm test
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const mem = {};
const localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
const { readSaveFile, saveFile, setChecked, hasSave } = vm.runInNewContext(
  readFileSync('src/assets/js/store.js', 'utf8') + ';({ readSaveFile, saveFile, setChecked, hasSave })', { localStorage });

assert.equal(hasSave(), false);
setChecked('hunter', 'Boar', 'done', true);
assert.equal(hasSave(), true);
assert.equal(JSON.stringify(readSaveFile(saveFile())), '{"chef":{},"hunter":{"Boar":{"done":true}}}');

const bad = [
  'not json',
  '{"progress":{}}',
  '{"app":"valheim-tracker","progress":[]}',
  '{"app":"valheim-tracker","progress":{"hunter":[true]}}',
  '{"app":"valheim-tracker","progress":{"hunter":{"Boar":{"done":"yes"}}}}',
  '{"app":"valheim-tracker","progress":{"hunter":{"Boar":true}}}',
];
for (const s of bad) assert.throws(() => readSaveFile(s), s);
console.log('save file: ok');
