import { createContext, useContext, useEffect } from 'react';

export const SITE = {
  name: 'CigarrerOnline',
  url: 'https://cigarreronline.se',
  email: 'info@cigarreronline.se',
  freeShipping: 799,
  /** Flip to true once the forum service is deployed, so the nav never links to a 404. */
  forumEnabled: false,
};

export interface HeadData {
  title: string;
  description: string;
  path: string; // canonical path, always with trailing slash
  jsonLd?: object[];
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
}

/** During prerendering the server passes a collector; in the browser this is null. */
export const HeadContext = createContext<{ data?: HeadData } | null>(null);

/** Keeps titles inside what Google shows (~60 chars): drops the brand suffix first if needed. */
export function fitTitle(title: string, max = 60) {
  const suffix = ' | ' + SITE.name;
  if (title.length <= max || !title.endsWith(suffix)) return title;
  return title.slice(0, -suffix.length);
}

/** Cuts text at a word boundary so descriptions never end mid-word. */
export function clip(text: string, max = 158) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s–-]+$/, '') + '…';
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function headTags(d: HeadData): string {
  const url = SITE.url + d.path;
  const title = fitTitle(d.title);
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(d.description)}" data-h="description">`,
    `<link rel="canonical" href="${url}" data-h="canonical">`,
    `<meta property="og:type" content="${d.type ?? 'website'}" data-h="og:type">`,
    `<meta property="og:title" content="${esc(title)}" data-h="og:title">`,
    `<meta property="og:description" content="${esc(d.description)}" data-h="og:description">`,
    `<meta property="og:url" content="${url}" data-h="og:url">`,
    `<meta property="og:site_name" content="${SITE.name}">`,
    `<meta property="og:image" content="${SITE.url}/og.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta property="og:locale" content="sv_SE">`,
    `<meta name="robots" content="${d.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" data-h="robots">`,
  ];
  for (const j of d.jsonLd ?? []) {
    tags.push(`<script type="application/ld+json" data-h="ld">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`);
  }
  return tags.join('\n    ');
}

function setAttr(key: string, sel: string, attr: string, value: string) {
  const el = document.head.querySelector(`[data-h="${key}"]`) ?? (() => {
    const tag = sel.startsWith('link') ? 'link' : 'meta';
    const e = document.createElement(tag);
    e.setAttribute('data-h', key);
    if (tag === 'link') e.setAttribute('rel', 'canonical');
    else if (key.startsWith('og:')) e.setAttribute('property', key);
    else e.setAttribute('name', key);
    document.head.appendChild(e);
    return e;
  })();
  el.setAttribute(attr, value);
}

export function Head(props: HeadData) {
  const ctx = useContext(HeadContext);
  if (ctx) ctx.data = props;

  useEffect(() => {
    const url = SITE.url + props.path;
    const title = fitTitle(props.title);
    document.title = title;
    setAttr('description', 'meta', 'content', props.description);
    setAttr('canonical', 'link', 'href', url);
    setAttr('og:title', 'meta', 'content', title);
    setAttr('og:description', 'meta', 'content', props.description);
    setAttr('og:url', 'meta', 'content', url);
    setAttr('robots', 'meta', 'content', props.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    document.head.querySelectorAll('[data-h="ld"]').forEach((e) => e.remove());
    for (const j of props.jsonLd ?? []) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-h', 'ld');
      s.textContent = JSON.stringify(j);
      document.head.appendChild(s);
    }
  }, [props.path, props.title]);

  return null;
}

/* ---------- JSON-LD helpers ---------- */
export type Crumb = { name: string; path: string };

export const breadcrumbLd = (crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: SITE.url + c.path,
  })),
});

export const faqLd = (faq: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

export const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: SITE.name,
  url: SITE.url + '/',
  logo: SITE.url + '/icons/icon.svg',
  image: SITE.url + '/og.png',
  email: SITE.email,
  areaServed: 'SE',
  currenciesAccepted: 'SEK',
};

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url + '/',
  inLanguage: 'sv-SE',
};
