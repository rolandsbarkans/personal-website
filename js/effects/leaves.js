/* The specks a brushed bush shakes loose. Needs shed.js. Applies to .sheds-leaves. */

(function () {
  'use strict';

  if (!window.Shed) return;
  const S = window.Shed;

  const COUNT = [5, 8];
  const COOLDOWN_MS = 700;
  const TONES = ['#628E05', '#205615', '#AFBD35'];
  const FROM = { x: [0.15, 0.85], y: [0.02, 0.28] };   // where in the canopy

  function shed(bush) {
  // --leaf-count and --leaf-scale tune one bush by hand.
    const scale = S.match(bush) * S.knob(bush, '--leaf-scale');
    const n = Math.round(S.rand(COUNT[0], COUNT[1]) * S.knob(bush, '--leaf-count'));

    for (let i = 0; i < n; i++) {
      const leaf = document.createElement('span');
      leaf.className = 'leaf';

      const size = S.rand(4, 7);
      const s = leaf.style;
      s.setProperty('--size', size * scale + 'cqw');
      s.setProperty('--x', S.rand(FROM.x[0], FROM.x[1]) * 100 + '%');
      s.setProperty('--y', S.rand(FROM.y[0], FROM.y[1]) * 100 + '%');
      s.setProperty('--tone', S.pick(TONES));
      s.setProperty('--lift', S.rand(28, 50) * scale + 'cqw');
      s.setProperty('--sway', S.rand(6, 16) * scale * S.coin() + 'cqw');
      s.setProperty('--tilt', S.rand(-40, 40) + 'deg');
      s.setProperty('--spin', S.rand(100, 240) * S.coin() + 'deg');
  // Bigger specks fall slower, which is what makes the puff read as depth.
      s.setProperty('--dur', S.rand(0.8, 1.2) / (size / 5.5) + 's');
      s.setProperty('--delay', S.rand(0, 0.18) + 's');

      const sway = document.createElement('span');
      sway.className = 'leaf-sway';
      const blade = document.createElement('span');
      blade.className = 'leaf-blade';
      sway.appendChild(blade);
      leaf.appendChild(sway);
      bush.appendChild(leaf);

      leaf.addEventListener('animationend', function (e) {
        if (e.animationName === 'leaf-pop') leaf.remove();
      });
    }
  }

  S.on('.sheds-leaves', { move: COOLDOWN_MS, click: 0 }, shed);
})();
