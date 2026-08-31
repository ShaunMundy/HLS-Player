import { attachHlsPlayback } from "./playback.mjs";
import { parseHlsSource } from "./stream.mjs";
import { createPlayerUi } from "./ui.mjs";

const video = document.getElementById("video");
const status = document.getElementById("status");
const sourceLabel = document.getElementById("source");
const requestedSource = new URLSearchParams(window.location.search).get("src");
const ui = createPlayerUi(video, status);

async function initialize() {
  await ui.initializeSettings();

  const sourceUrl = parseHlsSource(requestedSource);
  if (!sourceUrl) {
    ui.setStatus("No valid HLS stream URL was provided.", "error");
    return;
  }

  sourceLabel.textContent = sourceUrl;
  sourceLabel.title = sourceUrl;

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = sourceUrl;
    ui.setStatus("Using native HLS playback.", "ready", 1800);
    await ui.startPlayback();
    return;
  }

  if (!attachHlsPlayback(video, sourceUrl, ui.setStatus, ui.startPlayback)) {
    ui.setStatus("This browser does not provide the MediaSource support required for HLS playback.", "error");
  }
}

video.addEventListener("click", () => {
  if (video.controls) return;
  if (video.paused) ui.startPlayback();
  else video.pause();
});

video.addEventListener("playing", ui.hideStatus);

initialize().catch((error) => {
  console.error(error);
  ui.setStatus("Player initialization failed.", "error");
});
