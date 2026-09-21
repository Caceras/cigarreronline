import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CollectionPage from './pages/CollectionPage';
import ProductDetail from './pages/ProductDetail';
import { BrandIndex, BrandPage } from './pages/Brands';
import { GuideIndex, GuidePage } from './pages/Guides';
import { About, Cart, Contact, Podcast, Shipping } from './pages/Info';
import NotFound from './pages/NotFound';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { CartProvider } from './lib/cart';
import { collections } from './data/collections';
import { products } from './data/products';
import { brands } from './data/brands';
import { guides } from './data/guides';

/** Every indexable URL. The prerender step writes one HTML file per entry and builds sitemap.xml from it. */
export function allPaths(): string[] {
  return [
    '/',
    ...collections.map((c) => c.path),
    '/marken/',
    ...brands.filter((b) => products.some((p) => p.brand === b.id)).map((b) => `/marken/${b.id}/`),
    ...products.map((p) => `/produkt/${p.id}/`),
    '/guide/',
    ...guides.map((g) => `/guide/${g.slug}/`),
    '/frakt-och-leverans/', '/om-oss/', '/kontakt/', '/podcast/',
  ];
}

export default function App() {
  return (
    <CartProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          {collections.map((c) => (
            <Route key={c.path} path={c.path} element={<CollectionPage key={c.path} path={c.path} />} />
          ))}
          <Route path="/marken/" element={<BrandIndex />} />
          <Route path="/marken/:id/" element={<BrandPage />} />
          <Route path="/produkt/:id/" element={<ProductDetail />} />
          <Route path="/guide/" element={<GuideIndex />} />
          <Route path="/guide/:slug/" element={<GuidePage />} />
          <Route path="/frakt-och-leverans/" element={<Shipping />} />
          <Route path="/om-oss/" element={<About />} />
          <Route path="/kontakt/" element={<Contact />} />
          <Route path="/podcast/" element={<Podcast />} />
          <Route path="/varukorg/" element={<Cart />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <PWAInstallPrompt />
    </CartProvider>
  );
}
