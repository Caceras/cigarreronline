# Deploy – cigarreronline.se

Goal: the site deploys from a `git push`, from any machine, with no Mac and no SSH in the loop.

```
Du / Claude  ──push──▶  GitHub (source of truth)
                             │ webhook
                             ▼
                   Dokploy on witty-hawk  ──builds Dockerfile──▶  nginx container
                             │                                       │
                             └──────────── Traefik + Let's Encrypt ──┴──▶ cigarreronline.se
```

## What's in the repo

| File | Does what |
| --- | --- |
| `Dockerfile` | Builds the site (`npm run build`, which prerenders 116 pages) and bakes it into an nginx image |
| `deploy/nginx.conf` | Serving rules: real 404s, immutable asset caching, no caching of `sw.js`, security headers |
| `.github/workflows/ci.yml` | On every push: typecheck, build, verify pages were prerendered |
| `scripts/bootstrap-git.sh` | One-time: create the GitHub repo and push |
| `scripts/prerender.mjs` | Writes one HTML file per URL + `sitemap.xml` + `robots.txt` |
| `deploy/deploy.sh` | Legacy fallback: build on the Mac, rsync to the server over SSH |

## One-time setup

### 1. GitHub

On the Mac (it holds the GitHub login):

```bash
cd ~/Applications/Projects/finduscigarrer   # folder name can stay
./scripts/bootstrap-git.sh
```

### 2. Dokploy application

In Dokploy on witty-hawk: **Create Application**

- Source: **GitHub** → repo `Caceras/cigarreronline`, branch `main`
- Build type: **Dockerfile** (`./Dockerfile`)
- Domains: `cigarreronline.se` and `www.cigarreronline.se`, port **80**, HTTPS on, certificate **Let's Encrypt**
- Auto deploy: **on** (Dokploy registers the GitHub webhook itself)

### 3. Cut over from the old setup

The site currently runs as a hand-made Swarm service with a hand-written Traefik file. Both claim the
same domain, so remove them once the Dokploy app answers:

```bash
ssh witty-hawk 'docker service rm cigarreronline-web; rm -f /etc/dokploy/traefik/dynamic/cigarreronline.yml'
```

Keep `/srv/sites/cigarreronline/` until the new deploy is verified, then it can go too.

## Deploying after that

1. **Normal way:** commit and push to `main`. Dokploy builds and swaps the container.
2. **Without a push** (redeploy the same commit): Dokploy's API, `POST /api/application.deploy` with an
   API token, which is what the Dokploy MCP connector uses.

Both work from anywhere over HTTPS — no SSH, no Mac.

## Verify after a deploy

```bash
curl -sI https://cigarreronline.se/ | head -1                      # 200
curl -sI https://cigarreronline.se/cigarrer/kubanska/ | head -1    # 200
curl -sI https://cigarreronline.se/finns-inte/ | head -1           # 404, not 200
curl -s  https://cigarreronline.se/sitemap.xml | grep -c '<url>'   # 114
```

## Notes

- Deploy status of the Dokploy connector: the MCP server returned **502** in the session of 2026-09-20.
  Reconnect it before relying on API-triggered deploys.
- `CACHE` version in `public/sw.js` — bump it when the HTML changes shape, so installed PWA clients update.
- Google needs a while: after the first deploy, submit `https://cigarreronline.se/sitemap.xml` in Search Console.

## The CMS (chat as CMS)

`cms/` holds a second small service: an MCP server that edits `content/*.json`, validates against the
same schema the site builds with, and publishes as one commit — which deploys the site. See
`cms/README.md` for its env vars, its Dokploy application and the Google Sheet mirror.

The content itself lives in `/content`:

| File | Holds |
| --- | --- |
| `products.json` | The catalogue: 55 products |
| `brands.json` | 25 brand pages |
| `guides.json` | 9 guide articles |
| `collections.json` | The category pages, including which products each lists |
| `schema.ts` | The rules. Shared by the site build and the CMS, so both reject the same mistakes |

Editing content is therefore never a code change: change JSON, rebuild, done.

## The forum

`forum/` is a third small service: server-rendered threads at `cigarreronline.se/forum/`, backed by
one SQLite file, moderated from chat through the CMS connector. Its own README covers the Dokploy
application (path routing on `/forum`), the env vars, the spam defences and the BBS-law duties that
come with running a public message board.

Three services, then, all from this one repo:

| Dokploy app | Dockerfile | Domain |
| --- | --- | --- |
| site | `Dockerfile` | cigarreronline.se |
| cms | `cms/Dockerfile` | cms.host4ai.se |
| forum | `forum/Dockerfile` | cigarreronline.se path `/forum` |

## Shipping changes from a Claude chat

Claude edits the repo through the GitHub connector. Small code changes go in as a diff:
`patches/<name>.patch` → the **Apply patch** workflow applies it, typechecks, builds, and commits
the result (or fails loudly and changes nothing). Then deploy from Dokploy.

## SEO, built in

| What | Where |
| --- | --- |
| Every page prerendered to static HTML (what Google sees = what users see) | `scripts/prerender.mjs` |
| Titles kept ≤ 60 chars, descriptions cut at word boundaries | `fitTitle`, `clip` in `src/lib/seo.tsx` |
| JSON-LD: WebSite, OnlineStore, BreadcrumbList, ItemList, Product + Offer (shipping, returns), Brand, Article, FAQPage | pages + `src/lib/seo.tsx` |
| One SVG image per product at `/img/produkt/<id>.svg`, listed in the image sitemap | `productImages()` in `src/entry-server.tsx` |
| `sitemap.xml` with real dates only (guides), `robots.txt` | `scripts/prerender.mjs` |
| Brand pages get facts and FAQ generated from the catalogue, so they never go stale | `brandFacts()` in `src/pages/Brands.tsx` |
| Caching per file type, security headers on every response, real 404s, one URL per page | `deploy/nginx.conf` |
| Content is validated at build time; the validator is not shipped to browsers | `content/schema.ts`, `content/model.ts` |
