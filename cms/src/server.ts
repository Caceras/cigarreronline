/**
 * cigarreronline-cms — an MCP server that edits the site's content from any Claude surface.
 *
 * Edits are staged, validated against the same schema the site builds with, then published
 * as one commit to GitHub, which triggers the Dokploy deploy. Nothing here can touch code.
 */
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { Store } from './store.js';
import { recentContentCommits, type RepoConfig } from './github.js';
import { productSchema, guideSchema, STRENGTHS } from '../../content/schema.js';
import { pullSheet, pushSheet } from './sheet.js';
import * as forum from './forum.js';

const env = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env ${name}`);
  return v;
};

const cfg: RepoConfig = {
  token: env('GITHUB_TOKEN'),
  owner: env('GITHUB_OWNER', 'Caceras'),
  repo: env('GITHUB_REPO', 'cigarreronline'),
  branch: env('GITHUB_BRANCH', 'main'),
};
const URL_TOKEN = env('CMS_TOKEN');
const SITE = env('SITE_URL', 'https://cigarreronline.se');
const PORT = Number(env('PORT', '8080'));

const store = new Store(cfg, env('STAGING_FILE', '/data/staging.json'));

const ok = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const kr = (n: number) => `${n.toLocaleString('sv-SE')} kr`;

function server() {
  const s = new McpServer({ name: 'cigarreronline-cms', version: '1.0.0' });

  s.registerTool('list_products', {
    description: 'Lists products in the shop with id, name, price and category. Filter to narrow the list.',
    inputSchema: {
      query: z.string().optional().describe('Free text match on name, brand or country'),
      type: z.enum(['cigarr', 'cigarill', 'paket', 'tillbehor']).optional(),
      country: z.string().optional(),
      brand: z.string().optional(),
    },
  }, async ({ query, type, country, brand }) => {
    const { products } = await store.load();
    const q = query?.toLowerCase();
    const rows = products.filter((p) =>
      (!type || p.type === type) && (!country || p.country === country) && (!brand || p.brand === brand) &&
      (!q || `${p.name} ${p.brand ?? ''} ${p.country ?? ''}`.toLowerCase().includes(q)));
    if (!rows.length) return ok('Inga produkter matchade.');
    return ok(rows.map((p) => `${p.id.padEnd(42)} ${kr(p.price).padStart(10)}  ${p.type}${p.country ? ' · ' + p.country : ''}  ${p.name}`).join('\n'));
  });

  s.registerTool('get_product', {
    description: 'The full record for one product, as JSON.',
    inputSchema: { id: z.string() },
  }, async ({ id }) => {
    const { products } = await store.load();
    const p = products.find((x) => x.id === id);
    return p ? ok(JSON.stringify(p, null, 2)) : ok(`Ingen produkt med id "${id}".`);
  });

  s.registerTool('set_price', {
    description: 'Changes one product price. Staged until publish.',
    inputSchema: { id: z.string(), price: z.number().int().positive() },
  }, async ({ id, price }) => {
    const before = (await store.load()).products.find((p) => p.id === id)?.price;
    const p = await store.patchProduct(id, { price });
    return ok(`${p.name}: ${before !== undefined ? kr(before) + ' → ' : ''}${kr(p.price)} (ej publicerat än)`);
  });

  s.registerTool('update_product', {
    description: 'Changes fields on an existing product. Only the fields you pass are touched.',
    inputSchema: {
      id: z.string(),
      patch: z.object({
        name: z.string().optional(), price: z.number().int().positive().optional(),
        description: z.string().optional(), strength: z.enum(STRENGTHS).optional(),
        country: z.string().optional(), format: z.string().optional(), size: z.string().optional(),
        wrapperName: z.string().optional(), pack: z.string().optional(), brand: z.string().optional(),
        featured: z.boolean().optional(), wrapper: z.string().optional(), band: z.string().optional(),
      }).describe('Fields to change'),
    },
  }, async ({ id, patch }) => ok(JSON.stringify(await store.patchProduct(id, patch), null, 2)));

  s.registerTool('add_product', {
    description: 'Adds a product. Needs the full record; validated before it is accepted.',
    inputSchema: { product: z.object(productSchema.shape) },
  }, async ({ product }) => {
    const r = await store.upsertProduct(product);
    return ok(`${r.created ? 'Tillagd' : 'Uppdaterad'}: ${r.product.name} (${kr(r.product.price)}). Publicera för att lägga ut den.`);
  });

  s.registerTool('delete_product', {
    description: 'Removes a product from the shop.',
    inputSchema: { id: z.string() },
  }, async ({ id }) => { await store.deleteProduct(id); return ok(`Borttagen: ${id} (ej publicerat än)`); });

  s.registerTool('list_pages', {
    description: 'Lists the category pages with their path, heading and search title.',
    inputSchema: {},
  }, async () => {
    const { collections } = await store.load();
    return ok(collections.map((c) => `${c.path.padEnd(32)} ${c.h1}`).join('\n'));
  });

  s.registerTool('update_page', {
    description: 'Edits a category page: heading, intro, search title and description, text sections, FAQ.',
    inputSchema: {
      path: z.string().describe('e.g. /cigarrer/kubanska/'),
      patch: z.object({
        h1: z.string().optional(), title: z.string().max(75).optional(), description: z.string().max(165).optional(),
        intro: z.string().optional(),
        sections: z.array(z.object({ h2: z.string(), p: z.array(z.string()) })).optional(),
        faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
      }),
    },
  }, async ({ path, patch }) => ok(JSON.stringify(await store.updateCollection(path, patch), null, 2)));

  s.registerTool('update_brand', {
    description: 'Edits a brand page text.',
    inputSchema: {
      id: z.string(),
      patch: z.object({ intro: z.string().optional(), body: z.array(z.string()).optional(), since: z.string().optional() }),
    },
  }, async ({ id, patch }) => ok(JSON.stringify(await store.updateBrand(id, patch), null, 2)));

  s.registerTool('upsert_guide', {
    description: 'Writes or replaces a guide article. Existing slug = replace, new slug = new article and a new URL.',
    inputSchema: { guide: z.object(guideSchema.shape) },
  }, async ({ guide }) => {
    const g = await store.upsertGuide(guide);
    return ok(`Guide "${g.title}" klar på /guide/${g.slug}/ (ej publicerat än)`);
  });

  s.registerTool('pending', {
    description: 'What has been changed but not published yet.',
    inputSchema: {},
  }, async () => {
    const p = store.pending();
    return ok(p.changes.length ? `Väntar på publicering:\n- ${p.changes.join('\n- ')}` : 'Inget opublicerat.');
  });

  s.registerTool('publish', {
    description: 'Publishes all staged edits as one commit. The site rebuilds and is live in a minute or two.',
    inputSchema: { message: z.string().optional().describe('Short summary for the commit') },
  }, async ({ message }) => {
    const r = await store.publish(message);
    if (!r.published) return ok(r.reason);
    return ok(`Publicerat: ${r.files.join(', ')}\n${r.url}\nSajten byggs om och är live om någon minut.`);
  });

  s.registerTool('discard', {
    description: 'Throws away staged edits and reloads the published content.',
    inputSchema: {},
  }, async () => { await store.discard(); return ok('Ändringarna slängda. Arbetskopian matchar sajten igen.'); });

  s.registerTool('sheet_pull', {
    description: 'Reads prices and names from the Google Sheet and stages any differences.',
    inputSchema: { dry_run: z.boolean().optional().describe('Only report differences, change nothing') },
  }, async ({ dry_run }) => ok(await pullSheet(store, !!dry_run)));

  s.registerTool('sheet_push', {
    description: 'Writes the current catalogue to the Google Sheet, so it matches the site.',
    inputSchema: {},
  }, async () => ok(await pushSheet(store)));

  s.registerTool('forum_reports', {
    description: 'What forum members have reported and nobody has handled yet.',
    inputSchema: {},
  }, async () => ok(await forum.reports()));

  s.registerTool('forum_hide', {
    description: 'Hides a reported forum thread or reply. The page then returns 404.',
    inputSchema: { kind: z.enum(['thread', 'post']), id: z.number().int().positive() },
  }, async ({ kind, id }) => ok(await forum.hide(kind, id)));

  s.registerTool('forum_pin', {
    description: 'Pins a thread to the top of its category, or unpins it.',
    inputSchema: { id: z.number().int().positive(), pinned: z.boolean().default(true) },
  }, async ({ id, pinned }) => ok(await forum.pin(id, pinned)));

  s.registerTool('forum_ban', {
    description: 'Bans a forum account and hides everything it has posted. Use for spammers.',
    inputSchema: { user_id: z.number().int().positive() },
  }, async ({ user_id }) => ok(await forum.ban(user_id)));

  s.registerTool('forum_resolve', {
    description: 'Marks a report as handled without hiding anything.',
    inputSchema: { report_id: z.number().int().positive() },
  }, async ({ report_id }) => ok(await forum.resolve(report_id)));

  s.registerTool('site_status', {
    description: 'Is the site up, and what were the last content changes?',
    inputSchema: {},
  }, async () => {
    const started = Date.now();
    let live = 'okänd';
    try {
      const res = await fetch(SITE + '/', { method: 'HEAD' });
      live = `${res.status} (${Date.now() - started} ms)`;
    } catch (e) {
      live = `nås inte: ${(e as Error).message}`;
    }
    const commits = await recentContentCommits(cfg);
    const p = store.pending();
    return ok([
      `Sajt: ${SITE} → ${live}`,
      `Opublicerat: ${p.changes.length ? p.changes.join(', ') : 'inget'}`,
      'Senaste innehållsändringar:',
      ...commits.map((c: any) => `  ${c.date.slice(0, 16).replace('T', ' ')}  ${c.message}`),
    ].join('\n'));
  });

  return s;
}

/* ---------- HTTP: one MCP endpoint, token in the path (same pattern as the Loopia MCP) ---------- */
const transports = new Map<string, StreamableHTTPServerTransport>();

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'cigarreronline-cms' }));
    return;
  }

  if (url.pathname !== `/${URL_TOKEN}/mcp`) {
    res.writeHead(404).end('Not found');
    return;
  }

  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => { transports.set(id, transport!); },
      });
      transport.onclose = () => { if (transport!.sessionId) transports.delete(transport!.sessionId); };
      await server().connect(transport);
    }

    let body: unknown;
    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    }
    await transport.handleRequest(req, res, body);
  } catch (e) {
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: (e as Error).message }));
  }
});

httpServer.listen(PORT, () => console.log(`cigarreronline-cms listening on :${PORT}`));
