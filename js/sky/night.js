/* The campsite after dark. The campfire is the switch: it puts `night` on <body> and writes to sessionStorage for the other rooms. Main page only. */

(function () {
  'use strict';

  const scene = document.querySelector('.scene');
  const fire = document.querySelector('.bonfire');
  if (!scene || !window.Sky) return;

  const STAR_COUNT = 110;
  const STAR_TOP = 0.02;
  const STAR_BOTTOM = 0.56;      // stars stop well above the treeline
  const STAR_SIZE = [0.085, 0.24];
  const BRIGHT_EVERY = 14;       // every nth star gets a cross-flare
  const SHOOT_GAP = [16, 34];    // seconds between shooting stars

  const KEY = 'campsiteNight';
  const rand = window.Sky.rand;
  const stillOnly = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sky = window.Sky.layer('night', syncFire);

  const moon = document.createElement('div');
  moon.className = 'moon';
  moon.innerHTML =
    '<div class="moon-disc">' +
    '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="42" fill="#FFF6DC" stroke="#2A3260" stroke-width="3"/>' +
      '<path d="M92 50 A42 42 0 0 1 50 92 A42 42 0 0 0 86 36 A42 42 0 0 1 92 50 Z" fill="#EBDCB4"/>' +
      '<g fill="#F0E2BE">' +
        '<ellipse cx="38" cy="36" rx="11" ry="9.5"/>' +
        '<ellipse cx="62" cy="58" rx="8" ry="7"/>' +
        '<ellipse cx="36" cy="63" rx="6.5" ry="5.5"/>' +
        '<ellipse cx="57" cy="30" rx="4.5" ry="4"/>' +
      '</g>' +
    '</svg></div>';
  sky.box.appendChild(moon);

  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement('i');
    star.className = 'star' + (i % BRIGHT_EVERY === 0 ? ' star-bright' : '');
    const s = star.style;
    s.setProperty('--x', rand(0, 100).toFixed(2) + '%');
    // Squared random, so the field thins out toward the horizon.
    const t = Math.random() * Math.random();
    s.setProperty('--y', ((STAR_TOP + t * (STAR_BOTTOM - STAR_TOP)) * 100).toFixed(2) + '%');
    s.setProperty('--size', rand(STAR_SIZE[0], STAR_SIZE[1]).toFixed(3) + 'vw');
    s.setProperty('--lit', rand(0.45, 1).toFixed(2));
    s.setProperty('--tw', rand(1.9, 5.6).toFixed(2) + 's');
    s.setProperty('--delay', (-rand(0, 6)).toFixed(2) + 's');
    sky.layer.appendChild(star);
  }

  document.body.appendChild(sky.layer);

  const veil = document.createElement('div');
  veil.className = 'night-veil';
  const glow = document.createElement('div');
  glow.className = 'night-glow';
  const signLight = document.createElement('div');
  signLight.className = 'sign-light';
  document.body.append(veil, glow, signLight);

    /* A lantern over the sign being shown, or the veil flattens it to grey. */
  const SIGN_PAD = 1.35;

  scene.addEventListener('hotspot:lit', (e) => {
    const tag = e.target.querySelector && e.target.querySelector('.tag');
    if (!tag) return;
    const r = tag.getBoundingClientRect();
    if (!r.width) return;
    const s = signLight.style;
    s.setProperty('--sign-x', (((r.left + r.width / 2) / window.innerWidth) * 100).toFixed(2) + '%');
    s.setProperty('--sign-y', (((r.top + r.height / 2) / window.innerHeight) * 100).toFixed(2) + '%');
    s.setProperty('--sign-w', ((r.width * SIGN_PAD / window.innerWidth) * 100).toFixed(2) + '%');
    s.setProperty('--sign-h', ((r.height * SIGN_PAD * 1.6 / window.innerHeight) * 100).toFixed(2) + '%');
    signLight.classList.add('on');
  });

  scene.addEventListener('hotspot:unlit', () => signLight.classList.remove('on'));

  // The hole in the veil and the warm light both follow the fire.
  function syncFire() {
    if (!fire) return;
    const r = fire.getBoundingClientRect();
    if (!r.width) return;
    const root = document.documentElement.style;
    root.setProperty('--fire-x', (((r.left + r.width / 2) / window.innerWidth) * 100).toFixed(2) + '%');
    root.setProperty('--fire-y', (((r.top + r.height * 0.42) / window.innerHeight) * 100).toFixed(2) + '%');
  }

  window.Sky.sync();

  let night = sessionStorage.getItem(KEY) === '1';

    /* `instant` suppresses the transitions for a frame, so a camp that was already dark does not replay the sunset. */
  function apply(instant) {
    if (instant) document.body.classList.add('night-instant');
    document.body.classList.toggle('night', night);
    if (!instant) return;
    const release = () => document.body.classList.remove('night-instant');
    requestAnimationFrame(() => requestAnimationFrame(release));
    setTimeout(release, 150);
  }

  if (night) apply(true);

  if (fire) {
    fire.addEventListener('click', (e) => {
      e.stopPropagation();
      night = !night;
      sessionStorage.setItem(KEY, night ? '1' : '0');
      syncFire();
      apply(false);
    });
  }

  function shoot(asked) {
    if (!night || stillOnly) return;
    if (!asked && document.hidden) return;
    const star = document.createElement('div');
    star.className = 'shooting-star';
    const s = star.style;
    s.setProperty('--x', rand(-5, 75).toFixed(1) + '%');
    s.setProperty('--y', rand(2, 34).toFixed(1) + '%');
    s.setProperty('--angle', rand(14, 34).toFixed(1) + 'deg');
    s.setProperty('--len', rand(9, 17).toFixed(1) + 'vw');
    s.setProperty('--dur', rand(0.9, 1.5).toFixed(2) + 's');
    sky.layer.appendChild(star);
    star.addEventListener('animationend', () => star.remove());
  }

  (function schedule() {
    setTimeout(() => {
      shoot();
      schedule();
    }, rand(SHOOT_GAP[0], SHOOT_GAP[1]) * 1000);
  })();

  /* Drawn behind the scene, so it cannot be a .hotspot and is hit-tested by hand. */
  const MOON_REACH = 1.15;

  function onMoon(clientX, clientY) {
    if (!night) return false;
    const r = moon.getBoundingClientRect();
    if (!r.width) return false;
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    const reach = (r.width / 2) * MOON_REACH;
    return dx * dx + dy * dy <= reach * reach;
  }

  function nudgeMoon() {
    moon.classList.remove('nudged');
    void moon.offsetWidth;
    moon.classList.add('nudged');
  }

  moon.addEventListener('animationend', () => moon.classList.remove('nudged'));

  let onMoonNow = false;

  document.addEventListener('pointermove', (e) => {
    const over = onMoon(e.clientX, e.clientY);
    if (over === onMoonNow) return;
    onMoonNow = over;
    if (over) {
      nudgeMoon();
      shoot(true);
    }
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (!onMoon(e.clientX, e.clientY)) return;
    nudgeMoon();
    shoot(true);
  });
})();
