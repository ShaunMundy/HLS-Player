const video = document.getElementById("video");
const status = document.getElementById("status");
const sourceLabel = document.getElementById("source");
const requestedSource = new URLSearchParams(window.location.search).get("src");

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function parseHlsSource(value) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (!parsed.pathname.toLowerCase().endsWith('.m3u8')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

const sourceUrl = parseHlsSource(requestedSource);

if (!sourceUrl) {
  setStatus("No valid HLS stream URL was provided.", true);
} else {
  sourceLabel.textContent = sourceUrl;
  sourceLabel.title = sourceUrl;

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = sourceUrl;
    setStatus("Using native HLS playback.");
  } else if (Hls.isSupported()) {
    const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    hls.loadSource(sourceUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setStatus("Live stream ready.");
      video.play().catch(() => setStatus("Stream ready. Press play to start."));
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        setStatus("Network error. Retrying stream…", true);
        hls.startLoad();
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        setStatus("Media error. Recovering playback…", true);
        hls.recoverMediaError();
        return;
      }

      setStatus(`Playback failed: ${data.details}`, true);
      hls.destroy();
    });
  } else {
    setStatus("This browser does not provide the MediaSource support required for HLS playback.", true);
  }
}
