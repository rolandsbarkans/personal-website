/* The signpost in the corner. It belongs to the shell rather than to any room,
   which is the only way it stays put while the room behind it is swapped.
   Pairs with css/scene/shortcuts.css. */

(function () {
  'use strict';

  if (window.parent !== window) return;

  // Where the pole stands inside the post, and how tall the boards are.
  var POLE_X = 216;
  var TALL = 34;
  var TIP = 22;

  // Every walk from the pole washes through the campsite sky, not the
  // destination's own colour. `side` is the board's shaded edge.
  var WASH = '#CBDCF7';

  var SIGNS = [
    { word: 'about', page: 'closeup.html',
      dir: 'left',  y: 30,  w: 92,  tilt: '-2.2deg', face: '#D9705C', side: '#A9503F', opens: 'openBio' },
    { word: 'expertise', page: 'compass.html',
      dir: 'right', y: 76,  w: 126, tilt: '1.6deg',  face: '#F0B33C', side: '#BE8420' },
    { word: 'projects', page: 'map.html',
      dir: 'left',  y: 122, w: 114, tilt: '2.4deg',  face: '#8FBF3F', side: '#688F26' },
    { word: 'resume', page: 'notebook.html',
      dir: 'right', y: 168, w: 104, tilt: '-1.7deg', face: '#7FA8DE', side: '#587FAF' },
    { word: 'contact', page: 'bars.html',
      dir: 'left',  y: 214, w: 110, tilt: '2deg',    face: '#A78BD0', side: '#7B62A2' }
  ];

  // Rooms with their own use for this corner.
  var NO_POST = { 'notebook.html': 1, 'draw.html': 1 };

  var POLE =
    '<svg class="sc-pole" viewBox="0 0 40 300" aria-hidden="true">' +
      '<defs><linearGradient id="sc-wood" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#77501F"/>' +
        '<stop offset=".28" stop-color="#B8843F"/>' +
        '<stop offset=".48" stop-color="#DCBB84"/>' +
        '<stop offset=".74" stop-color="#AF7B3C"/>' +
        '<stop offset="1" stop-color="#6B4718"/>' +
      '</linearGradient></defs>' +
      '<path class="sc-trunk" d="M9.5 300 L13.5 24 C13.5 12.5 26.5 12.5 26.5 24 L30.5 300 Z"/>' +
      '<g class="sc-grain">' +
        '<path d="M17.5 48 c-1.4 52 1.1 104 -.3 172"/>' +
        '<path d="M23 36 c1.5 70 -1.2 124 .4 200"/>' +
        '<path d="M20 236 c-.3 26 .4 46 .1 64"/>' +
      '</g>' +
    '</svg>';

  var ARROW =
    '<svg viewBox="0 0 20 26" aria-hidden="true">' +
      '<path d="M10 3 c-1.4 6 1.3 12 0 19"/>' +
      '<path d="M5.4 17 L10 22.5 L14.6 17"/>' +
    '</svg>';

  var post = null;
  var dim = null;
  var open = false;
  var watched = null;   // the room document the listeners are on

  function roomWindow() {
    try {
      return (window.__campsiteRoom && window.__campsiteRoom()) || null;
    } catch (err) {
      return null;
    }
  }

  function roomPage() {
    try {
      return roomWindow().location.pathname.split('/').pop();
    } catch (err) {
      return null;
    }
  }

  function setOpen(on) {
    open = !!on;
    post.classList.toggle('open', open);
    dim.classList.toggle('on', open);
    post.querySelector('.sc-label').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function onDarkGround() {
    try {
      var win = roomWindow();
      // The room's own getComputedStyle: the shell's reads nothing across documents.
      var rgb = win.getComputedStyle(win.document.body)
        .backgroundColor.match(/\d+/g);
      return !!rgb && rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 < 140;
    } catch (err) {
      return false;
    }
  }

  /* `keepGround` while the sky is still changing colour: reading it mid-way
     would call a brightening campsite dark for the whole 2.9s. */
  function paintRoom(keepGround) {
    var night = false;
    try { night = sessionStorage.getItem('campsiteNight') === '1'; } catch (err) {}
    post.classList.toggle('night', night);
    if (!keepGround) post.classList.toggle('dark', !night && onDarkGround());

    if (NO_POST[roomPage()]) {
      setOpen(false);
      post.classList.add('off');
    } else {
      post.classList.remove('off');
    }
  }

  function hush(on) {
    post.classList.toggle('hushed', !!on);
    if (on) setOpen(false);
  }

  function leave() {
    setOpen(false);
    post.classList.add('moving');
  }

  function arrive() {
    post.classList.remove('moving');
  }

  /* Handing the walk to the room lets it play its own exit wash before the
     shell swaps the frame under it. */
  function walk(sign) {
    if (roomPage() === sign.page) {
      setOpen(false);
      return;
    }

    if (sign.opens) {
      try { sessionStorage.setItem(sign.opens, '1'); } catch (err) {}
    }
    leave();

    var win = roomWindow();
    try {
      if (win && win.Room && win.Room.jump) {
        win.Room.jump(sign.page, WASH);
        return;
      }
    } catch (err) {}
    if (window.__campsiteGo) window.__campsiteGo(sign.page);
  }

  function board(spec) {
    var id = 'sc-g-' + spec.word;
    var w = spec.w;
    var neck = w - TIP;
    var face = 'M2 2 H' + neck + ' L' + (w - 2.5) + ' 14 L' + neck + ' 26 H2 Z';
    var side = 'M2 7 H' + neck + ' L' + (w - 2.5) + ' 19 L' + neck + ' 31 H2 Z';

    return '<svg class="sc-board" viewBox="0 0 ' + w + ' ' + TALL + '" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#fff" stop-opacity=".26"/>' +
        '<stop offset=".5" stop-color="#fff" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity=".14"/>' +
      '</linearGradient></defs>' +
      '<path d="' + side + '" fill="' + spec.side + '"/>' +
      '<path d="' + face + '" fill="' + spec.face + '"/>' +
      '<path d="' + face + '" fill="url(#' + id + ')" stroke="none"/>' +
      '</svg>';
  }

  function build() {
    dim = document.createElement('div');
    dim.className = 'sc-dim';
    dim.addEventListener('click', function () { setOpen(false); });
    document.body.appendChild(dim);

    post = document.createElement('div');
    post.className = 'sc-post moving';
    post.style.setProperty('--pole-x', POLE_X + 'px');

    var label = document.createElement('button');
    label.type = 'button';
    label.className = 'sc-label';
    label.innerHTML = '<span>shortcuts</span>' + ARROW;
    label.setAttribute('aria-expanded', 'false');
    label.addEventListener('click', function () { setOpen(!open); });

    var rig = document.createElement('div');
    rig.className = 'sc-rig';
    rig.innerHTML = POLE;
    rig.firstChild.addEventListener('click', function () { setOpen(false); });

    SIGNS.forEach(function (spec, i) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'sc-sign';
      el.dataset.dir = spec.dir;
      el.style.left = (POLE_X - spec.w / 2) + 'px';
      el.style.width = spec.w + 'px';
      el.style.setProperty('--y', spec.y + 'px');
      el.style.setProperty('--tilt', spec.tilt);
      el.style.setProperty('--i', SIGNS.length - 1 - i);
      el.innerHTML = board(spec) + '<span class="sc-word">' + spec.word + '</span>';
      el.addEventListener('click', function () { walk(spec); });
      rig.appendChild(el);
    });

    post.appendChild(rig);
    post.appendChild(label);
    document.body.appendChild(post);
    paintRoom();
  }

  function onRoomClick() { setOpen(false); }
  function onBeeTalk(e) { hush(e.detail && e.detail.talking); }

  function follow() {
    var cls = watched.body.classList;
    if (cls.contains('leaving')) leave();
    else if (cls.contains('arrived')) arrive();
  }

  // The frame is rebuilt on every move, so its document is new each time.
  function watchRoom() {
    var win = roomWindow();
    try {
      if (!win || win.document === watched) return;
      watched = win.document;
      watched.addEventListener('click', onRoomClick, true);
      watched.addEventListener('beetalk', onBeeTalk);
      watched.body.addEventListener('transitionend', function (e) {
        if (e.target === watched.body && e.propertyName === 'background-color') paintRoom();
      });

      // The room says when its wash starts and when it has lifted.
      new win.MutationObserver(follow)
        .observe(watched.body, { attributes: true, attributeFilter: ['class'] });
      follow();

      hush(watched.documentElement.classList.contains('bee-talking'));
      paintRoom();
    } catch (err) {}
  }

  function start() {
    build();

    document.addEventListener('click', function (e) {
      if (!post.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false);
    });

    window.addEventListener('campsitewalk', leave);

    // index.html fires this once a new room is the one on screen.
    window.addEventListener('campsiteroom', function () {
      window.CampsiteShortcuts.setHidden(false);
      paintRoom();
      watchRoom();
    });

    // The room writing the night key reaches the shell here too.
    window.addEventListener('storage', function () { paintRoom(true); });
    window.__campsiteNight = function () { paintRoom(true); };

    watchRoom();
    window.addEventListener('load', watchRoom);
  }

  window.CampsiteShortcuts = {
    // Called from a room whose own furniture wants this corner; see hikes.js.
    setHidden: function (on) {
      if (!post) return;
      post.classList.toggle('away', !!on);
      if (on) setOpen(false);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
