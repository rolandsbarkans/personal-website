/* Pine needles off a brushed tree. Needs shed.js. Applies to .sheds-needles. */

(function () {
  'use strict';

  if (!window.Shed) return;
  const S = window.Shed;

  const COUNT = [3, 5];
  const COOLDOWN_MS = 800;
  const CLICK_MS = 260;
  const MAX_PER_TREE = 11;      // a tree swept back and forth must not fill up

  const TONES = ['#8FB52C', '#6E9C12', '#8C5A1E'];
  const WEIGHTS = [0.44, 0.38, 0.18];
  const SHEATH = '#5B3511';
  const OUTLINE = '#22350A';

  // The canopy is a triangle: a narrow band at the top, a wide one at the bottom.
  const HIGH = 0.04;
  const LOW = 0.78;
  const NARROW = 0.07;
  const WIDE = 0.46;

  function tone() {
    let r = Math.random();
    for (let i = 0; i < TONES.length; i++) {
      r -= WEIGHTS[i];
      if (r <= 0) return TONES[i];
    }
    return TONES[0];
  }

  function canopy() {
    const y = S.rand(HIGH, LOW);
    const halfSpan = NARROW + ((y - HIGH) / (LOW - HIGH)) * (WIDE - NARROW);
    return { x: 0.5 + S.rand(0, halfSpan) * S.coin(), y: y };
  }

  // Three blades and a sheath, drawn fat in the outline colour and again on top.
  function cluster(color) {
    const NEEDLES = [
      ['M10 41 C8.6 29 6.6 16 3.4 2', 2.1],
      ['M10 41 C10.2 28 10.4 14 10.2 0.6', 2.6],
      ['M10 41 C11.4 29 13.4 16 16.6 3', 2.1],
    ];
    const line = (colour, extra) => NEEDLES.map((n) =>
      '<path d="' + n[0] + '" stroke="' + colour + '" stroke-width="' +
      (n[1] + extra) + '" stroke-linecap="round"/>').join('');
    return '<svg viewBox="0 0 20 44" fill="none" aria-hidden="true">' +
      line(OUTLINE, 1.5) + line(color, 0) +
      '<ellipse cx="10" cy="41.4" rx="2.4" ry="2.8" fill="' + SHEATH +
      '" stroke="' + OUTLINE + '" stroke-width="1.2"/></svg>';
  }

  function shed(tree) {
    const scale = S.match(tree) * S.knob(tree, '--needle-scale');

    const room = MAX_PER_TREE - tree.querySelectorAll('.needle').length;
    if (room <= 0) return;

    const n = Math.min(room,
      Math.round(S.rand(COUNT[0], COUNT[1]) * S.knob(tree, '--needle-count')));

  // One gust per shake, so a handful of needles drifts the same way.
    const wind = S.rand(6, 20) * S.coin();

    for (let i = 0; i < n; i++) {
      const needle = document.createElement('span');
      needle.className = 'needle';

      const from = canopy();
      const size = S.rand(7.5, 11);
      const s = needle.style;
      s.setProperty('--size', size * scale + 'cqw');
      s.setProperty('--x', from.x * 100 + '%');
      s.setProperty('--y', from.y * 100 + '%');
      s.setProperty('--fall', S.rand(70, 115) * scale + 'cqw');
      s.setProperty('--drift', wind * S.rand(0.45, 1.15) * scale + 'cqw');
      s.setProperty('--sway', S.rand(3, 8) * scale + 'cqw');
      s.setProperty('--swing', S.rand(0.35, 0.65) + 's');
      s.setProperty('--pitch', S.rand(22, 48) + 'deg');
      s.setProperty('--tilt', S.rand(-30, 30) + 'deg');
      s.setProperty('--flip', S.rand(0.22, 0.5) + 's');
      s.setProperty('--dur', S.rand(1.5, 2.2) / (size / 9) + 's');
      s.setProperty('--delay', S.rand(0, 0.14) + 's');

      const sway = document.createElement('span');
      sway.className = 'needle-sway';
      const tumble = document.createElement('span');
      tumble.className = 'needle-tumble';
      const flip = document.createElement('span');
      flip.className = 'needle-flip';
      flip.innerHTML = cluster(tone());
      tumble.appendChild(flip);
      sway.appendChild(tumble);
      needle.appendChild(sway);
      tree.appendChild(needle);

      needle.addEventListener('animationend', function (e) {
        if (e.animationName === 'needle-fall') needle.remove();
      });
    }
  }

  S.on('.sheds-needles', { move: COOLDOWN_MS, click: CLICK_MS }, shed);
})();
