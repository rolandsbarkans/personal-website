/* What leaves, needles, debris and birds all do the same way: answer a hotspot nudge, no faster than a cooldown, with numbers read off the object's own CSS. Load before any of them. */

(function () {
  'use strict';

  var Shed = (window.Shed = {});

  // Specks are sized in cqw, so they are corrected against one reference object.
  var REF = '.bush1';

  Shed.still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Shed.rand = function (lo, hi) { return lo + Math.random() * (hi - lo); };
  Shed.pick = function (list) { return list[(Math.random() * list.length) | 0]; };
  Shed.coin = function () { return Math.random() < 0.5 ? -1 : 1; };

  // A per-object multiplier from the page's CSS, or 1.
  Shed.knob = function (el, name) {
    var v = parseFloat(getComputedStyle(el).getPropertyValue(name));
    return v > 0 ? v : 1;
  };

  Shed.match = function (el) {
    var ref = document.querySelector(REF);
    if (!ref || ref === el) return 1;
    var mine = el.getBoundingClientRect().width;
    if (!mine) return 1;
    return ref.getBoundingClientRect().width / mine;
  };

  // Call fn(el) when a matching object is brushed or clicked. `cool` is milliseconds or { move, click }.
  Shed.on = function (selector, cool, fn) {
    if (Shed.still) return;
    var move = typeof cool === 'number' ? cool : cool.move;
    var click = typeof cool === 'number' ? 0 : cool.click;

    document.querySelectorAll(selector).forEach(function (el) {
      var last = 0;
      el.addEventListener('hotspot:nudge', function (e) {
        var byClick = e.detail && e.detail.cause === 'click';
        var now = performance.now();
        if (now - last < (byClick ? click : move)) return;
        last = now;
        fn(el);
      });
    });
  };
})();
