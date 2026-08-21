#!/bin/sh
# Raise the cache stamp so a deploy reaches browsers at once. Cloudflare caches
# js and css for four hours whatever _headers says, so boot.js carries its own
# ?v= in every page and everything else is stamped from it.
set -e
cd "$(dirname "$0")/.."

now=$(grep -o "boot.js?v=[0-9]*" index.html | head -1 | cut -d= -f2)
next=$((now + 1))

for f in *.html; do
  sed -i '' "s|boot.js?v=$now|boot.js?v=$next|" "$f"
done
sed -i '' "s|: '$now';|: '$next';|" js/core/boot.js

echo "cache stamp $now -> $next"
