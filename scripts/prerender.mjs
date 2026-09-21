// Writes one static HTML file per route (so Google reads real content) plus sitemap.xml and robots.txt.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SITE = 'https://cigarreronline.se';
const { render, allPaths } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href);
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

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`,
);
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /varukorg/\n\nSitemap: ${SITE}/sitemap.xml\nSitemap: ${SITE}/forum/sitemap.xml\n`,
);
console.log(`Prerendered ${paths.length + 2} pages.`);
