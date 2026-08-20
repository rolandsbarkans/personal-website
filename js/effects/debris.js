/* Shavings off the log and chips off the rocks. Needs shed.js. */

(function () {
  'use strict';

  if (!window.Shed) return;
  const S = window.Shed;

  const COOLDOWN_MS = 700;
  const VARIANTS = ['v-a', 'v-b', 'v-c'];   // three silhouettes per shape

  const KINDS = {
    'sheds-shavings': {
      shape: 'shaving',
      count: [4, 7],
      size: [7, 11],
      rise: [8, 14],
      fall: [30, 46],
      drift: [10, 22],
      from: { x: [0.30, 0.92], y: [0.10, 0.45] },
      dur: [0.85, 1.25],
      tones: [
        ['#FBC78C', '#D7B563'],
        ['#D7B563', '#AD682F'],
        ['#FAAD61', '#D7B563'],
        ['#AD682F', '#8E4830']
      ]
    },

  // Stone is harder: chips are lighter, go higher and scatter further than shavings.
    'sheds-chips': {
      shape: 'chip',
      count: [4, 7],
      size: [4.5, 7.5],
      rise: [12, 20],
      fall: [40, 62],
      drift: [30, 55],
      from: { x: [0.15, 0.85], y: [0.05, 0.40] },
      dur: [0.75, 1.05],
      tones: [
        ['#DAD6CF', '#A69A9B'],
        ['#CAC2BE', '#847E7E'],
        ['#C2BCB4', '#77706F'],
        ['#A69A9B', '#7F7577']
      ]
    }
  };

  function knock(el, cfg) {
    const scale = S.match(el) * S.knob(el, '--bit-scale');
    const n = Math.round(S.rand(cfg.count[0], cfg.count[1]) * S.knob(el, '--bit-count'));

    for (let i = 0; i < n; i++) {
      const bit = document.createElement('span');
      bit.className = 'bit ' + cfg.shape + ' ' + S.pick(VARIANTS);

      const fx = S.rand(cfg.from.x[0], cfg.from.x[1]);
      const fy = S.rand(cfg.from.y[0], cfg.from.y[1]);

    // Bits fly away from the middle, so the burst looks like it came out of the impact.
      const away = fx < 0.5 ? -1 : 1;
      const dir = Math.random() < 0.35 ? -away : away;

      const s = bit.style;
      s.setProperty('--size', S.rand(cfg.size[0], cfg.size[1]) * scale + 'cqw');
      s.setProperty('--x', fx * 100 + '%');
      s.setProperty('--y', fy * 100 + '%');
      s.setProperty('--rise', S.rand(cfg.rise[0], cfg.rise[1]) * scale + 'cqw');
      s.setProperty('--fall', S.rand(cfg.fall[0], cfg.fall[1]) * scale + 'cqw');
      s.setProperty('--drift', S.rand(cfg.drift[0], cfg.drift[1]) * scale * dir + 'cqw');

      const tone = S.pick(cfg.tones);
      s.setProperty('--tone', tone[0]);
      s.setProperty('--shade', tone[1]);

      s.setProperty('--tilt', S.rand(-180, 180) + 'deg');
      s.setProperty('--spin', S.rand(140, 340) * dir + 'deg');
      s.setProperty('--dur', S.rand(cfg.dur[0], cfg.dur[1]) + 's');
      s.setProperty('--delay', S.rand(0, 0.12) + 's');

      const fall = document.createElement('span');
      fall.className = 'bit-fall';
      const body = document.createElement('span');
      body.className = 'bit-body';
      fall.appendChild(body);
      bit.appendChild(fall);
      el.appendChild(bit);

      bit.addEventListener('animationend', function (e) {
        if (e.animationName === 'bit-throw') bit.remove();
      });
    }
  }

  Object.keys(KINDS).forEach(function (kind) {
    const cfg = KINDS[kind];
    S.on('.' + kind, { move: COOLDOWN_MS, click: 0 }, function (el) {
      knock(el, cfg);
    });
  });
})();
