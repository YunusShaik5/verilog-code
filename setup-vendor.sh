#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
archive_path="$project_dir/vendor-runtime.tar.gz"

if [ -d "$project_dir/vendor" ]; then
  echo "vendor/ already exists; nothing to restore."
  exit 0
fi

cat "$project_dir"/vendor-archive/vendor-runtime.tar.gz.part-* > "$archive_path"
tar -xzf "$archive_path" -C "$project_dir"
rm "$archive_path"

echo "Restored vendor/. Start the app with: python3 -m http.server 8000"
