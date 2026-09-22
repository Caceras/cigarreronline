/**
 * Exposes the JSON content to the site. Validation (content/schema.ts, zod) runs at build time
 * in scripts/prerender.mjs, so the browser gets the data without the validator.
 */
import productsJson from '../../content/products.json';
import brandsJson from '../../content/brands.json';
import guidesJson from '../../content/guides.json';
import collectionsJson from '../../content/collections.json';
import { matches } from '../../content/model';
import type { Product, Brand, Guide, Collection } from '../../content/schema';

export const products = productsJson as unknown as Product[];
export const brands = brandsJson as unknown as Brand[];
export const guides = guidesJson as unknown as Guide[];
export const collections = collectionsJson as unknown as Collection[];
export * from '../../content/model';
export type * from '../../content/schema';

export const getProduct = (id?: string) => products.find((p) => p.id === id);
export const getBrand = (id?: string) => brands.find((b) => b.id === id);
export const getGuide = (slug?: string) => guides.find((g) => g.slug === slug);
export const getCollection = (path?: string) => collections.find((c) => c.path === path);
export const collectionProducts = (c: Collection): Product[] => products.filter((p) => matches(p, c.filter));

export const accessorySubs = [
  { id: 'humidorer', name: 'Humidorer' },
  { id: 'cigarrsnoppare', name: 'Cigarrsnoppare' },
  { id: 'tandare', name: 'Tändare' },
  { id: 'askfat', name: 'Askfat' },
  { id: 'fodral-och-fukt', name: 'Fodral & fukt' },
] as const;
