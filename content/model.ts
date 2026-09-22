/**
 * Content constants and pure helpers, with no validation library attached. The browser bundle
 * imports this file; the zod schemas in schema.ts only run at build time and in the CMS.
 */
import type { Product, Filter } from './schema';

export const STRENGTHS = ['Mild', 'Mild–medel', 'Medel', 'Medelstark', 'Stark'] as const;
export const STRENGTH_LEVEL: Record<(typeof STRENGTHS)[number], number> = {
  Mild: 1, 'Mild–medel': 2, Medel: 3, Medelstark: 4, Stark: 5,
};
export const KINDS = ['cigar', 'cutter', 'lighter', 'humidor', 'ashtray', 'box', 'case', 'humidifier'] as const;
export const VITOLAS = ['robusto', 'toro', 'churchill', 'petit', 'piramide', 'perfecto', 'cigarillo'] as const;
export const TYPES = ['cigarr', 'cigarill', 'paket', 'tillbehor'] as const;
export const SUBS = ['humidorer', 'cigarrsnoppare', 'tandare', 'askfat', 'fodral-och-fukt'] as const;

/** Turns a collection's filter spec into a predicate. */
export function matches(p: Product, f: Filter): boolean {
  const lvl = p.strength ? STRENGTH_LEVEL[p.strength] : 0;
  return (
    (f.type === undefined || p.type === f.type) &&
    (f.sub === undefined || p.sub === f.sub) &&
    (f.country === undefined || p.country === f.country) &&
    (f.brand === undefined || p.brand === f.brand) &&
    (f.signature === undefined || !!p.signature === f.signature) &&
    (f.flavoured === undefined || !!p.flavoured === f.flavoured) &&
    (f.strengthMin === undefined || lvl >= f.strengthMin) &&
    (f.strengthMax === undefined || (lvl > 0 && lvl <= f.strengthMax)) &&
    (f.priceMin === undefined || p.price >= f.priceMin) &&
    (f.priceMax === undefined || p.price <= f.priceMax)
  );
}
