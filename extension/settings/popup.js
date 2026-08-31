import { loadSettings, normalizeSettings, saveSettings } from "./preferences.mjs";

const seamless = document.getElementById("seamless");
const showControls = document.getElementById("show-controls");
const saveStatus = document.getElementById("save-status");
let flashTimer = null;

function render(settings) {
  const normalized = normalizeSettings(settings);
  seamless.checked = normalized.seamless;
  showControls.checked = normalized.showControls;
}

function flashSaved() {
  clearTimeout(flashTimer);
  saveStatus.textContent = "Saved.";
  saveStatus.classList.add("flash");
  flashTimer = setTimeout(() => {
    saveStatus.textContent = "Saved locally in Firefox.";
    saveStatus.classList.remove("flash");
  }, 1200);
}

async function persist() {
  await saveSettings({
    seamless: seamless.checked,
    showControls: showControls.checked,
  });
  flashSaved();
}

seamless.addEventListener("change", persist);
showControls.addEventListener("change", persist);

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  const next = {};
  if (changes.seamless) next.seamless = changes.seamless.newValue;
  if (changes.showControls) next.showControls = changes.showControls.newValue;
  if (Object.keys(next).length) {
    render({
      seamless: next.seamless ?? seamless.checked,
      showControls: next.showControls ?? showControls.checked,
    });
  }
});

render(await loadSettings());
