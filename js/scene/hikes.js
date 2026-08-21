/* The guestbook map: other people's hikes, and the pin for leaving one. Styling is css/scene/hikes.css. */

(function () {
  'use strict';

  /* Put a Stadia key in js/data/mapkey.js to get Stamen Watercolor; without
     one the map falls back to CARTO, which needs no key. The key is a public
     browser key — Stadia authorises it by domain, not by secrecy. */
  var STADIA = (window.STADIA_KEY || '').trim();

  var TILES = STADIA
    ? 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=' + STADIA
    : 'https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

  var CREDIT = STADIA
    ? '&copy; Stadia Maps &copy; Stamen &copy; OpenStreetMap'
    : '&copy; OpenStreetMap &copy; CARTO';

  /* Place names on their own, over whichever base is in use. The lighter set
     sits better on watercolour; both are CARTO and need no key. */
  var LABELS = STADIA
    ? 'https://basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}{r}.png'
    : 'https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';

  var MAX_Z = STADIA ? 14 : 16;

  var API = '/api/hikes';
  var LOCAL_KEY = 'campsiteMyHikes';

  var PIN =
    '<svg viewBox="0 0 100 140">' +
      '<path class="pin-body" d="M50 4C26 4 8 22 8 46c0 30 34 62 42 90 8-28 42-60 42-90 0-24-18-42-42-42z"/>' +
      '<circle class="pin-eye" cx="50" cy="45" r="15"/>' +
    '</svg>';

  var Hikes = (window.Hikes = {});

  var dim, panel, stage, mapEl, hint, ghost, formDim, card, addBtn;
  var titleIn, noteIn, nameIn, nameRow, anonBox, errOut, submitBtn;
  var countryIn, countryRow, turnstileBox;
  var map = null, built = false;
  var WORLD = null;
  var placing = false, dropped = null, sending = false, asking = false;
  var marks = [];

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function cross() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 5 L19 19 M19 5 L5 19" fill="none" stroke="currentColor"' +
      ' stroke-width="3.4" stroke-linecap="round"/></svg>';
  }

  function build() {
    if (built) return;
    built = true;

    dim = el('div', 'hike-dim');
    dim.addEventListener('click', close);

    panel = el('div', 'hike-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Favourite hikes');
    panel.tabIndex = -1;

    var closeBtn = el('button', 'hike-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = cross();
    closeBtn.addEventListener('click', close);

    stage = el('div', 'hike-stage');
    mapEl = el('div', 'hike-map');

    addBtn = el('button', 'hike-btn hike-add');
    addBtn.type = 'button';
    addBtn.textContent = 'add a hike';
    addBtn.addEventListener('click', function () { placing ? disarm() : arm(); });

    hint = el('div', 'hike-hint');
    hint.innerHTML = 'click the map where your hike is &nbsp;·&nbsp; scroll to zoom &nbsp;·&nbsp; ' +
                     '<kbd>esc</kbd> to stop';

    var zoomBox = el('div', 'hike-zoom');
    var zin = el('button'); zin.type = 'button'; zin.textContent = '+';
    zin.setAttribute('aria-label', 'Zoom in');
    var zout = el('button'); zout.type = 'button'; zout.textContent = '−';
    zout.setAttribute('aria-label', 'Zoom out');
    zin.addEventListener('click', function () { if (map) map.zoomIn(); });
    zout.addEventListener('click', function () { if (map) map.zoomOut(); });
    zoomBox.append(zin, zout);

    formDim = el('div', 'hike-form-dim');

    stage.append(mapEl, addBtn, hint, zoomBox, formDim, buildCard());
    panel.append(closeBtn, stage);

    ghost = el('div', 'hike-ghost');
    ghost.innerHTML = PIN;

    document.body.append(dim, panel, ghost);

    document.addEventListener('pointermove', function (e) {
      if (placing) {
        ghost.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      }
      // The bee cannot enter Turnstile's frame, so it steps aside at the edge
      // rather than being stranded there.
      if (turnstileBox && turnstileBox.classList.contains('live')) {
        var b = turnstileBox.getBoundingClientRect();
        var over = e.clientX >= b.left && e.clientX <= b.right &&
                   e.clientY >= b.top && e.clientY <= b.bottom;
        document.documentElement.classList.toggle('hike-handover', over);
      }
    });
  }

  function buildCard() {
    card = el('div', 'hike-card');

    var x = el('button', 'hike-card-close');
    x.type = 'button';
    x.setAttribute('aria-label', 'Remove this pin');
    x.innerHTML = cross();
    x.addEventListener('click', function () { clearDrop(); arm(); });

    titleIn = field('', 70);
    noteIn = document.createElement('textarea');
    noteIn.maxLength = 400;
    noteIn.placeholder = '';

    nameRow = el('div', 'hike-name-row');
    var nameLab = el('label');
    nameLab.textContent = 'your name';
    nameIn = field('', 40);
    nameRow.append(nameLab, nameIn);

    countryRow = el('div', 'hike-country-row');
    countryIn = document.createElement('select');
    countryIn.className = 'hike-country';
    var none = document.createElement('option');
    none.value = '';
    none.textContent = '';
    countryIn.appendChild(none);
    String(window.COUNTRIES || '').split('|').forEach(function (row) {
      var sp = row.indexOf(' ');
      if (sp < 1) return;
      var o = document.createElement('option');
      o.value = row.slice(0, sp);
      o.textContent = flagOf(row.slice(0, sp)) + '  ' + row.slice(sp + 1);
      countryIn.appendChild(o);
    });

    var anon = el('label', 'hike-anon');
    anonBox = document.createElement('input');
    anonBox.type = 'checkbox';
    anonBox.addEventListener('change', function () {
      nameRow.classList.toggle('hidden', anonBox.checked);
      countryRow.classList.toggle('hidden', anonBox.checked);
    });
    anon.append(anonBox, document.createTextNode('anonymous suggestion'));

    submitBtn = el('button', 'hike-btn');
    submitBtn.type = 'button';
    submitBtn.textContent = 'submit';
    submitBtn.addEventListener('click', send);

    errOut = el('p', 'hike-error');

    var lab1 = el('label'); lab1.textContent = 'hike name';
    var lab2 = el('label'); lab2.textContent = 'note';
    var lab3 = el('label'); lab3.textContent = 'your country';
    countryRow.append(lab3, countryIn);
    var actions = el('div', 'hike-card-actions');
    actions.appendChild(submitBtn);

    turnstileBox = el('div', 'hike-turnstile');

    card.append(x, lab1, titleIn, lab2, noteIn, nameRow,
                countryRow, anon, turnstileBox, actions, errOut);
    return card;
  }

  function field(placeholder, max) {
    var i = document.createElement('input');
    i.type = 'text';
    i.placeholder = placeholder;
    i.maxLength = max;
    return i;
  }

  function startMap() {
    if (map) {
      map.invalidateSize();
      return;
    }
    WORLD = L.latLngBounds(L.latLng(-82, -180), L.latLng(82, 180));

    map = L.map(mapEl, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
      maxZoom: MAX_Z,
      // fractional zoom, or the fitted level rounds down and leaves a gutter
      zoomSnap: 0,
      zoomDelta: 0.6,
      maxBounds: WORLD,
      maxBoundsViscosity: 1,
      worldCopyJump: false
    }).setView([20, 0], 2);

    L.tileLayer(TILES, {
      attribution: CREDIT,
      maxZoom: MAX_Z,
      detectRetina: true,
      noWrap: true,
      bounds: WORLD
    }).addTo(map);

    // Place names only, so the base stays clean but the map can be read.
    L.tileLayer(LABELS, {
      maxZoom: MAX_Z,
      detectRetina: true,
      noWrap: true,
      bounds: WORLD,
      opacity: 0.9
    }).addTo(map);

    map.on('click', function (e) {
      if (placing) drop(e.latlng);
    });

    window.addEventListener('resize', fitWorld);
  }

  /* The smallest zoom that still covers the panel, so there is never a gutter
     beside the world and nothing to drag past. */
  function fitWorld() {
    if (!map || !WORLD) return;
    map.invalidateSize();

    // The mercator world is 256 * 2^zoom square, so this is the zoom at which
    // it covers the panel on both axes — no gutter, nothing to drag past.
    var size = map.getSize();
    var z = Math.max(Math.log(size.x / 256) / Math.LN2,
                     Math.log(size.y / 256) / Math.LN2);

    map.setMinZoom(z);
    if (map.getZoom() < z) map.setZoom(z);
    map.panInsideBounds(WORLD, { animate: false });
  }

  /* Cloudflare's bot check. Without a site key the widget is skipped and the
     API accepts the post, so the site works the same locally. */
  function startTurnstile() {
    var key = (window.TURNSTILE_SITE_KEY || '').trim();
    if (!key || !turnstileBox || turnstileBox.dataset.on) return;
    turnstileBox.dataset.on = '1';

    /* The widget is a cross-origin frame: a pointer inside it stops reaching
       this document, which strands the bee and brings the real cursor back.
       It ignores the pointer until Turnstile says it needs a click. */
    var go = function () {
      if (!window.turnstile) return;
      window.turnstile.render(turnstileBox, {
        sitekey: key,
        theme: 'light',
        size: 'flexible',
        'before-interactive-callback': function () { turnstileBox.classList.add('live'); },
        'after-interactive-callback': function () { turnstileBox.classList.remove('live'); },
        callback: function () { turnstileBox.classList.remove('live'); },
        'error-callback': function () { turnstileBox.classList.add('live'); }
      });
    };

    if (window.turnstile) { go(); return; }
    var tag = document.createElement('script');
    tag.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    tag.async = true;
    tag.defer = true;
    tag.onload = go;
    document.head.appendChild(tag);
  }

  function turnstileToken() {
    try {
      return window.turnstile ? (window.turnstile.getResponse(turnstileBox) || '') : '';
    } catch (err) {
      return '';
    }
  }

  function resetTurnstile() {
    try {
      if (window.turnstile) window.turnstile.reset(turnstileBox);
    } catch (err) { /* nothing rendered */ }
  }

  function arm() {
    placing = true;
    stage.classList.add('placing');
    marks.forEach(function (m) {
      if (m.closeTooltip) m.closeTooltip();
      if (m.closePopup) m.closePopup();
    });
    addBtn.classList.add('armed');
    addBtn.textContent = 'placing...';
    hint.classList.add('show');
    ghost.classList.add('show');
    document.documentElement.classList.add('hike-placing');
  }

  function disarm() {
    placing = false;
    stage.classList.remove('placing');
    addBtn.classList.remove('armed');
    addBtn.textContent = 'add a hike';
    hint.classList.remove('show');
    ghost.classList.remove('show');
    document.documentElement.classList.remove('hike-placing');
  }

  function pinIcon(kind) {
    return L.divIcon({
      className: 'hike-marker' + (kind ? ' ' + kind : ''),
      html: PIN,
      iconSize: [26, 36],
      iconAnchor: [13, 36],
      tooltipAnchor: [0, -46]
    });
  }

  function flagOf(code) {
    if (!/^[A-Za-z]{2}$/.test(code || '')) return '';
    var up = code.toUpperCase();
    return String.fromCodePoint(0x1F1E6 + up.charCodeAt(0) - 65,
                                0x1F1E6 + up.charCodeAt(1) - 65);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function addMark(h, kind, own) {
    var m = L.marker([h.lat, h.lng], {
      icon: pinIcon(kind),
      keyboard: false,
      interactive: !!h.title
    }).addTo(map);

    if (own && own.id != null && own.secret) {
      m.once('add', function () { addCross(m, h, own); });
      if (m._icon) addCross(m, h, own);
    }

    if (h.title) {
      // An anonymous hike gives nothing away, the flag included.
      var flag = h.author ? flagOf(h.country) : '';
      var who = h.author ? esc(h.author) : 'anonymous';

      m.bindTooltip('<b>' + esc(h.title) + '</b><span>' + who +
                    (flag ? ' ' + flag : '') + '</span>',
                    { direction: 'top', className: 'hike-tip', opacity: 1 });

      m.bindPopup('<b>' + esc(h.title) + '</b>' +
                  (h.note ? '<p>' + esc(h.note) + '</p>' : '') +
                  '<span class="hike-by">' +
                  (h.author ? esc(h.author) : 'anonymous hiker') +
                  (flag ? ' <em>' + flag + '</em>' : '') + '</span>',
                  { className: 'hike-note', closeButton: false,
                    offset: [0, -42], maxWidth: 260, autoPan: true });
    }
    /* Leaflet reopens a tooltip on click, so closing the note would pop the
       little sign straight back up beside the pin. Hold it back until the
       pointer has actually left and come again. */
    m.on('mouseover', function () { m._over = true; });
    m.on('mouseout', function () { m._over = false; m._tipHold = false; });
    m.on('tooltipopen', function () { if (m._tipHold) m.closeTooltip(); });

    m.on('popupopen', function () {
      stage.classList.add('reading');
      if (m._icon) m._icon.classList.add('open');
      m.closeTooltip();
    });

    m.on('popupclose', function () {
      stage.classList.remove('reading');
      if (m._icon) m._icon.classList.remove('open');
      m.closeTooltip();
      m._tipHold = m._over;
    });

    marks.push(m);
    return m;
  }

  /* A pin this visitor left carries a cross, and the bee asks before it goes. */
  function addCross(m, h, own) {
    if (!m._icon || m._icon.querySelector('.hike-erase')) return;

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'hike-erase';
    b.title = 'remove this hike';
    b.setAttribute('aria-label', 'remove this hike');
    b.innerHTML = cross();

    L.DomEvent.on(b, 'click', function (e) {
      L.DomEvent.stop(e);
      // or Enter would keep re-activating the still-focused button
      b.blur();
      confirmErase(m, h, own);
    });
    L.DomEvent.disableClickPropagation(b);

    m._icon.appendChild(b);
  }

  function confirmErase(m, h, own) {
    if (asking) return;
    if (!window.Bee || !window.Bee.say) { erase(m, h, own); return; }
    asking = true;

    m.closeTooltip();
    m.closePopup();

    var bubble = document.createElement('div');
    bubble.className = 'bee-bubble';
    bubble.innerHTML =
      'take "' + esc(h.title) + '" off the map?' +
      '<span class="bee-note">press <span class="kbd">y</span> for yes ' +
      'or <span class="kbd">n</span> for no</span>';
    document.body.appendChild(bubble);

    window.Bee.say({
      bubble: bubble,
      delay: 0,
      keys: ['y', 'n'],
      onDone: function (answer) {
        asking = false;
        bubble.remove();
        if (answer === 'y') erase(m, h, own);
      }
    });
  }

  function erase(m, h, own) {
    forget(own && own.id);
    map.removeLayer(m);
    marks = marks.filter(function (x) { return x !== m; });

    if (!own || own.id == null || !own.secret) return;
    fetch(API + '?id=' + encodeURIComponent(own.id) +
          '&secret=' + encodeURIComponent(own.secret), { method: 'DELETE' })
      .catch(function () { /* it is already gone from view */ });
  }

  function forget(id) {
    try {
      var all = mine().filter(function (h) { return id == null || h.id !== id; });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    } catch (err) { /* storage blocked */ }
  }

  function drop(latlng) {
    clearDrop();
    disarm();
    dropped = {
      lat: latlng.lat,
      lng: latlng.lng,
      mark: addMark({ lat: latlng.lat, lng: latlng.lng }, 'pending')
    };
    formDim.classList.add('show');
    card.classList.add('show');
    errOut.textContent = '';
    startTurnstile();
    setTimeout(function () { titleIn.focus(); }, 240);
  }

  function clearDrop() {
    if (dropped && dropped.mark) map.removeLayer(dropped.mark);
    dropped = null;
    card.classList.remove('show');
    formDim.classList.remove('show');
  }

  function mine() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }
    catch (err) { return []; }
  }

  function remember(h) {
    try {
      var all = mine();
      all.push(h);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    } catch (err) { /* storage blocked */ }
  }

  function paint(list, trusted) {
    marks.forEach(function (m) { map.removeLayer(m); });
    marks = [];

    var owned = {};
    mine().forEach(function (h) { if (h.id != null) owned[h.id] = h.secret; });

    var seen = {};
    list.forEach(function (h) {
      seen[h.id] = true;
      if (owned[h.id] != null) addMark(h, 'mine', { id: h.id, secret: owned[h.id] });
      else addMark(h);
    });

    // A remembered hike the server no longer lists has been deleted since, so
    // let it go. Only ones that never reached the database are kept.
    mine().forEach(function (h) {
      if (h.id == null) addMark(h, 'mine');
      else if (!seen[h.id] && trusted) forget(h.id);
      else if (!seen[h.id]) addMark(h, 'mine');
    });
  }

  function load() {
    fetch(API, { headers: { accept: 'application/json' } })
      .then(function (r) {
        // Only an answered request may retire a remembered hike.
        if (!r.ok) throw new Error('unavailable');
        return r.json();
      })
      .then(function (list) { paint(Array.isArray(list) ? list : [], true); })
      .catch(function () { paint([], false); });
  }

  function send() {
    if (sending || !dropped) return;
    var title = titleIn.value.trim();
    if (!title) {
      errOut.textContent = 'the hike needs a name';
      titleIn.focus();
      return;
    }
    var body = {
      lat: dropped.lat,
      lng: dropped.lng,
      title: title.slice(0, 60),
      note: noteIn.value.trim().slice(0, 400),
      author: anonBox.checked ? '' : nameIn.value.trim().slice(0, 40),
      country: anonBox.checked ? '' : (countryIn.value || ''),
      token: turnstileToken()
    };

    sending = true;
    submitBtn.textContent = 'sending...';
    errOut.textContent = '';

    fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('rejected');
        return r.json().catch(function () { return {}; });
      })
      .then(function (out) {
        body.id = out.id;
        body.secret = out.secret;
        done(body);
      })
      .catch(function () { done(body); });
  }

  function done(body) {
    sending = false;
    submitBtn.textContent = 'submit';
    remember(body);
    if (dropped && dropped.mark) {
      map.removeLayer(dropped.mark);
      marks = marks.filter(function (x) { return x !== dropped.mark; });
      addMark(body, 'mine',
              body.id != null && body.secret
                ? { id: body.id, secret: body.secret }
                : null);
    }
    dropped = null;
    card.classList.remove('show');
    formDim.classList.remove('show');
    titleIn.value = noteIn.value = nameIn.value = '';
    countryIn.value = '';
    anonBox.checked = false;
    nameRow.classList.remove('hidden');
    countryRow.classList.remove('hidden');
    resetTurnstile();
    setTimeout(celebrate, 150);
  }

  function celebrate() {
    var thanks = el('div', 'hike-thanks');
    thanks.textContent = 'thank you!';
    document.body.appendChild(thanks);
    void thanks.offsetWidth;
    thanks.classList.add('run');
    confetti();
    setTimeout(function () { thanks.remove(); }, 2100);
  }

  /* Two cannons, one each side, firing up and inward. */
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var canvas = el('canvas', 'hike-confetti');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.width = window.innerWidth * dpr;
    var h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var COLOURS = ['#E0A32B', '#A8442F', '#3B6B1B', '#EAC68C', '#F6E6C8', '#7FA650'];
    var bits = [];

    [-1, 1].forEach(function (side) {
      var originX = side === -1 ? 0.015 * w : 0.985 * w;
      for (var i = 0; i < 90; i++) {
        var speed = (17 + Math.random() * 13) * dpr;
        var angle = (38 + Math.random() * 34) * Math.PI / 180;
        bits.push({
          x: originX,
          y: h * (0.66 + Math.random() * 0.14),
          vx: -side * Math.cos(angle) * speed,
          vy: -Math.sin(angle) * speed,
          w: (5 + Math.random() * 7) * dpr,
          h: (8 + Math.random() * 9) * dpr,
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.5,
          c: COLOURS[(Math.random() * COLOURS.length) | 0]
        });
      }
    });

    var LIFE = 1450;
    var start = performance.now();
    (function frame(now) {
      var age = now - start;
      ctx.clearRect(0, 0, w, h);
      bits.forEach(function (b) {
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.45 * dpr;
        b.vx *= 0.986;
        b.rot += b.spin;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(age / LIFE, 2.6));
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      });
      if (age < LIFE) requestAnimationFrame(frame);
      else canvas.remove();
    })(start);
  }

  /* The room keeps reacting to the pointer behind the map unless it is told
     not to, and the music panel is drawn by the shell so it cannot be layered
     under anything in here — it gets put away instead. */
  function holdRoom(on) {
    var scene = document.querySelector('.scene');
    if (scene) scene.classList.toggle('modal-open', on);
    if (on && window.Hotspots) window.Hotspots.release();

    var music = window.CampsiteMusic;
    if (!music) return;
    try {
      if (on) {
        if (music.isPlayerOpen && music.isPlayerOpen()) music.closePlayer();
        if (music.setMiniHidden) music.setMiniHidden(true);
      } else if (music.setMiniHidden) {
        music.setMiniHidden(false);
      }
    } catch (err) { /* the shell is not there when a room is opened alone */ }
  }

  Hikes.open = function () {
    build();
    if (window.closeBio) window.closeBio();
    holdRoom(true);
    dim.classList.add('open');
    panel.classList.add('open');
    startMap();
    load();
    panel.focus({ preventScroll: true });

    // Animation frames stop in a background tab, so the resize is also timed.
    var fit = fitWorld;
    requestAnimationFrame(fit);
    setTimeout(fit, 140);
    setTimeout(fit, 460);
  };

  function close() {
    if (!built) return;
    disarm();
    clearDrop();
    holdRoom(false);
    dim.classList.remove('open');
    panel.classList.remove('open');
  }

  Hikes.close = close;

  document.addEventListener('keydown', function (e) {
    if (!built || !panel.classList.contains('open')) return;
    if (e.key !== 'Escape') return;
    if (placing) { disarm(); return; }
    if (dropped) { clearDrop(); return; }
    close();
  });
})();
