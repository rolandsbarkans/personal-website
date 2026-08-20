#!/bin/bash
# prepare_moments.sh — turn photos off a phone into pictures the tent's
# torch can throw:
#
#     tools/prepare_moments.sh ~/Desktop/photos/*.HEIC
#
# then list the names it prints in js/data/moments.js.
#
# Each photo is centre-cropped to a square (the projector's frame is
# square), resized, and written to material/moments/ as a JPEG. The
# round trip through PNG in the middle is not incidental: PNG has
# nowhere to put an EXIF block, so the GPS coordinates a phone writes
# into every photo are gone by the time it comes back out as a JPEG.
#
# Never touches the originals, and never overwrites a moment it has
# already written, so running it twice over the same folder is safe.
# sips ships with macOS; nothing needs installing.

set -euo pipefail

# 1400 is sized for a 5K screen; the frame is a third of the window wide
# and behind a soft light, so more changes nothing you can point at.
LONG_SIDE=1400
QUALITY=80

# Relative to the repository root, so the script works from anywhere.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/material/moments"

if [ $# -eq 0 ]; then
  echo "usage: tools/prepare_moments.sh <photo> [photo ...]"
  echo "       tools/prepare_moments.sh ~/Desktop/trip/*.HEIC"
  exit 1
fi

mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

made=0
for src in "$@"; do
  if [ ! -f "$src" ]; then
    echo "  skipped (not a file):  $src"
    continue
  fi

  # Lowercased, spaces and underscores to dashes, always .jpg.
  base="$(basename "$src")"
  base="${base%.*}"
  name="$(echo "$base" | tr '[:upper:]' '[:lower:]' | tr ' _' '--').jpg"
  dest="$OUT/$name"

  if [ -e "$dest" ]; then
    echo "  already there, left alone:  material/moments/$name"
    continue
  fi

  # In as anything, out as PNG — this is the step that drops the EXIF.
  sips -s format png "$src" --out "$TMP/work.png" >/dev/null 2>&1

  # Centre-crop to a square, on whichever side is shorter.
  w="$(sips -g pixelWidth  "$TMP/work.png" | awk '/pixelWidth/  {print $2}')"
  h="$(sips -g pixelHeight "$TMP/work.png" | awk '/pixelHeight/ {print $2}')"
  side=$(( w < h ? w : h ))
  if [ "$w" -ne "$h" ]; then
    sips --cropToHeightWidth "$side" "$side" "$TMP/work.png" >/dev/null
  fi

  # Down only: an enlarged photo is a soft photo, and the light is
  # already soft.
  if [ "$side" -gt "$LONG_SIDE" ]; then
    sips --resampleHeightWidth "$LONG_SIDE" "$LONG_SIDE" "$TMP/work.png" >/dev/null
  fi

  sips -s format jpeg -s formatOptions "$QUALITY" "$TMP/work.png" --out "$dest" >/dev/null

  kb=$(( ($(stat -f%z "$dest") + 512) / 1024 ))
  echo "  material/moments/$name   ${kb}KB"
  made=$(( made + 1 ))
done

echo
echo "$made photo(s) written. Now add them to js/data/moments.js:"
echo
echo "  { src: 'material/moments/NAME.jpg', place: 'Sintra, Portugal',"
echo "    when: 'June 2025', alt: 'what is in the picture' },"
