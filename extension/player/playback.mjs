import { getWorkerPath } from "./stream.mjs";

export function attachHlsPlayback(video, sourceUrl, setStatus, startPlayback) {
  const Hls = globalThis.Hls;
  if (!Hls?.isSupported()) return false;

  const hls = new Hls({
    enableWorker: true,
    workerPath: getWorkerPath(),
    lowLatencyMode: true,
  });

  hls.loadSource(sourceUrl);
  hls.attachMedia(video);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    setStatus("Live stream ready.", "ready", 1800);
    startPlayback();
  });

  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (!data.fatal) return;

    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      setStatus("Network error. Retrying stream…", "warning");
      hls.startLoad();
      return;
    }

    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      setStatus("Media error. Recovering playback…", "warning");
      hls.recoverMediaError();
      return;
    }

    setStatus(`Playback failed: ${data.details}`, "error");
    hls.destroy();
  });

  return true;
}
