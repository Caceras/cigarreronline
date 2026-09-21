import { Link } from 'react-router-dom';
import type { Product } from '../data/products';
import { ProductArt } from './Art';

export const kr = (n: number) => `${n.toLocaleString('sv-SE')} kr`;

export function productMeta(p: Product) {
  return [p.country, p.format ?? p.pack].filter(Boolean).join(' · ');
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/produkt/${product.id}/`} className="group block">
      <div className="relative">
        <ProductArt product={product} className="aspect-[4/3] transition-colors duration-500 group-hover:bg-paper-3" />
        {product.signature && (
          <span className="absolute top-3 left-3 eyebrow !text-[0.6rem] bg-paper text-ink px-2.5 py-1">Signatur</span>
        )}
      </div>
      <div className="pt-4">
        <p className="eyebrow !text-[0.62rem] text-muted mb-1.5 truncate">{productMeta(product) || ' '}</p>
        <h3 className="font-display text-[1.25rem] sm:text-[1.3rem] leading-snug text-ink group-hover:text-brass-dark transition-colors text-balance line-clamp-2 min-h-[2.6em]">
          {product.name}
        </h3>
        <p className="mt-1.5 text-sm text-muted tabular-nums">{kr(product.price)}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ items, cols = 3 }: { items: Product[]; cols?: 3 | 4 }) {
  return (
    <div className={`grid grid-cols-2 ${cols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-14`}>
      {items.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
