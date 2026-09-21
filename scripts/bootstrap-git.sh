#!/usr/bin/env bash
# One-time: put this project on GitHub as the source of truth.
# Run on the Mac (it has the GitHub login). Usage: ./scripts/bootstrap-git.sh
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="cigarreronline"

git init -b main 2>/dev/null || true
git add -A
git commit -m "CigarrerOnline: rebrand, prerendered pages, SEO site structure" || true

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --private --source=. --remote=origin --push
else
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "$(gh repo view "$REPO" --json sshUrl -q .sshUrl)"
  git push -u origin main
fi
echo "Repo: $(gh repo view "$REPO" --json url -q .url)"
