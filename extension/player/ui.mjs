import { DEFAULT_SETTINGS, loadSettings, normalizeSettings } from "../settings/preferences.mjs";

export function createPlayerUi(video, status) {
  let settings = { ...DEFAULT_SETTINGS };
  let statusTimer = null;

  function applyDisplayMode() {
    const style = video.style;
    for (const property of ["width", "height", "max-width", "max-height", "aspect-ratio", "object-fit"]) {
      style.removeProperty(property);
    }
    document.documentElement.dataset.displayMode = settings.displayMode;

    if (settings.displayMode === "fill") {
      style.objectFit = "cover";
      return;
    }

    if (settings.displayMode === "native") {
      if (!video.videoWidth || !video.videoHeight) return;
      const scale = window.devicePixelRatio || 1;
      style.width = `${video.videoWidth / scale}px`;
      style.height = `${video.videoHeight / scale}px`;
      style.maxWidth = "none";
      style.maxHeight = "none";
      style.objectFit = "fill";
      return;
    }

    let aspect = 0;
    if (settings.displayMode === "16-9") aspect = 16 / 9;
    if (settings.displayMode === "4-3") aspect = 4 / 3;
    if (settings.displayMode === "original" && video.videoWidth && video.videoHeight) aspect = video.videoWidth / video.videoHeight;

    if (aspect) {
      style.aspectRatio = String(aspect);
      style.objectFit = settings.displayMode === "original" ? "contain" : "fill";
      if (settings.seamless) {
        let width = window.innerWidth;
        let height = width / aspect;
        if (height > window.innerHeight) {
          height = window.innerHeight;
          width = height * aspect;
        }
        style.width = `${width}px`;
        style.height = `${height}px`;
        style.maxWidth = "none";
        style.maxHeight = "none";
      }
      return;
    }

    style.objectFit = "contain";
  }

  function applySettings(next) {
    settings = normalizeSettings(next);
    document.documentElement.classList.toggle("seamless", settings.seamless);
    video.controls = settings.showControls;
    applyDisplayMode();
  }

  function hideStatus() {
    clearTimeout(statusTimer);
    status.classList.add("hidden");
  }

  function setStatus(message, kind = "info", hideAfter = 0) {
    clearTimeout(statusTimer);
    status.textContent = message;
    status.dataset.kind = kind;
    status.classList.remove("hidden");
    if (hideAfter > 0) statusTimer = setTimeout(hideStatus, hideAfter);
  }

  async function startPlayback() {
    try {
      await video.play();
      hideStatus();
    } catch {
      const action = settings.showControls ? "Press play to start." : "Click the video to start.";
      setStatus(`Stream ready. ${action}`, "warning");
    }
  }

  async function initializeSettings() {
    applySettings(await loadSettings());
    video.addEventListener("loadedmetadata", applyDisplayMode);
    window.addEventListener("resize", applyDisplayMode);

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      const next = { ...settings };
      if (changes.seamless) next.seamless = changes.seamless.newValue;
      if (changes.showControls) next.showControls = changes.showControls.newValue;
      if (changes.displayMode) next.displayMode = changes.displayMode.newValue;
      applySettings(next);
    });
  }

  return { hideStatus, initializeSettings, setStatus, startPlayback };
}
