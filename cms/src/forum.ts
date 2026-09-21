/**
 * Moderation of the forum, from any Claude surface.
 *
 * The forum service exposes a tiny admin API; these helpers wrap it so the tools read like
 * what you would actually say: show me what's reported, hide that one, ban that account.
 */
const URL_ = process.env.FORUM_ADMIN_URL ?? 'http://cigarreronline-forum:8080/forum/admin';
const TOKEN = process.env.FORUM_ADMIN_TOKEN ?? '';

async function call(path: string, body?: Record<string, string>) {
  if (!TOKEN) throw new Error('Forum moderation is not configured (FORUM_ADMIN_TOKEN).');
  const res = await fetch(`${URL_}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Forum admin ${path} → ${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

export async function reports() {
  const r = await call('/reports');
  if (!r.reports?.length) return 'Inget anmält just nu.';
  return r.reports
    .map((x: any) => `#${x.id}  ${x.kind} ${x.target_id}  ${x.created_at.slice(0, 16).replace('T', ' ')}  ${x.reason || '(ingen motivering)'}`)
    .join('\n');
}

export async function hide(kind: 'thread' | 'post', id: number) {
  await call('/hide', { kind, id: String(id) });
  return `Dold: ${kind} ${id}. Sidan svarar nu 404 och anmälan är avklarad.`;
}

export async function pin(id: number, pinned: boolean) {
  await call('/pin', { id: String(id), pinned: pinned ? '1' : '0' });
  return pinned ? `Tråd ${id} ligger nu överst i sin kategori.` : `Tråd ${id} är inte längre fäst.`;
}

export async function ban(userId: number) {
  await call('/ban', { user_id: String(userId) });
  return `Konto ${userId} är avstängt och alla dess inlägg är dolda.`;
}

export async function resolve(reportId: number) {
  await call('/resolve', { id: String(reportId) });
  return `Anmälan #${reportId} markerad som hanterad.`;
}
