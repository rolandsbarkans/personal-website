"""Build js/effects/flowers.js from illustrations/main/flowers.svg.

The artwork is 1359 flat <path> elements and perfectly regular: every
flower is 9 consecutive paths, 8 petals then a middle. This slices it into
those groups, gives each one a stem, and pastes the result into
templates/flowers_template.js.

    python3 build/build_flowers.py

Runs from any working directory; every path below is relative to this file.
"""
import re, math, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "illustrations" / "main" / "flowers.svg"   # the flat artwork
TEMPLATE = HERE / "templates" / "flowers_template.js"   # has a __MARKUP__ slot
OUT = ROOT / "js" / "effects" / "flowers.js"            # what the pages load

svg = SRC.read_text()
head = re.search(r"<svg[^>]*>", svg).group(0)
vb = re.search(r'viewBox="([^"]+)"', head).group(1).split()
VW, VH = float(vb[2]), float(vb[3])

paths = re.findall(r'<path\s+d="([^"]+)"\s+fill="([^"]+)"\s*/>', svg)
assert len(paths) % 9 == 0, len(paths)

num = re.compile(r"-?\d*\.?\d+(?:e-?\d+)?")


def pts(d):
    v = [float(x) for x in num.findall(d)]
    return list(zip(v[0::2], v[1::2]))


def fmt(x):
    s = f"{x:.2f}".rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"


def clean(d):
    """Round every coordinate to 2dp, which halves the embedded markup."""
    return num.sub(lambda m: fmt(float(m.group(0))), d)


flowers = []
for i in range(0, len(paths), 9):
    group = paths[i:i + 9]
    petals, center = group[:8], group[8]

    cpts = pts(center[0])
    cx = sum(p[0] for p in cpts) / len(cpts)
    cy = sum(p[1] for p in cpts) / len(cpts)

    allpts = [p for d, _ in group for p in pts(d)]
    bottom = max(p[1] for p in allpts)
    radius = max(math.hypot(p[0] - cx, p[1] - cy) for p in allpts)

    flowers.append(dict(idx=i // 9, cx=cx, cy=cy, bottom=bottom, r=radius,
                        paths=[(clean(d), f) for d, f in group]))

# Depth, which the artwork does not encode: SVG paints in document order, so
# sort by where each stem meets the soil and write them back to front. A
# flower further down the slope is nearer, so it covers the ones behind it —
# and it stays true while they grow, because roots do not move.
flowers.sort(key=lambda f: f["bottom"])

# Deterministic per-flower variation, keyed off the flower's ORIGINAL index
# so the sort above does not reshuffle who grows how.
def rnd(seed, salt):
    x = math.sin((seed + 1) * 12.9898 + salt * 78.233) * 43758.5453
    return x - math.floor(x)

parts = []
for f in flowers:
    i, cx, cy, r = f["idx"], f["cx"], f["cy"], f["r"]
    rise = r * (1.45 + rnd(i, 1) * 0.85)   # how far the head lifts
    bend = (rnd(i, 2) - 0.5) * r * 1.1     # sideways sway of the stem
    base = f["bottom"] + r * 0.15          # where the stem meets the soil
    tip_y = cy - rise

    # One quadratic: soil -> curved middle -> under the risen head.
    stem = (f'M{fmt(cx)} {fmt(base)}'
            f'Q{fmt(cx + bend)} {fmt((base + tip_y) / 2)} '
            f'{fmt(cx)} {fmt(tip_y + r * 0.4)}')

    body = "".join(f'<path d="{d}" fill="{fill}"/>' for d, fill in f["paths"])
    parts.append(
        f'<g class="flower" style="--rise:{fmt(rise)}px;'
        f'--dur:{0.34 + rnd(i, 3) * 0.3:.2f}s;--delay:{rnd(i, 4) * 0.06:.3f}s">'
        f'<path class="stem" d="{stem}"/>'
        f'<g class="head">{body}</g></g>'
    )

markup = f'{head}{"".join(parts)}</svg>'
OUT.write_text(TEMPLATE.read_text().replace("__MARKUP__", markup))
print(f"wrote {OUT.name}: {len(flowers)} flowers, {OUT.stat().st_size/1024:.0f} KB")
