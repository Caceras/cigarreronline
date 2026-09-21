/**
 * The site's content lives in /content/*.json so it can be edited without touching code.
 * Everything here is validated at build time: bad content fails the build instead of
 * reaching the site. Keep this file and the CMS server's copy of the schema in sync.
 */
import { z } from 'zod';

export const STRENGTHS = ['Mild', 'Mild–medel', 'Medel', 'Medelstark', 'Stark'] as const;
export const STRENGTH_LEVEL: Record<(typeof STRENGTHS)[number], number> = {
  Mild: 1, 'Mild–medel': 2, Medel: 3, Medelstark: 4, Stark: 5,
};
export const KINDS = ['cigar', 'cutter', 'lighter', 'humidor', 'ashtray', 'box', 'case', 'humidifier'] as const;
export const VITOLAS = ['robusto', 'toro', 'churchill', 'petit', 'piramide', 'perfecto', 'cigarillo'] as const;
export const TYPES = ['cigarr', 'cigarill', 'paket', 'tillbehor'] as const;
export const SUBS = ['humidorer', 'cigarrsnoppare', 'tandare', 'askfat', 'fodral-och-fukt'] as const;

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug: lowercase letters, digits and hyphens');
const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'colour: #rrggbb');
const path = z.string().regex(/^\/([a-z0-9-]+\/)*$/, 'path: /like-this/ with a trailing slash');

export const productSchema = z.object({
  id: slug,
  name: z.string().min(2).max(90),
  brand: slug.optional(),
  price: z.number().int().positive().max(100000),
  type: z.enum(TYPES),
  sub: z.enum(SUBS).optional(),
  country: z.string().min(2).max(40).optional(),
  strength: z.enum(STRENGTHS).optional(),
  format: z.string().max(40).optional(),
  size: z.string().max(40).optional(),
  wrapperName: z.string().max(40).optional(),
  pack: z.string().max(40).optional(),
  description: z.string().min(20).max(600),
  image: z.enum(KINDS),
  vitola: z.enum(VITOLAS).optional(),
  wrapper: hex.optional(),
  band: hex.optional(),
  handrolled: z.boolean().optional(),
  signature: z.boolean().optional(),
  flavoured: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const brandSchema = z.object({
  id: slug,
  name: z.string().min(2).max(60),
  country: z.string().min(2).max(80),
  since: z.string().regex(/^\d{4}$/).optional(),
  intro: z.string().min(20).max(400),
  body: z.array(z.string().min(20).max(900)).min(1),
});

const sectionSchema = z.object({ h2: z.string().min(3).max(120), p: z.array(z.string().min(10)).min(1) });
const faqSchema = z.object({ q: z.string().min(5).max(160), a: z.string().min(10).max(600) });

export const guideSchema = z.object({
  slug,
  title: z.string().min(5).max(120),
  metaTitle: z.string().min(5).max(75),
  description: z.string().min(50).max(165),
  category: z.string().min(2).max(30),
  readTime: z.string().max(12),
  podcastDuration: z.string().max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  intro: z.string().min(20).max(500),
  sections: z.array(sectionSchema).min(1),
  faq: z.array(faqSchema).optional(),
  products: z.array(slug).optional(),
  links: z.array(z.object({ to: z.string(), label: z.string() })).optional(),
});

/** Which products a collection page lists, expressed as data so the page is editable too. */
export const filterSchema = z.object({
  type: z.enum(TYPES).optional(),
  sub: z.enum(SUBS).optional(),
  country: z.string().optional(),
  brand: slug.optional(),
  signature: z.boolean().optional(),
  flavoured: z.boolean().optional(),
  strengthMin: z.number().int().min(1).max(5).optional(),
  strengthMax: z.number().int().min(1).max(5).optional(),
  priceMin: z.number().int().positive().optional(),
  priceMax: z.number().int().positive().optional(),
});

export const collectionSchema = z.object({
  path,
  parent: path.optional(),
  name: z.string().min(2).max(40),
  h1: z.string().min(2).max(80),
  title: z.string().min(10).max(75),
  description: z.string().min(50).max(165),
  intro: z.string().min(20).max(400),
  filter: filterSchema,
  sections: z.array(sectionSchema).optional(),
  faq: z.array(faqSchema).optional(),
  related: z.array(z.string()).optional(),
});

export type Product = z.infer<typeof productSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Guide = z.infer<typeof guideSchema>;
export type Collection = z.infer<typeof collectionSchema>;
export type Filter = z.infer<typeof filterSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Faq = z.infer<typeof faqSchema>;

/** Validates the four files together, including the links between them. */
export function validateContent(raw: {
  products: unknown; brands: unknown; guides: unknown; collections: unknown;
}) {
  const products = z.array(productSchema).parse(raw.products);
  const brands = z.array(brandSchema).parse(raw.brands);
  const guides = z.array(guideSchema).parse(raw.guides);
  const collections = z.array(collectionSchema).parse(raw.collections);

  const errors: string[] = [];
  const dupes = (ids: string[], what: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${what}: duplicate id "${id}"`);
      seen.add(id);
    }
  };
  dupes(products.map((p) => p.id), 'products');
  dupes(brands.map((b) => b.id), 'brands');
  dupes(guides.map((g) => g.slug), 'guides');
  dupes(collections.map((c) => c.path), 'collections');

  const brandIds = new Set(brands.map((b) => b.id));
  const productIds = new Set(products.map((p) => p.id));
  const paths = new Set<string>([
    '/', '/marken/', '/guide/', '/frakt-och-leverans/', '/om-oss/', '/kontakt/', '/podcast/',
    ...collections.map((c) => c.path),
    ...brands.map((b) => `/marken/${b.id}/`),
    ...guides.map((g) => `/guide/${g.slug}/`),
    ...products.map((p) => `/produkt/${p.id}/`),
  ]);

  for (const p of products) {
    if (p.brand && !brandIds.has(p.brand)) errors.push(`product "${p.id}": unknown brand "${p.brand}"`);
    if (p.image === 'cigar' && !p.vitola) errors.push(`product "${p.id}": image "cigar" needs a vitola`);
    if (p.type === 'tillbehor' && !p.sub) errors.push(`product "${p.id}": accessories need a sub category`);
  }
  for (const g of guides) {
    for (const id of g.products ?? []) if (!productIds.has(id)) errors.push(`guide "${g.slug}": unknown product "${id}"`);
    for (const l of g.links ?? []) if (!paths.has(l.to)) errors.push(`guide "${g.slug}": link to unknown page "${l.to}"`);
  }
  for (const c of collections) {
    if (c.parent && !collections.some((x) => x.path === c.parent)) errors.push(`collection "${c.path}": unknown parent "${c.parent}"`);
    for (const r of c.related ?? []) if (!paths.has(r)) errors.push(`collection "${c.path}": related link to unknown page "${r}"`);
  }

  if (errors.length) throw new Error(`Content errors:\n- ${errors.join('\n- ')}`);
  return { products, brands, guides, collections };
}

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
