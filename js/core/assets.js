/* Puts the cache stamp on <img> tags at runtime: they are written by hand and cannot get one from loadLocal. Does nothing once deployed. */

(function () {
  'use strict';

  var V = window.CAMPSITE_V;

  window.stamped = function (url) {
    if (!url || !V) return url;
    if (/^(https?:)?\/\//.test(url)) return url;
    if (/^(data:|blob:|#|mailto:)/.test(url)) return url;
    if (/[?&]v=/.test(url)) return url;
    // The fragment stays last: the PDF viewer options and the audio "#t=" depend on it.
    var hash = '';
    var h = url.indexOf('#');
    if (h >= 0) { hash = url.slice(h); url = url.slice(0, h); }
    return url + (url.indexOf('?') < 0 ? '?' : '&') + 'v=' + V + hash;
  };

  if (V === '1') return;

  var ATTR = { IMG: 'src', EMBED: 'src', SOURCE: 'src', OBJECT: 'data' };

  function fix(el) {
    var attr = ATTR[el.tagName];
    if (!attr) return;
    var url = el.getAttribute(attr);
    var next = window.stamped(url);
    if (next !== url) el.setAttribute(attr, next);
  }

  function fixTree(node) {
    if (node.nodeType !== 1) return;
    fix(node);
    if (node.querySelectorAll) {
      var found = node.querySelectorAll('img, embed, source, object');
      for (var i = 0; i < found.length; i++) fix(found[i]);
    }
  }

  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) fixTree(added[j]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // Backstop for anything the observer missed.
  function sweep() { fixTree(document.documentElement); }
  document.addEventListener('DOMContentLoaded', sweep);
  window.addEventListener('load', sweep);
})();
