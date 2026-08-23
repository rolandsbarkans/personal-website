/* Is this a phone? Shared by the shell, which sends one to mobile.html, and by mobile.html's own way back. Loaded from the <head> before anything decides where to go. */

(function () {
  'use strict';

  /* The short edge of the biggest phone, and the short edge of the smallest
     tablet (iPad mini, 744) safely above it. A tablet keeps the campsite: it
     has a pointer's worth of room even without a pointer. */
  var PHONE_EDGE = 560;

  window.isPhone = function () {
    // Both halves matter: a narrow desktop window is not a phone.
    var touch = window.matchMedia &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!touch) return false;

    // screen, not innerWidth, or turning the phone changes the answer.
    var screenW = window.screen ? window.screen.width : window.innerWidth;
    var screenH = window.screen ? window.screen.height : window.innerHeight;
    return Math.min(screenW, screenH) <= PHONE_EDGE;
  };
})();
