#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT_DIR/.tools/node-v22.14.0-darwin-arm64/bin:$PATH"

cd "$ROOT_DIR"
cp -n .env.example .env >/dev/null 2>&1 || true
npm run prisma:generate
RUST_LOG=error npm run prisma:dbpush
npm run seed
npm run test
npm run build
npm run lint
