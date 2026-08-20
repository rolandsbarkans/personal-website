/* The playlist, the audio, the corner panel and the player card. In the shell it owns the <audio>; in a room it drives the shell's through window.parent. A room opened on its own redirects into the shell unless ?solo=1. */

(function () {
  'use strict';

  // A room reached directly is bounced into the shell, so there is only ever one audio element.
  function useTheShell() {
    if (window.parent !== window) return false;
    if (/[?&]solo=1/.test(location.search)) return false;
    const here = location.pathname.split('/').pop();
    if (!here || here === 'index.html') return false;
    location.replace('index.html#' + here);
    return true;
  }

  if (useTheShell()) return;

  let shellEngine = null;
  if (window.parent !== window) {
    try {
      shellEngine = window.parent.CampsiteMusic || null;
    } catch (err) {

      shellEngine = null;
    }
  }

  function attachArrowKeys(api) {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (!api.hasStarted()) return;

      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        api.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        api.prev();
      }
    });
  }

  if (shellEngine) {

    window.CampsiteMusic = shellEngine;
    attachArrowKeys(shellEngine);

    if (typeof window.go === 'function') {
      const soloGo = window.go;
      window.go = function (page) {
        try {
          if (window.parent.__campsiteGo) {
            window.parent.__campsiteGo(page);
            return;
          }
        } catch (err) {

        }
        soloGo(page);
      };
    }
    return;
  }

    /* One entry per song; mp3 and square cover in material/music/. `explicit` shows the E. */
  const tracks = [
    {
      title: 'Material Lover',
      artist: 'SIENNA SPIRO',
      cover: 'material/music/song1.jpg',
      src: 'material/music/song1.mp3',
      explicit: false,
    },
    {
      title: "Let's Go Back",
      artist: 'Jungle',
      cover: 'material/music/song2.jpg',
      src: 'material/music/song2.mp3',
      explicit: false,
    },
    {
      title: 'Roommates',
      artist: 'Malcolm Todd',
      cover: 'material/music/song3.jpg',
      src: 'material/music/song3.mp3',
      explicit: false,
    },
    {
      title: 'The Dress',
      artist: 'Dijon',
      cover: 'material/music/song4.jpg',
      src: 'material/music/song4.mp3',
      explicit: false,
    },
    {
      title: 'Some',
      artist: 'Steve Lacy',
      cover: 'material/music/song5.jpg',
      src: 'material/music/song5.mp3',
      explicit: true,
    },
    {
      title: 'Send It Back',
      artist: 'DON WEST',
      cover: 'material/music/song6.jpg',
      src: 'material/music/song6.mp3',
      explicit: false,
    },
    {
      title: 'Will I See You Again?',
      artist: 'Thee Sacred Souls',
      cover: 'material/music/song7.jpg',
      src: 'material/music/song7.mp3',
      explicit: false,
    },
    {
      title: 'Genius',
      artist: 'Ravyn Lenae',
      cover: 'material/music/song8.jpg',
      src: 'material/music/song8.mp3',
      explicit: false,
    },
    {
      title: '4EVER',
      artist: 'Clairo',
      cover: 'material/music/song9.jpg',
      src: 'material/music/song9.mp3',
      explicit: false,
    },
    {
      title: 'I Think I Left The Stove On',
      artist: 'Hotel Ugly',
      cover: 'material/music/song10.jpg',
      src: 'material/music/song10.mp3',
      explicit: false,
    },
    {
      title: 'Baby Baby',
      artist: 'Sports',
      cover: 'material/music/song11.jpg',
      src: 'material/music/song11.mp3',
      explicit: false,
    },
  ];

  function asset(path) {
    const v = window.CAMPSITE_V;
    if (!v) return path;
    return path + (path.indexOf('?') < 0 ? '?' : '&') + 'v=' + v;
  }

  const KEY_INDEX = 'campsiteMusicIndex';
  const KEY_TIME = 'campsiteMusicTime';
  const KEY_PLAYING = 'campsiteMusicPlaying';
  const KEY_STARTED = 'campsiteMusicStarted';
  const KEY_STAMP = 'campsiteMusicStamp';
  const KEY_ASSET_V = 'campsiteMusicAssetV';

    /* Audio keeps one stamp for the whole visit: a fresh stamp per page is a new URL, so the song would re-download on every move. */
  function audioAsset(path) {
    const v = window.CAMPSITE_V;
    if (!v || v === '1') return path;
    let mine = sessionStorage.getItem(KEY_ASSET_V);
    if (!mine) {
      mine = String(v);
      sessionStorage.setItem(KEY_ASSET_V, mine);
    }
    return path + (path.indexOf('?') < 0 ? '?' : '&') + 'v=' + mine;
  }

  const KEY_HANDOFF = 'campsiteMusicHandoff';
  const SESSION_GAP_MS = 30 * 60 * 1000;

    /* A visit starts quiet after a reload, a long absence or a fresh arrival, but not across a walk from room to room. */
  (function startFreshIfNewVisit() {

    const handedOver = sessionStorage.getItem(KEY_HANDOFF) === '1';
    sessionStorage.removeItem(KEY_HANDOFF);

    let isReload = false;
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      isReload = !!nav && nav.type === 'reload';
    } catch (err) {

    }

    const stamp = parseInt(sessionStorage.getItem(KEY_STAMP), 10);
    const stale = isNaN(stamp) || Date.now() - stamp > SESSION_GAP_MS;

    if (!handedOver || isReload || stale) {
      sessionStorage.removeItem(KEY_INDEX);
      sessionStorage.removeItem(KEY_TIME);
      sessionStorage.removeItem(KEY_PLAYING);
      sessionStorage.removeItem(KEY_STARTED);
      sessionStorage.removeItem(KEY_STAMP);

      sessionStorage.removeItem(KEY_ASSET_V);
    }
  })();

  window.addEventListener('pagehide', () => {
    sessionStorage.setItem(KEY_HANDOFF, '1');
  });

  const audio = new Audio();
  audio.preload = 'auto';

  let index = parseInt(sessionStorage.getItem(KEY_INDEX), 10);
  if (isNaN(index) || index < 0 || index >= tracks.length) index = 0;

  let started = sessionStorage.getItem(KEY_STARTED) === '1';
  let loaded = false;
  const listeners = [];

  let miniHidden = false;
  let mini = null;
  let miniArt = null;
  let miniTitle = null;
  let miniArtist = null;

  function notify(what) {
    listeners.forEach((fn) => {
      try {
        fn(what);
      } catch (err) {

      }
    });
  }

  function saveState() {
    sessionStorage.setItem(KEY_INDEX, String(index));

    sessionStorage.setItem(KEY_TIME, String((seekBusy() ? wanted : audio.currentTime) || 0));
    sessionStorage.setItem(KEY_PLAYING, audio.paused ? '0' : '1');
    sessionStorage.setItem(KEY_STARTED, started ? '1' : '0');

    sessionStorage.setItem(KEY_STAMP, String(Date.now()));
  }

  const memory = {};

  let wanted = null;
  let seekWatch = 0;

  let pendingFraction = null;

  let repairing = false;

  let rangesOk = null;
  let probed = false;

  const SEEK_CHECK_MS = 700;
  const SEEK_TOLERANCE = 2;

  const REPAIR_LIMIT_MS = 8000;

  function inMemory() {
    return audio.src.indexOf('blob:') === 0;
  }

  function seekBusy() {
    if (repairing) return true;
    if (wanted === null) return false;
    return Math.abs(audio.currentTime - wanted) > SEEK_TOLERANCE;
  }

    /* Seeking needs range requests, which file:// and some static hosts refuse. Asked once with a one-byte range: 206 means ordinary seeking, 200 means fetch the file and seek in a blob. */
  function probeRanges() {
    if (probed) return;
    probed = true;
    fetch(audioAsset(tracks[index].src), { headers: { Range: 'bytes=0-1' } })
      .then((r) => {

        if (r.status === 206) rangesOk = true;
        else if (r.status === 200) rangesOk = false;
        else probed = false;
        if (r.body && r.body.cancel) r.body.cancel();
      })
      .catch(() => {

        rangesOk = null;
        probed = false;
      });
  }

  function seekTo(target) {
    wanted = target;

    if (rangesOk === false && !inMemory()) {
      repairSeek(target);
      return;
    }

    try {
      audio.currentTime = target;
    } catch (err) {

      repairSeek(target);
      return;
    }

    clearTimeout(seekWatch);
    seekWatch = setTimeout(() => {
      if (wanted !== target) return;
      if (Math.abs(audio.currentTime - target) <= SEEK_TOLERANCE) {
        wanted = null;
        return;
      }
      repairSeek(target);
    }, SEEK_CHECK_MS);
  }

  function watchSeek() {
    if (wanted === null || repairing) return;
    if (Math.abs(audio.currentTime - wanted) <= SEEK_TOLERANCE) return;
    repairSeek(wanted);
  }

  audio.addEventListener('timeupdate', watchSeek);
  audio.addEventListener('seeked', watchSeek);

    // Fetch the track into memory and seek in the blob, for servers that will not serve ranges.
  function repairSeek(target) {
    if (repairing) return;
    repairing = true;
    const wasPlaying = !audio.paused;

    const useIt = (url) => {

      if (audio.src === url) {
        try {
          audio.currentTime = target;
        } catch (err) {

        }
        repairing = false;
        wanted = null;
        saveState();
        notify('time');
        return;
      }
      audio.src = url;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(giveUp);
        audio.removeEventListener('loadedmetadata', onMeta);
        repairing = false;
        wanted = null;
        saveState();
        notify('time');
      };
      function onMeta() {
        try {
          audio.currentTime = target;
        } catch (err) {

        }
        if (wasPlaying) {
          const attempt = audio.play();
          if (attempt && attempt.catch) attempt.catch(() => {});
        }
        finish();
      }
      const giveUp = setTimeout(finish, REPAIR_LIMIT_MS);
      audio.addEventListener('loadedmetadata', onMeta);
    };

    if (memory[index]) {
      useIt(memory[index]);
      return;
    }
    fetch(audioAsset(tracks[index].src))
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('bad response'))))
      .then((blob) => {
        memory[index] = URL.createObjectURL(blob);
        useIt(memory[index]);
      })
      .catch(() => {

        repairing = false;
        wanted = null;
        notify('time');
      });
  }

  audio.addEventListener('loadedmetadata', () => {
    if (pendingFraction === null || !audio.duration) return;
    const f = pendingFraction;
    pendingFraction = null;
    seekTo(Math.max(0, Math.min(1, f)) * audio.duration);
  });

  function load(at) {

    audio.src = memory[index] || audioAsset(tracks[index].src) + (at ? '#t=' + at.toFixed(2) : '');
    loaded = true;

    probeRanges();
    if (at) {

      audio.addEventListener('loadedmetadata', function once() {
        audio.removeEventListener('loadedmetadata', once);
        if (audio.currentTime > 0.5) return;
        seekTo(at);
      });
    }
  }

  function play() {
    if (!loaded) load(0);
    started = true;
    const attempt = audio.play();
    if (attempt && attempt.catch) attempt.catch(() => {});
    saveState();
  }

  const api = {
    isPlaying: function () {
      return loaded && !audio.paused;
    },
    hasStarted: function () {
      return started;
    },

    toggle: function () {
      if (!loaded || audio.paused) {
        play();
      } else {
        audio.pause();
      }
    },

    next: function () {
      const wasPlaying = this.isPlaying();
      index = (index + 1) % tracks.length;
      load(0);
      notify('track');
      if (wasPlaying) play();
      else saveState();
    },

    prev: function () {
      const wasPlaying = this.isPlaying();
      index = (index - 1 + tracks.length) % tracks.length;
      load(0);
      notify('track');
      if (wasPlaying) play();
      else saveState();
    },

    seekFraction: function (f) {
      if (!loaded) return;
      if (!audio.duration || !isFinite(audio.duration)) {
        pendingFraction = f;
        return;
      }
      seekTo(Math.max(0, Math.min(1, f)) * audio.duration);
      saveState();
    },

    seekBusy: seekBusy,

    setMiniHidden: function (hidden) {
      miniHidden = !!hidden;
      updateMini();
    },

    dismiss: function () {
      audio.pause();
      started = false;
      saveState();
      updateMini();
    },

    on: function (fn) {
      listeners.push(fn);
    },
  };

  window.CampsiteMusic = api;

  audio.addEventListener('play', () => {
    started = true;
    saveState();
    updateMini();
    notify('play');
  });

  audio.addEventListener('pause', () => {
    saveState();
    updateMini();
    notify('pause');
  });

  audio.addEventListener('timeupdate', () => {
    notify('time');
  });

  audio.addEventListener('ended', () => {
    failures = 0;
    index = (index + 1) % tracks.length;
    load(0);
    notify('track');
    play();
  });

    // A broken file skips to the next song; a whole playlist of them gives up.
  let failures = 0;
  audio.addEventListener('error', () => {
    if (!started) return;

    if (repairing) return;
    failures++;
    if (failures >= tracks.length) {
      audio.pause();
      failures = 0;
      return;
    }
    index = (index + 1) % tracks.length;
    load(0);
    notify('track');
    play();
  });

  audio.addEventListener('playing', () => {
    failures = 0;
  });

  setInterval(() => {
    if (!audio.paused) saveState();
  }, 300);
  window.addEventListener('pagehide', saveState);

  (function resume() {
    const wasPlaying = sessionStorage.getItem(KEY_PLAYING) === '1';
    const at = parseFloat(sessionStorage.getItem(KEY_TIME)) || 0;
    if (!started) return;

    load(at);
    if (!wasPlaying) {
      updateMini();
      return;
    }

    const attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch(() => {
        function kick() {
          document.removeEventListener('pointerdown', kick, true);
          document.removeEventListener('keydown', kick, true);
          audio.play().catch(() => {});
        }
        document.addEventListener('pointerdown', kick, true);
        document.addEventListener('keydown', kick, true);
      });
    }
  })();

  attachArrowKeys(api);

    /* The corner panel. Its CSS is inlined because the shell builds it and has no stylesheet. */
  const MINI_CSS = `
    .cm-mini {
      --cm-mini-size: 148px;
      position: fixed;
      top: 16px;
      right: 16px;
      width: var(--cm-mini-size);
      box-sizing: border-box;
      padding: 11px;
      border-radius: 20px;
      background: rgba(38, 38, 40, 0.82);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
      color: #fff;
      user-select: none;
      z-index: 9995;
      opacity: 0;
      transform: translateY(-12px) scale(0.92);
      pointer-events: none;
      transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
    }

    .cm-mini.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .cm-mini-art {
      width: 58px;
      height: 58px;
      border-radius: 14px;
      object-fit: cover;
      background: rgba(255, 255, 255, 0.14);
      display: block;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }

      /* Puts the music away entirely. Sits where the airplay button does on a phone. */
    .cm-mini-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease;
    }

    .cm-mini-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .cm-mini-close svg {
      width: 9px;
      height: 9px;
      stroke: #fff;
      stroke-width: 2.4;
      stroke-linecap: round;
      fill: none;
      display: block;
    }

      /* Both truncate rather than wrap, so the panel is always the same size. */
    .cm-mini-title {
      margin-top: 10px;
      font-size: 12.5px;
      font-weight: 700;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cm-mini-artist {
      font-size: 11.5px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.55);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cm-mini-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 9px;
      padding: 0 3px;
    }

    .cm-mini-controls svg {
      fill: #fff;
      cursor: pointer;
      display: block;
      transition: transform 0.15s ease, opacity 0.15s ease;
      opacity: 0.92;
    }

    .cm-mini-controls svg:hover {
      opacity: 1;
      transform: scale(1.15);
    }

    .cm-mini-skip { width: 24px; height: 17px; }
    .cm-mini-play { width: 20px; height: 20px; }

      /* The panel itself opens the card; the buttons on it keep their own jobs. */
    .cm-mini {
      cursor: pointer;
    }

    .cm-mini-close,
    .cm-mini-controls svg {
      cursor: pointer;
    }

      /* Only one of the play / pause glyphs is ever shown. */
    .cm-mini.playing .cm-icon-play,
    .cm-mini:not(.playing) .cm-icon-pause {
      display: none;
    }
  `;

  const GLYPH_SKIP =
    'M1 2.2a1.1 1.1 0 0 1 1.7-.9l9.3 6.8a1.1 1.1 0 0 1 0 1.8l-9.3 6.8a1.1 1.1 0 0 1-1.7-.9z' +
    'M13 2.2a1.1 1.1 0 0 1 1.7-.9l9.3 6.8a1.1 1.1 0 0 1 0 1.8l-9.3 6.8a1.1 1.1 0 0 1-1.7-.9z';
  const ICON_NEXT = '<path d="' + GLYPH_SKIP + '"/>';
  const ICON_PREV = '<path d="' + GLYPH_SKIP + '" transform="translate(26 0) scale(-1 1)"/>';

  function buildMini() {
    const style = document.createElement('style');
    style.textContent = MINI_CSS;
    document.head.appendChild(style);

    mini = document.createElement('div');
    mini.className = 'cm-mini';
    mini.innerHTML =
      '<img class="cm-mini-art" alt="">' +
      '<div class="cm-mini-close" data-act="dismiss" title="close the player">' +
      '  <svg viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9"/></svg>' +
      '</div>' +
      '<div class="cm-mini-title"></div>' +
      '<div class="cm-mini-artist"></div>' +
      '<div class="cm-mini-controls">' +
      '  <svg class="cm-mini-skip" data-act="prev" viewBox="0 0 26 18">' + ICON_PREV + '</svg>' +
      '  <svg class="cm-mini-play cm-icon-play" data-act="toggle" viewBox="0 0 24 24">' +
      '    <path d="M5.5 2.6a1 1 0 0 1 1.5-.87l14 9.4a1 1 0 0 1 0 1.74l-14 9.4a1 1 0 0 1-1.5-.87z"/></svg>' +
      '  <svg class="cm-mini-play cm-icon-pause" data-act="toggle" viewBox="0 0 24 24">' +
      '    <rect x="4.5" y="2.5" width="5.6" height="19" rx="1.6"/>' +
      '    <rect x="13.9" y="2.5" width="5.6" height="19" rx="1.6"/></svg>' +
      '  <svg class="cm-mini-skip" data-act="next" viewBox="0 0 26 18">' + ICON_NEXT + '</svg>' +
      '</div>';
    document.body.appendChild(mini);

    miniArt = mini.querySelector('.cm-mini-art');
    miniTitle = mini.querySelector('.cm-mini-title');
    miniArtist = mini.querySelector('.cm-mini-artist');

    mini.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target.closest('[data-act]');
      if (!btn) {
        api.openPlayer(mini);
        return;
      }
      const act = btn.getAttribute('data-act');
      if (act === 'toggle') api.toggle();
      else if (act === 'next') api.next();
      else if (act === 'prev') api.prev();
      else if (act === 'dismiss') api.dismiss();
    });

    updateMini();
  }

  function updateMini() {
    if (!mini) return;
    const t = tracks[index];
    if (t) {
      miniTitle.textContent = t.title;
      miniArtist.textContent = t.artist;
      const art = asset(t.cover);
      if (miniArt.getAttribute('src') !== art) miniArt.src = art;
    }
    mini.classList.toggle('playing', api.isPlaying());
    mini.classList.toggle('visible', started && !miniHidden);
  }

  api.on(updateMini);

  const PLAYER_OPEN_WIDTH = 40;

    /* The player card, which grows out of whatever opened it. */
  const PLAYER_CSS = `
    .cm-card {
      position: fixed;
      left: 50%;
      top: 50%;
      width: 40%;
      transform: translate(-50%, -50%);
      z-index: 9996;
      display: none;
      container-type: inline-size;

      box-sizing: border-box;
      padding: 2.6cqw 3cqw 3cqw;
      border-radius: 3.6cqw;
      background:
        radial-gradient(120% 140% at 12% 0%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 55%),
        rgba(38, 38, 40, 0.86);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow:
        0 1.5cqw 4cqw rgba(0, 0, 0, 0.45),
        inset 0 0.15cqw 0 rgba(255, 255, 255, 0.14);
      font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
      color: #fff;
      user-select: none;
      cursor: default;
    }

      /* .open makes it exist; .grow animates the travel from whatever opened it. */
    .cm-card.open { display: block; }

    .cm-card.grow {
      transition:
        left 0.55s cubic-bezier(0.25, 0.1, 0.25, 1),
        top 0.55s cubic-bezier(0.25, 0.1, 0.25, 1),
        width 0.55s cubic-bezier(0.25, 0.1, 0.25, 1),
        opacity 0.35s ease;
    }

      /* Opacity is driven from JS, so there is deliberately no rule here to fight it. */

      /* While shrinking it must stop catching clicks: it ends up invisibly on top of the thing it came from. */
    .cm-card.closing { pointer-events: none; }

    .cm-card-top {
      display: flex;
      align-items: flex-start;
      gap: 2.6cqw;
    }

      /* Falls back to a flat tile, so a wrong filename never breaks the layout. */
    .cm-card-art {
      flex: 0 0 auto;
      width: 17cqw;
      height: 17cqw;
      border-radius: 1.6cqw;
      object-fit: cover;
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0.6cqw 1.4cqw rgba(0, 0, 0, 0.3);
      display: block;
    }

      /* min-width:0 is what lets the ellipsis kick in inside a flex row. */
    .cm-card-meta {
      flex: 1 1 auto;
      min-width: 0;
      padding-top: 1cqw;
    }

    .cm-card-title-row {
      display: flex;
      align-items: center;
      gap: 1.2cqw;
    }

      /* Truncates rather than wrapping, so the card never changes height. */
    .cm-card-title {
      font-size: 5.2cqw;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

      /* Only for tracks marked explicit: true. */
    .cm-card-badge {
      flex: 0 0 auto;
      width: 3.4cqw;
      height: 3.4cqw;
      display: block;
    }

    .cm-card-badge.hidden { display: none; }

    .cm-card-artist {
      font-size: 4.3cqw;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.62);
      line-height: 1.3;
      margin-top: 0.3cqw;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

      /* Five bars, which only move while a song is playing. */
    .cm-card-waves {
      flex: 0 0 auto;
      display: flex;
      align-items: flex-end;
      gap: 0.55cqw;
      height: 4cqw;
      padding-top: 1.6cqw;
      opacity: 0.75;
    }

    .cm-card-waves span {
      width: 0.55cqw;
      height: 22%;
      border-radius: 0.4cqw;
      background: #fff;
      transition: height 0.2s ease;
    }

    .cm-card.playing .cm-card-waves span {
      animation: cm-wave 0.9s ease-in-out infinite alternate;
    }

      /* Staggered delays and different speeds, so the bars never move as a block. */
    .cm-card.playing .cm-card-waves span:nth-child(1) { animation-delay: 0s;    animation-duration: 0.7s; }
    .cm-card.playing .cm-card-waves span:nth-child(2) { animation-delay: 0.15s; animation-duration: 0.9s; }
    .cm-card.playing .cm-card-waves span:nth-child(3) { animation-delay: 0.3s;  animation-duration: 0.6s; }
    .cm-card.playing .cm-card-waves span:nth-child(4) { animation-delay: 0.1s;  animation-duration: 1.0s; }
    .cm-card.playing .cm-card-waves span:nth-child(5) { animation-delay: 0.25s; animation-duration: 0.8s; }

    @keyframes cm-wave {
      from { height: 20%; }
      to   { height: 100%; }
    }

    .cm-card-progress {
      display: flex;
      align-items: center;
      gap: 2cqw;
      margin-top: 3.4cqw;
    }

    .cm-card-time {
      flex: 0 0 auto;
      font-size: 3.4cqw;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.72);
      font-variant-numeric: tabular-nums;
      min-width: 8cqw;
    }

    .cm-card-time.right { text-align: right; }

      /* Click the bar to jump, or drag the knob to scrub. */
    .cm-card-track {
      position: relative;
      flex: 1 1 auto;
      height: 1.3cqw;
      border-radius: 1.3cqw;
      background: rgba(255, 255, 255, 0.28);
      cursor: pointer;
      touch-action: none;
    }

    .cm-card-fill {
      height: 100%;
      width: 0%;
      border-radius: 1.3cqw;
      background: #fff;
      transition: width 0.12s linear;
    }

      /* Rides at the end of the filled part; width/height set the circle's size. */
    .cm-card-knob {
      position: absolute;
      top: 50%;
      left: 0%;
      width: 3cqw;
      height: 3cqw;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0.3cqw 0.9cqw rgba(0, 0, 0, 0.45);
      transform: translate(-50%, -50%);
      transition: left 0.12s linear, width 0.15s ease, height 0.15s ease;
      cursor: grab;
    }

      /* No easing while scrubbing — a transition here makes the drag feel laggy. */
    .cm-card.scrubbing .cm-card-knob,
    .cm-card.scrubbing .cm-card-fill {
      transition: none;
    }

    .cm-card.scrubbing .cm-card-knob {
      width: 3.8cqw;
      height: 3.8cqw;
      cursor: grabbing;
    }

    .cm-card-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 3.6cqw;
      padding: 0 1cqw;
    }

      /* Every glyph shares this fill and hover lift; width below sets each one's size. */
    .cm-ctrl {
      fill: rgba(255, 255, 255, 0.86);
      cursor: pointer;
      display: block;
      transition: fill 0.15s ease, transform 0.15s ease;
    }

    .cm-ctrl:hover {
      fill: #fff;
      transform: scale(1.12);
    }

      /* Outline when unliked, solid once liked. Kept in localStorage. */
    .cm-ctrl-heart { width: 6.4cqw; height: 6.4cqw; }

      /* The outline heart is a stroke, so it needs its own colour rules for hover. */
    .cm-ctrl-heart .cm-heart-outline { stroke: rgba(255, 255, 255, 0.86); }
    .cm-ctrl-heart:hover .cm-heart-outline { stroke: #fff; }

    .cm-ctrl-heart .cm-heart-solid { display: none; }
    .cm-ctrl-heart.liked .cm-heart-solid { display: block; }
    .cm-ctrl-heart.liked .cm-heart-outline { display: none; }
    .cm-ctrl-heart.liked,
    .cm-ctrl-heart.liked:hover { fill: #ff5a63; }

      /* Pops once when liked; unliking is quiet. */
    .cm-ctrl-heart.pop { animation: cm-heart-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }

    @keyframes cm-heart-pop {
      0%   { transform: scale(1); }
      45%  { transform: scale(1.35); }
      100% { transform: scale(1); }
    }

    .cm-ctrl-skip { width: 8cqw; height: 6cqw; }
    .cm-ctrl-play { width: 7cqw; height: 7cqw; fill: #fff; }

      /* A status glyph, not a button. */
    .cm-ctrl-bt {
      width: 8cqw;
      height: 6.4cqw;
      cursor: default;
    }

    .cm-ctrl-bt .cm-bt-rune { stroke: rgba(255, 255, 255, 0.86); }

    .cm-ctrl-bt:hover {
      fill: rgba(255, 255, 255, 0.86);
      transform: none;
    }

    .cm-card.playing .cm-icon-play,
    .cm-card:not(.playing) .cm-icon-pause {
      display: none;
    }

      /* Swallows the click before it reaches the scene underneath. */
    .cm-dim {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.45s ease;
      z-index: 9994;
    }

    .cm-dim.visible {
      opacity: 1;
      pointer-events: auto;
    }
  `;

  let card = null;
  let dim = null;
  let cardArt = null;
  let cardTitle = null;
  let cardArtist = null;
  let cardBadge = null;
  let cardHeart = null;
  let cardFill = null;
  let cardKnob = null;
  let cardTrack = null;
  let cardElapsed = null;
  let cardRemaining = null;

  let playerOpen = false;
  let scrubbing = false;

  let openedFrom = null;

  const LIKES_KEY = 'campsiteLikedTracks';

  function trackId(t) {
    return t.title + ' — ' + t.artist;
  }

  function readLikes() {
    try {
      const raw = JSON.parse(localStorage.getItem(LIKES_KEY));
      return Array.isArray(raw) ? raw : [];
    } catch (err) {

      return [];
    }
  }

  function writeLikes(list) {
    try {
      localStorage.setItem(LIKES_KEY, JSON.stringify(list));
    } catch (err) {

    }
  }

  function showLike() {
    if (!cardHeart) return;
    cardHeart.classList.toggle('liked', readLikes().includes(trackId(tracks[index])));
  }

  function toggleLike() {
    const id = trackId(tracks[index]);
    const likes = readLikes();
    const at = likes.indexOf(id);
    if (at === -1) {
      likes.push(id);
      cardHeart.classList.remove('pop');
      void cardHeart.offsetWidth;
      cardHeart.classList.add('pop');
    } else {
      likes.splice(at, 1);
    }
    writeLikes(likes);
    showLike();
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function paintProgress(fraction) {
    if (!card) return;
    const pct = Math.max(0, Math.min(1, fraction)) * 100;
    cardFill.style.width = pct + '%';
    cardKnob.style.left = pct + '%';
  }

  function paintTimes(current, duration) {
    if (!card) return;
    cardElapsed.textContent = formatTime(current);
    cardRemaining.textContent = '-' + formatTime((duration || 0) - current);
  }

  function updateCard() {
    if (!card) return;
    const t = tracks[index];
    if (t) {
      cardTitle.textContent = t.title;
      cardArtist.textContent = t.artist;
      const cover = asset(t.cover);
      if (cardArt.getAttribute('src') !== cover) cardArt.src = cover;
      cardArt.alt = t.title + ' cover';
      cardBadge.classList.toggle('hidden', !t.explicit);
      showLike();
    }
    card.classList.toggle('playing', api.isPlaying());
  }

  // Where something is on screen, as percentages, so the card can be placed on it before growing.
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return {
      left: ((r.left + r.width / 2) / window.innerWidth) * 100,
      top: ((r.top + r.height / 2) / window.innerHeight) * 100,
      width: (r.width / window.innerWidth) * 100,
    };
  }

  api.isPlayerOpen = function () {
    return playerOpen;
  };

  api.openPlayer = function (fromEl) {
    if (!card || playerOpen) return;
    playerOpen = true;

    openedFrom = fromEl || mini;
    const from = boxOf(openedFrom);

    card.classList.remove('grow', 'closing');
    if (from) {

      card.style.left = from.left.toFixed(1) + '%';
      card.style.top = from.top.toFixed(1) + '%';
      card.style.width = from.width.toFixed(1) + '%';
    } else {

      card.style.left = '50%';
      card.style.top = '50%';
      card.style.width = PLAYER_OPEN_WIDTH * 0.2 + '%';
    }
    card.style.opacity = '0';
    card.classList.add('open');
    void card.offsetWidth;

    card.classList.add('grow');
    card.style.left = '50%';
    card.style.top = '50%';
    card.style.width = PLAYER_OPEN_WIDTH + '%';
    card.style.opacity = '1';

    dim.classList.add('visible');
    api.setMiniHidden(true);
  };

  api.closePlayer = function () {
    if (!card || !playerOpen) return;
    playerOpen = false;

    const to = boxOf(openedFrom);
    card.classList.add('grow', 'closing');
    if (to) {
      card.style.left = to.left.toFixed(1) + '%';
      card.style.top = to.top.toFixed(1) + '%';
      card.style.width = to.width.toFixed(1) + '%';
    }
    card.style.opacity = '0';
    dim.classList.remove('visible');
    api.setMiniHidden(false);

    if (window.__campsiteFocusRoom) window.__campsiteFocusRoom();

    setTimeout(() => {
      if (playerOpen) return;
      card.classList.remove('open', 'grow', 'closing');
    }, 600);
  };

  const ICON_HEART =
    'M12 20.4 3.9 12.6a4.9 4.9 0 0 1 0-7 5 5 0 0 1 7.05 0l1.05 1.05L13.05 5.6a5 5 0 0 1 7.05 0 4.9 4.9 0 0 1 0 7z';

  function buildPlayer() {
    const style = document.createElement('style');
    style.textContent = PLAYER_CSS;
    document.head.appendChild(style);

    dim = document.createElement('div');
    dim.className = 'cm-dim';
    document.body.appendChild(dim);

    card = document.createElement('div');
    card.className = 'cm-card';
    card.innerHTML =
      '<div class="cm-card-top">' +
      '  <img class="cm-card-art" alt="">' +
      '  <div class="cm-card-meta">' +
      '    <div class="cm-card-title-row">' +
      '      <span class="cm-card-title">press play</span>' +
      '      <svg class="cm-card-badge hidden" viewBox="0 0 24 24" aria-label="Explicit">' +
      '        <rect x="1" y="1" width="22" height="22" rx="6" fill="rgba(255,255,255,0.85)"/>' +
      '        <path d="M9 7h6.4v2.1h-4.2v1.85h3.9v2.1h-3.9v1.85h4.2V17H9z" fill="#262628"/>' +
      '      </svg>' +
      '    </div>' +
      '    <div class="cm-card-artist">rolands\' campsite mix</div>' +
      '  </div>' +
      '  <div class="cm-card-waves" aria-hidden="true">' +
      '    <span></span><span></span><span></span><span></span><span></span>' +
      '  </div>' +
      '</div>' +
      '<div class="cm-card-progress">' +
      '  <span class="cm-card-time cm-elapsed">0:00</span>' +
      '  <div class="cm-card-track">' +
      '    <div class="cm-card-fill"></div>' +
      '    <div class="cm-card-knob"></div>' +
      '  </div>' +
      '  <span class="cm-card-time right cm-remaining">-0:00</span>' +
      '</div>' +
      '<div class="cm-card-controls">' +
      '  <svg class="cm-ctrl cm-ctrl-heart" data-act="like" viewBox="0 0 24 24">' +
      '    <path class="cm-heart-outline" d="' + ICON_HEART + '" fill="none" stroke-width="1.9" stroke-linejoin="round"/>' +
      '    <path class="cm-heart-solid" d="' + ICON_HEART + '"/>' +
      '  </svg>' +
      '  <svg class="cm-ctrl cm-ctrl-skip" data-act="prev" viewBox="0 0 26 18">' + ICON_PREV + '</svg>' +
      '  <svg class="cm-ctrl cm-ctrl-play cm-icon-play" data-act="toggle" viewBox="0 0 24 24">' +
      '    <path d="M5.5 2.6a1 1 0 0 1 1.5-.87l14 9.4a1 1 0 0 1 0 1.74l-14 9.4a1 1 0 0 1-1.5-.87z"/></svg>' +
      '  <svg class="cm-ctrl cm-ctrl-play cm-icon-pause" data-act="toggle" viewBox="0 0 24 24">' +
      '    <rect x="4.5" y="2.5" width="5.6" height="19" rx="1.6"/>' +
      '    <rect x="13.9" y="2.5" width="5.6" height="19" rx="1.6"/></svg>' +
      '  <svg class="cm-ctrl cm-ctrl-skip" data-act="next" viewBox="0 0 26 18">' + ICON_NEXT + '</svg>' +
      '  <svg class="cm-ctrl cm-ctrl-bt" viewBox="0 0 30 24">' +
      '    <path d="M2 9h4.2L11.6 4.3a.8.8 0 0 1 1.4.6v14.2a.8.8 0 0 1-1.4.6L6.2 15H2a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1z"/>' +
      '    <path class="cm-bt-rune" d="M22 7.5 L28 16.5 L25 21 V3 L28 7.5 L22 16.5" fill="none" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>' +
      '  </svg>' +
      '</div>';
    document.body.appendChild(card);

    cardArt = card.querySelector('.cm-card-art');
    cardTitle = card.querySelector('.cm-card-title');
    cardArtist = card.querySelector('.cm-card-artist');
    cardBadge = card.querySelector('.cm-card-badge');
    cardHeart = card.querySelector('.cm-ctrl-heart');
    cardFill = card.querySelector('.cm-card-fill');
    cardKnob = card.querySelector('.cm-card-knob');
    cardTrack = card.querySelector('.cm-card-track');
    cardElapsed = card.querySelector('.cm-elapsed');
    cardRemaining = card.querySelector('.cm-remaining');

    cardHeart.addEventListener('animationend', () => cardHeart.classList.remove('pop'));

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-act');
      if (act === 'toggle') api.toggle();
      else if (act === 'next') api.next();
      else if (act === 'prev') api.prev();
      else if (act === 'like') toggleLike();
    });

    function fractionFromEvent(e) {
      const r = cardTrack.getBoundingClientRect();
      return (e.clientX - r.left) / r.width;
    }

    cardTrack.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      scrubbing = true;
      card.classList.add('scrubbing');
      cardTrack.setPointerCapture(e.pointerId);
      const f = fractionFromEvent(e);
      paintProgress(f);
      api.seekFraction(f);
      if (audio.duration) paintTimes(f * audio.duration, audio.duration);
    });

    cardTrack.addEventListener('pointermove', (e) => {
      if (!scrubbing) return;
      const f = fractionFromEvent(e);
      paintProgress(f);

      api.seekFraction(f);
      if (audio.duration) paintTimes(f * audio.duration, audio.duration);
    });

    function endScrub(e) {
      if (!scrubbing) return;
      scrubbing = false;
      card.classList.remove('scrubbing');
      if (e && e.pointerId !== undefined && cardTrack.hasPointerCapture(e.pointerId)) {
        cardTrack.releasePointerCapture(e.pointerId);
      }
    }

    cardTrack.addEventListener('pointerup', endScrub);
    cardTrack.addEventListener('pointercancel', endScrub);

    dim.addEventListener('click', () => api.closePlayer());
    document.addEventListener('click', () => {
      if (playerOpen) api.closePlayer();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && playerOpen) api.closePlayer();
    });

    audio.addEventListener('loadedmetadata', () => {

      if (!scrubbing && !api.seekBusy()) paintTimes(audio.currentTime, audio.duration);
    });

    updateCard();
    if (audio.duration) {
      paintProgress(audio.currentTime / audio.duration);
      paintTimes(audio.currentTime, audio.duration);
    }
  }

  api.on((what) => {
    if (!card) return;
    if (what === 'track') {
      updateCard();
      paintProgress(0);
      paintTimes(0, 0);
      return;
    }
    if (what === 'time') {

      if (scrubbing || api.seekBusy() || !audio.duration) return;
      paintProgress(audio.currentTime / audio.duration);
      paintTimes(audio.currentTime, audio.duration);
      return;
    }
    updateCard();
  });

  function loadFont() {
    if (document.querySelector('link[href*="fonts.googleapis.com"][href*="Montserrat"]')) return;
    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect';
    pre1.href = 'https://fonts.googleapis.com';
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect';
    pre2.href = 'https://fonts.gstatic.com';
    pre2.crossOrigin = 'anonymous';
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap';
    document.head.appendChild(pre1);
    document.head.appendChild(pre2);
    document.head.appendChild(font);
  }

  function build() {
    loadFont();
    buildMini();
    buildPlayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
