// Writes one static HTML file per route (so Google reads real content), product images,
// sitemap.xml (with image entries) and robots.txt.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const { render, allPaths, productImages, lastmod, SITE, validate } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href);
validate();
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const write = (url, file) => {
  const { html, head } = render(url);
  const out = template.replace('<!--head-->', head).replace('<!--app-->', html);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
};

const paths = allPaths();
for (const url of paths) write(url, path.join(dist, url, 'index.html'));
write('/404/', path.join(dist, '404.html'));
write('/varukorg/', path.join(dist, 'varukorg', 'index.html'));

const images = productImages();
for (const img of images) {
  const file = path.join(dist, img.path);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, img.svg);
}
const imagesByUrl = Object.fromEntries(images.map((i) => [i.url, i]));

fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    paths
      .map((p) => {
        const img = imagesByUrl[p];
        return `  <url><loc>${SITE.url}${p}</loc>${lastmod[p] ? `<lastmod>${lastmod[p]}</lastmod>` : ''}` +
          (img ? `<image:image><image:loc>${SITE.url}${img.path}</image:loc></image:image>` : '') + `</url>`;
      })
      .join('\n') +
    `\n</urlset>\n`,
);
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /varukorg/\n\nSitemap: ${SITE.url}/sitemap.xml\n` +
    (SITE.forumEnabled ? `Sitemap: ${SITE.url}/forum/sitemap.xml\n` : ''),
);
console.log(`Prerendered ${paths.length + 2} pages and ${images.length} product images.`);
