/* The fade between the open backpack and the thing inside it. A page opts in with [data-bag-dim] or [data-bag-item]; window.BAG_MS tunes the timings. Exports { toItem(url), toBag(url) }. */

(function () {
  'use strict';

  var FROM_ITEM = 'bagArriveFromItem';

  var dim = document.querySelector('[data-bag-dim]');
  var item = document.querySelector('[data-bag-item]');

  var isItemPage = !!item;

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // dark: the bag going out. rise: the item coming in. beat: the pause. out, undim: the way back.
  var MS = {
    dark: 150,
    rise: 400,
    beat: 30,
    out: 170,
    undim: 280,
    wait: 700
  };

  if (window.BAG_MS) {
    Object.keys(window.BAG_MS).forEach(function (key) {
      if (typeof window.BAG_MS[key] === 'number') MS[key] = window.BAG_MS[key];
    });
  }

  var leaving = false;

  function dur(el, ms) {
    if (el) el.style.setProperty('--bag-dur', (reduce ? 1 : ms) + 'ms');
  }

  function delay(el, ms) {
    if (el) el.style.transitionDelay = (reduce ? 0 : ms) + 'ms';
  }

  function add(el, cls) { if (el) el.classList.add(cls); }
  function remove(el, cls) { if (el) el.classList.remove(cls); }

  function commit(el) {
    if (el) void el.offsetHeight;
  }

  // Run fn when a transition finishes, or when it should have: a hidden or interrupted one may never fire.
  function whenDone(el, prop, ms, fn) {
    var fired = false;
    function done() {
      if (fired) return;
      fired = true;
      if (el) el.removeEventListener('transitionend', onEnd);
      fn();
    }
    function onEnd(e) {
      if (e.target === el && e.propertyName === prop) done();
    }
    if (el) el.addEventListener('transitionend', onEnd);
    setTimeout(done, (reduce ? 1 : ms) + 60);
  }

  function whenLoaded(fn) {
    if (document.readyState === 'complete') { fn(); return; }
    window.addEventListener('load', fn, { once: true });
  }

    // Hold the item back until the bag behind it has painted, or it rises out of a blank rectangle.
  function whenReady(fn) {

    var bg = document.querySelector('[data-bag-wait]') ||
             document.querySelector('.stage.backdrop img');
    var stage = document.querySelector('.stage.backdrop');

    function ready() {
      if (stage) stage.classList.add('bag-ready');
      fn();
    }

    if (!bg || bg.complete) { ready(); return; }
    var ran = false;
    function once() {
      if (ran) return;
      ran = true;
      bg.removeEventListener('load', once);
      bg.removeEventListener('error', once);
      ready();
    }
    bg.addEventListener('load', once);
    bg.addEventListener('error', once);
    setTimeout(once, reduce ? 1 : MS.wait);
  }

  if (isItemPage) {

    whenReady(function () {

      commit(item);

      dur(item, MS.rise);
      delay(item, MS.beat);
      add(item, 'bag-anim');
      add(item, 'bag-shown');
    });
  } else if (sessionStorage.getItem(FROM_ITEM) === '1') {
    sessionStorage.removeItem(FROM_ITEM);

    add(dim, 'bag-dark');
    commit(dim);

    whenLoaded(function () {
      dur(dim, MS.undim);
      add(dim, 'bag-anim');
      remove(dim, 'bag-dark');
    });
  } else {

    sessionStorage.removeItem(FROM_ITEM);
  }

  function toItem(url) {
    if (leaving) return;
    leaving = true;

    dur(dim, MS.dark);
    add(dim, 'bag-anim');
    add(dim, 'bag-dark');

    whenDone(dim, 'opacity', MS.dark, function () {
      window.go(url);
    });
  }

  function toBag(url) {
    if (leaving) return;
    leaving = true;

    sessionStorage.setItem(FROM_ITEM, '1');

    dur(item, MS.out);
    delay(item, 0);
    add(item, 'bag-anim');
    remove(item, 'bag-shown');

    whenDone(item, 'opacity', MS.out, function () {
      window.go(url || 'backpack.html');
    });
  }

  window.bagTransition = { toItem: toItem, toBag: toBag };
})();
