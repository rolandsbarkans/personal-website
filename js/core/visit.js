/* A visit, as opposed to a reload.

   sessionStorage lasts exactly as long as the tab: it survives Cmd-R and every
   move between rooms, and is gone when the tab is closed. So a flag in it is
   the one thing that can tell "came back a week later" apart from "pressed
   reload" — which is the difference this file is about. On a new visit the
   keys that only record HAVING BEEN SHOWN something are wiped, and the
   campsite is met the way it is meant to be met: the bee talks on the island,
   the flowers earn their hint again, and the patch is the one that was drawn
   for it.

   What a visitor MADE is not touched. Their hikes and their liked songs are
   theirs and stay. The flower styles are wiped because the patch is scenery
   they repainted, not a thing they filed away — the island should open in its
   own colours again.

   Loaded by the shell only, before any room exists, so nothing has read these
   keys yet. */

(function () {
  'use strict';

  var FLAG = 'campsiteVisit';

  var SHOWN_ALREADY = [
    'seenIntroMain',        // the bee's opening line on the island
    'seenFlowerHint',       // the hint that the flowers can be repainted
    'flowerHoverMs',        // how long the pointer has rested on them
    'seenDrawRoom',         // set by draw.html, and retires the hint for good
    'seenIntroDraw2',       // the bee's line in the drawing room
    'campsiteFlowerStyles'  // the repainted patch itself
  ];

  try {
    if (sessionStorage.getItem(FLAG) === '1') return;
    sessionStorage.setItem(FLAG, '1');
    SHOWN_ALREADY.forEach(function (key) {
      localStorage.removeItem(key);
    });
  } catch (err) {
    /* Storage walled off: every load is then a first visit, which is the
       right way for this to fail. */
  }
})();
