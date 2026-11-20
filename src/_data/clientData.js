// Datos que viajan al navegador (el JS los lee de #tracker-data). Las recetas, imágenes y enlaces
// solo se usan al construir las cards, así que se quitan para no inflar la página.
import { readFileSync } from 'node:fs';
const load = f => JSON.parse(readFileSync(new URL(`./${f}.json`, import.meta.url), 'utf8'));
const lite = rows => rows.map(({ recipe, image, wiki, page, ...row }) => row);

export default {
  biomes: load('biomes'),
  chef: lite(load('chef')),
  hunter: load('hunter'),
  trophy: load('trophy'),
  fish: load('fish'),
  artisan: lite(load('artisan')),
  carpenter: lite(load('carpenter')),
};
