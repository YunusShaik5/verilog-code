#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$project_dir"

bash setup-vendor.sh
mkdir -p public

cp index.html styles.css app.js core.js examples.js engine.js engine-worker.js THIRD_PARTY_NOTICES.txt public/
cp -R vendor public/vendor

echo "Vercel output prepared in public/."
