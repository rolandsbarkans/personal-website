#!/usr/bin/env python3
"""Print where the links in material/resume.pdf sit, as percentages.

The resume is drawn on the notebook as a flat picture, so notebook.html
lays an invisible box over each link by hand. Those boxes come from the
PDF's own /Annot rects — run this after a resume whose header has moved,
and paste the numbers into the .resume-link rules.

    python3 tools/read_resume_links.py
"""

import re
import zlib

PDF = 'material/resume.pdf'


def chunks(data):
    """The file itself, plus every stream in it that inflates — annotations
    can live in a compressed object stream."""
    yield data
    for m in re.finditer(rb'stream\r?\n', data):
        start = m.end()
        end = data.find(b'endstream', start)
        try:
            yield zlib.decompress(data[start:end])
        except zlib.error:
            pass


def main():
    data = open(PDF, 'rb').read()
    box = re.search(rb'/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)', data)
    pw, ph = (float(box.group(1)), float(box.group(2))) if box else (612.0, 792.0)

    for chunk in chunks(data):
        # An annotation writes its rect before its action, so pairing them
        # in document order is enough.
        rects = [m.group(1) for m in re.finditer(rb'/Rect\s*\[([^\]]*)\]', chunk)]
        uris = [m.group(1) for m in re.finditer(rb'/URI\s*\(([^)]*)\)', chunk)]
        for rect, uri in zip(rects, uris):
            x0, y0, x1, y1 = [float(v) for v in rect.split()]
            print('%-52s left: %.2f%%; width: %.2f%%; top: %.2f%%; height: %.2f%%' % (
                uri.decode('latin1'),
                x0 / pw * 100, (x1 - x0) / pw * 100,
                (ph - y1) / ph * 100, (y1 - y0) / ph * 100))


if __name__ == '__main__':
    main()
