#!/usr/bin/env bash
# Builds the site (prerendered HTML for every page) and publishes it to witty-hawk.
set -euo pipefail

HOST="witty-hawk"
REMOTE_DIR="/srv/sites/cigarreronline"
cd "$(dirname "$0")/.."

npm run build

ssh "$HOST" "mkdir -p $REMOTE_DIR/html $REMOTE_DIR/conf"
rsync -az --delete dist/ "$HOST:$REMOTE_DIR/html/"
rsync -az deploy/nginx.conf "$HOST:$REMOTE_DIR/conf/default.conf"
rsync -az deploy/traefik-cigarreronline.yml "$HOST:/etc/dokploy/traefik/dynamic/cigarreronline.yml"

ssh "$HOST" bash -s <<REMOTE
set -euo pipefail
if docker service inspect cigarreronline-web >/dev/null 2>&1; then
  docker service update --force --detach cigarreronline-web >/dev/null
else
  docker service create --detach --name cigarreronline-web \
    --network dokploy-network \
    --mount type=bind,source=$REMOTE_DIR/html,target=/usr/share/nginx/html,readonly \
    --mount type=bind,source=$REMOTE_DIR/conf/default.conf,target=/etc/nginx/conf.d/default.conf,readonly \
    --limit-memory 128M \
    nginx:1.29-alpine >/dev/null
fi
REMOTE
echo "Deployed."
