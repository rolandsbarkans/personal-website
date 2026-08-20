/* Arriving in a room, leaving one, and the round back arrow. Driven by attributes on .scene: data-exit="main.html" with data-door=".tent", or data-exit="bag" / "bag:tent.html" to hand over to bagTransition. Load after .scene and before hotspots.js. */

(function () {
  'use strict';

  var scene = document.querySelector('.scene');
  if (!scene) return;

  var body = document.body;
  var ARRIVE = 'arrive:';
  var DOOR = 'arriveDoor';

  // A room whose artwork never loads must not stay behind its wash forever.
  var LOAD_LIMIT = 4000;

  function pageOf(url) {
    return url.split('/').pop().split('?')[0] || 'main.html';
  }

  // Where a door sits, as a transform-origin on the scene.
  function originOf(selector) {
    var target = selector && document.querySelector(selector);
    if (!target) return '50% 50%';
    var rect = scene.getBoundingClientRect();
    var css = getComputedStyle(target);
    var x = target.style.left ? parseFloat(target.style.left)
      : (parseFloat(css.left) / rect.width) * 100;
    var y = target.style.top ? parseFloat(target.style.top)
      : (parseFloat(css.top) / rect.height) * 100;
    return x + '% ' + y + '%';
  }

    var here = pageOf(location.pathname);
  var smooth = sessionStorage.getItem(ARRIVE + here) === '1';
  var door = sessionStorage.getItem(DOOR);
  sessionStorage.removeItem(ARRIVE + here);
  sessionStorage.removeItem(DOOR);

  if (smooth) {
    if (door) scene.style.transformOrigin = originOf(door);
    body.classList.add('zoomed-in');
  } else {
    body.classList.add('no-wash');
  }

  var settled = false;

  function reveal() {
    body.classList.add('arrived');
    scene.classList.add('settle');
  }

    /* One frame of the arrival state before the transitions are let go, or the room settles from nowhere. Animation frames do not run in an offscreen frame, hence the timer. */
  function settle() {
    if (settled) return;
    settled = true;
    requestAnimationFrame(reveal);
    setTimeout(reveal, 60);
  }

  if (document.readyState === 'complete') settle();
  else window.addEventListener('load', settle, { once: true });
  setTimeout(settle, LOAD_LIMIT);

    var leaving = false;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function walk(to, opts) {
    if (leaving) return;
    leaving = true;

    sessionStorage.setItem(ARRIVE + to, '1');
    if (opts.remember) sessionStorage.setItem(DOOR, opts.remember);
    if (opts.wash) body.style.setProperty('--wash-out', opts.wash);

    // The fade still happens; only the zoom is movement for its own sake.
    if (!still) {
      scene.style.transformOrigin = opts.origin || '50% 50%';
      scene.classList.remove('settle');
      scene.classList.add('zoom-exit');
      scene.style.transform = 'scale(' + opts.scale + ')';
    }
    body.classList.add('leaving');

    var gone = false;
    function go() {
      if (gone) return;
      gone = true;
      window.go(to);
    }
    body.addEventListener('transitionend', function (e) {
      if (e.pseudoElement === '::after' && e.propertyName === 'opacity') go();
    });
    setTimeout(go, 900);
  }

  var Room = (window.Room = {});

  // Zoom toward the thing clicked. `wash` is the colour of the destination.
  Room.enter = function (selector, to, wash) {
    walk(to, { origin: originOf(selector), scale: 1.6, wash: wash });
  };

  // Back out to the campsite, telling it which door to grow from.
  Room.exit = function (door) {
    walk('main.html', { remember: door, scale: 0.94 });
  };

  // Return true to swallow a back click — the tent puts the torch out first.
  Room.beforeExit = null;

  var exitTo = scene.getAttribute('data-exit');
  if (exitTo) {
    var button = document.createElement('div');
    button.className = 'back-button hotspot';
    button.innerHTML =
      '<span class="swell"><svg viewBox="0 0 40 40" aria-hidden="true">' +
      '<circle cx="20" cy="20" r="17" fill="#fff" stroke="#000" stroke-width="3"/>' +
      '<path d="M24 12 L15 20 L24 28" fill="none" stroke="#000" stroke-width="3"' +
      ' stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    document.body.appendChild(button);

    button.addEventListener('click', function () {
      if (Room.beforeExit && Room.beforeExit()) return;
      if (exitTo.indexOf('bag') === 0) {
        window.bagTransition.toBag(exitTo.split(':')[1]);
      } else {
        Room.exit(scene.getAttribute('data-door'));
      }
    });
  }
})();
