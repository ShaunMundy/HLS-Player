export function formatRate(value) {
  return Number.isFinite(value) && value > 0 ? (value / 1e6).toFixed(2) + ' Mbps' : '—';
}

export function formatDownloaded(bytes) {
  return Number.isFinite(bytes) && bytes >= 0 ? (bytes / 1e6).toFixed(2) + ' MB' : '—';
}

// hls.js can put loading statistics on the fragment or a low-latency part.
export function fragmentTransferSample(data, time) {
  const stats = data?.part?.stats ?? data?.frag?.stats ?? data?.stats;
  const loading = stats?.loading;
  const bytes = stats?.loaded > 0 ? stats.loaded :
    stats?.total > 0 ? stats.total : data?.payload?.byteLength;
  const elapsed = loading?.end - loading?.start;
  if (!Number.isFinite(bytes) || bytes <= 0 ||
      !Number.isFinite(elapsed) || elapsed <= 0) return null;
  return { time, bytes, rate: bytes * 8000 / elapsed };
}

export function throughputSparkline(samples, now, width = 300, height = 64) {
  const valid = samples.filter(s => Number.isFinite(s.time) &&
    s.time >= now - 30000 && s.time <= now &&
    Number.isFinite(s.rate) && s.rate > 0);
  if (valid.length === 0) return { line: '', area: '', max: 0 };
  const peak = Math.max(...valid.map(s => s.rate));
  const points = valid.map(s => ({
    x: Math.max(0, Math.min(width, (s.time - now + 30000) * width / 30000)),
    y: Math.max(4, height - 5 - s.rate / peak * (height - 13))
  }));
  const coords = points.map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1));
  const line = coords.length === 1 ?
    'M ' + Math.max(0, points[0].x - 3).toFixed(1) + ' ' +
    points[0].y.toFixed(1) + ' L ' + coords[0] :
    'M ' + coords.join(' L ');
  const area = line + ' L ' + points[points.length - 1].x.toFixed(1) +
    ' ' + height + ' L ' + points[0].x.toFixed(1) + ' ' + height + ' Z';
  return { line, area, max: peak };
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
    ['HLS', [['Quality level', 'level'], ['Declared bitrate', 'bitrate'], ['Measured throughput', 'throughput'], ['Downloaded', 'downloaded']]],
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
  let sparkLine;
  let sparkArea;
  let sparkPeak;
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
    if (title === 'HLS') {
      const chart = document.createElement('div');
      chart.className = 'stream-info-chart';
      const chartHeading = document.createElement('div');
      chartHeading.className = 'stream-info-chart-heading';
      const chartName = document.createElement('span');
      chartName.textContent = 'NETWORK ACTIVITY';
      sparkPeak = document.createElement('span');
      sparkPeak.textContent = 'Waiting for fragments';
      chartHeading.append(chartName, sparkPeak);
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 300 64');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Measured fragment download throughput over the last 30 seconds');
      svg.setAttribute('preserveAspectRatio', 'none');
      sparkArea = document.createElementNS(ns, 'path');
      sparkArea.setAttribute('class', 'stream-info-spark-area');
      sparkLine = document.createElementNS(ns, 'path');
      sparkLine.setAttribute('class', 'stream-info-spark-line');
      svg.append(sparkArea, sparkLine);
      const axis = document.createElement('div');
      axis.className = 'stream-info-chart-axis';
      const past = document.createElement('span');
      past.textContent = '30s AGO';
      const present = document.createElement('span');
      present.textContent = 'NOW';
      axis.append(past, present);
      chart.append(chartHeading, svg, axis);
      section.append(chart);
    }
    panel.append(section);
  }
  const note = document.createElement('p');
  note.className = 'stream-info-note';
  note.textContent = 'Declared bitrate and stream FPS come from the playlist. Throughput and download totals come from completed fragments; playlists are excluded.';
  panel.append(note);
  stage.append(toggle, panel);

  let hls = null;
  let interval = null;
  let hideTimer = null;
  let previousQuality = null;
  let measuredRate = null;
  let totalBytes = 0;
  let samples = [];
  const number = (value, digits = 1) => Number.isFinite(value) && value >= 0 ? value.toFixed(digits) : '—';
  const put = (key, value) => { fields[key].textContent = String(value); };
  function onFragmentLoaded(_event, data) {
    const sample = fragmentTransferSample(data, performance.now());
    if (!sample) return;
    measuredRate = sample.rate;
    totalBytes += sample.bytes;
    samples.push(sample);
    samples = samples.filter(s => s.time >= sample.time - 30000);
    if (!panel.hidden) update();
  }

  function setHls(next) {
    if (hls && globalThis.Hls?.Events?.FRAG_LOADED) hls.off(globalThis.Hls.Events.FRAG_LOADED, onFragmentLoaded);
    hls = next;
    measuredRate = null;
    totalBytes = 0;
    samples = [];
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
    const visibleSamples = samples.filter(s => s.time >= now - 30000);
    put('throughput', formatRate(visibleSamples.length ? measuredRate : null));
    put('downloaded', hls ? formatDownloaded(totalBytes) : '—');
    const graph = throughputSparkline(visibleSamples, now);
    sparkLine.setAttribute('d', graph.line);
    sparkArea.setAttribute('d', graph.area);
    sparkPeak.textContent = graph.max ? 'PEAK ' + formatRate(graph.max) : 'Waiting for fragments';
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
