import { readFileSync } from 'node:fs';

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/assets');
  // Las imágenes descargadas de la wiki viven en _data/assets y se sirven en assets/img/items
  eleventyConfig.addPassthroughCopy({ 'src/_data/assets': 'assets/img/items' });
  // Iconos de Phosphor (MIT) en línea al compilar: {% icon "github-logo" %}. Decorativos: el texto va en el enlace
  eleventyConfig.addShortcode('icon', name => readFileSync(`node_modules/@phosphor-icons/core/assets/regular/${name}.svg`, 'utf8')
    .replace('<svg', '<svg class="icon" width="20" height="20" aria-hidden="true" focusable="false"'));
  return { dir: { input: 'src', output: '_site' } };
}
