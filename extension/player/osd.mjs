export function formatRate(value) {
  return Number.isFinite(value) && value > 0 ? (value / 1e6).toFixed(2) + ' Mbps' : '—';
}

export function bufferedAhead(video) {
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
      return Math.max(0, video.buffered.end(i) - video.currentTime);
    }
  }
  return 0;
}

export function createStreamInfoOsd(video, stage) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'stream-info-toggle';
  toggle.textContent = 'ⓘ';
  toggle.title = 'Stream information (I)';
  toggle.setAttribute('aria-label', 'Toggle stream information');
  toggle.setAttribute('aria-keyshortcuts', 'I');
  toggle.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('section');
  panel.className = 'stream-info-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Live stream information');
  const rows = [
    ['VIDEO', [['Resolution', 'resolution'], ['Codec', 'codec'], ['Stream FPS', 'streamFps'], ['Displayed FPS', 'fps'], ['Dropped frames', 'dropped']]],
    ['HLS', [['Quality level', 'level'], ['Declared bitrate', 'bitrate'], ['Measured throughput', 'throughput']]],
    ['PLAYBACK', [['Buffer ahead', 'buffer'], ['Live latency', 'latency'], ['State', 'state']]],
  ];
  const heading = document.createElement('div');
  heading.className = 'stream-info-heading';
  const name = document.createElement('strong');
  name.textContent = 'STREAM INFO';
  const live = document.createElement('span');
  live.textContent = '● LIVE DATA';
  live.className = 'stream-info-live';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.className = 'stream-info-close';
  close.setAttribute('aria-label', 'Close stream information');
  heading.append(name, live, close);
  panel.append(heading);
  const fields = {};
  for (const [title, items] of rows) {
    const section = document.createElement('div');
    section.className = 'stream-info-group';
    const h = document.createElement('h2');
    h.textContent = title;
    const dl = document.createElement('dl');
    for (const [label, key] of items) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = '—';
      fields[key] = dd;
      dl.append(dt, dd);
    }
    section.append(h, dl);
    panel.append(section);
  }
  const note = document.createElement('p');
  note.className = 'stream-info-note';
  note.textContent = 'Declared bitrate and stream FPS come from the playlist. Throughput comes from loaded fragments.';
  panel.append(note);
  stage.append(toggle, panel);

  let hls = null;
  let interval = null;
  let hideTimer = null;
  let previousQuality = null;
  let measuredRate = null;
  const number = (value, digits = 1) => Number.isFinite(value) && value >= 0 ? value.toFixed(digits) : '—';
  const put = (key, value) => { fields[key].textContent = String(value); };
  function onFragmentLoaded(_event, data) {
    const loading = data?.stats?.loading;
    const bytes = data?.stats?.total;
    if (loading && Number.isFinite(bytes) && bytes > 0 && Number.isFinite(loading.start) && Number.isFinite(loading.end) && loading.end > loading.start) {
      measuredRate = bytes * 8000 / (loading.end - loading.start);
    }
  }

  function setHls(next) {
    if (hls && globalThis.Hls?.Events?.FRAG_LOADED) hls.off(globalThis.Hls.Events.FRAG_LOADED, onFragmentLoaded);
    hls = next;
    measuredRate = null;
    if (hls && globalThis.Hls?.Events?.FRAG_LOADED) hls.on(globalThis.Hls.Events.FRAG_LOADED, onFragmentLoaded);
    update();
  }

  function update() {
    if (panel.hidden) return;
    const level = hls?.levels?.[hls.currentLevel];
    const quality = typeof video.getVideoPlaybackQuality === 'function' ? video.getVideoPlaybackQuality() : null;
    const now = performance.now();
    let fps = null;
    if (quality && previousQuality && now > previousQuality.time) {
      fps = Math.max(0, quality.totalVideoFrames - previousQuality.frames) * 1000 / (now - previousQuality.time);
    }
    previousQuality = quality ? { frames: quality.totalVideoFrames, time: now } : null;
    put('resolution', video.videoWidth && video.videoHeight ? video.videoWidth + ' × ' + video.videoHeight : '—');
    put('codec', level?.videoCodec || '—');
    put('streamFps', level?.frameRate ? number(level.frameRate, 2) + ' fps' : '—');
    put('fps', fps === null ? '—' : number(fps) + ' fps');
    put('dropped', quality ? quality.droppedVideoFrames : '—');
    put('level', !hls ? 'Native HLS' : level ? (hls.currentLevel + 1) + ' / ' + hls.levels.length + (level.height ? ' (' + level.height + 'p)' : '') : 'Auto / pending');
    put('bitrate', formatRate(level?.bitrate));
    put('throughput', formatRate(measuredRate));
    put('buffer', number(bufferedAhead(video)) + ' s');
    put('latency', Number.isFinite(hls?.latency) ? number(hls.latency) + ' s' : '—');
    put('state', video.error ? 'Error' : video.ended ? 'Ended' : video.paused ? 'Paused' : video.readyState < 3 ? 'Buffering' : 'Playing');
  }

  function reveal() {
    stage.classList.add('stream-info-active');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (panel.hidden && !toggle.matches(':focus-visible')) stage.classList.remove('stream-info-active');
    }, 2500);
  }

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    clearInterval(interval);
    interval = null;
    previousQuality = null;
    if (open) {
      reveal();
      update();
      interval = setInterval(update, 1000);
    } else {
      reveal();
    }
  }

  toggle.addEventListener('click', event => { event.stopPropagation(); setOpen(panel.hidden); });
  close.addEventListener('click', event => { event.stopPropagation(); setOpen(false); toggle.focus(); });
  panel.addEventListener('click', event => event.stopPropagation());
  stage.addEventListener('pointermove', reveal, { passive: true });
  stage.addEventListener('pointerleave', () => { if (panel.hidden) stage.classList.remove('stream-info-active'); });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
    if (event.key.toLowerCase() === 'i') { event.preventDefault(); setOpen(panel.hidden); }
    else if (event.key === 'Escape' && !panel.hidden) { event.stopPropagation(); setOpen(false); }
  });
  window.addEventListener('pagehide', () => {
    clearInterval(interval);
    clearTimeout(hideTimer);
    setHls(null);
  }, { once: true });
  return { setHls };
}
