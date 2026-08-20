/* The daytime sky. night.js draws over this rather than replacing it, so nothing here knows about the campfire. */

(function () {
  'use strict';

  if (!window.Sky) return;

  const CLOUD_COUNT = 3;
  const CLOUD_BAND = [0.06, 0.28];    // where in the sky they drift, top-down
  const CLOUD_WIDTH = [10, 17];       // vw
  const CLOUD_CROSS = [170, 290];     // seconds to cross the window
  const CLOUD_DIM = [0.20, 0.34];
  const PUFFS = 4;                    // blobs per cloud

  const rand = window.Sky.rand;

  const sky = window.Sky.layer('day', syncSun);

  const sun = document.createElement('div');
  sun.className = 'sun';
  sun.innerHTML = '<div class="sun-halo"></div><div class="sun-disc"></div>';
  sky.box.appendChild(sun);

    /* A cloud is overlapping radial gradients: a long flat base and a row of puffs, built per cloud so no two are alike. */
  function cloudBackground() {
    const blobs = [
      'radial-gradient(ellipse ' + rand(44, 52).toFixed(0) + '% ' +
      rand(15, 20).toFixed(0) + '% at 50% ' + rand(66, 74).toFixed(0) + '%, ' +
      'rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 46%, rgba(255,255,255,0) 100%)'
    ];
    for (let j = 0; j < PUFFS; j++) {
      const x = ((j + 0.5) / PUFFS) * 74 + 13 + rand(-6, 6);
      const rx = rand(13, 21);
      const lift = 1 - Math.abs((j + 0.5) / PUFFS - 0.5) * 1.4;
      const ry = rx * rand(1.5, 2.0) * lift;
      const y = rand(48, 62) - ry * 0.35;
      blobs.push('radial-gradient(ellipse ' + rx.toFixed(1) + '% ' + ry.toFixed(1) +
                 '% at ' + x.toFixed(1) + '% ' + y.toFixed(1) + '%, ' +
                 'rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 48%, rgba(255,255,255,0) 100%)');
    }
    return blobs.join(', ');
  }

  for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloud = document.createElement('i');
    cloud.className = 'cloud';
    const s = cloud.style;

    // One cloud per band of sky, jittered inside it, so they never bunch.
    const slot = (i + rand(0.15, 0.85)) / CLOUD_COUNT;
    const dur = rand(CLOUD_CROSS[0], CLOUD_CROSS[1]);
    s.setProperty('--y', ((CLOUD_BAND[0] + slot * (CLOUD_BAND[1] - CLOUD_BAND[0])) * 100).toFixed(2) + '%');
    s.setProperty('--w', rand(CLOUD_WIDTH[0], CLOUD_WIDTH[1]).toFixed(1) + 'vw');
    s.setProperty('--dur', dur.toFixed(0) + 's');
    s.setProperty('--dim', rand(CLOUD_DIM[0], CLOUD_DIM[1]).toFixed(2));
    s.background = cloudBackground();

    // A negative delay starts each part-way across, so the sky is already busy.
    s.setProperty('--delay', (-rand(0, 1) * dur).toFixed(0) + 's');
    s.setProperty('--still-x', rand(5, 75).toFixed(0) + 'vw');
    sky.layer.appendChild(cloud);
  }

  document.body.appendChild(sky.layer);

  const warm = document.createElement('div');
  warm.className = 'day-warm';
  document.body.appendChild(warm);

  // The warm light in the scene is aimed at wherever the sun ended up.
  function syncSun() {
    const r = sun.getBoundingClientRect();
    if (!r.width) return;
    const root = document.documentElement.style;
    root.setProperty('--sun-x', (((r.left + r.width / 2) / window.innerWidth) * 100).toFixed(2) + '%');
    root.setProperty('--sun-y', (((r.top + r.height / 2) / window.innerHeight) * 100).toFixed(2) + '%');
  }

  window.Sky.sync();
})();
