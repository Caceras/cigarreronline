import { Link, useParams } from 'react-router-dom';
import { brands, getBrand } from '../data/brands';
import { products } from '../data/products';
import { ProductGrid } from '../components/ProductCard';
import { PageHeader } from '../components/ui';
import { Head, breadcrumbLd } from '../lib/seo';
import NotFound from './NotFound';

const countOf = (id: string) => products.filter((p) => p.brand === id).length;

export function BrandIndex() {
  const crumbs = [{ name: 'Hem', path: '/' }, { name: 'Märken', path: '/marken/' }];
  const groupOf = (b: (typeof brands)[number]) => (b.id === 'signatur' ? 'Eget märke' : b.country.split(',')[0]);
  const groups = Array.from(new Set(brands.map(groupOf))).map((country) => ({
    country,
    items: brands.filter((b) => groupOf(b) === country && countOf(b.id) > 0),
  }));
  return (
    <div>
      <Head path="/marken/" title="Cigarrmärken – Cohiba, Montecristo, Davidoff m.fl. | CigarrerOnline"
        description="Alla cigarrmärken vi säljer: Cohiba, Montecristo, Partagás, Arturo Fuente, Davidoff, Padrón, Rocky Patel och fler, sorterade efter land."
        jsonLd={[breadcrumbLd(crumbs)]} />
      <PageHeader crumbs={crumbs} title="Cigarrmärken" intro="Märken från Kuba, Dominikanska republiken, Nicaragua, Honduras och Europa. Välj ett märke för att se historien och cigarrerna." />
      <section className="container-x grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
        {groups.filter((g) => g.items.length).map((g) => (
          <div key={g.country}>
            <p className="eyebrow text-muted border-b border-line pb-3 mb-2">{g.country}</p>
            <ul>
              {g.items.map((b) => (
                <li key={b.id}>
                  <Link to={`/marken/${b.id}/`} className="group flex items-baseline justify-between py-2.5 border-b border-line/60">
                    <span className="font-display text-2xl group-hover:text-brass-dark transition-colors">{b.name}</span>
                    <span className="text-xs text-muted tabular-nums">{countOf(b.id)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

export function BrandPage() {
  const { id } = useParams();
  const b = getBrand(id);
  if (!b) return <NotFound />;
  const items = products.filter((p) => p.brand === b.id);
  const crumbs = [{ name: 'Hem', path: '/' }, { name: 'Märken', path: '/marken/' }, { name: b.name, path: `/marken/${b.id}/` }];
  const plural = items.every((p) => p.type === 'cigarill') ? 'cigariller' : 'cigarrer';
  return (
    <div>
      <Head path={`/marken/${b.id}/`}
        title={`${b.name} ${plural} – köp ${b.name} online | CigarrerOnline`}
        description={`${b.intro} Köp ${b.name} ${plural} online med fri frakt över 799 kr.`.slice(0, 158)}
        jsonLd={[breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'Brand', name: b.name }]} />
      <PageHeader crumbs={crumbs} eyebrow={[b.country, b.since && `sedan ${b.since}`].filter(Boolean).join(' · ')} title={`${b.name} ${plural}`} intro={b.intro} />
      <section className="container-x"><ProductGrid items={items} cols={items.length >= 4 ? 4 : 3} /></section>
      <section className="container-x mt-24 grid lg:grid-cols-12 gap-10 border-t border-line pt-14">
        <h2 className="lg:col-span-4 text-3xl sm:text-4xl">Om {b.name}</h2>
        <div className="lg:col-span-7 prose-co">{b.body.map((t, i) => <p key={i}>{t}</p>)}</div>
      </section>
    </div>
  );
}
