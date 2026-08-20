/* The flock that breaks out of a brushed tree. Needs shed.js. Applies to .takes-flight. */

(function () {
  'use strict';

  if (!window.Shed) return;
  const S = window.Shed;

  const COUNT = [6, 7];
  const SIZE = [13, 22];
  const DUR = [1.9, 3.4];
  const FLAP = [0.13, 0.2];
  const BOB = [3, 7];
  const TILT_JITTER = [-7, 9];
  const TILT_OF = 0.45;         // how much of the heading shows as a tilt

  const HEADING = [38, 66];     // degrees up and to the right
  const SPREAD = [14, 38];      // how far the flock fans out
  const OVERSHOOT = [1.08, 1.3];
  const FROM = { x: [0.16, 0.84], y: [0.08, 0.52] };
  const COOLDOWN_MS = 1100;

  const TONES = [
    ['#141414', '#3A3D40', '#6E7478'],
    ['#0E0E10', '#33363A', '#646A6E'],
    ['#1A1A1C', '#42454A', '#787E82'],
  ];

    // A far wing, a body, a beak and two near wings, so the flap passes in front of the bird.
  const BIRD_SVG =
    '<svg class="bird-body" viewBox="0 0 56 30" fill="none" aria-hidden="true">' +
    '<path class="bird-wing bird-wing-far" fill="var(--shade)" ' +
    'd="M32 18C28.4 12.4 22.2 6.2 15.4 2.2L5.8 .6 11.2 5.2 1.6 4.2 8.4 8.4 .4 9.2 7.4 11.6 2.2 14.2' +
    'C8.6 16 17.4 18.4 27.6 19.8 30 20.1 31.6 19.4 32 18Z"/>' +
    '<path fill="var(--tone)" ' +
    'd="M21.5 17.4C15 16.8 8 15.8 2.8 14.8 1.4 14.5 1 16.6 2.2 17.2 8 19.4 14.5 21 21.5 22.4Z"/>' +
    '<path fill="var(--tone)" ' +
    'd="M20 18.2C24 16.4 28 15.2 33 14.7 37.5 14.25 41 14.6 43.6 15.6 44.6 16.1 44.8 20 43.8 20.5' +
    '41.2 21.9 37.6 22.7 33.6 22.9 28 23.2 23.5 22.4 20 21.4Z"/>' +
    '<path fill="var(--beak)" ' +
    'd="M43.4 15.7 54.2 17.9C55 18.05 55 18.75 54.2 18.95L43.6 20.4C43 19 43 16.9 43.4 15.7Z"/>' +
    '<circle cx="41.4" cy="17.4" r="0.8" fill="#C9CCCE"/>' +
    '<path class="bird-wing bird-wing-near" fill="var(--tone)" ' +
    'd="M32 18C28.4 12.4 22.2 6.2 15.4 2.2L5.8 .6 11.2 5.2 1.6 4.2 8.4 8.4 .4 9.2 7.4 11.6 2.2 14.2' +
    'C8.6 16 17.4 18.4 27.6 19.8 30 20.1 31.6 19.4 32 18Z"/>' +
    '<path class="bird-wing bird-wing-near" fill="var(--shade)" ' +
    'd="M32 18C29.4 14.2 25.6 9.8 21.4 6.4 22.6 10.6 25 15 28.4 18.8 29.8 19.4 31.2 19.2 32 18Z"/>' +
    '</svg>';

    // Their own layer inside the tree, which the page can put behind the leaves.
  function nestOf(tree) {
    let nest = tree.querySelector('.birds');
    if (!nest) {
      nest = document.createElement('span');
      nest.className = 'birds';
      tree.insertBefore(nest, tree.firstChild);
    }
    return nest;
  }

  function startle(tree) {
    const heading = S.rand(HEADING[0], HEADING[1]);
    const spread = S.rand(SPREAD[0], SPREAD[1]);
    const hurry = S.rand(0.82, 1.18);
    const n = Math.round(S.rand(COUNT[0], COUNT[1]) * S.knob(tree, '--bird-count'));
    const scale = S.knob(tree, '--bird-scale');

    const nest = nestOf(tree);
    const box = nest.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;

    for (let i = 0; i < n; i++) {
      const bird = document.createElement('span');
      bird.className = 'bird';

      const deg = heading + S.rand(-spread / 2, spread / 2);
      const rad = (deg * Math.PI) / 180;

      const fx = S.rand(FROM.x[0], FROM.x[1]);
      const fy = S.rand(FROM.y[0], FROM.y[1]);
      const x0 = box.left + fx * box.width;
      const y0 = box.top + fy * box.height;

    // Far enough to clear the window, so no bird stops short or outlives its flight.
      const stepX = Math.cos(rad);
      const stepY = -Math.sin(rad);
      const size = S.rand(SIZE[0], SIZE[1]) * scale;
      const pad = box.width * (size / 100) + 8;
      const toEdgeX = stepX > 0 ? (W + pad - x0) / stepX
                    : stepX < 0 ? (-pad - x0) / stepX : Infinity;
      const toEdgeY = stepY > 0 ? (H + pad - y0) / stepY
                    : stepY < 0 ? (-pad - y0) / stepY : Infinity;
      const reach = Math.min(toEdgeX, toEdgeY) * S.rand(OVERSHOOT[0], OVERSHOOT[1]);

      const s = bird.style;
      s.setProperty('--x', fx * 100 + '%');
      s.setProperty('--y', fy * 100 + '%');
      s.setProperty('--size', size + 'cqw');
      s.setProperty('--fly-x', (stepX * reach).toFixed(0) + 'px');
      s.setProperty('--fly-y', (stepY * reach).toFixed(0) + 'px');
      s.setProperty('--tilt',
        (-deg * TILT_OF + S.rand(TILT_JITTER[0], TILT_JITTER[1])).toFixed(1) + 'deg');
      s.setProperty('--bank', S.rand(4, 11).toFixed(1) + 'deg');
      s.setProperty('--dur', (S.rand(DUR[0], DUR[1]) * hurry).toFixed(2) + 's');
      s.setProperty('--flap', (S.rand(FLAP[0], FLAP[1]) * hurry).toFixed(3) + 's');
      s.setProperty('--bob', S.rand(BOB[0], BOB[1]).toFixed(1) + 'cqw');
      s.setProperty('--bob-dur', S.rand(0.5, 0.9).toFixed(2) + 's');
    // Squared random, so most of the flock leaves at once and a straggler follows.
      s.setProperty('--delay', (Math.pow(Math.random(), 2) * 0.42).toFixed(3) + 's');

      const tone = S.pick(TONES);
      s.setProperty('--tone', tone[0]);
      s.setProperty('--shade', tone[1]);
      s.setProperty('--beak', tone[2]);

      const bob = document.createElement('span');
      bob.className = 'bird-bob';
      const tilt = document.createElement('span');
      tilt.className = 'bird-tilt';
      tilt.innerHTML = BIRD_SVG;
      bob.appendChild(tilt);
      bird.appendChild(bob);
      nest.appendChild(bird);

      bird.addEventListener('animationend', function (e) {
        if (e.animationName === 'bird-fly') bird.remove();
      });
    }
  }

  S.on('.takes-flight', { move: COOLDOWN_MS, click: 0 }, function (tree) {
    // After dark the birds are asleep and the owl has the tree.
    if (document.body.classList.contains('night')) return;
    startle(tree);
  });
})();
