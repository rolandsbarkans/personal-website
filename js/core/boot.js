/* The cache stamp, the local-file loader and the door from one room to the next. Loaded with a plain <script src> because it defines loadLocal. */

// Local: a new stamp every load. Deployed: '1' — bump it to force a refresh.
window.CAMPSITE_V =
  location.protocol === 'file:' ||
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
    ? Date.now()
    : '1';

// document.write keeps each file parser-blocking and in order.
window.loadLocal = function (src) {
  var url = src + '?v=' + window.CAMPSITE_V;
  document.write(
    /\.css$/.test(src)
      ? '<link rel="stylesheet" href="' + url + '">'
      : '<script src="' + url + '"><\/script>'
  );
};

// music.js replaces this inside the shell, so the frame is never torn out from under the song.
window.go = function (page) {
  location.href = page + (page.indexOf('?') < 0 ? '?' : '&') + 'v=' + window.CAMPSITE_V;
};
