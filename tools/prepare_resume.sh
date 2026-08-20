#!/bin/bash
#
# Rebuild the two files made out of material/resume.pdf. Run it from the
# project root after replacing the PDF:
#
#     tools/prepare_resume.sh
#
#   material/resume_page.png   the picture on the notebook's paper. An
#                              <img> rather than an <embed> because
#                              Chrome composites its PDF viewer over the
#                              rest of the page — the bee flew behind the
#                              resume and the viewer ate the mouse.
#   material/resume_data.js    the PDF as base64, which is what the "grab
#                              a copy" button hands to the browser as a
#                              blob, so it downloads over file:// too.
#
# FORGETTING TO RUN THIS is the failure mode worth knowing about: a new
# PDF with a stale PNG means the site SHOWS the old resume and DOWNLOADS
# the new one, and nothing looks broken while it happens.
#
# The invisible link boxes over the header are positioned by hand in
# notebook.html; if the header has reflowed, tools/read_resume_links.py
# prints the new percentages.
#
# Page 1 only, rendered by Quick Look at 1700px — about twice the size
# the paper is ever drawn at, so it stays crisp on a retina screen.

set -e

cd "$(dirname "$0")/.."

if [ ! -f material/resume.pdf ]; then
  echo "material/resume.pdf not found — run this from the project root." >&2
  exit 1
fi

echo "rendering page 1 -> material/resume_page.png"
tmp=$(mktemp -d)
qlmanage -t -s 1700 -o "$tmp" material/resume.pdf >/dev/null 2>&1
mv "$tmp/resume.pdf.png" material/resume_page.png
rm -rf "$tmp"

echo "encoding the pdf -> material/resume_data.js"
python3 -c "import base64;d=base64.b64encode(open('material/resume.pdf','rb').read()).decode();open('material/resume_data.js','w').write('window.RESUME_PDF_BASE64 = ' + repr(d) + ';')"

echo "done. hard-refresh the notebook page to see it."
