import { readFileSync } from 'node:fs';

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/assets');
  // Las imágenes descargadas de la wiki viven en _data/assets y se sirven en assets/img/items
  eleventyConfig.addPassthroughCopy({ 'src/_data/assets': 'assets/img/items' });
  // Iconos de Phosphor (MIT) en línea al compilar: {% icon "github-logo" %}. Decorativos: el texto va en el enlace
  eleventyConfig.addShortcode('icon', name => readFileSync(`node_modules/@phosphor-icons/core/assets/regular/${name}.svg`, 'utf8')
    .replace('<svg', '<svg class="icon" width="20" height="20" aria-hidden="true" focusable="false"'));
  // El JS va dentro del HTML: datos y código llegan juntos. Con ficheros aparte, la caché (10 min en GitHub Pages)
  // podía mezclar un HTML viejo con un JS nuevo tras un despliegue, y dejaban de verse las marcas enlazadas
  eleventyConfig.addShortcode('js', name => {
    const code = readFileSync(`src/assets/js/${name}.js`, 'utf8');
    if (/<\/script/i.test(code)) throw new Error(`${name}.js contiene "</script": rompería el HTML`);
    return `<script>\n${code}</script>`;
  });
  return { dir: { input: 'src', output: '_site' } };
}
