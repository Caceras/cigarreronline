# cigarreronline-cms

An MCP server that turns any Claude chat into the CMS for cigarreronline.se — phone included.

```
Claude (any surface) ──MCP──▶ cms.host4ai.se ──commit──▶ GitHub ──webhook──▶ Dokploy ──▶ live site
                                    │
                                    └──▶ Google Sheet (optional mirror of the product table)
```

Edits are **staged**, validated against `content/schema.ts` — the same schema the site builds with — and
published as **one commit**. A bad price or an unknown brand is refused at the tool call, so the site
cannot break from an edit. Every publish is a commit, so rollback is `git revert`.

## Tools

| Tool | Does what |
| --- | --- |
| `list_products`, `get_product` | Browse the catalogue |
| `set_price`, `update_product`, `add_product`, `delete_product` | Change the catalogue |
| `list_pages`, `update_page` | Category page heading, intro, SEO title/description, text sections, FAQ |
| `update_brand`, `upsert_guide` | Brand texts and guide articles |
| `pending`, `discard`, `publish` | See, throw away or publish staged edits |
| `sheet_pull`, `sheet_push` | Sync the product table with the Google Sheet |
| `site_status` | Is the site up, what changed recently, what is unpublished |

## Deploy on witty-hawk

Two env values you have to create first:

- **`GITHUB_TOKEN`** — a fine-grained personal access token on github.com/settings/tokens, scoped to
  the `cigarreronline` repo only, with **Contents: read and write**.
- **`CMS_TOKEN`** — a long random string; it becomes part of the connector URL, so it is the password.
  `openssl rand -hex 24`

```bash
ssh witty-hawk 'mkdir -p /srv/sites/cigarreronline-cms'
ssh witty-hawk 'cat > /srv/sites/cigarreronline-cms/cms.env' <<'ENV'
GITHUB_TOKEN=github_pat_...
GITHUB_OWNER=Caceras
GITHUB_REPO=cigarreronline
GITHUB_BRANCH=main
CMS_TOKEN=...
SITE_URL=https://cigarreronline.se
SHEET_WEBAPP_URL=
SHEET_SECRET=
ENV
ssh witty-hawk 'chmod 600 /srv/sites/cigarreronline-cms/cms.env'
```

Then in Dokploy: **Create Application** → source GitHub `Caceras/cigarreronline`, build type
**Dockerfile** at `cms/Dockerfile` (build context: repo root), domain **cms.host4ai.se** port **8080**,
HTTPS with Let's Encrypt, env from the file above, and a **volume** mounted at `/data` so staged
edits survive a restart.

DNS for `cms.host4ai.se` already points at witty-hawk (A → 136.148.209.184).

## Connect it to Claude

Add a custom connector with the URL:

```
https://cms.host4ai.se/<CMS_TOKEN>/mcp
```

The URL contains the password — never paste it into a chat, a file or a commit. Health check without
the token: `https://cms.host4ai.se/health`.

## Google Sheet mirror (optional)

1. Create a Sheet, e.g. "CigarrerOnline – produkter".
2. Extensions → Apps Script, paste `apps-script/Code.gs`, set `SECRET`.
3. Deploy → New deployment → **Web app**, execute as you, access: anyone with the link.
4. Put the `/exec` URL in `SHEET_WEBAPP_URL` and the same secret in `SHEET_SECRET`.
5. Ask Claude to run `sheet_push` once to fill the Sheet.

After that: edit prices or names in the Sheet, then `sheet_pull` (`dry_run: true` first if you want to
see the diff) and `publish`. The JSON in the repo stays the source of truth; the Sheet is a view you
can edit from your phone without Claude.

## Local development

```bash
cd cms
npm install
GITHUB_TOKEN=... CMS_TOKEN=dev STAGING_FILE=/tmp/staging.json npm run dev
```
