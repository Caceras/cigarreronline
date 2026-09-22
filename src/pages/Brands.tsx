import { Link, useParams } from 'react-router-dom';
import { brands, getBrand } from '../data/brands';
import { products, STRENGTH_LEVEL, type Product } from '../data/products';
import { ProductGrid, kr } from '../components/ProductCard';
import { FaqList, PageHeader } from '../components/ui';
import { Head, SITE, breadcrumbLd, clip, faqLd } from '../lib/seo';
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
  const facts = brandFacts(b.name, b.country, b.since, items, plural);
  const origin = b.country.split(',')[0];
  const siblings = b.id === 'signatur' ? [] : brands.filter((x) => x.id !== b.id && x.country.split(',')[0] === origin && countOf(x.id) > 0);
  const title = [`${b.name} ${plural} – köp ${b.name} online | ${SITE.name}`, `${b.name} ${plural} – köp online | ${SITE.name}`, `${b.name} ${plural} | ${SITE.name}`]
    .find((t) => t.length <= 60 && !b.name.includes(SITE.name)) ?? `${b.name} ${plural}`;
  return (
    <div>
      <Head path={`/marken/${b.id}/`}
        title={title}
        description={clip(`${b.intro} ${facts.summary}`)}
        jsonLd={[
          breadcrumbLd(crumbs),
          { '@context': 'https://schema.org', '@type': 'Brand', name: b.name, url: `${SITE.url}/marken/${b.id}/`, description: b.intro },
          faqLd(facts.faq),
        ]} />
      <PageHeader crumbs={crumbs} eyebrow={[b.country, b.since && `sedan ${b.since}`].filter(Boolean).join(' · ')} title={`${b.name} ${plural}`} intro={b.intro} />
      <section className="container-x">
        <h2 className="sr-only">{b.name} i sortimentet</h2>
        <ProductGrid items={items} cols={items.length >= 4 ? 4 : 3} eager />
      </section>
      <section className="container-x mt-24 grid lg:grid-cols-12 gap-10 border-t border-line pt-14">
        <h2 className="lg:col-span-4 text-3xl sm:text-4xl">Om {b.name}</h2>
        <div className="lg:col-span-7 prose-co">
          {b.body.map((t, i) => <p key={i}>{t}</p>)}
          <h2>{b.name} hos {SITE.name}</h2>
          <p>{facts.summary}</p>
        </div>
      </section>
      <section className="container-x mt-20 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7"><FaqList faq={facts.faq} title={`Vanliga frågor om ${b.name}`} /></div>
        {siblings.length > 0 && (
          <aside className="lg:col-span-4 lg:col-start-9 border-t border-line pt-6 self-start">
            <p className="eyebrow text-muted mb-4">Fler märken från {origin}</p>
            <ul className="space-y-3">
              {siblings.map((x) => (
                <li key={x.id}><Link to={`/marken/${x.id}/`} className="font-display text-xl hover:text-brass-dark transition-colors">{x.name}</Link></li>
              ))}
            </ul>
          </aside>
        )}
      </section>
    </div>
  );
}

const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} och ${xs[xs.length - 1]}`);

/** Facts and FAQ written from the catalogue itself, so they are always true and never go stale. */
function brandFacts(name: string, country: string, since: string | undefined, items: Product[], plural: string) {
  const singles = items.filter((p) => p.type === 'cigarr' || p.type === 'cigarill');
  const boxes = items.filter((p) => p.type === 'paket');
  const pool = singles.length ? singles : items;
  const cheapest = pool.reduce((a, b) => (b.price < a.price ? b : a));
  const dearest = pool.reduce((a, b) => (b.price > a.price ? b : a));
  const unit = pool.every((p) => p.type === 'cigarill') ? 'per förpackning' : 'styck';
  const strengths = [...new Set(pool.map((p) => p.strength).filter(Boolean))] as (keyof typeof STRENGTH_LEVEL)[];
  strengths.sort((a, b) => STRENGTH_LEVEL[a] - STRENGTH_LEVEL[b]);
  const formats = [...new Set(pool.map((p) => p.format?.toLowerCase()).filter(Boolean))] as string[];

  const price = cheapest === dearest
    ? `${cheapest.name} kostar ${kr(cheapest.price)} ${unit}.`
    : `Priset ligger mellan ${kr(cheapest.price)} (${cheapest.name}) och ${kr(dearest.price)} (${dearest.name}) ${unit}.`;
  const strength = strengths.length === 0 ? ''
    : strengths.length === 1 ? `Styrkan är ${strengths[0].toLowerCase()}.`
    : `Styrkan varierar från ${strengths[0].toLowerCase()} till ${strengths[strengths.length - 1].toLowerCase()}.`;
  const box = boxes.length ? ` Det finns också ${boxes.length === 1 ? 'en hel låda' : `${boxes.length} lådor och paket`}: ${list(boxes.map((p) => p.name))}.` : '';

  const summary = `Vi säljer ${pool.length} ${pool.length === 1 ? (plural === 'cigariller' ? 'cigarill' : 'cigarr') : plural} från ${name}. ${price} ${strength}`.trim() + box;

  const faq = [
    { q: `Vad kostar ${name} ${plural}?`, a: `${price}${box} Fri frakt över ${SITE.freeShipping} kr.` },
    ...(strengths.length ? [{
      q: `Hur starka är ${name} ${plural}?`,
      a: `${strength} ${pool.filter((p) => p.strength).map((p) => `${p.name}: ${p.strength!.toLowerCase()}`).join('. ')}.`,
    }] : []),
    { q: `Var tillverkas ${name}?`, a: `${name} kommer från ${country}${since ? ` och har funnits sedan ${since}` : ''}.${formats.length ? ` Hos oss finns formaten ${list(formats)}.` : ''}` },
  ];
  return { summary, faq };
}
