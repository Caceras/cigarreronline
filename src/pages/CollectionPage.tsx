import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collections, collectionProducts, getCollection, type Collection } from '../data/collections';
import { ProductGrid } from '../components/ProductCard';
import { Chips, FaqList, PageHeader, Sections } from '../components/ui';
import { Head, SITE, breadcrumbLd, faqLd, type Crumb } from '../lib/seo';
import { STRENGTH_LEVEL } from '../data/products';
import { guides } from '../data/guides';
import { brands } from '../data/brands';

type Sort = 'popular' | 'price-asc' | 'price-desc' | 'strength';

export function crumbsFor(c: Collection): Crumb[] {
  const chain: Crumb[] = [];
  let cur: Collection | undefined = c;
  while (cur) {
    chain.unshift({ name: cur.name, path: cur.path });
    cur = cur.parent ? getCollection(cur.parent) : undefined;
  }
  return [{ name: 'Hem', path: '/' }, ...chain];
}

const labelFor = (path: string) =>
  getCollection(path)?.name ??
  brands.find((b) => `/marken/${b.id}/` === path)?.name ??
  guides.find((g) => `/guide/${g.slug}/` === path)?.title ??
  path;

export default function CollectionPage({ path }: { path: string }) {
  const c = getCollection(path)!;
  const [sort, setSort] = useState<Sort>('popular');
  const items = useMemo(() => {
    const list = collectionProducts(c);
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    if (sort === 'strength') return [...list].sort((a, b) => (a.strength ? STRENGTH_LEVEL[a.strength] : 0) - (b.strength ? STRENGTH_LEVEL[b.strength] : 0));
    return list;
  }, [c, sort]);

  const crumbs = crumbsFor(c);
  const topParent = c.parent ? getCollection(c.parent)! : c;
  const siblings = collections.filter((x) => x.parent === topParent.path);
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: c.h1,
    itemListElement: collectionProducts(c).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE.url}/produkt/${p.id}/`, name: p.name })),
  };
  const related = (c.related ?? []).filter((r) => !siblings.some((s) => s.path === r));

  return (
    <div>
      <Head
        path={c.path}
        title={c.title}
        description={c.description}
        jsonLd={[breadcrumbLd(crumbs), itemListLd, ...(c.faq ? [faqLd(c.faq)] : [])]}
      />
      <PageHeader crumbs={crumbs} title={c.h1} intro={c.intro}>
        {siblings.length > 0 && (
          <div className="mt-10">
            <Chips
              active={c.path}
              items={[{ to: topParent.path, label: `Alla ${topParent.name.toLowerCase()}` }, ...siblings.map((s) => ({ to: s.path, label: s.name }))]}
            />
          </div>
        )}
      </PageHeader>

      <section className="container-x">
        <div className="flex items-center justify-between border-y border-line py-3.5 mb-10 text-sm">
          <span className="text-muted"><span className="text-ink tabular-nums">{items.length}</span> produkter</span>
          <label className="flex items-center gap-2 text-muted">
            <span className="hidden sm:inline">Sortera</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-transparent text-ink pr-1 focus:outline-none cursor-pointer"
            >
              <option value="popular">Populärast</option>
              <option value="price-asc">Pris, lägst först</option>
              <option value="price-desc">Pris, högst först</option>
              <option value="strength">Styrka, mildast först</option>
            </select>
          </label>
        </div>
        <ProductGrid items={items} cols={items.length >= 4 ? 4 : 3} />
      </section>

      {(c.sections || related.length > 0 || c.faq) && (
        <section className="container-x mt-24 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 lg:col-start-1">
            {c.sections && <Sections sections={c.sections} />}
            {c.faq && <div className="mt-14"><FaqList faq={c.faq} /></div>}
          </div>
          {related.length > 0 && (
            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="lg:sticky lg:top-28 border-t border-line pt-6">
                <p className="eyebrow text-muted mb-4">Relaterat</p>
                <ul className="space-y-3">
                  {related.map((r) => (
                    <li key={r}><Link to={r} className="font-display text-xl hover:text-brass-dark transition-colors">{labelFor(r)}</Link></li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </section>
      )}
    </div>
  );
}
