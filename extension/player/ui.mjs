import { DEFAULT_SETTINGS, loadSettings, normalizeSettings } from "../settings/preferences.mjs";

export function createPlayerUi(video, status) {
  let settings = { ...DEFAULT_SETTINGS };
  let statusTimer = null;

  function applySettings(next) {
    settings = normalizeSettings(next);
    document.documentElement.classList.toggle("seamless", settings.seamless);
    video.controls = settings.showControls;
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
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      const next = { ...settings };
      if (changes.seamless) next.seamless = changes.seamless.newValue;
      if (changes.showControls) next.showControls = changes.showControls.newValue;
      applySettings(next);
    });
  }

  return { hideStatus, initializeSettings, setStatus, startPlayback };
}
