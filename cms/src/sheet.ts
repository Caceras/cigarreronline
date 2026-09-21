/**
 * Google Sheet mirror. The Sheet talks to us through a small Apps Script web app
 * (cms/apps-script/Code.gs) so there is no Google Cloud project, no service account
 * and no OAuth dance — just one URL and a shared secret.
 *
 * The Sheet is a convenience view: the JSON in the repo stays the source of truth.
 * sheet_push writes the catalogue to the Sheet; sheet_pull brings edited prices
 * and names back, through the same validation as every other edit.
 */
import type { Store } from './store.js';

const URL_ = process.env.SHEET_WEBAPP_URL ?? '';
const SECRET = process.env.SHEET_SECRET ?? '';

const HEADERS = ['id', 'namn', 'pris', 'typ', 'marke', 'land', 'styrka', 'format', 'utvald'] as const;

function ensureConfigured() {
  if (!URL_ || !SECRET) throw new Error('Google Sheet is not configured (SHEET_WEBAPP_URL, SHEET_SECRET).');
}

async function call(action: 'read' | 'write', rows?: unknown[][]) {
  ensureConfigured();
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SECRET, action, rows }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Sheet ${action} → ${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

export async function pushSheet(store: Store) {
  const { products } = await store.load();
  const rows: (string | number)[][] = [
    [...HEADERS],
    ...products.map((p) => [
      p.id, p.name, p.price, p.type, p.brand ?? '', p.country ?? '', p.strength ?? '', p.format ?? '', p.featured ? 'ja' : '',
    ]),
  ];
  const r = await call('write', rows);
  return `Skickade ${products.length} produkter till kalkylarket.${r.url ? '\n' + r.url : ''}`;
}

export async function pullSheet(store: Store, dryRun: boolean) {
  const { products } = await store.load();
  const r = await call('read');
  const rows: string[][] = r.rows ?? [];
  if (!rows.length) return 'Kalkylarket är tomt. Kör sheet_push först.';

  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => head.indexOf(name);
  const idC = col('id'), priceC = col('pris'), nameC = col('namn');
  if (idC === -1) return 'Kalkylarket saknar en id-kolumn.';

  const changes: string[] = [];
  const unknown: string[] = [];

  for (const row of rows.slice(1)) {
    const id = (row[idC] ?? '').trim();
    if (!id) continue;
    const p = products.find((x) => x.id === id);
    if (!p) { unknown.push(id); continue; }

    const patch: Record<string, unknown> = {};
    if (priceC !== -1 && String(row[priceC] ?? '').trim() !== '') {
      const price = Number(String(row[priceC]).replace(/[^\d]/g, ''));
      if (Number.isFinite(price) && price > 0 && price !== p.price) patch.price = price;
    }
    if (nameC !== -1) {
      const name = (row[nameC] ?? '').trim();
      if (name && name !== p.name) patch.name = name;
    }
    if (!Object.keys(patch).length) continue;

    changes.push(`${p.name}: ${Object.entries(patch).map(([k, v]) => `${k} ${JSON.stringify((p as any)[k])} → ${JSON.stringify(v)}`).join(', ')}`);
    if (!dryRun) await store.patchProduct(id, patch);
  }

  const lines = [
    changes.length ? `${dryRun ? 'Skulle ändra' : 'Ändrade'} ${changes.length} produkter:` : 'Kalkylarket matchar sajten, inget att göra.',
    ...changes.map((c) => '  ' + c),
  ];
  if (unknown.length) lines.push(`Okända id:n i arket (hoppade över): ${unknown.join(', ')}`);
  if (changes.length && !dryRun) lines.push('Kör publish för att lägga ut ändringarna.');
  return lines.join('\n');
}
