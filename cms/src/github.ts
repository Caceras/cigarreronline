/** Thin GitHub client: read the content files, and write them back as one commit. */
const API = 'https://api.github.com';

export interface RepoConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

async function gh(cfg: RepoConfig, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'cigarreronline-cms',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${init.method ?? 'GET'} ${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<any>;
}

/** Current file contents on the branch, decoded. */
export async function readFile(cfg: RepoConfig, file: string): Promise<string> {
  const data = await gh(cfg, `/repos/${cfg.owner}/${cfg.repo}/contents/${file}?ref=${cfg.branch}`);
  return Buffer.from(data.content, 'base64').toString('utf8');
}

/** Commits several files at once, so one publish is one commit and one deploy. */
export async function commitFiles(
  cfg: RepoConfig,
  files: { path: string; content: string }[],
  message: string,
): Promise<{ sha: string; url: string }> {
  const base = `/repos/${cfg.owner}/${cfg.repo}`;
  const ref = await gh(cfg, `${base}/git/ref/heads/${cfg.branch}`);
  const baseSha: string = ref.object.sha;
  const baseCommit = await gh(cfg, `${base}/git/commits/${baseSha}`);

  const tree = await gh(cfg, `${base}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
    }),
  });

  const commit = await gh(cfg, `${base}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }),
  });

  await gh(cfg, `${base}/git/refs/heads/${cfg.branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return { sha: commit.sha, url: `https://github.com/${cfg.owner}/${cfg.repo}/commit/${commit.sha}` };
}

/** Latest commits touching the content folder — "what changed lately". */
export async function recentContentCommits(cfg: RepoConfig, limit = 5) {
  const list = await gh(cfg, `/repos/${cfg.owner}/${cfg.repo}/commits?sha=${cfg.branch}&path=content&per_page=${limit}`);
  return list.map((c: any) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    date: c.commit.committer.date,
    url: c.html_url,
  }));
}
