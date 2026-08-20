/* The dimmed backpack the notebook, compass and bars sit on. Written in at the script tag, so assets.js and nightart.js see the images as the parser creates them. */

(function () {
  'use strict';

  var ART = 'illustrations/backpack/';

  document.currentScript.insertAdjacentHTML('afterend',
    '<div class="sky-layer"></div>' +
    '<div class="stage backdrop night-backdrop">' +
      '<img class="stage-art" src="' + ART + 'bag_background.svg" alt="">' +
      '<img class="bag-item-back bag-notebook" src="' + ART + 'notebook_small.svg" alt="">' +
      '<img class="bag-item-back bag-compass" src="' + ART + 'compass_small.svg"' +
        ' data-night-src="' + ART + 'compass_small_night.svg" alt="">' +
      '<img class="bag-item-back bag-bars" src="' + ART + 'bars_small.svg" alt="">' +
    '</div>' +
    '<div class="dim-overlay"></div>'
  );
})();
