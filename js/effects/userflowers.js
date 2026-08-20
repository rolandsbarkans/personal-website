/* The three kinds of wildflower and the pad one is repainted on in draw.html. Load BEFORE flowers.js, which hands over the artwork as soon as it is built. Repainting a kind is nine custom properties, not 1359 fills. */

(function () {
  'use strict';

  var UF = (window.UserFlowers = window.UserFlowers || {});
  var NS = 'http://www.w3.org/2000/svg';

  var PETALS = 8;

  // One flower's nine shapes from the artwork: eight petals then the middle disc, in a 100x100 box.
  var FLOWER_D = [
    'M59.19 69.7C59.15 67.36,54.71 49.84,50.02 50C45.29 50.16,42.08 67.94,42.16 70.28C42.25 72.62,46.15 75.17,50.88 75.01C55.57 74.85,59.32 72.05,59.19 69.7Z',
    'M84.7 59.91C81.32 58.39,53.27 48.23,50.02 50C46.73 51.77,69.48 64.81,72.85 66.37C76.22 67.94,82.68 68.22,85.97 66.45C89.22 64.64,88.07 61.48,84.7 59.91Z',
    'M89.84 44.32C85.15 44.49,49.94 47.66,50.02 50C50.06 52.34,85.44 53,90.13 52.84C94.86 52.67,100.08 50.62,100 48.23C99.92 45.89,94.53 44.16,89.84 44.32Z',
    'M71.66 32.07C68.41 33.83,46.61 48.44,50.02 50C53.39 51.52,80.63 39.43,83.92 37.66C87.21 35.89,88.11 32.64,84.74 31.08C81.37 29.51,74.95 30.3,71.66 32.07Z',
    'M40.77 30.3C40.85 32.64,45.29 50.16,50.02 50C54.71 49.84,57.92 32.07,57.84 29.72C57.75 27.33,53.85 24.83,49.12 24.99C44.43 25.15,40.68 27.95,40.77 30.3Z',
    'M15.3 40.05C18.68 41.61,46.73 51.77,50.02 50C53.27 48.23,30.52 35.15,27.15 33.63C23.78 32.07,17.32 31.78,14.03 33.55C10.78 35.31,11.93 38.52,15.3 40.05Z',
    'M10.16 55.64C14.85 55.47,50.06 52.34,50.02 50C49.94 47.66,14.56 46.96,9.87 47.12C5.14 47.29,-0.08 49.38,0 51.73C0.08 54.07,5.47 55.8,10.16 55.64Z',
    'M28.34 67.94C31.63 66.13,53.39 51.52,50.02 50C46.61 48.44,19.33 60.53,16.08 62.3C12.83 64.11,11.89 67.36,15.26 68.92C18.68 70.44,25.09 69.7,28.34 67.94Z',
    'M62.2 49.55C62.07 46.17,56.52 43.67,49.77 43.87C43.03 44.12,37.68 47.04,37.8 50.41C37.93 53.78,43.48 56.33,50.23 56.09C56.97 55.88,62.32 52.96,62.2 49.55Z'
  ];

    /* The flowers lie on sloping ground, so each is squashed to half height; the pad divides that back out and SQUASH puts it back. */
  var SQUASH = 0.5;

  // Un-squash one path: leave x alone, stretch y about the centre.
  function faceOn(d) {
    if (!/^[MCZ\s\d.,-]+$/.test(d)) return d;
    var n = 0;
    return d.replace(/-?\d*\.?\d+/g, function (tok) {
      if (n++ % 2 === 0) return tok;
      var y = 50 + (parseFloat(tok) - 50) / SQUASH;
      return String(Math.round(y * 100) / 100);
    });
  }

  var FLAT_D = FLOWER_D.map(faceOn);

  var SPOKE = 360 / PETALS;

  function points(d) {
    var v = d.match(/-?\d*\.?\d+/g) || [];
    var out = [];
    for (var i = 0; i + 1 < v.length; i += 2) {
      out.push([parseFloat(v[i]), parseFloat(v[i + 1])]);
    }
    return out;
  }

  function spin(pts, deg) {
    var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return pts.map(function (p) {
      var x = p[0] - 50, y = p[1] - 50;
      return [50 + x * c - y * s, 50 + x * s + y * c];
    });
  }

  function tipAngle(pts) {
    var best = -1, ang = 0;
    pts.forEach(function (p) {
      var dx = p[0] - 50, dy = p[1] - 50, r = dx * dx + dy * dy;
      if (r > best) { best = r; ang = Math.atan2(dy, dx) * 180 / Math.PI; }
    });
    return (ang + 360) % 360;
  }

  function fmt(n) {
    return String(Math.round(n * 100) / 100);
  }

  function toPath(pts) {
    var d = 'M' + fmt(pts[0][0]) + ' ' + fmt(pts[0][1]);
    for (var i = 1; i + 2 < pts.length + 1 && i + 2 <= pts.length - 1; i += 3) {
      d += 'C' + [pts[i], pts[i + 1], pts[i + 2]].map(function (p) {
        return fmt(p[0]) + ' ' + fmt(p[1]);
      }).join(',');
    }
    return d + 'Z';
  }

    /* One petal drawn eight times, the node-by-node average of the artwork's own eight: un-squashing makes a flower round, not symmetrical. */
  function meanPetal() {
    var laid = [], n = null, i;
    for (i = 0; i < PETALS; i++) {
      if (!/^M(C[^CZ]*){4}Z$/.test(FLAT_D[i].replace(/[-\d.,\s]/g, ''))) return null;
      var pts = points(FLAT_D[i]);
      if (n === null) n = pts.length;
      if (pts.length !== n) return null;
      laid.push(spin(pts, 90 - tipAngle(pts)));
    }
    var mean = [];
    for (i = 0; i < n; i++) {
      var x = 0, y = 0;
      laid.forEach(function (p) { x += p[i][0]; y += p[i][1]; });
      mean.push([x / PETALS, y / PETALS]);
    }
    return toPath(mean);
  }

  var MEAN_D = meanPetal();

  // The three kinds and their drawn colours. The key goes in the class name and in storage.
  var TYPES = [
    { key: 'white',  petal: '#FAFAFA', middle: '#FFB74D' },
    { key: 'yellow', petal: '#FAE06C', middle: '#FFB74D' },
    { key: 'rose',   petal: '#FC7F7F', middle: '#FFDCA9' }
  ];

  var PAPER = '#FAFAFA';
  var LINE = '#61700a';
  var LINE_W = 0.6;

  var STORE = 'campsiteFlowerStyles';

  var REGIONS = FLAT_D.map(function (d, i) {
    if (!MEAN_D || i >= PETALS) return { d: d, rot: 0 };
    return { d: MEAN_D, rot: -SPOKE * i };
  });

  function turn(region) {
    return region.rot ? ' transform="rotate(' + region.rot + ' 50 50)"' : '';
  }

  function regionMarkup(i, fills) {
    var r = REGIONS[i];
    var colour = (fills && fills[i]) || PAPER;
    return '<path class="uf-region" data-region="' + i + '" d="' + r.d + '"' +
      turn(r) + ' fill="' + colour + '"/>';
  }

  UF.regionsMarkup = function (fills) {
    return REGIONS.map(function (r, i) { return regionMarkup(i, fills); }).join('');
  };

  // The outline. Petals are clipped to everything outside the middle disc, so no edge crosses it.
  UF.edgesMarkup = function (cutId) {
    var core = REGIONS[REGIONS.length - 1];
    var line = ' fill="none" stroke="' + LINE + '" stroke-width="' + LINE_W +
      '" stroke-linejoin="round"';

    var petals = REGIONS.slice(0, -1).map(function (r) {
      return '<path d="' + r.d + '"' + turn(r) + line + '/>';
    }).join('');

    return '<g clip-path="url(#' + cutId + ')">' + petals + '</g>' +
      '<path d="' + core.d + '"' + turn(core) + line + '/>';
  };

  // Everything outside the middle disc, so neither the outline nor a repainted petal spills across it.
  UF.cutMarkup = function (id) {
    var core = REGIONS[REGIONS.length - 1];
    return '<clipPath id="' + id + '">' +
      '<path clip-rule="evenodd" d="M-200 -200H300V300H-200Z' + core.d + '"/>' +
      '</clipPath>';
  };

  UF.clipMarkup = function (id) {
    return '<clipPath id="' + id + '">' + REGIONS.map(function (r) {
      return '<path d="' + r.d + '"' + turn(r) + '/>';
    }).join('') + '</clipPath>';
  };

  UF.inkMarkup = function (marks) {
    if (!marks) return '';
    return marks.map(function (m) {
      return (m.g || []).map(function (run) {
        return '<polyline points="' + run.map(function (p) {
          return p.x + ',' + p.y;
        }).join(' ') + '" fill="none" stroke="' + m.c + '" stroke-width="' + m.w +
          '" stroke-linecap="round" stroke-linejoin="round"/>';
      }).join('');
    }).join('');
  };

    /* The drawing in the order it was made: a fill covers a region, so it goes over earlier strokes and under later ones. rec.c[i] is how many strokes were down when region i was filled. */
  UF.layerPlan = function (rec) {
    var marks = (rec && rec.m) || [];
    var cuts = (rec && rec.c) || [];
    var plan = [];
    var from = 0;

    for (var n = 1; n <= marks.length; n++) {
      var over = [];
      for (var i = 0; i < REGIONS.length; i++) {
        if ((cuts[i] || 0) === n) over.push(i);
      }
      if (!over.length) continue;
      plan.push({ ink: marks.slice(from, n) });
      plan.push({ fill: over });
      from = n;
    }

    plan.push({ ink: marks.slice(from) });
    return plan;
  };

  UF.bodyMarkup = function (rec, id) {
    var fills = rec && rec.f;

    // The bottom layer is every region in its final colour; a region repainted later is drawn twice, and the second hides the ink.
    var out = '<g class="uf-regions">' + UF.regionsMarkup(fills) + '</g>';

    UF.layerPlan(rec).forEach(function (layer) {
      if (layer.ink) {
        out += '<g class="uf-ink" clip-path="url(#' + id + ')">' +
          UF.inkMarkup(layer.ink) + '</g>';
        return;
      }
      out += '<g class="uf-regions">' + layer.fill.map(function (i) {
        var path = regionMarkup(i, fills);
        return i < PETALS
          ? '<g clip-path="url(#' + id + '-cut)">' + path + '</g>'
          : path;
      }).join('') + '</g>';
    });

    return out + '<g class="uf-edges">' + UF.edgesMarkup(id + '-cut') + '</g>';
  };

  UF.flowerMarkup = function (rec, id) {
    return '<defs>' + UF.clipMarkup(id) + UF.cutMarkup(id + '-cut') + '</defs>' +
      UF.bodyMarkup(rec, id);
  };

  UF.blank = function () {
    return {
      f: [null, null, null, null, null, null, null, null, null],
      m: [],
      c: [0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
  };

  UF.TYPES = TYPES;
  UF.REGIONS = REGIONS;
  UF.PETALS = PETALS;
  UF.PAPER = PAPER;

  UF.defaults = function (key) {
    var type = byKey(key);
    if (!type) return UF.blank().f;
    var out = [];
    for (var i = 0; i < PETALS; i++) out.push(type.petal);
    out.push(type.middle);
    return out;
  };

  function byKey(key) {
    for (var i = 0; i < TYPES.length; i++) {
      if (TYPES[i].key === key) return TYPES[i];
    }
    return null;
  }

    // Drawings saved before the pad was un-squashed are half as tall; upgrade() stretches them.
  var VERSION = 2;

  function upgrade(rec) {
    if (!rec || rec.v === VERSION) return rec;
    (rec.m || []).forEach(function (mark) {
      (mark.g || []).forEach(function (run) {
        run.forEach(function (p) {
          p.y = Math.round((50 + (p.y - 50) / SQUASH) * 100) / 100;
        });
      });
    });
    rec.v = VERSION;
    return rec;
  }

  UF.load = function () {
    var raw;
    try {
      raw = JSON.parse(localStorage.getItem(STORE) || '{}');
    } catch (err) {
      return {};
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    var out = {};
    Object.keys(raw).forEach(function (key) {
      var rec = raw[key];
      if (!rec || !Array.isArray(rec.f) || !Array.isArray(rec.m)) return;
      if (!byKey(key)) return;
      out[key] = upgrade(rec);
    });
    return out;
  };

  UF.save = function (styles) {
    Object.keys(styles || {}).forEach(function (key) {
      if (styles[key]) styles[key].v = VERSION;
    });
    try {
      localStorage.setItem(STORE, JSON.stringify(styles));
    } catch (err) {

    }
  };

  var SHEET_ID = 'uf-type-styles';

    // Twenty-seven rules, nine regions per kind, each reading a custom property that falls back to the drawn colour.
  function installSheet(doc) {
    if (doc.getElementById(SHEET_ID)) return;
    var css = ['.flower .head > path { transition: fill var(--uf-fade, 0ms) linear; }'];
    TYPES.forEach(function (type) {
      for (var i = 0; i < REGIONS.length; i++) {
        var own = i < PETALS ? type.petal : type.middle;

        css.push('.flower.uf-' + type.key + ' .head > path:nth-of-type(' + (i + 1) + ')' +
          ' { fill: var(--uf-' + type.key + '-' + i + ', ' + own + '); }');
      }
    });
    var el = doc.createElement('style');
    el.id = SHEET_ID;
    el.textContent = css.join('\n');
    (doc.head || doc.documentElement).appendChild(el);
  }

  UF.typeOf = function (flower) {
    var head = flower.querySelector ? flower.querySelector('.head') : null;

    var first = head && head.querySelector('path');
    var fill = first && first.getAttribute('fill');
    if (!fill) return null;
    fill = fill.toUpperCase();
    for (var i = 0; i < TYPES.length; i++) {
      if (TYPES[i].petal.toUpperCase() === fill) return TYPES[i].key;
    }
    return null;
  };

  var RING_W = 0.055;

    // The outline that lights up when a kind is pointed at. Petals only: the disc would be a blob.
  function ringFor(flower) {
    if (flower.__ufRing) return;
    flower.__ufRing = true;

    var head = flower.querySelector('.head');
    if (!head) return;

    var box = flower.__ufBox;
    if (!box) {
      try { box = head.getBBox(); } catch (err) { return; }
      if (!box || !box.width) return;
      flower.__ufBox = box;
    }

    var paths = [];
    Array.prototype.forEach.call(head.children, function (el) {
      if (el.tagName === 'path') paths.push(el);
    });
    if (paths.length < 2) return;

    var w = box.width * RING_W;
    var ring = document.createElementNS(NS, 'g');
    ring.setAttribute('class', 'uf-ring');
    ring.style.setProperty('--ring-w', w);
    ring.setAttribute('stroke-width', w);
    ring.innerHTML = paths.slice(0, -1).map(function (p) {
      return '<path d="' + p.getAttribute('d') + '"/>';
    }).join('');

    head.insertBefore(ring, head.firstChild);
  }

  UF.ringAll = function (svg) {
    if (!svg) return;
    Array.prototype.forEach.call(svg.querySelectorAll('.flower'), ringFor);
  };

  function tag(svg) {
    if (svg.__ufTagged) return;
    svg.__ufTagged = true;
    Array.prototype.forEach.call(svg.querySelectorAll('.flower'), function (el) {
      var key = UF.typeOf(el);
      if (key) el.classList.add('uf-' + key);
    });
  }

    // The flower's nine shapes, in the order the sheet's rules count them.
  function headPaths(head) {
    var out = [];
    Array.prototype.forEach.call(head.children, function (el) {
      if (el.tagName === 'path' && el.getAttribute('d')) out.push(el);
    });
    return out;
  }

  function defsFor(svg) {
    var defs = svg.__ufDefs;
    if (!defs) {
      defs = document.createElementNS(NS, 'defs');
      defs.setAttribute('class', 'uf-fences');
      svg.insertBefore(defs, svg.firstChild);
      svg.__ufDefs = defs;
    }
    return defs;
  }

  function clipOnto(svg, id, inner) {
    var clip = document.createElementNS(NS, 'clipPath');
    clip.setAttribute('id', id);
    clip.innerHTML = inner;
    defsFor(svg).appendChild(clip);
  }

    // Two clipPaths in the flower's own shape: the fence, so a drawing cannot spill past the petals, and the disc cut, so a repainted petal stops at the middle. Cut once per flower.
  function fenceFor(svg, flower, head, index) {
    var id = 'uf-fence-' + index;
    if (flower.__ufFence) return id;

    var paths = headPaths(head);
    if (!paths.length) return null;

    clipOnto(svg, id, paths.map(function (p) {
      return '<path d="' + p.getAttribute('d') + '"/>';
    }).join(''));

    var box = flower.__ufBox;
    var core = paths[paths.length - 1].getAttribute('d');
    // A box big enough to be everywhere, in the flower's own coordinates.
    var room = [box.x - box.width, box.y - box.height,
                box.x + box.width * 2, box.y + box.height * 2];
    clipOnto(svg, id + '-cut',
      '<path clip-rule="evenodd" d="M' + room[0] + ' ' + room[1] +
      'H' + room[2] + 'V' + room[3] + 'H' + room[0] + 'Z' + core + '"/>');

    flower.__ufFence = true;
    return id;
  }

  function inkOnto(svg, flower, index, rec, ms) {
    var head = flower.querySelector('.head');
    if (!head) return;

    var old = head.querySelector('.uf-field-ink');
    var marks = rec && rec.m && rec.m.length ? rec.m : null;

    if (old) {
      if (ms) {
        old.style.opacity = '0';
        setTimeout(function () {
          if (old.parentNode) old.remove();
        }, ms + 40);
      } else {
        old.remove();
      }
    }
    if (!marks) return;

    var box = flower.__ufBox;
    if (!box) {
      try { box = head.getBBox(); } catch (err) { return; }
      if (!box || !box.width) return;
      flower.__ufBox = box;
    }

    var id = fenceFor(svg, flower, head, index);
    if (!id) return;

    // The pad's box laid onto this flower's, which is how a round drawing lands as an ellipse.
    var into = '<g transform="translate(' + box.x + ' ' + box.y + ')' +
      ' scale(' + (box.width / 100) + ' ' + (box.height / 100) + ')">';

    // A fill made after a stroke has to hide it here too, so a repaint is the artwork's own path drawn again over the ink.
    var paths = headPaths(head);

    var html = '';
    UF.layerPlan(rec).forEach(function (layer) {
      if (layer.ink) {
        if (layer.ink.length) html += into + UF.inkMarkup(layer.ink) + '</g>';
        return;
      }
      html += layer.fill.map(function (i) {
        if (!paths[i]) return '';
        var path = '<path d="' + paths[i].getAttribute('d') + '" fill="' +
          (rec.f[i] || PAPER) + '"/>';
        return i < PETALS
          ? '<g clip-path="url(#' + id + '-cut)">' + path + '</g>'
          : path;
      }).join('');
    });

    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'uf-field-ink');
    g.setAttribute('clip-path', 'url(#' + id + ')');
    g.innerHTML = html;

    if (ms) {
      g.style.opacity = '0';
      g.style.transition = 'opacity ' + ms + 'ms linear';
    }
    head.appendChild(g);
    if (ms) {
      void g.getBoundingClientRect();
      g.style.opacity = '1';
    }
  }

  // Repaint every flower of one kind. `ms` fades the change in; 0 cuts.
  UF.paint = function (svg, key, rec, ms) {
    if (!svg || !byKey(key)) return;
    ms = ms || 0;

    svg.style.setProperty('--uf-fade', ms + 'ms');

    for (var i = 0; i < REGIONS.length; i++) {
      var name = '--uf-' + key + '-' + i;
      if (rec) svg.style.setProperty(name, rec.f[i] || PAPER);
      else svg.style.removeProperty(name);
    }

    var all = svg.querySelectorAll('.flower');
    for (var n = 0; n < all.length; n++) {
      if (all[n].classList.contains('uf-' + key)) inkOnto(svg, all[n], n, rec, ms);
    }

    if (ms) {
      clearTimeout(svg.__ufFadeTimer);
      svg.__ufFadeTimer = setTimeout(function () {
        svg.style.setProperty('--uf-fade', '0ms');
      }, ms + 60);
    }
  };

  // Called by flowers.js once the patch exists: install the rules, tag each flower, apply saved colours.
  UF.applyTo = function (svg) {
    if (!svg) return;
    installSheet(svg.ownerDocument || document);
    tag(svg);
    var styles = UF.load();
    Object.keys(styles).forEach(function (key) {
      UF.paint(svg, key, styles[key], 0);
    });
  };
})();
