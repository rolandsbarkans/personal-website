/* The email address, and the bubble the bee holds up to say it is copied. Call EmailCopy.copy() from a click. */

(function () {
  'use strict';

  var EMAIL = 'rolands.barkans@uni.minerva.edu';
  var SHOWN = 2200;
  var REACH = 20;

  var bubble = document.createElement('div');
  bubble.className = 'bee-bubble tight';
  bubble.textContent = 'email address copied';
  document.body.appendChild(bubble);

  var timer = null;
  var following = false;

  // Only runs while the bubble is up, so an idle room keeps no animation.
  function follow() {
    if (!following) return;
    if (window.Bee) {
      bubble.style.left = (window.Bee.x + REACH) + 'px';
      bubble.style.top = (window.Bee.y - 24) + 'px';
    }
    requestAnimationFrame(follow);
  }

  function show() {
    if (!following) {
      following = true;
      follow();
    }
    bubble.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(function () {
      bubble.classList.remove('show');
      following = false;
    }, SHOWN);
  }

  function copy() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(show, show);
      return;
    }
      // execCommand is the fallback for file:// and older browsers.
    var helper = document.createElement('textarea');
    helper.value = EMAIL;
    document.body.appendChild(helper);
    helper.select();
    try { document.execCommand('copy'); } catch (err) {}
    helper.remove();
    show();
  }

  window.EmailCopy = { address: EMAIL, copy: copy, bubble: bubble };
})();
