# cigarreronline-forum

A small forum that lives at **cigarreronline.se/forum/** — same domain as the shop, so its threads
count towards the site rather than a separate one.

```
visitor ──▶ Traefik ──/forum/──▶ forum service (Node + SQLite)
                   └──everything else──▶ the static site
Claude ──MCP──▶ CMS connector ──admin API──▶ forum service   (reports, hide, ban, pin)
```

## What it is

- **Server-rendered HTML, no build step, no JavaScript needed.** Forms are plain HTML forms, so
  threads are crawlable, fast, and work even if a script fails.
- **Pseudonymous accounts.** A member picks a display name and gets a signed cookie. No password to
  leak, no email to store, nothing to reset. An email field can be added later without a migration.
- **One SQLite file** on a Docker volume. No database server to run or back up separately.
- **Structured data** on every thread (`DiscussionForumPosting`), its own `sitemap.xml`, referenced
  from the site's `robots.txt`.

## Spam and abuse defences

| Layer | What it stops |
| --- | --- |
| Hidden honeypot field | Nearly all simple bots |
| Minimum 3 seconds on the form | Scripted posting |
| Per-IP limits (3 threads/h, 10 replies/h, 3 accounts/day) | Flooding |
| No links until a member has 3 posts; then `rel="nofollow ugc"` | Link spam and SEO leakage |
| Keyword and link-count check | The obvious junk |
| Report button → moderation queue | Everything else, with a human deciding |

IP addresses are never stored — only a salted hash, only for the rate limits, deleted after 30 days.

## Moderating from chat

With the CMS connector attached, these work from any Claude surface including your phone:

- "vad är anmält i forumet?" → `forum_reports`
- "dölj inlägg 42" → `forum_hide`
- "fäst tråd 7" → `forum_pin`
- "stäng av konto 13" → `forum_ban`

## Deploy

In Dokploy: **Create Application** → same repo, build type **Dockerfile** at `forum/Dockerfile`
(context: repo root), port **8080**, a **volume at `/data`**, and the domain
`cigarreronline.se` with **path `/forum`** so it sits on the shop's domain. If path routing is
awkward, `forum.cigarreronline.se` works too — SEO is a little weaker, everything else is the same.

Environment:

```
SITE_URL=https://cigarreronline.se
ADMIN_TOKEN=<openssl rand -hex 24>     # also set as FORUM_ADMIN_TOKEN on the CMS service
IP_SALT=<openssl rand -hex 16>
FORUM_ADMIN_URL=http://cigarreronline-forum:8080/forum/admin   # set this one on the CMS service
```

## Your legal duties, in short

Sweden's **BBS-lagen** makes whoever runs a public message board responsible for supervising it and
removing posts that are clearly illegal — incitement, threats, unlawful violence, obvious copyright
infringement. Check the report queue regularly; that is what "supervision" means in practice. The
rules page states the 18-year limit, that private sales are not allowed, and how member data is
handled. Deletion requests go to info@cigarreronline.se, so that mailbox needs to exist and be read.

## Local development

```bash
cd forum
npm install
DB_FILE=/tmp/forum.db ADMIN_TOKEN=dev SITE_URL=http://localhost:4173 npm run dev
```
