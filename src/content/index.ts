/** Loads and validates the JSON content, and exposes it to the site. */
import productsJson from '../../content/products.json';
import brandsJson from '../../content/brands.json';
import guidesJson from '../../content/guides.json';
import collectionsJson from '../../content/collections.json';
import { validateContent, matches, type Product, type Collection } from '../../content/schema';

const content = validateContent({
  products: productsJson, brands: brandsJson, guides: guidesJson, collections: collectionsJson,
});

export const { products, brands, guides, collections } = content;
export * from '../../content/schema';

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
