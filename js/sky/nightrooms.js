/* The night follows the visitor out of the campsite. Pairs with css/sky/nightrooms.css. The class goes on <html> because this runs from the <head>. */

(function () {
  const KEY = 'campsiteNight';   // the same key night.js writes
  if (sessionStorage.getItem(KEY) !== '1') return;

  const root = document.documentElement;

  // Suppressed for the first paint, or a room that was already dark replays the sunset. The timer covers an offscreen frame, where animation frames never run.
  root.classList.add('night-instant', 'night');

  const release = () => root.classList.remove('night-instant');
  requestAnimationFrame(() => requestAnimationFrame(release));
  setTimeout(release, 150);
})();
