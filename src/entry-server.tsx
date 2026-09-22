import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App, { allPaths } from './App';
import { HeadContext, headTags, SITE, type HeadData } from './lib/seo';
import { ProductSvg, productImage, productAlt } from './components/Art';
import { products } from './data/products';
import { guides } from './data/guides';
import { validateContent } from '../content/schema';
import { brands } from './data/brands';
import { collections } from './data/collections';

export { allPaths, SITE };

/** Throws with a readable list if any content file is invalid, so a bad edit fails the build. */
export const validate = () => validateContent({ products, brands, guides, collections });

export function render(url: string) {
  const collector: { data?: HeadData } = {};
  const html = renderToString(
    <HeadContext.Provider value={collector}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HeadContext.Provider>,
  );
  return { html, head: collector.data ? headTags(collector.data) : '' };
}

/** One standalone SVG file per product (1200×900), so product pictures are real, indexable images. */
export function productImages() {
  return products.map((p) => {
    const art = renderToStaticMarkup(<ProductSvg product={p} />)
      .replace(/^<svg /, '<svg x="72" y="210" width="1056" height="352" ');
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900" role="img" aria-label="${productAlt(p).replace(/"/g, '&quot;')}">` +
      `<title>${productAlt(p).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>${art}</svg>`;
    return { path: productImage(p), url: `/produkt/${p.id}/`, title: productAlt(p), svg };
  });
}

/** Real last-changed dates where we have them (guides); other pages get none rather than a fake one. */
export const lastmod: Record<string, string> = Object.fromEntries(guides.map((g) => [`/guide/${g.slug}/`, g.date]));
