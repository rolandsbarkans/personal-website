/* Swaps in a second drawing after dark: <img src="…" data-night-src="…">. Load after nightrooms.js. Watches the parser, so the day drawing is usually never painted. */

(function () {
  'use strict';

  if (!document.documentElement.classList.contains('night')) return;

  function swap(el) {
    if (el.tagName !== 'IMG') return;
    var night = el.getAttribute('data-night-src');
    if (!night) return;
    // Removing the attribute records "done", so the sweeps below cost nothing.
    el.removeAttribute('data-night-src');
    el.setAttribute('src', window.stamped ? window.stamped(night) : night);
  }

  function swapTree(node) {
    if (node.nodeType !== 1) return;
    swap(node);
    if (node.querySelectorAll) {
      var found = node.querySelectorAll('img[data-night-src]');
      for (var i = 0; i < found.length; i++) swap(found[i]);
    }
  }

  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) swapTree(added[j]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  function sweep() { swapTree(document.documentElement); }
  document.addEventListener('DOMContentLoaded', sweep);
  window.addEventListener('load', sweep);
})();
