/* Decides what the pointer is actually on: a .hotspot is hovered only over its artwork, hit-tested against a mask read from the alpha channel. `decor` wobbles once instead of holding the swell. data-hit="box" opts out; data-hotspot-pass lets a child's clicks through. Fires hotspot:lit, hotspot:unlit and hotspot:nudge. */

(function () {
  const scene = document.querySelector('.scene');
  if (!scene) return;

  const ALPHA_FLOOR = 25;   // below this the artwork counts as empty
  const FORGIVE = 2;        // mask pixels of slack around thin shapes
  const MASK_SIZE = 256;    // mask resolution on the longer side

  // A fast pointer jumps tens of pixels, so walk the line it travelled.
  const PATH_STEP = 10;
  const PATH_MAX = 48;

  const DEFAULT_ORIGIN = '50% 100%';

  const hotspots = [];

  document.querySelectorAll('.hotspot').forEach((el) => {
    const img = el.querySelector('img');

    const decor = el.classList.contains('decor');

    if (el.dataset.hit === 'box') {
      hotspots.push({ el: el, img: img, mask: 'all', w: 0, h: 0, decor: decor });
      return;
    }

    if (!img) {
      if (!el.querySelector('svg')) return;
      hotspots.push({ el: el, img: null, mask: 'svg', w: 0, h: 0, decor: decor });
      return;
    }

    const spot = { el: el, img: img, mask: null, w: 0, h: 0, decor: decor };
    hotspots.push(spot);

    if (img.complete && img.naturalWidth) buildMask(spot);
    else img.addEventListener('load', () => buildMask(spot), { once: true });
  });

  function buildMask(spot) {
    const src = spot.img;
    const ratio = src.naturalHeight / src.naturalWidth;
    const w = ratio > 1 ? Math.round(MASK_SIZE / ratio) : MASK_SIZE;
    const h = Math.max(1, Math.round(w * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const step = FORGIVE || 1;
    for (let dx = -FORGIVE; dx <= FORGIVE; dx += step) {
      for (let dy = -FORGIVE; dy <= FORGIVE; dy += step) {
        ctx.drawImage(src, dx, dy, w, h);
      }
    }

    let data;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
    } catch (e) {

      console.warn(
        'hotspots.js: cannot read the artwork\'s pixels, so ' +
        (spot.el.classList[0] || 'a hotspot') +
        ' falls back to its rectangle. Serve the site over http (see the ' +
        'note by the script tags in main.html) to get shape-accurate hover.'
      );
      spot.mask = 'all';
      return;
    }

    const mask = new Uint8Array(w * h);
    let minX = w, maxX = -1, maxY = -1;
    for (let i = 0, p = 3; i < mask.length; i++, p += 4) {
      if (data[p] < ALPHA_FLOOR) continue;
      mask[i] = 1;
      const x = i % w;
      const y = (i - x) / w;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    spot.mask = mask;
    spot.w = w;
    spot.h = h;

    if (maxY < 0) return;
    const authored = getComputedStyle(spot.el).getPropertyValue('--origin').trim();
    if (authored && authored !== DEFAULT_ORIGIN) return;
    const cx = (((minX + maxX) / 2 + 0.5) / w) * 100;
    const cy = ((maxY + 1) / h) * 100;
    spot.el.style.setProperty('--origin', cx.toFixed(1) + '% ' + cy.toFixed(1) + '%');
  }

  function isOverArtwork(spot, clientX, clientY) {
    if (!spot.mask) return false;

    if (spot.mask === 'svg') {
      const hit = document.elementFromPoint(clientX, clientY);
      if (!hit || !spot.el.contains(hit)) return false;

      return !!hit.ownerSVGElement;
    }

    const rect = spot.el.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const fx = (clientX - rect.left) / rect.width;
    const fy = (clientY - rect.top) / rect.height;
    if (fx < 0 || fx >= 1 || fy < 0 || fy >= 1) return false;
    if (spot.mask === 'all') return true;
    const x = Math.min(spot.w - 1, (fx * spot.w) | 0);
    const y = Math.min(spot.h - 1, (fy * spot.h) | 0);
    return spot.mask[y * spot.w + x] === 1;
  }

  let lit = null;

  // Released until the pointer leaves — the tent uses it so putting the torch out does not re-light it.
  let held = null;

  window.Hotspots = {
    release: function () {
      if (!lit) return;
      held = lit;
      light(null);
    }
  };

  function nudge(spot, cause) {
    const el = spot.el;
    if (el.classList.contains('nudged')) {
      if (cause !== 'click') return;

      el.classList.remove('nudged');
      void el.offsetWidth;
    }
    el.classList.add('nudged');

    clearTimeout(spot.nudgeTimer);
    spot.nudgeTimer = setTimeout(() => el.classList.remove('nudged'), 2000);
    el.dispatchEvent(new CustomEvent('hotspot:nudge', {
      bubbles: true,
      detail: { cause: cause }
    }));
  }

  scene.addEventListener('animationend', (e) => {
    if (e.animationName !== 'hotspot-nudge-x') return;
    const el = e.target.closest && e.target.closest('.hotspot');
    if (el) el.classList.remove('nudged');
  });

  // The last match wins: collected in document order, so the top thing is the one pointed at.
  function at(clientX, clientY) {

    let found = null;
    for (const spot of hotspots) {
      if (isOverArtwork(spot, clientX, clientY)) found = spot;
    }

    if (found && found.decor) {
      nudge(found, 'move');
      found = null;
    }

    if (held) {
      if (found === held) found = null;
      else held = null;
    }
    light(found);
  }

  function light(spot) {
    if (spot === lit) return;
    if (lit) {
      lit.el.classList.remove('lit');
      lit.el.dispatchEvent(new CustomEvent('hotspot:unlit', { bubbles: true }));
    }
    lit = spot;
    if (lit) {
      lit.el.classList.add('lit');
      lit.el.dispatchEvent(new CustomEvent('hotspot:lit', { bubbles: true }));
    }
  }

  let lastX = null, lastY = null;

  function track(clientX, clientY) {

    // The bee's bubble holds the scene still, the same way a modal does.
    if (scene.classList.contains('modal-open') ||
        document.documentElement.classList.contains('bee-talking')) {
      light(null);
      lastX = lastY = null;
      return;
    }
    if (lastX !== null) {
      const dx = clientX - lastX;
      const dy = clientY - lastY;
      const steps = Math.min(PATH_MAX, Math.ceil(Math.hypot(dx, dy) / PATH_STEP));
      for (let i = 1; i < steps; i++) {
        at(lastX + (dx * i) / steps, lastY + (dy * i) / steps);
      }
    }
    lastX = clientX;
    lastY = clientY;
    at(clientX, clientY);
  }

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const points = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (points && points.length) {
      for (const p of points) track(p.clientX, p.clientY);
    } else {
      track(e.clientX, e.clientY);
    }
  });

  document.addEventListener('mouseleave', () => {
    light(null);
    lastX = lastY = null;
  });

  scene.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    let found = null;
    for (const spot of hotspots) {
      if (isOverArtwork(spot, e.clientX, e.clientY)) found = spot;
    }
    if (!found || !found.decor) return;
    nudge(found, 'click');
  });

  // Swallow clicks in a hotspot's box but off its artwork, so a door only opens by its own artwork.
  scene.addEventListener('click', (e) => {
    const el = e.target.closest('.hotspot');
    if (!el) return;
    if (e.target.closest('[data-hotspot-pass]')) return;
    const spot = hotspots.find((s) => s.el === el);
    if (spot && isOverArtwork(spot, e.clientX, e.clientY)) return;
    e.stopPropagation();
    e.preventDefault();
  }, true);
})();
