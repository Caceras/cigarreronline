import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import type { Crumb } from '../lib/seo';
import type { Faq, Section } from '../data/collections';
import { STRENGTH_LEVEL, type Strength } from '../data/products';

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Brödsmulor" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} strokeWidth={1.5} className="text-line" />}
            {i < crumbs.length - 1 ? (
              <Link to={c.path} className="py-1.5 -my-1.5 hover:text-ink transition-colors">{c.name}</Link>
            ) : (
              <span className="text-ink" aria-current="page">{c.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  crumbs, eyebrow, title, intro, children,
}: { crumbs: Crumb[]; eyebrow?: string; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="container-x pt-8 sm:pt-10 pb-10 sm:pb-14">
      <Breadcrumbs crumbs={crumbs} />
      <div className="mt-10 sm:mt-14 max-w-3xl">
        {eyebrow && <p className="eyebrow text-brass-dark mb-4">{eyebrow}</p>}
        <h1 className="text-[2.6rem] sm:text-6xl leading-[1.05]">{title}</h1>
        {intro && <p className="mt-5 text-lg text-muted leading-relaxed max-w-2xl">{intro}</p>}
      </div>
      {children}
    </header>
  );
}

export function Sections({ sections }: { sections: Section[] }) {
  return (
    <div className="prose-co">
      {sections.map((s) => (
        <section key={s.h2}>
          <h2>{s.h2}</h2>
          {s.p.map((t, i) => <p key={i}>{t}</p>)}
        </section>
      ))}
    </div>
  );
}

export function FaqList({ faq, title = 'Vanliga frågor' }: { faq: Faq[]; title?: string }) {
  return (
    <section>
      <h2 className="text-3xl sm:text-4xl mb-6">{title}</h2>
      <div className="border-t border-line">
        {faq.map((f) => (
          <details key={f.q} className="group border-b border-line">
            <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[1.05rem] text-ink">{f.q}</span>
              <Plus size={18} strokeWidth={1.25} className="shrink-0 text-muted transition-transform group-open:rotate-45" />
            </summary>
            <p className="pb-6 -mt-1 text-muted leading-relaxed max-w-2xl">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Strength({ value }: { value: Strength }) {
  const n = STRENGTH_LEVEL[value];
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Styrka: ${value}`}>
      <span className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`w-3.5 h-[3px] ${i <= n ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </span>
      <span>{value}</span>
    </span>
  );
}

export function Chips({ items, active }: { items: { to: string; label: string }[]; active?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <Link
          key={i.to}
          to={i.to}
          className={`px-4 py-2 text-[0.8rem] border transition-colors ${
            active === i.to ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:border-ink'
          }`}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-10">
      <div>
        {eyebrow && <p className="eyebrow text-brass-dark mb-3">{eyebrow}</p>}
        <h2 className="text-4xl sm:text-5xl leading-tight">{title}</h2>
      </div>
      {action && <div className="hidden sm:block shrink-0">{action}</div>}
    </div>
  );
}
