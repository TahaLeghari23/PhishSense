const apiKeyInput = document.getElementById("api-key");
const modelInput = document.getElementById("model");
const statusElement = document.getElementById("status");

chrome.storage.local.get(["geminiApiKey", "geminiModel"]).then((settings) => {
  apiKeyInput.value = settings.geminiApiKey || "";
  modelInput.value = normalizeModelName(settings.geminiModel);
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    geminiApiKey: apiKeyInput.value.trim(),
    geminiModel: normalizeModelName(modelInput.value.trim())
  });

  showStatus("Settings saved.");
});

document.getElementById("clear").addEventListener("click", async () => {
  await chrome.storage.local.remove(["geminiApiKey"]);
  apiKeyInput.value = "";
  showStatus("API key cleared.");
});

function showStatus(message) {
  statusElement.textContent = message;
  window.setTimeout(() => {
    statusElement.textContent = "";
  }, 2500);
}

function normalizeModelName(model) {
  if (!model || model === "gemini-2.5-flash" || model === "models/gemini-2.5-flash") {
    return "gemini-3.5-flash";
  }

  return model;
}
