import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Old hash URLs (/#/kategori/cigarrer) from the previous version of the site → the new real URLs.
const legacyHash: Record<string, string> = {
  '/kategori/cigarrer': '/cigarrer/', '/kategori/handrullade': '/cigarrer/handrullade/',
  '/kategori/cigariller': '/cigarrer/cigariller/', '/kategori/tillbehor': '/tillbehor/',
  '/kategori/paket': '/cigarrpaket/', '/blogg': '/guide/', '/om-oss': '/om-oss/',
  '/kontakt': '/kontakt/', '/podcast': '/podcast/', '/varukorg': '/varukorg/',
};
if (location.hash.startsWith('#/')) location.replace(legacyHash[location.hash.slice(1)] ?? '/');

const root = document.getElementById('root')!;
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Prerendered pages already contain the HTML; hydrate them instead of re-rendering.
if (root.firstElementChild) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
