export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/assets');
  // Las imágenes descargadas de la wiki viven en _data/assets y se sirven en assets/img/items
  eleventyConfig.addPassthroughCopy({ 'src/_data/assets': 'assets/img/items' });
  return { dir: { input: 'src', output: '_site' } };
}
