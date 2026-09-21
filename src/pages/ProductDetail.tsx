import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { getProduct, products, accessorySubs, type Product } from '../data/products';
import { getBrand } from '../data/brands';
import { getCollection } from '../data/collections';
import { ProductArt } from '../components/Art';
import { ProductGrid, kr } from '../components/ProductCard';
import { Breadcrumbs, Strength } from '../components/ui';
import { Head, SITE, breadcrumbLd, type Crumb } from '../lib/seo';
import { useCart } from '../lib/cart';
import NotFound from './NotFound';

const countryPath: Record<string, string> = {
  Kuba: '/cigarrer/kubanska/',
  'Dominikanska republiken': '/cigarrer/dominikanska/',
  Nicaragua: '/cigarrer/nicaraguanska/',
  Honduras: '/cigarrer/honduranska/',
};

export function primaryCollection(p: Product): string {
  if (p.type === 'cigarr') return p.signature ? '/cigarrer/handrullade/' : countryPath[p.country ?? ''] ?? '/cigarrer/';
  if (p.type === 'cigarill') return '/cigarrer/cigariller/';
  if (p.type === 'paket') return '/cigarrpaket/';
  return p.sub ? `/tillbehor/${p.sub}/` : '/tillbehor/';
}

function crumbsFor(p: Product): Crumb[] {
  const chain: Crumb[] = [];
  let c = getCollection(primaryCollection(p));
  while (c) {
    chain.unshift({ name: c.name, path: c.path });
    c = c.parent ? getCollection(c.parent) : undefined;
  }
  return [{ name: 'Hem', path: '/' }, ...chain, { name: p.name, path: `/produkt/${p.id}/` }];
}

export default function ProductDetail() {
  const { id } = useParams();
  const p = getProduct(id ?? '');
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  if (!p) return <NotFound />;

  const brand = getBrand(p.brand);
  const crumbs = crumbsFor(p);
  const related = products
    .filter((x) => x.id !== p.id && (x.brand === p.brand || (x.country === p.country && x.type === p.type) || (p.sub && x.sub === p.sub)))
    .slice(0, 4);

  const specs: [string, React.ReactNode][] = [];
  if (brand) specs.push(['Märke', <Link to={`/marken/${brand.id}/`} className="link-u">{brand.name}</Link>]);
  if (p.country) specs.push(['Ursprung', countryPath[p.country] ? <Link to={countryPath[p.country]} className="link-u">{p.country}</Link> : p.country]);
  if (p.strength) specs.push(['Styrka', <Strength value={p.strength} />]);
  if (p.format) specs.push(['Format', p.format]);
  if (p.size) specs.push(['Storlek', `${p.size} (mm × ringmått)`]);
  if (p.wrapperName) specs.push(['Täckblad', p.wrapperName]);
  if (p.pack) specs.push(['Förpackning', p.pack]);
  if (p.type === 'cigarr') specs.push(['Tillverkning', 'Handrullad, lång inlaga']);
  if (p.sub) specs.push(['Kategori', <Link to={`/tillbehor/${p.sub}/`} className="link-u">{accessorySubs.find((s) => s.id === p.sub)?.name}</Link>]);

  const title = `${p.name}${p.type === 'cigarr' ? ' – köp online' : ''} | ${kr(p.price)} | CigarrerOnline`;
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.id,
    description: p.description,
    ...(brand ? { brand: { '@type': 'Brand', name: brand.name } } : {}),
    ...(p.country ? { countryOfOrigin: p.country } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE.url}/produkt/${p.id}/`,
      priceCurrency: 'SEK',
      price: p.price,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <div>
      <Head
        path={`/produkt/${p.id}/`}
        type="product"
        title={title}
        description={`${p.name}${p.country ? ` från ${p.country}` : ''}. ${p.description} ${kr(p.price)}. Fri frakt över ${SITE.freeShipping} kr.`.slice(0, 158)}
        jsonLd={[breadcrumbLd(crumbs), productLd]}
      />
      <div className="container-x pt-8 sm:pt-10">
        <Breadcrumbs crumbs={crumbs} />
      </div>

      <section className="container-x pt-8 sm:pt-12 grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7">
          <ProductArt product={p} className="aspect-[4/3] lg:aspect-[5/4]" />
        </div>
        <div className="lg:col-span-5 lg:pt-6">
          {brand && <Link to={`/marken/${brand.id}/`} className="eyebrow text-brass-dark hover:text-ink">{brand.name}</Link>}
          <h1 className="text-4xl sm:text-5xl leading-[1.08] mt-3">{p.name}</h1>
          <p className="mt-5 text-2xl tabular-nums">{kr(p.price)}{p.pack && p.type !== 'tillbehor' ? <span className="text-sm text-muted"> / {p.pack}</span> : p.type === 'cigarr' ? <span className="text-sm text-muted"> / st</span> : null}</p>
          <p className="mt-6 text-muted leading-relaxed">{p.description}</p>

          <div className="mt-8 flex gap-3">
            <div className="flex items-center border border-line">
              <button className="p-3.5 text-muted hover:text-ink" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Minska antal"><Minus size={15} /></button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
              <button className="p-3.5 text-muted hover:text-ink" onClick={() => setQty((q) => q + 1)} aria-label="Öka antal"><Plus size={15} /></button>
            </div>
            <button className="btn btn-ink flex-1" onClick={() => add(p.id, qty)}>Lägg i varukorg</button>
          </div>
          <p className="mt-4 text-xs text-muted">I lager · Skickas inom 1 vardag · Fri frakt över {SITE.freeShipping} kr</p>

          <dl className="mt-10 border-t border-line text-sm">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-3.5 border-b border-line">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-x mt-16">
        <div className="border-t border-line pt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <span className="text-muted">Bra att veta:</span>
          {(p.type === 'tillbehor'
            ? [['/guide/forvara-cigarrer/', 'Förvara cigarrer rätt'], ['/guide/snoppa-och-tanda-en-cigarr/', 'Snoppa och tända en cigarr']]
            : [['/guide/forvara-cigarrer/', 'Förvara cigarrer rätt'], ['/guide/cigarrformat-och-typer/', 'Om cigarrformat'], ['/frakt-och-leverans/', 'Frakt & leverans']]
          ).map(([to, label]) => (
            <Link key={to} to={to} className="link-u py-1.5 -my-1.5">{label}</Link>
          ))}
        </div>
      </section>

      {brand && brand.id !== 'signatur' && (
        <section className="container-x mt-24 grid lg:grid-cols-12 gap-10 border-t border-line pt-14">
          <h2 className="lg:col-span-4 text-3xl sm:text-4xl">Om {brand.name}</h2>
          <div className="lg:col-span-7 prose-co">
            <p>{brand.intro}</p>
            <p>{brand.body[0]}</p>
            <p><Link to={`/marken/${brand.id}/`}>Alla cigarrer från {brand.name}</Link></p>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="container-x mt-24">
          <h2 className="text-3xl sm:text-4xl mb-10">Du kanske också gillar</h2>
          <ProductGrid items={related} cols={4} />
        </section>
      )}
    </div>
  );
}
