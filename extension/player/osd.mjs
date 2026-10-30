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

// Curve points are interpolated for display only, never recorded as measurements.
export function throughputSparkline(samples, now, width = 300, height = 64) {
  const left = now - 30000;
  const empty = { line: '', area: '', continuation: '', max: 0, current: null, age: null };
  const ordered = samples.filter(s => Number.isFinite(s.time) && s.time <= now &&
    Number.isFinite(s.rate) && s.rate > 0).sort((a, b) => a.time - b.time);
  const knots = [];
  for (const sample of ordered) {
    if (knots.length && knots[knots.length - 1].time === sample.time) {
      knots[knots.length - 1] = sample;
    } else {
      knots.push(sample);
    }
  }
  const recent = knots.filter(s => s.time >= left);
  if (!recent.length) return empty;

  // Preserve the preceding real observation so the curve enters at x=0
  // instead of opening a gap when the oldest visible sample expires.
  const previous = knots.filter(s => s.time < left).at(-1);
  const curve = previous ? [previous, ...recent] : recent;
  const slopes = curve.slice(1).map((s, i) =>
    (s.rate - curve[i].rate) / (s.time - curve[i].time));
  const tangents = curve.map((s, i) => {
    if (i === 0) return slopes[0] ?? 0;
    if (i === curve.length - 1) return slopes[i - 1];
    const a = slopes[i - 1], b = slopes[i];
    if (a * b <= 0) return 0;
    const h0 = s.time - curve[i - 1].time;
    const h1 = curve[i + 1].time - s.time;
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / a + w1 / b);
  });

  const rendered = [];
  function addPoint(time, rate) {
    if (rendered.length && rendered[rendered.length - 1].time === time) return;
    rendered.push({ time, rate });
  }
  for (let i = 0; i < curve.length - 1; i++) {
    const from = curve[i], to = curve[i + 1];
    const start = Math.max(left, from.time);
    const stop = Math.min(now, to.time);
    if (stop < start) continue;
    const h = to.time - from.time;
    const rateAt = time => {
      const u = (time - from.time) / h;
      const u2 = u * u, u3 = u2 * u;
      const value = (2 * u3 - 3 * u2 + 1) * from.rate +
        (u3 - 2 * u2 + u) * h * tangents[i] +
        (-2 * u3 + 3 * u2) * to.rate +
        (u3 - u2) * h * tangents[i + 1];
      return Math.max(Math.min(from.rate, to.rate),
        Math.min(Math.max(from.rate, to.rate), value));
    };
    addPoint(start, rateAt(start));
    // A 500 ms rendering mesh smooths the line between real fragments.
    for (let time = Math.floor(start / 500) * 500 + 500; time < stop; time += 500) {
      addPoint(time, rateAt(time));
    }
    addPoint(stop, rateAt(stop));
  }
  const latest = recent[recent.length - 1];
  addPoint(latest.time, latest.rate);
  const peak = Math.max(...rendered.map(p => p.rate));
  const points = rendered.map(p => ({
    x: Math.max(0, Math.min(width, (p.time - left) * width / 30000)),
    y: Math.max(4, height - 5 - p.rate / peak * (height - 13))
  }));
  const coords = points.map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1));
  const line = coords.length === 1 ?
    'M ' + Math.max(0, points[0].x - 3).toFixed(1) + ' ' +
    points[0].y.toFixed(1) + ' L ' + coords[0] :
    'M ' + coords.join(' L ');
  const last = points[points.length - 1];
  const area = line + ' L ' + last.x.toFixed(1) +
    ' ' + height + ' L ' + points[0].x.toFixed(1) + ' ' + height + ' Z';
  const age = Math.max(0, now - latest.time);
  const continuation = age >= 1000 && last.x < width ?
    'M ' + last.x.toFixed(1) + ' ' + last.y.toFixed(1) +
    ' L ' + width + ' ' + last.y.toFixed(1) : '';
  return { line, area, continuation, max: peak, current: latest.rate, age };
}

export function isOutsideStreamInfo(panel, toggle, target) {
  return !panel.contains(target) && !toggle.contains(target);
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
  // Draw exactly one centered ring; the button itself has no visible border.
  const ns = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(ns, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  const ring = document.createElementNS(ns, 'circle');
  ring.setAttribute('cx', '12');
  ring.setAttribute('cy', '12');
  ring.setAttribute('r', '9');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', 'currentColor');
  ring.setAttribute('stroke-width', '1.6');
  const stem = document.createElementNS(ns, 'path');
  stem.setAttribute('d', 'M12 11v5');
  stem.setAttribute('fill', 'none');
  stem.setAttribute('stroke', 'currentColor');
  stem.setAttribute('stroke-width', '1.8');
  stem.setAttribute('stroke-linecap', 'round');
  const dot = document.createElementNS(ns, 'circle');
  dot.setAttribute('cx', '12');
  dot.setAttribute('cy', '8');
  dot.setAttribute('r', '1.1');
  dot.setAttribute('fill', 'currentColor');
  icon.append(ring, stem, dot);
  toggle.append(icon);
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
  let sparkCurrent;
  let sparkContinuation;
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
      sparkCurrent = document.createElement('span');
      sparkCurrent.textContent = '—';
      chartHeading.append(chartName, sparkCurrent);
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
      sparkContinuation = document.createElementNS(ns, 'path');
      sparkContinuation.setAttribute('class', 'stream-info-spark-continuation');
      svg.append(sparkArea, sparkLine, sparkContinuation);
      const axis = document.createElement('div');
      axis.className = 'stream-info-chart-axis';
      const past = document.createElement('span');
      past.textContent = '30 seconds';
      axis.append(past);
      chart.append(chartHeading, svg, axis);
      section.append(chart);
    }
    panel.append(section);
  }
  const note = document.createElement('p');
  note.className = 'stream-info-note';
  note.textContent = 'Declared bitrate and stream FPS come from the playlist.';
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
    samples = samples.filter(s => s.time >= sample.time - 60000);
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
    const graph = throughputSparkline(samples, now);
    sparkLine.setAttribute('d', graph.line);
    sparkArea.setAttribute('d', graph.area);
    sparkContinuation.setAttribute('d', graph.continuation);
    sparkCurrent.textContent = formatRate(graph.current);
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
  document.addEventListener('click', event => {
    if (panel.hidden || !isOutsideStreamInfo(panel, toggle, event.target)) return;
    setOpen(false);
    // The first click outside dismisses the panel without pausing the video.
    // Subsequent clicks retain the player's normal pause/resume behavior.
    if (event.target === video && !video.controls) event.stopPropagation();
  }, true);
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
