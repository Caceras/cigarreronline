import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { FaqList, PageHeader, Sections } from '../components/ui';
import { EditorialCover, ProductArt } from '../components/Art';
import { kr } from '../components/ProductCard';
import { Head, SITE, breadcrumbLd, faqLd } from '../lib/seo';
import { guides } from '../data/guides';
import { getProduct } from '../data/products';
import { useCart } from '../lib/cart';

const c = (name: string, path: string) => [{ name: 'Hem', path: '/' }, { name, path }];

const cities: [string, string][] = [
  ['Stockholm', '1–2'], ['Uppsala', '1–2'], ['Västerås', '1–2'], ['Örebro', '1–2'], ['Norrköping', '1–2'], ['Linköping', '1–2'],
  ['Göteborg', '1–2'], ['Malmö', '1–3'], ['Helsingborg', '1–3'], ['Lund', '1–3'], ['Jönköping', '1–2'], ['Gävle', '1–2'],
  ['Karlstad', '1–2'], ['Sundsvall', '2–3'], ['Umeå', '2–3'], ['Luleå', '2–3'], ['Visby', '2–3'], ['Östersund', '2–3'],
];

const shippingFaq = [
  { q: 'Hur mycket kostar frakten?', a: `59 kr till ombud. Fri frakt för beställningar över ${SITE.freeShipping} kr.` },
  { q: 'Hur förpackas cigarrerna?', a: 'I en neutral kartong utan tryck om innehållet. Cigarrerna ligger i en försluten påse med fuktreglering så att de klarar resan.' },
  { q: 'Behöver jag visa legitimation?', a: 'Ja, ombudet kan begära legitimation vid utlämning. Paket till personer under 18 år lämnas inte ut.' },
  { q: 'Kan jag ångra mitt köp?', a: 'Du har 14 dagars ångerrätt på oöppnade varor enligt distansavtalslagen.' },
];

export function Shipping() {
  const crumbs = c('Frakt & leverans', '/frakt-och-leverans/');
  return (
    <div>
      <Head path="/frakt-och-leverans/" title="Frakt & leverans – cigarrer med fri frakt | CigarrerOnline"
        description={`Cigarrer med fri frakt över ${SITE.freeShipping} kr. Leverans 1–3 vardagar till hela Sverige, från Stockholm och Göteborg till Luleå. Neutral förpackning.`}
        jsonLd={[breadcrumbLd(crumbs), faqLd(shippingFaq)]} />
      <PageHeader crumbs={crumbs} title="Frakt & leverans" intro={`Fri frakt över ${SITE.freeShipping} kr. Vi skickar inom ett dygn och du har paketet på 1–3 vardagar, var du än bor i Sverige.`} />
      <section className="container-x grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <Sections sections={[
            { h2: 'Så skickar vi', p: [
              'Cigarrerna plockas direkt ur humidorn, läggs i en försluten påse med tvåvägs fuktreglering och packas i en neutral kartong. De klarar några dagars transport utan att torka.',
              'Beställningar som görs före klockan 14 på vardagar skickas samma dag. Du får spårningslänk via e-post och sms.',
            ] },
            { h2: 'Ålderskontroll vid köp och leverans', p: [
              'Vi säljer tobak enbart till personer som fyllt 18 år. Åldern kontrolleras med BankID i kassan och ombudet kan begära legitimation när du hämtar paketet.',
            ] },
          ]} />
          <div className="mt-14"><FaqList faq={shippingFaq} /></div>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="border-t border-line pt-6">
            <p className="eyebrow text-muted mb-4">Leveranstid, vardagar</p>
            <table className="w-full text-sm">
              <tbody>
                {cities.map(([city, d]) => (
                  <tr key={city} className="border-b border-line">
                    <td className="py-2.5">Cigarrer till {city}</td>
                    <td className="py-2.5 text-right text-muted tabular-nums">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </section>
    </div>
  );
}

export function About() {
  const crumbs = c('Om oss', '/om-oss/');
  return (
    <div>
      <Head path="/om-oss/" title="Om CigarrerOnline – svensk tobakshandel på nätet"
        description="CigarrerOnline är en svensk nätbutik för cigarrer. Så väljer vi cigarrer, förvarar dem och skickar dem till dig."
        jsonLd={[breadcrumbLd(crumbs)]} />
      <PageHeader crumbs={crumbs} title={<>En tobakshandel, <span className="italic">på nätet.</span></>}
        intro="CigarrerOnline säljer handrullade premiumcigarrer, cigariller och tillbehör till hela Sverige, med samma omsorg som i en fysisk cigarraffär." />
      <section className="container-x grid md:grid-cols-3 gap-10 border-t border-line pt-14">
        {[
          ['Utvalt', 'Vi väljer märken och format vi själva tycker om, från klassiska Habanos till nya favoriter från Nicaragua. Hellre ett genomtänkt sortiment än ett stort.'],
          ['Förvarat rätt', 'Alla cigarrer ligger i humidor vid 69 % luftfuktighet och cirka 18 °C tills de packas.'],
          ['Ärligt', 'Vi berättar vad cigarrer är, även riskerna. Tobak är skadligt och säljs bara till dig som fyllt 18 år.'],
        ].map(([t, d]) => (
          <div key={t}>
            <h2 className="text-3xl">{t}</h2>
            <p className="mt-3 text-muted leading-relaxed">{d}</p>
          </div>
        ))}
      </section>
      <section className="container-x mt-20 max-w-3xl prose-co">
        <h2>Integritet</h2>
        <p>Vi sparar bara de uppgifter som krävs för att leverera din beställning och uppfylla bokföringslagen. Varukorgen och åldersbekräftelsen sparas lokalt i din webbläsare. Vi skickar inga reklamutskick.</p>
      </section>
    </div>
  );
}

export function Contact() {
  const crumbs = c('Kontakt', '/kontakt/');
  const [sent, setSent] = useState(false);
  return (
    <div>
      <Head path="/kontakt/" title="Kontakt – frågor om cigarrer och beställningar | CigarrerOnline" description={`Frågor om cigarrer, beställningar eller leverans? Mejla ${SITE.email} så svarar vi inom ett dygn.`} jsonLd={[breadcrumbLd(crumbs)]} />
      <PageHeader crumbs={crumbs} title="Kontakt" intro="Frågor om en cigarr, en beställning eller vad du ska välja? Skriv till oss så svarar vi inom ett dygn på vardagar." />
      <section className="container-x grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8 text-sm">
          <div><p className="eyebrow text-muted mb-2">E-post</p><a href={`mailto:${SITE.email}`} className="font-display text-2xl link-u">{SITE.email}</a></div>
          <div><p className="eyebrow text-muted mb-2">Kundservice</p><p>Vardagar 9–17</p></div>
          <div><p className="eyebrow text-muted mb-2">Snabba svar</p><Link to="/frakt-och-leverans/" className="link-u">Frakt, leverans och ångerrätt</Link></div>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          {sent ? (
            <div className="bg-paper-2 p-10"><h2 className="text-3xl">Tack!</h2><p className="text-muted mt-2">Vi återkommer inom ett dygn.</p></div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              <label className="block"><span className="eyebrow text-muted">Namn</span><input required className="field" /></label>
              <label className="block"><span className="eyebrow text-muted">E-post</span><input required type="email" className="field" /></label>
              <label className="block sm:col-span-2"><span className="eyebrow text-muted">Ämne</span>
                <select className="field"><option>Fråga om produkt</option><option>Min beställning</option><option>Reklamation</option><option>Övrigt</option></select>
              </label>
              <label className="block sm:col-span-2"><span className="eyebrow text-muted">Meddelande</span><textarea required rows={5} className="field resize-none" /></label>
              <div className="sm:col-span-2"><button className="btn btn-ink">Skicka meddelande</button></div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export function Podcast() {
  const crumbs = c('Podcast', '/podcast/');
  return (
    <div>
      <Head path="/podcast/" title="Podcast om cigarrer | CigarrerOnline" description="Lyssna på våra guider om cigarrer som podcast: förvaring, nybörjartips, kubanska cigarrer och cigarrens hantverk." jsonLd={[breadcrumbLd(crumbs)]} />
      <PageHeader crumbs={crumbs} title="Podcast" intro="Varje guide finns också som ett lugnt podcastavsnitt, för dig som hellre lyssnar medan cigarren brinner." />
      <section className="container-x max-w-4xl">
        <ol className="border-t border-line">
          {guides.map((g, i) => (
            <li key={g.slug} className="border-b border-line py-6 grid grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[6rem_1fr_auto] gap-5 items-center">
              <EditorialCover index={guides.length - i} category="" className="aspect-square" />
              <div className="min-w-0">
                <p className="eyebrow !text-[0.62rem] text-muted">Avsnitt {guides.length - i} · {g.podcastDuration}</p>
                <p className="font-display text-xl sm:text-2xl mt-1 truncate">{g.title}</p>
                <Link to={`/guide/${g.slug}/`} className="text-xs link-u text-muted mt-1 inline-block">Läs som guide</Link>
              </div>
              <span className="text-xs text-muted hidden sm:block">Snart</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function Cart() {
  const { lines, set } = useCart();
  const items = Object.entries(lines).map(([id, qty]) => ({ p: getProduct(id), qty })).filter((x) => x.p) as { p: NonNullable<ReturnType<typeof getProduct>>; qty: number }[];
  const sum = items.reduce((a, { p, qty }) => a + p.price * qty, 0);
  const shipping = sum === 0 || sum >= SITE.freeShipping ? 0 : 59;
  return (
    <div>
      <Head path="/varukorg/" title="Varukorg | CigarrerOnline" description="Din varukorg." noindex />
      <PageHeader crumbs={c('Varukorg', '/varukorg/')} title="Varukorg" />
      <section className="container-x">
        {items.length === 0 ? (
          <div className="border-t border-line pt-10">
            <p className="text-muted">Varukorgen är tom.</p>
            <Link to="/cigarrer/" className="btn btn-ink mt-6">Se cigarrer</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-12">
            <ul className="lg:col-span-8 border-t border-line">
              {items.map(({ p, qty }) => (
                <li key={p.id} className="border-b border-line py-5 grid grid-cols-[6rem_1fr_auto] gap-5 items-center">
                  <Link to={`/produkt/${p.id}/`}><ProductArt product={p} className="aspect-[4/3]" /></Link>
                  <div className="min-w-0">
                    <Link to={`/produkt/${p.id}/`} className="block font-display text-xl leading-snug hover:text-brass-dark">{p.name}</Link>
                    <div className="mt-3 inline-flex items-center border border-line">
                      <button className="p-2 text-muted hover:text-ink" onClick={() => set(p.id, qty - 1)} aria-label="Minska"><Minus size={13} /></button>
                      <span className="w-7 text-center text-sm tabular-nums">{qty}</span>
                      <button className="p-2 text-muted hover:text-ink" onClick={() => set(p.id, qty + 1)} aria-label="Öka"><Plus size={13} /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums">{kr(p.price * qty)}</p>
                    <button className="mt-2 text-muted hover:text-ink" onClick={() => set(p.id, 0)} aria-label={`Ta bort ${p.name}`}><X size={15} /></button>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="lg:col-span-4 bg-paper-2 p-7 self-start">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Delsumma</dt><dd className="tabular-nums">{kr(sum)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Frakt</dt><dd className="tabular-nums">{shipping ? kr(shipping) : 'Fri'}</dd></div>
                <div className="flex justify-between border-t border-line pt-3 text-base"><dt>Totalt</dt><dd className="tabular-nums">{kr(sum + shipping)}</dd></div>
              </dl>
              {shipping > 0 && <p className="text-xs text-muted mt-3">Handla för {kr(SITE.freeShipping - sum)} till för fri frakt.</p>}
              <button className="btn w-full mt-6 bg-line text-muted cursor-not-allowed" disabled title="Kassan öppnar snart">Till kassan</button>
              <p className="text-xs text-muted mt-3 text-center">Kassan med BankID-ålderskontroll öppnar snart.</p>
              <Link to="/cigarrer/" className="block text-center text-sm link-u mt-5">Fortsätt handla</Link>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
