/**
 * Server-rendered HTML for the forum, in the site's design.
 *
 * Pages are plain HTML with normal forms: they work without JavaScript, which keeps them
 * fast, crawlable and hard to break. The stylesheet is the site's own — its hashed filename
 * is read from the published home page and refreshed hourly.
 */
import type { Category, Post, Thread } from './db.js';

const SITE = process.env.SITE_URL ?? 'https://cigarreronline.se';
const BASE = '/forum';

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The site's CSS filename changes on each deploy, so look it up instead of hard-coding it. */
let cssHref = '';
let cssAt = 0;
export async function siteCss(): Promise<string> {
  if (cssHref && Date.now() - cssAt < 3_600_000) return cssHref;
  try {
    const html = await fetch(SITE + '/', { signal: AbortSignal.timeout(4000) }).then((r) => r.text());
    const m = html.match(/href="(\/assets\/[^"]+\.css)"/);
    if (m) { cssHref = m[1]; cssAt = Date.now(); }
  } catch { /* keep whatever we had; the fallback styles below carry the page */ }
  return cssHref;
}

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });

/** Escapes everything, keeps paragraph breaks, and only linkifies for established members. */
export function body(text: string, allowLinks: boolean) {
  return esc(text)
    .split(/\n{2,}/)
    .map((para) => {
      const withBreaks = para.replace(/\n/g, '<br>');
      const linked = allowLinks
        ? withBreaks.replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" rel="nofollow ugc noopener" target="_blank">${u}</a>`)
        : withBreaks;
      return `<p>${linked}</p>`;
    })
    .join('');
}

interface PageOpts {
  title: string; description: string; path: string; jsonLd?: object[];
  noindex?: boolean; user?: { name: string } | null; css: string;
}

export function page(content: string, o: PageOpts) {
  const url = SITE + o.path;
  const ld = (o.jsonLd ?? []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('');
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fbfaf7">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${o.noindex ? 'noindex, follow' : 'index, follow'}">
<meta property="og:title" content="${esc(o.title)}"><meta property="og:url" content="${url}">
<meta property="og:description" content="${esc(o.description)}"><meta property="og:image" content="${SITE}/og.png">
<meta property="og:site_name" content="CigarrerOnline"><meta property="og:locale" content="sv_SE">
<link rel="icon" type="image/svg+xml" href="/icons/icon.svg">
${o.css ? `<link rel="stylesheet" href="${o.css}">` : ''}
<style>
  :root{--ink:#1c1917;--paper:#fbfaf7;--paper2:#f4f1ea;--line:#e7e1d6;--muted:#78716c;--brass:#7a5c2e}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.6}
  a{color:inherit}
  .wrap{max-width:60rem;margin:0 auto;padding:0 1.25rem}
  .fbar{border-bottom:1px solid var(--line)}
  .fbar .wrap{display:flex;align-items:center;justify-content:space-between;height:4.25rem;gap:1rem}
  .mark{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.45rem}
  .mark i{color:var(--brass)}
  h1,h2,h3{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;letter-spacing:-.01em;margin:0}
  h1{font-size:2.6rem;line-height:1.1}
  .crumbs{font-size:.75rem;color:var(--muted);padding:1.6rem 0 0}
  .crumbs a{text-decoration:none}
  .row{display:block;padding:1.2rem 0;border-bottom:1px solid var(--line);text-decoration:none}
  .row h2,.row h3{font-size:1.45rem}
  .meta{font-size:.78rem;color:var(--muted);margin-top:.35rem}
  .post{padding:1.6rem 0;border-bottom:1px solid var(--line)}
  .post p{margin:0 0 .9rem;color:#57534e}
  .who{font-size:.8rem;color:var(--muted);margin-bottom:.6rem}
  form.card{background:var(--paper2);padding:1.6rem;margin:2rem 0}
  label{display:block;font-size:.69rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem}
  input[type=text],textarea{width:100%;box-sizing:border-box;background:transparent;border:0;border-bottom:1px solid var(--line);padding:.7rem 0;font:inherit;color:var(--ink);border-radius:0}
  input[type=text]:focus,textarea:focus{outline:none;border-color:var(--ink)}
  textarea{resize:vertical;min-height:7rem}
  .btn{display:inline-flex;align-items:center;gap:.5rem;background:var(--ink);color:var(--paper);border:0;padding:.85rem 1.5rem;font:inherit;font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;text-decoration:none}
  .btn:hover{background:#44403c}
  .hp{position:absolute;left:-9999px}
  .note{font-size:.8rem;color:var(--muted)}
  .err{background:#fdf2ef;border-left:2px solid #b23a2e;padding:.9rem 1rem;margin:1.5rem 0;font-size:.9rem}
  footer.f{border-top:1px solid var(--line);margin-top:4rem;padding:2rem 0;font-size:.8rem;color:var(--muted)}
  footer.f a{margin-right:1.25rem}
</style>
${ld}
</head>
<body>
<header class="fbar"><div class="wrap">
  <a class="mark" href="/" style="text-decoration:none">Cigarrer<i>Online</i></a>
  <nav style="font-size:.8125rem;display:flex;gap:1.25rem;align-items:center">
    <a href="/cigarrer/" style="text-decoration:none;color:var(--muted)">Butiken</a>
    <a href="${BASE}/" style="text-decoration:none">Forum</a>
    ${o.user ? `<span class="note">${esc(o.user.name)}</span>` : ''}
  </nav>
</div></header>
<div id="agegate" hidden style="position:fixed;inset:0;z-index:100;background:rgba(28,25,23,.3);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:1rem">
  <div style="background:var(--paper);max-width:26rem;width:100%;padding:2.5rem;text-align:center">
    <div class="mark">Cigarrer<i>Online</i></div>
    <h2 style="font-size:1.8rem;margin:1.5rem 0 .6rem">Är du 18 år eller äldre?</h2>
    <p class="note" style="margin:0 0 1.6rem">Forumet handlar om tobak och är bara för dig som fyllt 18.</p>
    <p><a class="btn" href="https://www.google.se" style="background:transparent;color:var(--ink);border:1px solid var(--line);margin-right:.5rem">Nej</a>
       <button class="btn" type="button" id="ageok">Ja, jag är 18+</button></p>
  </div>
</div>
<script>
  (function () {
    try {
      if (localStorage.getItem('co-age') !== 'ok') document.getElementById('agegate').hidden = false;
    } catch (e) {}
    document.getElementById('ageok').addEventListener('click', function () {
      try { localStorage.setItem('co-age', 'ok'); } catch (e) {}
      document.getElementById('agegate').hidden = true;
    });
  })();
</script>
<main class="wrap">${content}</main>
<footer class="f"><div class="wrap">
  <a href="/">Startsidan</a><a href="/cigarrer/">Cigarrer</a><a href="/guide/">Guider</a><a href="${BASE}/regler/">Forumregler</a>
  <p>18-årsgräns. Rökning skadar din hälsa. Inlägg skrivs av besökare och är deras egna åsikter.</p>
</div></footer>
</body></html>`;
}

/* ---------- page bodies ---------- */

export function indexPage(cats: (Category & { threads: number })[], latest: Thread[], user: { name: string } | null, css: string, notice?: string) {
  const content = `
  <div class="crumbs"><a href="/">Hem</a> · Forum</div>
  <div style="padding:2.5rem 0 1rem">
    <h1>Forum</h1>
    <p class="note" style="max-width:36rem;margin-top:1rem">
      Ett lugnt ställe för frågor och smaknoteringar om cigarrer. Skriv under vilket namn du vill,
      men håll god ton. <a href="${BASE}/regler/">Reglerna</a> är korta.
    </p>
  </div>
  ${notice ? `<div class="err">${esc(notice)}</div>` : ''}
  <div style="border-top:1px solid var(--line);margin-top:1.5rem">
    ${cats.map((c) => `
      <a class="row" href="${BASE}/${c.slug}/">
        <h2>${esc(c.name)}</h2>
        <div class="note">${esc(c.description)}</div>
        <div class="meta">${c.threads} ${c.threads === 1 ? 'tråd' : 'trådar'}</div>
      </a>`).join('')}
  </div>
  ${latest.length ? `
  <h2 style="font-size:1.9rem;margin:3rem 0 1rem">Senaste inläggen</h2>
  <div style="border-top:1px solid var(--line)">
    ${latest.map((t) => `
      <a class="row" href="${BASE}/${catSlug(cats, t.category_id)}/${t.slug}/">
        <h3>${esc(t.title)}</h3>
        <div class="meta">${esc(t.author)} · ${dateFmt(t.last_reply_at)} · ${t.reply_count} svar</div>
      </a>`).join('')}
  </div>` : ''}
  ${user ? '' : accountForm()}
  `;
  return page(content, {
    title: 'Forum – frågor och samtal om cigarrer | CigarrerOnline',
    description: 'Cigarrforum på svenska: frågor från nybörjare, smaknoteringar, förvaring och humidor. Skriv utan konto och krångel.',
    path: `${BASE}/`, user, css,
  });
}

const catSlug = (cats: Category[], id: number) => cats.find((c) => c.id === id)?.slug ?? 'allmant';

export function categoryPage(cat: Category, threads: Thread[], user: { name: string } | null, css: string, notice?: string) {
  const content = `
  <div class="crumbs"><a href="/">Hem</a> · <a href="${BASE}/">Forum</a> · ${esc(cat.name)}</div>
  <div style="padding:2.5rem 0 1rem">
    <h1>${esc(cat.name)}</h1>
    <p class="note" style="max-width:36rem;margin-top:.8rem">${esc(cat.description)}</p>
  </div>
  ${notice ? `<div class="err">${esc(notice)}</div>` : ''}
  <div style="border-top:1px solid var(--line);margin-top:1.5rem">
    ${threads.length ? threads.map((t) => `
      <a class="row" href="${BASE}/${cat.slug}/${t.slug}/">
        <h2>${t.pinned ? '↑ ' : ''}${esc(t.title)}</h2>
        <div class="meta">${esc(t.author)} · ${dateFmt(t.created_at)} · ${t.reply_count} svar</div>
      </a>`).join('') : '<p class="note" style="padding:2rem 0">Ingen har skrivit här än. Bli först.</p>'}
  </div>
  ${user ? threadForm(cat) : accountForm(`${BASE}/${cat.slug}/`)}
  `;
  return page(content, {
    title: `${cat.name} – forum | CigarrerOnline`,
    description: `${cat.description} Diskussioner om cigarrer på svenska.`,
    path: `${BASE}/${cat.slug}/`, user, css,
    jsonLd: [{
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Hem', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Forum', item: `${SITE}${BASE}/` },
        { '@type': 'ListItem', position: 3, name: cat.name, item: `${SITE}${BASE}/${cat.slug}/` },
      ],
    }],
  });
}

export function threadPage(cat: Category, t: Thread, posts: Post[], user: { name: string; post_count: number } | null, css: string, notice?: string) {
  const allowLinks = (user?.post_count ?? 0) >= 3;
  const content = `
  <div class="crumbs"><a href="/">Hem</a> · <a href="${BASE}/">Forum</a> · <a href="${BASE}/${cat.slug}/">${esc(cat.name)}</a></div>
  <article style="padding:2.5rem 0 0">
    <h1 style="font-size:2.2rem">${esc(t.title)}</h1>
    <div class="who" style="margin-top:.8rem">${esc(t.author)} · ${dateFmt(t.created_at)}</div>
    <div class="post" style="border-top:1px solid var(--line);padding-top:1.4rem">${body(t.body, false)}</div>
    ${posts.map((p) => `
      <div class="post" id="p${p.id}">
        <div class="who">${esc(p.author)} · ${dateFmt(p.created_at)}</div>
        ${body(p.body, allowLinks)}
      </div>`).join('')}
  </article>
  ${notice ? `<div class="err">${esc(notice)}</div>` : ''}
  ${user ? replyForm(cat, t) : accountForm(`${BASE}/${cat.slug}/${t.slug}/`)}
  <form method="post" action="${BASE}/rapportera/" style="margin:2rem 0">
    <input type="hidden" name="kind" value="thread"><input type="hidden" name="id" value="${t.id}">
    <input type="hidden" name="back" value="${BASE}/${cat.slug}/${t.slug}/">
    <button class="note" style="background:none;border:0;padding:0;cursor:pointer;text-decoration:underline">Anmäl tråden</button>
  </form>`;
  const first = t.body.replace(/\s+/g, ' ').slice(0, 155);
  return page(content, {
    title: `${t.title} | Forum | CigarrerOnline`,
    description: first,
    path: `${BASE}/${cat.slug}/${t.slug}/`, user, css,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: t.title,
      text: t.body.slice(0, 500),
      datePublished: t.created_at,
      author: { '@type': 'Person', name: t.author },
      url: `${SITE}${BASE}/${cat.slug}/${t.slug}/`,
      interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: t.reply_count },
      comment: posts.slice(0, 20).map((p) => ({
        '@type': 'Comment', text: p.body.slice(0, 500), datePublished: p.created_at,
        author: { '@type': 'Person', name: p.author },
      })),
    }],
  });
}

export function rulesPage(css: string, user: { name: string } | null) {
  const content = `
  <div class="crumbs"><a href="/">Hem</a> · <a href="${BASE}/">Forum</a> · Regler</div>
  <div style="padding:2.5rem 0 1rem"><h1>Forumregler</h1></div>
  <div class="post" style="border-top:1px solid var(--line)">
    <p><strong>18 år.</strong> Forumet handlar om tobak och är bara för dig som fyllt 18.</p>
    <p><strong>Håll god ton.</strong> Oenighet är bra, personangrepp är det inte.</p>
    <p><strong>Ingen försäljning mellan privatpersoner.</strong> Att sälja tobak kräver tillstånd. Annonser tas bort.</p>
    <p><strong>Ingen spam.</strong> Länkar går först att lägga in när du skrivit några inlägg, och de följs inte av sökmotorer.</p>
    <p><strong>Vi tar bort inlägg</strong> som är olagliga, hotfulla eller uppenbart reklam. Anmäl gärna, vi läser allt som anmäls.</p>
    <p><strong>Om dina uppgifter.</strong> Vi sparar ditt valda namn och dina inlägg. Ingen e-post, inget lösenord. Din IP-adress sparas bara som en oläsbar kod i 30 dagar för att stoppa spam. Vill du få ditt konto och dina inlägg borttagna, mejla <a href="mailto:info@cigarreronline.se">info@cigarreronline.se</a>.</p>
  </div>`;
  return page(content, {
    title: 'Forumregler | CigarrerOnline',
    description: 'Reglerna för CigarrerOnlines forum: 18-årsgräns, god ton, ingen försäljning mellan privatpersoner och hur vi hanterar dina uppgifter.',
    path: `${BASE}/regler/`, user, css,
  });
}

/* ---------- forms ---------- */
const stamp = () => `<input type="hidden" name="t" value="${Date.now()}"><input class="hp" type="text" name="webbplats" tabindex="-1" autocomplete="off">`;

function accountForm(back = `${BASE}/`) {
  return `
  <form class="card" method="post" action="${BASE}/konto/">
    <h2 style="font-size:1.6rem;margin-bottom:.8rem">Välj ett namn för att skriva</h2>
    <p class="note" style="margin:0 0 1.2rem">Inget lösenord, ingen e-post. Namnet sparas i den här webbläsaren.</p>
    <label for="name">Namn</label>
    <input id="name" type="text" name="name" maxlength="24" required placeholder="t.ex. Robusto_Ragnar">
    ${stamp()}<input type="hidden" name="back" value="${back}">
    <p style="margin:1.4rem 0 0"><button class="btn" type="submit">Skapa namn</button></p>
    <p class="note" style="margin-top:1rem">Genom att skriva här intygar du att du fyllt 18 år och godkänner <a href="${BASE}/regler/">reglerna</a>.</p>
  </form>`;
}

function threadForm(cat: Category) {
  return `
  <form class="card" method="post" action="${BASE}/${cat.slug}/">
    <h2 style="font-size:1.6rem;margin-bottom:1.2rem">Ny tråd i ${esc(cat.name)}</h2>
    <label for="title">Rubrik</label>
    <input id="title" type="text" name="title" maxlength="120" required>
    <div style="height:1.2rem"></div>
    <label for="body">Ditt inlägg</label>
    <textarea id="body" name="body" maxlength="6000" required></textarea>
    ${stamp()}
    <p style="margin:1.4rem 0 0"><button class="btn" type="submit">Publicera tråd</button></p>
  </form>`;
}

function replyForm(cat: Category, t: Thread) {
  return `
  <form class="card" method="post" action="${BASE}/${cat.slug}/${t.slug}/">
    <label for="body">Svara</label>
    <textarea id="body" name="body" maxlength="6000" required></textarea>
    ${stamp()}
    <p style="margin:1.4rem 0 0"><button class="btn" type="submit">Skicka svar</button></p>
  </form>`;
}
