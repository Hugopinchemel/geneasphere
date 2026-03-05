#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$DEPLOY_DIR/deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=== Deploy started ==="

cd "$DEPLOY_DIR"

log "Pulling latest code..."
git pull origin master

log "Installing dependencies..."
pnpm install --frozen-lockfile

log "Building app..."
pnpm build

log "Linking mailer package into output node_modules..."
mkdir -p .output/server/node_modules
ln -sfn /home/debian/mailer .output/server/node_modules/mailer

log "Reloading PM2 (zero-downtime)..."
pm2 reload geneasphere --update-env

log "=== Deploy complete ==="
