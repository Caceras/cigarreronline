import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Check } from 'lucide-react';
import { Wordmark } from './Art';
import { useCart } from '../lib/cart';
import { getProduct, products } from '../data/products';
import { brands } from '../data/brands';
import { SITE } from '../lib/seo';

const allNav = [
  { to: '/cigarrer/', label: 'Cigarrer' },
  { to: '/cigarrer/kubanska/', label: 'Kubanska' },
  { to: '/cigarrer/cigariller/', label: 'Cigariller' },
  { to: '/cigarrpaket/', label: 'Paket' },
  { to: '/tillbehor/', label: 'Tillbehör' },
  { to: '/marken/', label: 'Märken' },
  { to: '/guide/', label: 'Guider' },
  { to: '/forum/', label: 'Forum', external: true },
];
const nav = allNav.filter((l) => SITE.forumEnabled || !l.to.startsWith('/forum'));

const footerCols: { title: string; links: [string, string][] }[] = [
  { title: 'Cigarrer', links: [
    ['/cigarrer/', 'Alla cigarrer'], ['/cigarrer/kubanska/', 'Kubanska cigarrer'], ['/cigarrer/dominikanska/', 'Dominikanska cigarrer'],
    ['/cigarrer/nicaraguanska/', 'Nicaraguanska cigarrer'], ['/cigarrer/honduranska/', 'Honduranska cigarrer'], ['/cigarrer/cigariller/', 'Cigariller'],
  ] },
  { title: 'Hitta rätt', links: [
    ['/cigarrer/milda/', 'Milda cigarrer'], ['/cigarrer/starka/', 'Starka cigarrer'], ['/cigarrer/prisvarda/', 'Prisvärda cigarrer'],
    ['/cigarrer/exklusiva/', 'Exklusiva cigarrer'], ['/cigarrer/handrullade/', 'Handrullade cigarrer'], ['/cigarrpaket/', 'Cigarrpaket & lådor'],
  ] },
  { title: 'Märken', links: [
    ['/marken/cohiba/', 'Cohiba'], ['/marken/montecristo/', 'Montecristo'], ['/marken/partagas/', 'Partagás'],
    ['/marken/davidoff/', 'Davidoff'], ['/marken/arturo-fuente/', 'Arturo Fuente'], ['/marken/', 'Alla märken'],
  ] },
  { title: 'Guider', links: [
    ['/guide/forvara-cigarrer/', 'Förvara cigarrer'], ['/guide/cigarrer-for-nyborjare/', 'Cigarrer för nybörjare'],
    ['/guide/ar-kubanska-cigarrer-olagliga/', 'Är kubanska cigarrer olagliga?'], ['/guide/kopa-cigarrer-fran-utlandet/', 'Köpa cigarrer från utlandet'],
    ['/guide/cigarrformat-och-typer/', 'Cigarrformat och typer'], ['/guide/', 'Alla guider'],
  ] },
  { title: 'Kundservice', links: [
    ['/frakt-och-leverans/', 'Frakt & leverans'], ['/forum/', 'Forum'], ['/podcast/', 'Podcast'], ['/om-oss/', 'Om oss'], ['/kontakt/', 'Kontakt'],
  ] },
].map((c) => ({ ...c, links: c.links.filter(([to]) => SITE.forumEnabled || !to.startsWith('/forum')) as [string, string][] }));

function AgeGate() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem('co-age') !== 'ok') setOpen(true); } catch { setOpen(true); }
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-ink/25 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="age-title">
      <div className="bg-paper w-full max-w-md p-8 sm:p-10 text-center shadow-[0_30px_80px_-20px_rgba(28,25,23,.35)] animate-rise">
        <Wordmark size="md" />
        <div className="w-10 h-px bg-line mx-auto my-7" />
        <h2 id="age-title" className="text-3xl">Är du 18 år eller äldre?</h2>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Tobak säljs enligt svensk lag bara till personer som fyllt 18 år. Vi kontrollerar ålder även vid köp och leverans.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button className="btn btn-ghost" onClick={() => (window.location.href = 'https://www.google.se')}>Nej</button>
          <button
            className="btn btn-ink"
            onClick={() => { try { localStorage.setItem('co-age', 'ok'); } catch {} setOpen(false); }}
          >
            Ja, jag är 18+
          </button>
        </div>
      </div>
    </div>
  );
}

function CartToast() {
  const { lastAdded } = useCart();
  const p = lastAdded ? getProduct(lastAdded) : null;
  if (!p) return null;
  return (
    <div className="fixed z-[90] bottom-4 right-4 left-4 sm:left-auto sm:w-80 bg-paper border border-line p-4 flex items-center gap-3 shadow-[0_20px_50px_-20px_rgba(28,25,23,.3)] animate-rise" role="status">
      <span className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center shrink-0"><Check size={15} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">Tillagd i varukorgen</p>
        <p className="text-sm truncate">{p.name}</p>
      </div>
      <Link to="/varukorg/" className="text-xs link-u shrink-0">Visa</Link>
    </div>
  );
}

function SearchBox({ onDone }: { onDone: () => void }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const term = q.trim().toLowerCase();
  const hits = term.length > 1
    ? products
        .filter((p) => (p.name + ' ' + (p.country ?? '') + ' ' + (p.format ?? '')).toLowerCase().includes(term))
        .slice(0, 6)
    : [];
  const brandHits = term.length > 1 ? brands.filter((b) => b.name.toLowerCase().includes(term)).slice(0, 3) : [];
  return (
    <div className="pb-6 animate-rise">
      <div className="relative">
        <Search size={17} strokeWidth={1.5} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) { navigate(`/produkt/${hits[0].id}/`); onDone(); } }}
          placeholder="Sök cigarr eller märke, t.ex. Cohiba"
          className="field !pl-7 !text-lg"
          autoFocus
          aria-label="Sök"
        />
      </div>
      {brandHits.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {brandHits.map((b) => (
            <Link key={b.id} to={`/marken/${b.id}/`} onClick={onDone} className="px-3 py-1.5 text-xs border border-line hover:border-ink">
              {b.name}
            </Link>
          ))}
        </div>
      )}
      {term.length > 1 && hits.length === 0 && brandHits.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          Inga träffar på "{q.trim()}". Prova ett märke som Cohiba, eller bläddra bland{' '}
          <Link to="/cigarrer/" onClick={onDone} className="link-u text-ink">alla cigarrer</Link>.
        </p>
      )}
      {hits.length > 0 && (
        <ul className="mt-3 divide-y divide-line">
          {hits.map((p) => (
            <li key={p.id}>
              <Link to={`/produkt/${p.id}/`} onClick={onDone} className="flex justify-between py-2.5 text-sm hover:text-brass-dark">
                <span>{p.name}</span><span className="text-muted tabular-nums">{p.price} kr</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count } = useCart();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-[0.8125rem] transition-colors ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[110] focus:top-3 focus:left-3 focus:bg-ink focus:text-paper focus:px-4 focus:py-2 focus:text-sm"
      >
        Hoppa till innehållet
      </a>
      <div className="border-b border-line text-muted">
        <div className="container-x h-9 flex items-center justify-center text-[0.72rem] tracking-wide gap-6">
          <span>Fri frakt över {SITE.freeShipping} kr</span>
          <span className="hidden sm:inline text-line">|</span>
          <span className="hidden sm:inline">Leverans 1–3 vardagar i hela Sverige</span>
          <span className="hidden md:inline text-line">|</span>
          <span className="hidden md:inline">18-årsgräns</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-line">
        <div className="container-x">
          <div className="flex items-center justify-between h-[4.25rem] gap-6">
            <Link to="/" aria-label="CigarrerOnline, startsida" className="shrink-0">
              <Wordmark size="sm" />
            </Link>
            <nav className="hidden lg:flex items-center gap-7" aria-label="Huvudmeny">
              {nav.map((l) =>
                l.external ? (
                  <a key={l.to} href={l.to} className="text-[0.8125rem] text-muted hover:text-ink transition-colors">{l.label}</a>
                ) : (
                  <NavLink key={l.to} to={l.to} end={l.to === '/cigarrer/'} className={navClass}>{l.label}</NavLink>
                ),
              )}
            </nav>
            <div className="flex items-center -mr-2.5">
              <button onClick={() => setSearchOpen((v) => !v)} className="p-2.5 text-ink/75 hover:text-ink" aria-label="Sök">
                <Search size={19} strokeWidth={1.4} />
              </button>
              <Link to="/varukorg/" className="relative p-2.5 text-ink/75 hover:text-ink" aria-label={`Varukorg, ${count} varor`}>
                <ShoppingBag size={19} strokeWidth={1.4} />
                {count > 0 && (
                  <span className="absolute top-1 right-0.5 min-w-4 h-4 px-1 bg-ink text-paper text-[0.6rem] rounded-full flex items-center justify-center tabular-nums">
                    {count}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="lg:hidden p-2.5 text-ink/75 hover:text-ink"
                aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={21} strokeWidth={1.4} /> : <Menu size={21} strokeWidth={1.4} />}
              </button>
            </div>
          </div>
          {searchOpen && <SearchBox onDone={() => setSearchOpen(false)} />}
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-line bg-paper animate-rise max-h-[80vh] overflow-y-auto">
            <nav className="container-x py-6" aria-label="Mobilmeny">
              {nav.map((l) =>
                l.external ? (
                  <a key={l.to} href={l.to} className="block py-2.5 font-display text-[1.75rem] text-ink">{l.label}</a>
                ) : (
                  <Link key={l.to} to={l.to} className="block py-2.5 font-display text-[1.75rem] text-ink">{l.label}</Link>
                ),
              )}
              <div className="mt-6 pt-6 border-t border-line grid grid-cols-2 gap-y-2 text-sm text-muted">
                {footerCols[1].links.slice(0, 4).concat([['/frakt-och-leverans/', 'Frakt'], ['/kontakt/', 'Kontakt']]).map(([to, label]) => (
                  <Link key={to} to={to}>{label}</Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="bg-paper-2 border-t border-line mt-24">
        <div className="container-x pt-16 pb-10">
          <div className="grid lg:grid-cols-[1.3fr_4fr] gap-12">
            <div>
              <Wordmark size="md" />
              <p className="mt-5 text-sm text-muted leading-relaxed max-w-xs">
                Cigarrer online från en svensk tobakshandel. Handrullade premiumcigarrer, cigariller och tillbehör, skickade i hela Sverige.
              </p>
              <a href={`mailto:${SITE.email}`} className="mt-5 inline-block text-sm link-u">{SITE.email}</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {footerCols.map((c) => (
                <div key={c.title}>
                  <p className="eyebrow text-ink mb-4">{c.title}</p>
                  <ul className="space-y-2.5 text-[0.82rem] text-muted">
                    {c.links.map(([to, label]) => (
                      <li key={to}>
                        {to.startsWith('/forum')
                          ? <a href={to} className="hover:text-ink transition-colors">{label}</a>
                          : <Link to={to} className="hover:text-ink transition-colors">{label}</Link>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 pt-6 border-t border-line flex flex-col md:flex-row gap-3 md:items-center justify-between text-xs text-muted">
            <p>© {new Date().getFullYear()} {SITE.name}</p>
            <p className="text-ink">18-årsgräns. Rökning skadar din hälsa.</p>
            <div className="flex gap-5">
              <Link to="/frakt-och-leverans/" className="hover:text-ink">Köpvillkor</Link>
              <Link to="/om-oss/" className="hover:text-ink">Integritet</Link>
            </div>
          </div>
        </div>
      </footer>
      <AgeGate />
      <CartToast />
    </div>
  );
}
