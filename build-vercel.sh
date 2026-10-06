#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$project_dir"

bash setup-vendor.sh
mkdir -p public

cp index.html styles.css app.js core.js examples.js lab-programs.js all-lab-programs.md engine.js engine-worker.js THIRD_PARTY_NOTICES.txt public/
mkdir -p public/vendor
cp -R vendor/. public/vendor/

echo "Vercel output prepared in public/."
