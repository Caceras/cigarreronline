import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { products, getProduct } from '../data/products';
import { guides } from '../data/guides';
import { Cigar, EditorialCover } from '../components/Art';
import { ProductGrid, kr } from '../components/ProductCard';
import { Chips, FaqList, SectionTitle } from '../components/ui';
import { Head, SITE, faqLd, orgLd, websiteLd } from '../lib/seo';

const faq = [
  { q: 'Kan man köpa cigarrer online i Sverige?', a: 'Ja. Svenska nätbutiker får sälja tobak till personer över 18 år. Hos oss beställer du cigarrer online och får dem hemskickade inom 1–3 vardagar, med svensk tobaksskatt redan betald.' },
  { q: 'Är det lagligt att köpa kubanska cigarrer online?', a: 'Ja. Kubanska cigarrer som Cohiba och Montecristo är lagliga att köpa i Sverige och resten av EU. Förbudet gäller bara USA.' },
  { q: 'Hur kontrolleras min ålder?', a: 'Du bekräftar att du är 18 år när du besöker sidan, och åldern kontrolleras med BankID i kassan. Vid leverans kan ombudet begära legitimation.' },
  { q: 'Vad kostar frakten?', a: `Frakten är fri för beställningar över ${SITE.freeShipping} kr. Under det kostar den 59 kr. Paketen är neutrala och skickas från Sverige.` },
  { q: 'Kan jag beställa cigarrer online från Tyskland eller USA i stället?', a: 'Det går, men svensk tobaksskatt ska betalas. Från USA tillkommer tull och moms, och de flesta amerikanska butiker skickar inte tobak utomlands. Läs mer i vår guide om att köpa cigarrer från utlandet.' },
  { q: 'Var hittar jag billiga cigarrer online?', a: 'Under Prisvärda cigarrer samlar vi handrullade premiumcigarrer under 200 kr. Det lägsta styckpriset får du när du köper en hel låda om 20 eller 25.' },
];

const origins = [
  { to: '/cigarrer/kubanska/', label: 'Kuba', name: 'Kubanska cigarrer', note: 'Cohiba, Montecristo, Partagás', w: '#5a3620', b: '#c9a24a', v: 'piramide' as const },
  { to: '/cigarrer/dominikanska/', label: 'Dominikanska rep.', name: 'Dominikanska cigarrer', note: 'Arturo Fuente, Davidoff', w: '#a0703f', b: '#e8dcc2', v: 'churchill' as const },
  { to: '/cigarrer/nicaraguanska/', label: 'Nicaragua', name: 'Nicaraguanska cigarrer', note: 'Padrón, Oliva, Perdomo', w: '#3e2515', b: '#1f1f1f', v: 'robusto' as const },
  { to: '/cigarrer/honduranska/', label: 'Honduras', name: 'Honduranska cigarrer', note: 'Rocky Patel, Alec Bradley', w: '#6b4428', b: '#7a1f22', v: 'toro' as const },
];

export default function Home() {
  const popular = ['cohiba-robusto', 'montecristo-no-2', 'arturo-fuente-hemingway-best-seller', 'partagas-serie-d-no-4', 'padron-1964-anniversary-exclusivo', 'signatur-robusto'].map((id) => getProduct(id)!);
  const cuban = ['cohiba-siglo-ii', 'montecristo-no-4', 'romeo-y-julieta-churchill'].map((id) => getProduct(id)!);
  const value = products.filter((p) => p.type === 'cigarr' && p.price < 160).slice(0, 4);
  const hero = getProduct('cohiba-robusto')!;

  return (
    <div>
      <Head
        path="/"
        title="Cigarrer online – köp kubanska cigarrer | CigarrerOnline"
        description="Köp cigarrer online från en svensk tobakshandel: kubanska Cohiba och Montecristo, handrullade premiumcigarrer, cigariller och tillbehör. Fri frakt över 799 kr."
        jsonLd={[websiteLd, orgLd, faqLd(faq)]}
      />

      {/* Hero */}
      <section className="container-x pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-6 animate-rise">
            <p className="eyebrow text-brass-dark mb-6">Svensk tobakshandel på nätet</p>
            <h1 className="text-[3.3rem] sm:text-7xl lg:text-[5.6rem] leading-[0.98] tracking-[-0.02em]">
              Cigarrer online
            </h1>
            <p className="font-display italic text-2xl sm:text-3xl text-brass-dark mt-3">handplockade, rätt förvarade, hemskickade.</p>
            <p className="mt-7 max-w-md text-muted leading-relaxed">
              Köp cigarrer online från kubanska Cohiba och Montecristo till handrullade cigarrer från Nicaragua och
              Dominikanska republiken. Svensk tobaksskatt är betald och du har paketet hemma inom 1–3 vardagar.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/cigarrer/" className="btn btn-ink">Köp cigarrer <ArrowRight size={16} strokeWidth={1.5} /></Link>
              <Link to="/cigarrer/kubanska/" className="btn btn-ghost">Kubanska cigarrer</Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            <Link to={`/produkt/${hero.id}/`} className="group block bg-paper-2 relative">
              <div className="aspect-[5/4] sm:aspect-[16/12] flex items-center px-[6%]">
                <div className="w-full animate-drift"><Cigar vitola="churchill" wrapper="#7a4b2a" band="#c9a24a" tilt={-12} /></div>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 flex items-end justify-between text-sm">
                <span>
                  <span className="eyebrow text-muted block mb-1">Mest köpt just nu</span>
                  <span className="font-display text-xl group-hover:text-brass-dark transition-colors">{hero.name}</span>
                </span>
                <span className="tabular-nums">{kr(hero.price)}</span>
              </div>
            </Link>
          </div>
        </div>
        <ul className="mt-14 grid grid-cols-2 md:grid-cols-4 border-t border-line text-sm">
          {[['Fri frakt', `över ${SITE.freeShipping} kr`], ['Leverans', '1–3 vardagar'], ['Förvarade', 'i 69 % luftfuktighet'], ['Neutral förpackning', 'skickas från Sverige']].map(([a, b]) => (
            <li key={a} className="py-5 pr-4 border-b border-line">
              <span className="block text-ink">{a}</span>
              <span className="text-muted">{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Shop by origin */}
      <section className="container-x pb-20 sm:pb-28">
        <SectionTitle eyebrow="Sortimentet" title={<>Handla cigarrer <span className="italic">efter ursprung</span></>} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {origins.map((o) => (
            <Link key={o.to} to={o.to} className="group block">
              <div className="bg-paper-2 aspect-[4/3] flex items-center px-[8%] transition-colors group-hover:bg-paper-3">
                <Cigar vitola={o.v} wrapper={o.w} band={o.b} tilt={-8} />
              </div>
              <p className="eyebrow !text-[0.62rem] text-muted mt-4">{o.label}</p>
              <h3 className="font-display text-[1.45rem] mt-1 group-hover:text-brass-dark transition-colors">{o.name}</h3>
              <p className="text-sm text-muted mt-0.5">{o.note}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="eyebrow text-muted shrink-0 sm:mr-2">Eller efter smak</span>
          <Chips items={[
            { to: '/cigarrer/milda/', label: 'Milda' }, { to: '/cigarrer/starka/', label: 'Starka' },
            { to: '/cigarrer/prisvarda/', label: 'Prisvärda' }, { to: '/cigarrer/exklusiva/', label: 'Exklusiva' },
            { to: '/cigarrer/handrullade/', label: 'Handrullade' }, { to: '/cigarrer/cigariller/', label: 'Cigariller' },
            { to: '/cigarrpaket/', label: 'Paket & lådor' },
          ]} />
        </div>
      </section>

      {/* Popular */}
      <section className="container-x pb-20 sm:pb-28">
        <SectionTitle
          eyebrow="Populärt"
          title="Mest köpta cigarrer"
          action={<Link to="/cigarrer/" className="inline-flex items-center gap-2 text-sm link-u">Alla cigarrer <ArrowRight size={15} strokeWidth={1.5} /></Link>}
        />
        <ProductGrid items={popular} />
      </section>

      {/* Cuban */}
      <section className="bg-paper-2">
        <div className="container-x py-20 sm:py-28 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <p className="eyebrow text-brass-dark mb-4">Habanos</p>
            <h2 className="text-4xl sm:text-5xl leading-tight">Cohiba och kubanska cigarrer online</h2>
            <p className="mt-5 text-muted leading-relaxed">
              Kubanska cigarrer är lagliga i Sverige och säljs med Habanos garantisigill. Montecristo No. 4 är ett prisvärt
              sätt att börja. Cohiba är klassikern många söker efter.
            </p>
            <div className="mt-8 flex flex-col gap-3 text-sm">
              <Link to="/cigarrer/kubanska/" className="link-u self-start">Alla kubanska cigarrer</Link>
              <Link to="/marken/cohiba/" className="link-u self-start">Cohiba cigarrer</Link>
              <Link to="/guide/ar-kubanska-cigarrer-olagliga/" className="link-u self-start">Är kubanska cigarrer olagliga?</Link>
            </div>
          </div>
          <div className="lg:col-span-8"><ProductGrid items={cuban} /></div>
        </div>
      </section>

      {/* Value */}
      <section className="container-x py-20 sm:py-28">
        <SectionTitle
          eyebrow="Under 160 kr"
          title={<>Prisvärda cigarrer <span className="italic">online</span></>}
          action={<Link to="/cigarrer/prisvarda/" className="inline-flex items-center gap-2 text-sm link-u">Fler prisvärda <ArrowRight size={15} strokeWidth={1.5} /></Link>}
        />
        <ProductGrid items={value} cols={4} />
      </section>

      {/* How to order */}
      <section className="border-y border-line">
        <div className="container-x py-20 sm:py-24">
          <SectionTitle eyebrow="Så fungerar det" title={<>Beställ cigarrer online <span className="italic">i tre steg</span></>} />
          <ol className="grid md:grid-cols-3 gap-10 md:gap-0 md:divide-x divide-line">
            {[
              ['Välj', 'Handla cigarrer online efter ursprung, styrka eller märke. Osäker? Våra guider hjälper dig.'],
              ['Bekräfta', 'Ålderskontroll med BankID i kassan. Betala med kort, Swish eller faktura.'],
              ['Få hemskickat', 'Vi skickar inom ett dygn i neutral förpackning. Leverans till ombud eller hem på 1–3 vardagar.'],
            ].map(([t, d], i) => (
              <li key={t} className="md:px-10 first:md:pl-0">
                <span className="font-display italic text-brass text-2xl">0{i + 1}</span>
                <h3 className="text-2xl mt-2">{t}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed max-w-xs">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Signature */}
      <section className="container-x py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div className="bg-paper-2 py-10 px-[6%] space-y-[-2.5rem]">
          <Cigar vitola="churchill" wrapper="#8c5d33" band="#b08a4a" tilt={-4} />
          <Cigar vitola="toro" wrapper="#4a2c19" band="#b08a4a" tilt={-4} />
          <Cigar vitola="petit" wrapper="#9b6a3d" band="#b08a4a" tilt={-4} />
        </div>
        <div className="max-w-lg">
          <p className="eyebrow text-brass-dark mb-4">Vår signatur</p>
          <h2 className="text-4xl sm:text-5xl leading-tight">Handrullade cigarrer <span className="italic">i vårt eget namn.</span></h2>
          <p className="mt-6 text-muted leading-relaxed">
            Fyra format med lång inlaga från Nicaragua, Honduras och Dominikanska republiken. Blandade för att vara lätta att
            tycka om, från en mild petit corona till en fyllig toro.
          </p>
          <Link to="/cigarrer/handrullade/" className="btn btn-ghost mt-8">Se signaturserien <ArrowRight size={16} strokeWidth={1.5} /></Link>
        </div>
      </section>

      {/* SEO copy */}
      <section className="container-x pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-12 gap-10 border-t border-line pt-16">
          <h2 className="lg:col-span-4 text-4xl leading-tight">Köpa cigarrer online <span className="italic">i Sverige</span></h2>
          <div className="lg:col-span-8 grid md:grid-cols-2 gap-x-10 prose-co text-[0.95rem]">
            <div>
              <p>
                Att köpa cigarr online ska vara lika tryggt som i en fysisk tobaksaffär. Därför förvaras varje cigarr i humidor vid
                69 % luftfuktighet tills den packas. Den kommer fram i samma skick som när den lämnade tobakshuset.
              </p>
              <p>
                I vår cigarrer online shop hittar du <Link to="/cigarrer/kubanska/">kubanska cigarrer</Link>,{' '}
                <Link to="/cigarrer/dominikanska/">dominikanska</Link> och <Link to="/cigarrer/nicaraguanska/">nicaraguanska cigarrer</Link>,{' '}
                <Link to="/cigarrer/cigariller/">cigariller</Link> och <Link to="/tillbehor/">tillbehör</Link>. Beställ en enstaka cigarr eller en{' '}
                <Link to="/cigarrpaket/">hel låda</Link> för lägre styckpris.
              </p>
            </div>
            <div>
              <p>
                Söker du cigarrer online billigt är <Link to="/cigarrer/prisvarda/">prisvärda cigarrer</Link> under 200 kr ett bra
                ställe att börja. Många nicaraguanska och dominikanska cigarrer håller hög kvalitet till ett lägre pris än de kubanska.
              </p>
              <p>
                Funderar du på att beställa cigarrer online från Tyskland eller USA? Svensk tobaksskatt ska ändå betalas, och från
                USA tillkommer tull. Läs vår guide om att <Link to="/guide/kopa-cigarrer-fran-utlandet/">köpa cigarrer från utlandet</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="container-x pb-20 sm:pb-28">
        <SectionTitle
          eyebrow="Guider"
          title={<>Lär dig mer <span className="italic">om cigarrer</span></>}
          action={<Link to="/guide/" className="inline-flex items-center gap-2 text-sm link-u">Alla guider <ArrowRight size={15} strokeWidth={1.5} /></Link>}
        />
        <div className="grid md:grid-cols-3 gap-x-6 gap-y-12">
          {guides.slice(0, 3).map((g, i) => (
            <Link key={g.slug} to={`/guide/${g.slug}/`} className="group block">
              <EditorialCover index={i + 1} category={g.category} className="aspect-[4/3]" />
              <p className="eyebrow !text-[0.62rem] text-muted mt-5">{g.readTime} läsning</p>
              <h3 className="font-display text-2xl leading-snug mt-2 group-hover:text-brass-dark transition-colors">{g.title}</h3>
              <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-2">{g.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x max-w-4xl">
        <FaqList faq={faq} title="Frågor om att köpa cigarrer online" />
      </section>
    </div>
  );
}
