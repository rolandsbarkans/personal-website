/* The bee that replaces the pointer, and the bubble it talks in. Bee.x/Bee.y is the pointer, Bee.el the element, Bee.moveTo() drives it from the shell, Bee.say({bubble, once, delay, dim, onDone}) types a line. */

(function () {
  'use strict';

  var Bee = (window.Bee = window.Bee || {});

  var SVG =
    '<svg viewBox="0 0 64 52">' +
      '<g class="bee-wings">' +
        '<ellipse cx="25" cy="12" rx="9" ry="7" fill="#dceafc" stroke="#000" stroke-width="2.5"/>' +
        '<ellipse cx="39" cy="10" rx="7" ry="6" fill="#eef5ff" stroke="#000" stroke-width="2.5"/>' +
      '</g>' +
      '<ellipse cx="32" cy="32" rx="17" ry="12" fill="#ffcf3f" stroke="#000" stroke-width="3"/>' +
      '<path d="M27 21 c-1 7 -1 15 0 22" stroke="#000" stroke-width="4.5" fill="none"/>' +
      '<path d="M37 21 c1 7 1 15 0 22" stroke="#000" stroke-width="4.5" fill="none"/>' +
      '<circle cx="44" cy="29" r="2.2" fill="#000"/>' +
      '<path d="M15 33 l-7 2" stroke="#000" stroke-width="3" stroke-linecap="round"/>' +
    '</svg>';

  // How far the bee banks into a turn, and how quickly it levels off.
  var TILT_MAX = 18;
  var TILT_EASE = 0.25;
  var POLLEN_GAP = 20;

  var bee = document.createElement('div');
  bee.className = 'bee-cursor';
  bee.id = 'beeCursor';
  bee.innerHTML = SVG;
  document.body.appendChild(bee);

  var savedX = parseFloat(sessionStorage.getItem('beeX'));
  var savedY = parseFloat(sessionStorage.getItem('beeY'));
  var mouseX = isNaN(savedX) ? window.innerWidth / 2 : savedX;
  var mouseY = isNaN(savedY) ? window.innerHeight / 2 : savedY;
  var prevX = mouseX;
  var prevY = mouseY;
  var facing = 1;
  var tilt = 0;
  var pollenDistance = 0;

  Bee.x = mouseX;
  Bee.y = mouseY;

  function place() {
    bee.style.transform =
      'translate(' + mouseX + 'px, ' + mouseY + 'px) translate(-50%, -50%)' +
      ' scaleX(' + facing + ') rotate(' + tilt * facing + 'deg)';
  }

  place();

    /* The bee starts where it was in the last room, so it waits a moment before showing itself in case the pointer has moved. */
  var GRACE = 260;
  var placed = false;

  bee.classList.add('bee-waiting');

  function reveal() {
    if (placed) return;
    placed = true;
    place();
    bee.classList.remove('bee-waiting');
  }

  var graceTimer = setTimeout(reveal, GRACE);

  function pointerAt(x, y) {
    mouseX = x;
    mouseY = y;
    Bee.x = mouseX;
    Bee.y = mouseY;

    if (!placed) {
      clearTimeout(graceTimer);
      prevX = mouseX;
      prevY = mouseY;
      reveal();
      return;
    }

    place();
  }

  Bee.el = bee;

  // False while the shell is driving the bee.
  var mine = true;

  Bee.moveTo = function (x, y) {
    mine = false;
    pointerAt(x, y);
  };

  function takeBack() {
    if (mine) return;
    mine = true;
    if (window.parent === window) return;
    try {
      if (window.parent.__campsiteBeeHome) window.parent.__campsiteBeeHome();
    } catch (err) {

    }
  }

  document.addEventListener('pointermove', function (e) {
    takeBack();
    pointerAt(e.clientX, e.clientY);
  });

  function remember() {
    sessionStorage.setItem('beeX', mouseX);
    sessionStorage.setItem('beeY', mouseY);
  }

  window.addEventListener('pagehide', remember);
  document.addEventListener('click', remember, true);

  function spawnPollen() {
    var speck = document.createElement('div');
    speck.className = 'pollen';

    speck.style.left = (mouseX - facing * 12 + (Math.random() - 0.5) * 8) + 'px';
    speck.style.top = (mouseY + 8 + Math.random() * 5) + 'px';
    document.body.appendChild(speck);
    speck.addEventListener('animationend', function () { speck.remove(); });
  }

  (function tick() {
    var dx = mouseX - prevX;
    var dy = mouseY - prevY;
    var speed = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.4) facing = dx > 0 ? 1 : -1;
    var tiltTarget = Math.max(-TILT_MAX, Math.min(TILT_MAX, dx * 1.4));
    tilt += (tiltTarget - tilt) * TILT_EASE;
    place();
    prevX = mouseX;
    prevY = mouseY;
    pollenDistance += speed;
    if (pollenDistance > POLLEN_GAP && speed > 0.5) {
      pollenDistance = 0;
      spawnPollen();
    }
    requestAnimationFrame(tick);
  })();

  // Milliseconds per letter, and the pause a punctuation mark buys.
  var SPEED = 26;
  var BREATH = { '.': 260, '!': 260, '?': 260, ',': 110 };
  var WAIT = 280;

  var EDGE = 12;
  var REACH = 18;

  // Flips the bubble to the bee's other side rather than running off the window.
  function follow(bubble, fixedWidth) {
    var going = true;
    (function step() {
      var w = fixedWidth || bubble.offsetWidth;
      var h = bubble.offsetHeight;

      var toRight = Bee.x + REACH + w <= window.innerWidth - EDGE;
      var left = toRight ? Bee.x + REACH : Bee.x - REACH - w;

      if (left + w > window.innerWidth - EDGE) left = window.innerWidth - EDGE - w;
      if (left < EDGE) left = EDGE;

      bubble.classList.toggle('flip', !toRight);
      bubble.style.left = left + 'px';
      bubble.style.top = Math.max(Bee.y - 24, h + EDGE) + 'px';
      if (going) requestAnimationFrame(step);
    })();
    return function () { going = false; };
  }

    /* `bee-talking` on <html> is how the rest of the site knows to hold still. */
  var talkers = 0;

  function announce() {
    document.dispatchEvent(new CustomEvent('beetalk', {
      detail: { talking: talkers > 0 }
    }));
  }

  function startTalking() {
    talkers++;
    document.documentElement.classList.add('bee-talking');
    announce();
  }

  function stopTalking() {
    if (talkers > 0) talkers--;
    if (!talkers) document.documentElement.classList.remove('bee-talking');
    announce();
  }

  function sheet(darken) {
    var el = document.createElement('div');
    el.className = 'bee-dim block' + (darken ? '' : ' clear');
    document.body.appendChild(el);
    return el;
  }

  Bee.say = function (options) {
    var bubble = options.bubble;
    var seenKey = options.once;
    var onDone = options.onDone || function () {};
    var wantDim = options.dim !== false;
    var delay = options.delay == null ? 1500 : options.delay;
    // A set of keys to answer with, instead of Enter to dismiss.
    var keys = options.keys || null;

    if (seenKey && localStorage.getItem(seenKey) === '1') {
      if (bubble) bubble.remove();
      onDone();
      return;
    }

    var script = Array.prototype.map.call(bubble.childNodes, function (node) {
      return node.nodeType === 3
        ? { letters: node.textContent.replace(/\s+/g, ' ') }
        : { whole: node.outerHTML };
    });

    function escapeText(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    }

    var full = script.map(function (bit) {
      return bit.whole ? bit.whole : escapeText(bit.letters);
    }).join('');

    bubble.innerHTML = '';
    var text = document.createElement('span');
    text.className = 'bee-bubble-text';
    bubble.appendChild(text);

    var dim = sheet(wantDim);

    var ghost = document.createElement('div');
    ghost.className = bubble.className + ' bee-bubble-ghost';
    var ghostText = document.createElement('span');
    ghostText.className = text.className;
    ghost.appendChild(ghostText);
    document.body.appendChild(ghost);

    function show(html, caret) {
      var withCaret = html + (caret ? '<i class="bee-caret"></i>' : '');
      text.innerHTML = withCaret;
      ghostText.innerHTML = withCaret;
      bubble.style.width = ghost.getBoundingClientRect().width + 'px';
      text.style.height = ghostText.getBoundingClientRect().height + 'px';
    }

    function begin() {

      ghostText.innerHTML = full;
      var finalWidth = ghost.getBoundingClientRect().width;

      show('', false);

      startTalking();
      dim.classList.add('visible');
      bubble.classList.add('show');

      var stopFollowing = follow(bubble, finalWidth);

      var typing = true;
      var bit = 0;
      var at = 0;
      var html = '';
      var timer = 0;

      function finish() {
        typing = false;
        clearTimeout(timer);
        show(full, false);
      }

      function next() {
        if (bit >= script.length) {
          finish();
          return;
        }
        var piece = script[bit];

        if (piece.whole) {
          html += piece.whole;
          bit++;
          show(html, true);
          timer = setTimeout(next, SPEED * 4);
          return;
        }

        var letter = piece.letters[at++];
        if (at >= piece.letters.length) {
          bit++;
          at = 0;
        }
        html += escapeText(letter);
        show(html, true);
        timer = setTimeout(next, SPEED + (BREATH[letter] || 0));
      }

      timer = setTimeout(next, WAIT);

      function close(answer) {
        stopFollowing();
        stopTalking();
        dim.classList.remove('visible');
        bubble.classList.remove('show');
        ghost.remove();

        setTimeout(function () { dim.remove(); }, 600);
        if (seenKey) localStorage.setItem(seenKey, '1');
        onDone(answer);
      }

      document.addEventListener('keydown', function key(e) {
        if (keys) {
          var pressed = String(e.key).toLowerCase();
          if (keys.indexOf(pressed) < 0) return;
          if (typing) finish();
          document.removeEventListener('keydown', key);
          close(pressed);
          return;
        }

        if (e.key !== 'Enter') return;
        if (typing) {
          finish();
          return;
        }
        document.removeEventListener('keydown', key);
        close();
      });
    }

    function afterLoad() { setTimeout(begin, delay); }
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad);
  };
})();
