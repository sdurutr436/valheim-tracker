// Datos que viajan al navegador (el JS los lee de #tracker-data). Las recetas e imágenes
// solo se usan al construir las cards, así que se quitan para no inflar la página.
import { readFileSync } from 'node:fs';
const load = f => JSON.parse(readFileSync(new URL(`./${f}.json`, import.meta.url), 'utf8'));

export default {
  biomes: load('biomes'),
  chef: load('chef').map(({ recipe, image, ...row }) => row),
  hunter: load('hunter'),
  trophy: load('trophy'),
  fish: load('fish'),
  artisan: load('artisan'),
  carpenter: load('carpenter'),
};
