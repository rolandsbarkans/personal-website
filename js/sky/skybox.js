/* The plumbing day.js and night.js share: a full-window layer with a box kept over the scene, since the sun and moon are placed against the scene and the rest against the window. */

(function () {
  'use strict';

  var scene = document.querySelector('.scene');
  if (!scene) return;

  var boxes = [];

  // Ignores any arrival zoom still running, so the sky does not swim about.
  function resting() {
    var x = 0;
    var y = 0;
    var n = scene;
    while (n) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return { left: x, top: y, width: scene.offsetWidth, height: scene.offsetHeight };
  }

  function sync() {
    var r = resting();
    boxes.forEach(function (entry) {
      entry.el.style.left = r.left + 'px';
      entry.el.style.top = r.top + 'px';
      entry.el.style.width = r.width + 'px';
      entry.el.style.height = r.height + 'px';
      if (entry.after) entry.after();
    });
  }

  var Sky = (window.Sky = {});

  Sky.rand = function (lo, hi) { return lo + Math.random() * (hi - lo); };

  // A full-window {name}-layer holding a scene-sized {name}-scenebox. `after` runs on every re-sync.
  Sky.layer = function (name, after) {
    var layer = document.createElement('div');
    layer.className = name + '-layer';
    var box = document.createElement('div');
    box.className = name + '-scenebox';
    layer.appendChild(box);
    boxes.push({ el: box, after: after });
    return { layer: layer, box: box };
  };

  Sky.sync = sync;

  window.addEventListener('resize', sync);
  window.addEventListener('load', sync);
  scene.addEventListener('transitionend', sync);
})();
