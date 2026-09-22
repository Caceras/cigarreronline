import { useId } from 'react';
import type { Product } from '../data/products';

/* ---------- colour helpers ---------- */
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* ---------- cigar ---------- */
type Vitola = NonNullable<Product['vitola']>;
const VITOLA: Record<Vitola, { len: number; ring: number }> = {
  robusto: { len: 290, ring: 46 },
  toro: { len: 330, ring: 46 },
  churchill: { len: 380, ring: 42 },
  petit: { len: 240, ring: 34 },
  piramide: { len: 336, ring: 50 },
  perfecto: { len: 300, ring: 48 },
  cigarillo: { len: 290, ring: 18 },
};

export function Cigar({
  vitola = 'robusto',
  wrapper = '#6b4428',
  band = '#b08a4a',
  tilt = -9,
}: { vitola?: Vitola; wrapper?: string; band?: string; tilt?: number }) {
  const id = useId().replace(/:/g, '');
  const { len, ring } = VITOLA[vitola];
  const r = ring / 2;
  const cx = 240, cy = 80;
  const x0 = cx - len / 2, x1 = cx + len / 2;
  const footTaper = vitola === 'perfecto' ? r * 0.35 : 0;

  let body: string;
  if (vitola === 'piramide') {
    body = `M${x0},${cy - r} L${x1 - 70},${cy - r} C${x1 - 30},${cy - r} ${x1 - 6},${cy - 7} ${x1},${cy} C${x1 - 6},${cy + 7} ${x1 - 30},${cy + r} ${x1 - 70},${cy + r} L${x0},${cy + r} Z`;
  } else if (vitola === 'perfecto') {
    body = `M${x0},${cy - r + footTaper} C${x0 + 30},${cy - r - 2} ${x0 + 60},${cy - r} ${x0 + 90},${cy - r} L${x1 - 60},${cy - r} C${x1 - 20},${cy - r} ${x1},${cy - 12} ${x1},${cy} C${x1},${cy + 12} ${x1 - 20},${cy + r} ${x1 - 60},${cy + r} L${x0 + 90},${cy + r} C${x0 + 60},${cy + r} ${x0 + 30},${cy + r + 2} ${x0},${cy + r - footTaper} Z`;
  } else {
    const cap = Math.min(r * 1.1, 26);
    body = `M${x0},${cy - r} L${x1 - cap},${cy - r} C${x1 - cap * 0.3},${cy - r} ${x1},${cy - r * 0.55} ${x1},${cy} C${x1},${cy + r * 0.55} ${x1 - cap * 0.3},${cy + r} ${x1 - cap},${cy + r} L${x0},${cy + r} Z`;
  }
  const footR = r - footTaper;
  const bandX = vitola === 'piramide' ? x1 - 118 : x1 - Math.max(len * 0.24, 62);
  const bandW = vitola === 'cigarillo' ? 18 : 34;
  const showBand = band !== wrapper;

  return (
    <svg viewBox="0 0 480 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(wrapper, 0.28)} />
          <stop offset=".28" stopColor={shade(wrapper, 0.08)} />
          <stop offset=".62" stopColor={wrapper} />
          <stop offset="1" stopColor={shade(wrapper, -0.45)} />
        </linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(band, 0.35)} />
          <stop offset=".5" stopColor={band} />
          <stop offset="1" stopColor={shade(band, -0.4)} />
        </linearGradient>
        <radialGradient id={`f${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#5a3b22" />
          <stop offset=".7" stopColor="#3b2414" />
          <stop offset="1" stopColor="#24150b" />
        </radialGradient>
        <filter id={`s${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <clipPath id={`c${id}`}><path d={body} /></clipPath>
      </defs>
      <ellipse cx={cx + 8} cy={cy + r + 26} rx={len * 0.46} ry={ring > 30 ? 7 : 4} fill="#1a120d" opacity=".22" filter={`url(#s${id})`} />
      <g transform={`rotate(${tilt} ${cx} ${cy})`}>
        <path d={body} fill={`url(#w${id})`} />
        <g clipPath={`url(#c${id})`} fill="none" stroke={shade(wrapper, -0.35)} strokeWidth="1" opacity=".45">
          <path d={`M${x0 + 20},${cy - r * 0.35} C${x0 + len * 0.3},${cy - r * 0.55} ${x0 + len * 0.55},${cy - r * 0.1} ${x1 - 40},${cy - r * 0.4}`} />
          <path d={`M${x0 + 60},${cy + r * 0.3} C${x0 + len * 0.35},${cy + r * 0.1} ${x0 + len * 0.6},${cy + r * 0.55} ${x1 - 60},${cy + r * 0.2}`} />
          {ring > 30 && <path d={`M${x0 + 110},${cy - r * 0.8} C${x0 + len * 0.45},${cy - r * 0.7} ${x0 + len * 0.62},${cy - r * 0.95} ${x1 - 90},${cy - r * 0.75}`} />}
          {/* spiral seam of the wrapper leaf */}
          <path d={`M${x0 + len * 0.18},${cy - r} l${-r * 0.6},${ring}`} opacity=".5" />
          <path d={`M${x0 + len * 0.52},${cy - r} l${-r * 0.6},${ring}`} opacity=".5" />
        </g>
        <path d={`M${x0 + 6},${cy - r * 0.62} L${x1 - 30},${cy - r * 0.62}`} stroke="#fff" strokeOpacity=".16" strokeWidth={Math.max(ring * 0.08, 1.2)} strokeLinecap="round" clipPath={`url(#c${id})`} />
        {showBand && (
          <g clipPath={`url(#c${id})`}>
            <rect x={bandX} y={cy - r - 2} width={bandW} height={ring + 4} fill={`url(#b${id})`} />
            <rect x={bandX + 3} y={cy - r - 2} width="1" height={ring + 4} fill="#fff" opacity=".35" />
            <rect x={bandX + bandW - 4} y={cy - r - 2} width="1" height={ring + 4} fill="#000" opacity=".25" />
            {ring > 30 && (
              <ellipse cx={bandX + bandW / 2} cy={cy - r * 0.1} rx={bandW * 0.26} ry={r * 0.36} fill="none" stroke={shade(band, -0.5)} strokeWidth="1.2" opacity=".75" />
            )}
          </g>
        )}
        <ellipse cx={x0} cy={cy} rx={Math.max(footR * 0.2, 3)} ry={footR} fill={`url(#f${id})`} />
        <ellipse cx={x0} cy={cy} rx={Math.max(footR * 0.2, 3) * 0.6} ry={footR * 0.6} fill="none" stroke="#6b4a2c" strokeWidth=".8" opacity=".6" />
      </g>
    </svg>
  );
}

/* ---------- accessories (line + tone illustrations) ---------- */
const INK = '#1a120d';
const BRASS = '#b08a4a';

function Cutter({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 480 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={`m${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b534c" />
          <stop offset=".45" stopColor="#2b2420" />
          <stop offset="1" stopColor="#140e0a" />
        </linearGradient>
        <linearGradient id={`st${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2efe9" />
          <stop offset=".5" stopColor="#b9b3aa" />
          <stop offset="1" stopColor="#8b857c" />
        </linearGradient>
      </defs>
      <ellipse cx="244" cy="136" rx="120" ry="7" fill={INK} opacity=".16" />
      <g transform="rotate(-6 240 80)">
        <path d="M128,58 h78 l6,-8 h56 l6,8 h78 a28,28 0 0 1 0,56 h-78 l-6,8 h-56 l-6,-8 h-78 a28,28 0 0 1 0,-56 z" fill={`url(#m${id})`} />
        <path d="M206,58 l6,-8 h56 l6,8 v56 l-6,8 h-56 l-6,-8 z" fill={`url(#st${id})`} />
        <circle cx="240" cy="86" r="21" fill="#e9e0cf" />
        <circle cx="240" cy="86" r="21" fill="none" stroke={INK} strokeOpacity=".35" />
        <path d="M219,86 h42" stroke={INK} strokeOpacity=".25" />
        <path d="M140,70 h52 M288,70 h52" stroke="#fff" strokeOpacity=".18" strokeWidth="2" strokeLinecap="round" />
        <circle cx="150" cy="86" r="3" fill={BRASS} />
        <circle cx="330" cy="86" r="3" fill={BRASS} />
      </g>
    </svg>
  );
}

function Lighter({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 480 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6a33" />
          <stop offset=".3" stopColor="#e3c88f" />
          <stop offset=".55" stopColor="#b08a4a" />
          <stop offset="1" stopColor="#6d5225" />
        </linearGradient>
        <linearGradient id={`fl${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#3b6fd1" />
          <stop offset=".35" stopColor="#f2b35e" />
          <stop offset="1" stopColor="#f6e2b4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="240" cy="146" rx="52" ry="5" fill={INK} opacity=".18" />
      <path d="M240,18 c-7,10 -9,18 -4,24 c-1,-6 2,-10 4,-12 c2,2 5,6 4,12 c5,-6 3,-14 -4,-24 z" fill={`url(#fl${id})`} />
      <rect x="226" y="40" width="28" height="10" rx="2" fill="#3a3430" />
      <rect x="206" y="48" width="68" height="94" rx="8" fill={`url(#g${id})`} />
      <rect x="206" y="48" width="68" height="18" rx="6" fill={INK} opacity=".12" />
      <path d="M214,74 v58 M266,74 v58" stroke="#fff" strokeOpacity=".22" />
      {[82, 94, 106, 118].map((y) => (
        <path key={y} d={`M218,${y} h44`} stroke={INK} strokeOpacity=".14" />
      ))}
    </svg>
  );
}

function Humidor({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 480 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={`wd${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5530" />
          <stop offset="1" stopColor="#4a2a17" />
        </linearGradient>
        <linearGradient id={`lid${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8693d" />
          <stop offset="1" stopColor="#6b3d20" />
        </linearGradient>
      </defs>
      <ellipse cx="240" cy="144" rx="130" ry="7" fill={INK} opacity=".18" />
      <path d="M118,56 l18,-22 h208 l18,22 z" fill={`url(#lid${id})`} />
      <rect x="118" y="56" width="244" height="84" rx="3" fill={`url(#wd${id})`} />
      <path d="M118,74 h244" stroke={INK} strokeOpacity=".35" />
      <path d="M130,62 h220" stroke="#fff" strokeOpacity=".12" />
      {[92, 108, 124].map((y) => (
        <path key={y} d={`M126,${y} C200,${y - 4} 280,${y + 4} 354,${y - 2}`} stroke={INK} strokeOpacity=".12" fill="none" />
      ))}
      <rect x="220" y="92" width="40" height="22" rx="2" fill={BRASS} />
      <rect x="224" y="96" width="32" height="14" rx="1" fill="none" stroke={INK} strokeOpacity=".3" />
      <circle cx="326" cy="103" r="12" fill="#efe4cf" stroke={BRASS} strokeWidth="3" />
      <path d="M326,103 l6,-6" stroke={INK} strokeWidth="1.5" />
      <rect x="232" y="70" width="16" height="8" rx="1" fill={BRASS} />
    </svg>
  );
}

function Ashtray({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 480 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id={`gl${id}`} cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".6" stopColor="#d9d4cb" stopOpacity=".9" />
          <stop offset="1" stopColor="#9d968b" />
        </radialGradient>
      </defs>
      <ellipse cx="240" cy="128" rx="140" ry="12" fill={INK} opacity=".16" />
      <path d="M110,90 a130,34 0 0 0 260,0 v14 a130,34 0 0 1 -260,0 z" fill="#a39c91" />
      <ellipse cx="240" cy="90" rx="130" ry="34" fill={`url(#gl${id})`} />
      <ellipse cx="240" cy="92" rx="92" ry="21" fill="#4b433c" opacity=".85" />
      <ellipse cx="240" cy="96" rx="78" ry="14" fill="#2b2420" opacity=".6" />
      <path d="M148,82 q-10,6 -18,8 M332,82 q10,6 18,8" stroke="#fff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(78 30) scale(.62) rotate(-4 240 80)">
        <rect x="120" y="68" width="250" height="24" rx="12" fill="#6b4428" />
        <rect x="120" y="68" width="250" height="8" rx="4" fill="#fff" opacity=".12" />
        <rect x="300" y="66" width="22" height="28" fill={BRASS} />
        <ellipse cx="120" cy="80" rx="5" ry="12" fill="#8f8a84" />
      </g>
    </svg>
  );
}

function SamplerBox({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 480 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={`cd${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c89a68" />
          <stop offset="1" stopColor="#8d6238" />
        </linearGradient>
      </defs>
      <ellipse cx="240" cy="146" rx="150" ry="7" fill={INK} opacity=".18" />
      <path d="M96,64 h288 l-12,78 h-264 z" fill={`url(#cd${id})`} />
      <path d="M96,64 h288" stroke="#fff" strokeOpacity=".3" />
      <rect x="196" y="92" width="88" height="30" fill="#efe4cf" />
      <rect x="200" y="96" width="80" height="22" fill="none" stroke={BRASS} />
      <text x="240" y="112" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic" fontSize="14" fill={INK}>Cigarrer</text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${-i * 14})`}>
          <rect x={126 + i * 6} y={46} width="228" height="16" rx="8" fill={['#5a3620', '#7a4e2c', '#3e2515'][i]} />
          <rect x={126 + i * 6} y={46} width="228" height="5" rx="3" fill="#fff" opacity=".12" />
          <rect x={300 + i * 6} y={45} width="18" height="18" fill={[BRASS, '#9a2f2a', '#e8dcc2'][i]} />
        </g>
      ))}
    </svg>
  );
}

function CigarCase({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 480 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={`lc${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a34" />
          <stop offset="1" stopColor="#4e301c" />
        </linearGradient>
      </defs>
      <ellipse cx="240" cy="140" rx="140" ry="6" fill={INK} opacity=".14" />
      <g transform="rotate(-6 240 80)">
        <rect x="100" y="54" width="180" height="56" rx="26" fill={`url(#lc${id})`} />
        <rect x="262" y="58" width="130" height="48" rx="22" fill={`url(#lc${id})`} opacity=".85" />
        <path d="M112,64 h160" stroke="#fff" strokeOpacity=".18" strokeWidth="2" strokeLinecap="round" />
        <path d="M272,56 v52" stroke={INK} strokeOpacity=".35" />
        <path d="M114,82 h156" stroke="#d9c7a8" strokeOpacity=".5" strokeDasharray="4 5" />
      </g>
    </svg>
  );
}

function Humidifier({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 480 160" className="w-full h-full" aria-hidden="true">
      <ellipse cx="240" cy="140" rx="110" ry="6" fill={INK} opacity=".14" />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${i * 70 - 35} ${i * 6}) rotate(${i ? 6 : -4} 240 88)`}>
          <rect x="180" y="34" width="120" height="100" rx="10" fill={i ? '#efe7d8' : '#f7f2e8'} stroke="#d9cfbd" />
          <rect x="196" y="56" width="88" height="44" rx="3" fill="#fff" stroke="#e3d9c7" />
          <text x="240" y="84" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="600" fill={INK}>69%</text>
          <path d={`M196,114 h88`} stroke={BRASS} strokeWidth="2" />
          
        </g>
      ))}
    </svg>
  );
}

/** The illustration itself, as inline SVG. Used at build time to write /img/produkt/<id>.svg. */
export function ProductSvg({ product }: { product: Product }) {
  const id = useId().replace(/:/g, '');
  switch (product.image) {
    case 'cigar': return <Cigar vitola={product.vitola} wrapper={product.wrapper} band={product.band} />;
    case 'cutter': return <Cutter id={id} />;
    case 'lighter': return <Lighter id={id} />;
    case 'humidor': return <Humidor id={id} />;
    case 'ashtray': return <Ashtray id={id} />;
    case 'case': return <CigarCase id={id} />;
    case 'humidifier': return <Humidifier id={id} />;
    default: return <SamplerBox id={id} />;
  }
}

export const productImage = (p: Product) => `/img/produkt/${p.id}.svg`;
export const productAlt = (p: Product) =>
  p.type === 'cigarr' ? `${p.name}, ${p.format?.toLowerCase() ?? 'cigarr'}${p.country ? ' från ' + p.country : ''}` : p.name;

/**
 * Product picture as a real image file, so it can be indexed by image search and referenced
 * from structured data. `priority` is for the main image on a product page (the LCP element).
 */
export function ProductArt({ product, className = '', priority = false }: { product: Product; className?: string; priority?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-paper-2 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,.55),transparent_65%)]" />
      <img
        src={productImage(product)}
        alt={productAlt(product)}
        width={1200}
        height={900}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...(priority ? { fetchpriority: 'high' } : {})}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}

/* ---------- brand ---------- */
export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-[2.4rem]' : size === 'sm' ? 'text-[1.45rem]' : 'text-[1.7rem]';
  return (
    <span className={`font-display ${cls} leading-none tracking-[-0.015em] text-ink whitespace-nowrap`}>
      Cigarrer<span className="italic text-brass-dark">Online</span>
    </span>
  );
}

/* A little variety across covers, so a list of guides does not look like one repeated picture. */
const COVER_ART = [
  { vitola: 'churchill' as const, wrapper: '#7a4b2a', band: '#a47e45' },
  { vitola: 'robusto' as const, wrapper: '#5a3620', band: '#c9a24a' },
  { vitola: 'piramide' as const, wrapper: '#8a5a34', band: '#9a2f2a' },
  { vitola: 'toro' as const, wrapper: '#4a2c19', band: '#e8dcc2' },
  { vitola: 'petit' as const, wrapper: '#a0703f', band: '#7a5c2e' },
];

/* Typographic cover for guides / podcast episodes */
export function EditorialCover({
  index,
  category,
  className = '',
}: { index: number; category: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-paper-2 ${className}`}>
      <div className="absolute -right-[8%] top-1/2 -translate-y-1/2 w-[64%] opacity-45">
        <Cigar
          vitola={COVER_ART[index % COVER_ART.length].vitola}
          wrapper={COVER_ART[index % COVER_ART.length].wrapper}
          band={COVER_ART[index % COVER_ART.length].band}
          tilt={-14 + (index % 3) * 5}
        />
      </div>
      <div className="absolute inset-0 flex flex-col justify-between p-6">
        <span className="eyebrow text-muted">{category}</span>
        <div className="flex items-end justify-between">
          <span className="font-display italic text-[5.5rem] leading-[.8] text-brass-light">
            {String(index).padStart(2, '0')}
          </span>
          <span className="block w-12 h-px bg-brass-light mb-3" />
        </div>
      </div>
    </div>
  );
}
