import { loadSettings, normalizeSettings, saveSettings } from "./preferences.mjs";

const seamless = document.getElementById("seamless");
const showControls = document.getElementById("show-controls");
const displayMode = document.getElementById("display-mode");
const saveStatus = document.getElementById("save-status");
let flashTimer = null;

function render(settings) {
  const normalized = normalizeSettings(settings);
  seamless.checked = normalized.seamless;
  showControls.checked = normalized.showControls;
  displayMode.value = normalized.displayMode;
}

function currentSettings() {
  return {
    seamless: seamless.checked,
    showControls: showControls.checked,
    displayMode: displayMode.value,
  };
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
  await saveSettings(currentSettings());
  flashSaved();
}

seamless.addEventListener("change", persist);
showControls.addEventListener("change", persist);
displayMode.addEventListener("change", persist);

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  const current = currentSettings();
  if (changes.seamless) current.seamless = changes.seamless.newValue;
  if (changes.showControls) current.showControls = changes.showControls.newValue;
  if (changes.displayMode) current.displayMode = changes.displayMode.newValue;
  render(current);
});

render(await loadSettings());
