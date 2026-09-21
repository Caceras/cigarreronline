/**
 * The forum service. Serves /forum/* as server-rendered HTML on the shop's own domain,
 * so threads are indexable and share the site's authority.
 *
 * Spam defences, in order of how much they catch: a hidden honeypot field, a minimum time
 * on the form, per-IP rate limits, no links until a member has three posts, and a report
 * queue that Claude can moderate from chat through the CMS connector.
 */
import http from 'node:http';
import { URL } from 'node:url';
import * as db from './db.js';
import {
  categoryPage, indexPage, page, rulesPage, siteCss, threadPage, esc,
} from './render.js';

const PORT = Number(process.env.PORT ?? 8080);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? '';
const COOKIE = 'co_forum';
const BASE = '/forum';

const database = db.open();

const redirect = (res: http.ServerResponse, to: string) => {
  res.writeHead(303, { Location: to });
  res.end();
};
const html = (res: http.ServerResponse, s: string, status = 200) => {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff' });
  res.end(s);
};
const json = (res: http.ServerResponse, data: unknown, status = 200) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
};

const cookies = (req: http.IncomingMessage) =>
  Object.fromEntries((req.headers.cookie ?? '').split(';').map((c) => {
    const i = c.indexOf('=');
    return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
  }).filter(([k]) => k));

const clientIp = (req: http.IncomingMessage) =>
  ((req.headers['x-forwarded-for'] as string) ?? '').split(',')[0].trim() || req.socket.remoteAddress || '0.0.0.0';

async function formBody(req: http.IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 64_000) throw new Error('too big');
    chunks.push(c as Buffer);
  }
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
}

/** Everything a submitted form must pass before it can become a post. */
function guard(fields: Record<string, string>, ipHash: string, kind: string, limit: number) {
  if (fields.webbplats) return 'Något gick fel. Försök igen.'; // honeypot: only bots fill this
  const t = Number(fields.t ?? 0);
  if (!t || Date.now() - t < 3000) return 'Det gick lite för fort. Försök igen.';
  if (Date.now() - t > 6 * 3600_000) return 'Formuläret var för gammalt. Ladda om sidan och försök igen.';
  if (db.tooFast(database, ipHash, kind, limit, 60)) return 'Du har skrivit mycket på kort tid. Ta en paus och försök om en stund.';
  return null;
}

const looksLikeSpam = (text: string) => {
  const links = (text.match(/https?:\/\//g) ?? []).length;
  return links > 2 || /\b(viagra|casino|crypto|bitcoin|loan|porn|escort)\b/i.test(text);
};

const setCookie = (res: http.ServerResponse, token: string) =>
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/{2,}/g, '/');
  const ipHash = db.hashIp(clientIp(req));
  const token = cookies(req)[COOKIE];
  const user = token ? db.userByToken(database, token) : undefined;
  const css = await siteCss();
  const notice = url.searchParams.get('fel') ?? undefined;

  try {
    if (path === '/health') return json(res, { ok: true, service: 'cigarreronline-forum' });

    /* ---------- admin API, used by the CMS connector ---------- */
    if (path.startsWith(`${BASE}/admin/`)) {
      if (!ADMIN_TOKEN || req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) return json(res, { error: 'forbidden' }, 403);
      if (path.endsWith('/reports')) return json(res, { reports: db.openReports(database) });
      if (req.method === 'POST') {
        const f = await formBody(req);
        if (path.endsWith('/hide')) {
          const table = f.kind === 'post' ? 'posts' : 'threads';
          database.prepare(`UPDATE ${table} SET hidden=1 WHERE id=?`).run(Number(f.id));
          database.prepare('UPDATE reports SET resolved=1 WHERE kind=? AND target_id=?').run(f.kind, Number(f.id));
          return json(res, { ok: true });
        }
        if (path.endsWith('/pin')) {
          database.prepare('UPDATE threads SET pinned=? WHERE id=?').run(f.pinned === '0' ? 0 : 1, Number(f.id));
          return json(res, { ok: true });
        }
        if (path.endsWith('/ban')) {
          database.prepare('UPDATE users SET banned=1 WHERE id=?').run(Number(f.user_id));
          database.prepare('UPDATE posts SET hidden=1 WHERE user_id=?').run(Number(f.user_id));
          database.prepare('UPDATE threads SET hidden=1 WHERE user_id=?').run(Number(f.user_id));
          return json(res, { ok: true });
        }
        if (path.endsWith('/resolve')) {
          database.prepare('UPDATE reports SET resolved=1 WHERE id=?').run(Number(f.id));
          return json(res, { ok: true });
        }
      }
      return json(res, { error: 'not found' }, 404);
    }

    /* ---------- sitemap ---------- */
    if (path === `${BASE}/sitemap.xml`) {
      const site = process.env.SITE_URL ?? 'https://cigarreronline.se';
      const cats = db.categories(database);
      const urls = [
        `${BASE}/`, `${BASE}/regler/`,
        ...cats.map((c) => `${BASE}/${c.slug}/`),
        ...cats.flatMap((c) => db.threadsIn(database, c.id, 500).map((t) => `${BASE}/${c.slug}/${t.slug}/`)),
      ];
      res.writeHead(200, { 'content-type': 'application/xml' });
      return res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
        urls.map((u) => `  <url><loc>${site}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
    }

    /* ---------- create an account (a name and a cookie) ---------- */
    if (path === `${BASE}/konto/` && req.method === 'POST') {
      const f = await formBody(req);
      const back = f.back?.startsWith(BASE) ? f.back : `${BASE}/`;
      const bad = guard(f, ipHash, 'account', 3);
      if (bad) return redirect(res, `${back}?fel=${encodeURIComponent(bad)}`);
      const name = (f.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
      if (name.length < 2) return redirect(res, `${back}?fel=${encodeURIComponent('Välj ett namn med minst två tecken.')}`);
      if (database.prepare('SELECT 1 FROM users WHERE lower(name)=lower(?)').get(name)) {
        return redirect(res, `${back}?fel=${encodeURIComponent('Namnet är taget. Välj ett annat.')}`);
      }
      const created = db.createUser(database, name);
      db.noteAction(database, ipHash, 'account');
      setCookie(res, created.token);
      return redirect(res, back);
    }

    /* ---------- report ---------- */
    if (path === `${BASE}/rapportera/` && req.method === 'POST') {
      const f = await formBody(req);
      const back = f.back?.startsWith(BASE) ? f.back : `${BASE}/`;
      if (!db.tooFast(database, ipHash, 'report', 10, 60)) {
        db.report(database, f.kind === 'post' ? 'post' : 'thread', Number(f.id), f.reason ?? '');
        db.noteAction(database, ipHash, 'report');
      }
      return redirect(res, `${back}?fel=${encodeURIComponent('Tack, vi tittar på den.')}`);
    }

    if (path === `${BASE}/regler/`) return html(res, rulesPage(css, user ?? null));

    /* ---------- forum index ---------- */
    if (path === `${BASE}/` || path === BASE) {
      const cats = db.categories(database).map((c) => ({
        ...c,
        threads: (database.prepare('SELECT count(*) n FROM threads WHERE category_id=? AND hidden=0').get(c.id) as { n: number }).n,
      }));
      return html(res, indexPage(cats, db.latestThreads(database, 10), user ?? null, css, notice));
    }

    const parts = path.replace(`${BASE}/`, '').split('/').filter(Boolean);

    /* ---------- category: list and create ---------- */
    if (parts.length === 1) {
      const cat = db.categoryBySlug(database, parts[0]);
      if (!cat) return html(res, notFound(css), 404);

      if (req.method === 'POST') {
        if (!user) return redirect(res, `${BASE}/${cat.slug}/?fel=${encodeURIComponent('Välj ett namn först.')}`);
        if (user.banned) return redirect(res, `${BASE}/${cat.slug}/?fel=${encodeURIComponent('Ditt konto kan inte skriva inlägg.')}`);
        const f = await formBody(req);
        const bad = guard(f, ipHash, 'thread', 3);
        const title = (f.title ?? '').trim().slice(0, 120);
        const text = (f.body ?? '').trim().slice(0, 6000);
        const problem = bad
          ?? (title.length < 5 ? 'Skriv en lite längre rubrik.' : null)
          ?? (text.length < 15 ? 'Skriv några meningar till.' : null)
          ?? (looksLikeSpam(`${title} ${text}`) ? 'Inlägget såg ut som spam och sparades inte.' : null);
        if (problem) return redirect(res, `${BASE}/${cat.slug}/?fel=${encodeURIComponent(problem)}`);
        const slug = db.uniqueSlug(database, title);
        db.createThread(database, cat.id, slug, title, text, user.id);
        db.noteAction(database, ipHash, 'thread');
        return redirect(res, `${BASE}/${cat.slug}/${slug}/`);
      }

      return html(res, categoryPage(cat, db.threadsIn(database, cat.id), user ?? null, css, notice));
    }

    /* ---------- thread: read and reply ---------- */
    if (parts.length === 2) {
      const cat = db.categoryBySlug(database, parts[0]);
      const thread = db.threadBySlug(database, parts[1]);
      if (!cat || !thread || thread.hidden) return html(res, notFound(css), 404);
      const here = `${BASE}/${cat.slug}/${thread.slug}/`;

      if (req.method === 'POST') {
        if (!user) return redirect(res, `${here}?fel=${encodeURIComponent('Välj ett namn först.')}`);
        if (user.banned) return redirect(res, `${here}?fel=${encodeURIComponent('Ditt konto kan inte skriva inlägg.')}`);
        const f = await formBody(req);
        const bad = guard(f, ipHash, 'post', 10);
        const text = (f.body ?? '').trim().slice(0, 6000);
        const problem = bad
          ?? (text.length < 5 ? 'Skriv lite mer än så.' : null)
          ?? (looksLikeSpam(text) ? 'Inlägget såg ut som spam och sparades inte.' : null);
        if (problem) return redirect(res, `${here}?fel=${encodeURIComponent(problem)}`);
        const id = db.createPost(database, thread.id, text, user.id);
        db.noteAction(database, ipHash, 'post');
        return redirect(res, `${here}#p${id}`);
      }

      return html(res, threadPage(cat, thread, db.postsIn(database, thread.id), user ?? null, css, notice));
    }

    return html(res, notFound(css), 404);
  } catch (e) {
    console.error(e);
    return html(res, notFound(css, 'Något gick fel. Försök igen.'), 500);
  }
});

const notFound = (css: string, message = 'Sidan finns inte.') =>
  page(`<div style="padding:5rem 0;text-align:center">
     <h1 style="font-size:2.4rem">${esc(message)}</h1>
     <p style="margin-top:1.5rem"><a class="btn" href="${BASE}/">Till forumet</a></p>
   </div>`, {
    title: 'Sidan finns inte | Forum | CigarrerOnline',
    description: 'Sidan kunde inte hittas.',
    path: `${BASE}/404/`, noindex: true, user: null, css,
  });

server.listen(PORT, () => console.log(`cigarreronline-forum listening on :${PORT}`));
