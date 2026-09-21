import { Link, useParams } from 'react-router-dom';
import { guides, getGuide } from '../data/guides';
import { getProduct } from '../data/products';
import { EditorialCover } from '../components/Art';
import { ProductGrid } from '../components/ProductCard';
import { Breadcrumbs, FaqList, PageHeader } from '../components/ui';
import { Head, SITE, breadcrumbLd, faqLd } from '../lib/seo';
import NotFound from './NotFound';

export function GuideIndex() {
  const crumbs = [{ name: 'Hem', path: '/' }, { name: 'Guider', path: '/guide/' }];
  return (
    <div>
      <Head path="/guide/" title="Guider om cigarrer – förvaring, nybörjare, fakta | CigarrerOnline"
        description="Guider om cigarrer: förvara cigarrer, cigarrer för nybörjare, cigarrformat, hur cigarrer tillverkas och om kubanska cigarrer är olagliga."
        jsonLd={[breadcrumbLd(crumbs)]} />
      <PageHeader crumbs={crumbs} title="Guider" intro="Allt om cigarrer, från hur du förvarar dem till hur de tillverkas. Varje guide finns också som podcastavsnitt." />
      <section className="container-x grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
        {guides.map((g, i) => (
          <Link key={g.slug} to={`/guide/${g.slug}/`} className="group block">
            <EditorialCover index={i + 1} category={g.category} className="aspect-[4/3]" />
            <p className="eyebrow !text-[0.62rem] text-muted mt-5">{g.readTime} läsning</p>
            <h2 className="font-display text-2xl leading-snug mt-2 group-hover:text-brass-dark transition-colors">{g.title}</h2>
            <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-2">{g.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

export function GuidePage() {
  const { slug } = useParams();
  const g = getGuide(slug);
  if (!g) return <NotFound />;
  const idx = guides.indexOf(g);
  const crumbs = [{ name: 'Hem', path: '/' }, { name: 'Guider', path: '/guide/' }, { name: g.title, path: `/guide/${g.slug}/` }];
  const prods = (g.products ?? []).map((id) => getProduct(id)!).filter(Boolean);
  const more = guides.filter((x) => x.slug !== g.slug).slice(0, 3);
  const articleLd = {
    '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description,
    datePublished: g.date, dateModified: g.date, inLanguage: 'sv-SE',
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url + '/' },
    publisher: { '@type': 'Organization', name: SITE.name },
    mainEntityOfPage: `${SITE.url}/guide/${g.slug}/`,
  };
  return (
    <article>
      <Head path={`/guide/${g.slug}/`} type="article" title={`${g.metaTitle} | CigarrerOnline`} description={g.description}
        jsonLd={[breadcrumbLd(crumbs), articleLd, ...(g.faq ? [faqLd(g.faq)] : [])]} />
      <div className="container-x pt-8 sm:pt-10"><Breadcrumbs crumbs={crumbs} /></div>
      <header className="container-x max-w-3xl pt-12 sm:pt-16 text-center">
        <p className="eyebrow text-brass-dark">{g.category} · {g.readTime} läsning</p>
        <h1 className="text-[2.5rem] sm:text-6xl leading-[1.05] mt-5">{g.title}</h1>
        <p className="mt-6 text-lg text-muted leading-relaxed">{g.intro}</p>
      </header>
      <div className="container-x max-w-3xl mt-12">
        <EditorialCover index={idx + 1} category={g.category} className="aspect-[21/9]" />
        <div className="mt-6 flex items-center justify-between text-xs text-muted border-b border-line pb-4">
          <span>Uppdaterad {new Date(g.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <Link to="/podcast/" className="link-u">Lyssna som podcast · {g.podcastDuration}</Link>
        </div>
        <nav aria-label="Innehåll" className="mt-8 bg-paper-2 p-6">
          <p className="eyebrow text-muted mb-3">Innehåll</p>
          <ol className="space-y-1.5 text-sm">
            {g.sections.map((s, i) => (
              <li key={s.h2}><a href={`#s${i}`} className="hover:text-brass-dark">{s.h2}</a></li>
            ))}
          </ol>
        </nav>
        <div className="prose-co mt-4">
          {g.sections.map((s, i) => (
            <section key={s.h2} id={`s${i}`} className="scroll-mt-24">
              <h2>{s.h2}</h2>
              {s.p.map((t, j) => <p key={j}>{t}</p>)}
            </section>
          ))}
        </div>
        {g.links && (
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-muted">Läs vidare:</span>
            {g.links.map((l) => <Link key={l.to} to={l.to} className="link-u">{l.label}</Link>)}
          </div>
        )}
        {g.faq && <div className="mt-16"><FaqList faq={g.faq} /></div>}
      </div>
      {prods.length > 0 && (
        <section className="container-x mt-24">
          <h2 className="text-3xl sm:text-4xl mb-10">Produkter i guiden</h2>
          <ProductGrid items={prods} cols={prods.length >= 4 ? 4 : 3} />
        </section>
      )}
      <section className="container-x mt-24">
        <h2 className="text-3xl sm:text-4xl mb-10">Fler guider</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {more.map((m) => (
            <Link key={m.slug} to={`/guide/${m.slug}/`} className="group border-t border-line pt-5">
              <p className="eyebrow !text-[0.62rem] text-muted">{m.category}</p>
              <p className="font-display text-2xl mt-2 group-hover:text-brass-dark transition-colors">{m.title}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
