(function initGmailScamDetector() {
  const PANEL_ID = "scamdetector-panel";
  const RESULT_ID = "scamdetector-result";

  function createPanel() {
    if (document.getElementById(PANEL_ID)) {
      return;
    }

    const panel = document.createElement("aside");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="sd-header">
        <div>
          <strong>PhishSense</strong>
          <span>Gmail scanner</span>
        </div>
        <button class="sd-icon-button" type="button" aria-label="Hide PhishSense">×</button>
      </div>
      <button class="sd-scan-button" type="button">Scan open email</button>
      <button class="sd-settings-button" type="button">AI settings</button>
      <div id="${RESULT_ID}" class="sd-result muted">
        Open an email in Gmail, then scan it.
      </div>
    `;

    panel.querySelector(".sd-icon-button").addEventListener("click", () => {
      panel.classList.toggle("sd-collapsed");
    });

    panel.querySelector(".sd-scan-button").addEventListener("click", scanOpenEmail);
    panel.querySelector(".sd-settings-button").addEventListener("click", () => {
      sendExtensionMessage({ type: "OPEN_OPTIONS" }).catch(() => {
        showStaleExtensionMessage();
      });
    });
    document.body.appendChild(panel);
  }

  function getOpenEmailText() {
    const messageNodes = Array.from(document.querySelectorAll(".a3s.aiL, .a3s"))
      .filter((node) => isVisible(node) && node.innerText.trim().length > 0);

    if (messageNodes.length > 0) {
      return messageNodes[messageNodes.length - 1].innerText.trim();
    }

    const main = document.querySelector('[role="main"]');
    return main ? main.innerText.trim() : "";
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  async function scanOpenEmail() {
    const result = document.getElementById(RESULT_ID);
    const messageText = getOpenEmailText();

    if (!messageText) {
      result.className = "sd-result warning";
      result.textContent = "No visible email text found. Open a message first, then scan again.";
      return;
    }

    const scores = globalThis.ScamDetector.classify(messageText);
    const ruleVerdict = scores[0]?.category || "NONE";

    result.className = "sd-result muted";
    result.innerHTML = `
      <div class="sd-verdict">Scanning...</div>
      <div class="sd-confidence">Checking local rules and AI analysis.</div>
    `;

    if (scores.length === 0) {
      renderRuleOnlyResult(result, scores);
    } else {
      renderRuleOnlyResult(result, scores);
    }

    try {
      const aiResponse = await sendExtensionMessage({
        type: "AI_ANALYZE_EMAIL",
        payload: {
          emailText: messageText,
          ruleVerdict,
          ruleScores: scores
        }
      });

      if (!aiResponse.ok) {
        throw new Error(aiResponse.error || "AI analysis failed.");
      }

      renderCombinedResult(result, scores, aiResponse.analysis);
    } catch (error) {
      renderCombinedResult(result, scores, {
        configured: false,
        verdict: "AI_ERROR",
        scamCategory: "UNKNOWN",
        riskLevel: "UNKNOWN",
        confidencePercentage: 0,
        explanation: error.message,
        suspiciousSignals: [],
        recommendedAction: "Check your AI settings, then try scanning again.",
        ruleVerdictUsed: ruleVerdict
      });
    }
  }

  function sendExtensionMessage(message) {
    try {
      return chrome.runtime.sendMessage(message);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function showStaleExtensionMessage() {
    const result = document.getElementById(RESULT_ID);

    if (!result) {
      return;
    }

    result.className = "sd-result warning";
    result.innerHTML = `
      <div class="sd-verdict">Refresh Gmail</div>
      <p class="sd-explanation">
        The extension was reloaded while this Gmail tab was open. Refresh Gmail, then try again.
      </p>
    `;
  }

  function renderRuleOnlyResult(result, scores) {
    if (scores.length === 0) {
      result.className = "sd-result safe";
      result.innerHTML = `
        <div class="sd-verdict">Local rules: no scam category matched</div>
        <div class="sd-confidence">Rule confidence: 0.00%</div>
        <div class="sd-ai-box muted">AI analysis is loading...</div>
      `;
      return;
    }

    const [verdict, ...partials] = scores;
    result.className = "sd-result danger";
    result.innerHTML = `
      <div class="sd-verdict">Local rules: ${formatCategory(verdict.category)}</div>
      <div class="sd-confidence">Rule confidence: ${verdict.confidencePercentage.toFixed(2)}%</div>
      <div class="sd-section-label">Matched phrases</div>
      <ul>${verdict.matchedPhrases.map((phrase) => `<li>${escapeHtml(phrase)}</li>`).join("")}</ul>
      ${renderPartials(partials)}
      <div class="sd-ai-box muted">AI analysis is loading...</div>
    `;
  }

  function renderCombinedResult(result, scores, aiAnalysis) {
    const topRuleScore = scores[0];
    const riskClass = getRiskClass(aiAnalysis);
    result.className = `sd-result ${riskClass}`;

    const ruleHtml = topRuleScore
      ? `
        <div class="sd-section-label">Local rule result</div>
        <div><strong>${formatCategory(topRuleScore.category)}</strong> (${topRuleScore.confidencePercentage.toFixed(2)}%)</div>
        <ul>${topRuleScore.matchedPhrases.map((phrase) => `<li>${escapeHtml(phrase)}</li>`).join("")}</ul>
        ${renderPartials(scores.slice(1))}
      `
      : `
        <div class="sd-section-label">Local rule result</div>
        <div>No exact red-flag phrases matched.</div>
      `;

    result.innerHTML = `
      <div class="sd-verdict">AI: ${formatAiVerdict(aiAnalysis.verdict)}</div>
      <div class="sd-confidence">
        ${formatCategory(aiAnalysis.scamCategory)} · ${escapeHtml(aiAnalysis.riskLevel)} risk · ${Number(aiAnalysis.confidencePercentage || 0).toFixed(2)}%
      </div>
      <p class="sd-explanation">${escapeHtml(aiAnalysis.explanation || "No explanation returned.")}</p>
      ${renderSignals(aiAnalysis.suspiciousSignals)}
      <div class="sd-section-label">Recommended action</div>
      <p class="sd-explanation">${escapeHtml(aiAnalysis.recommendedAction || "Use caution before clicking links or sending information.")}</p>
      ${ruleHtml}
    `;
  }

  function renderSignals(signals) {
    if (!Array.isArray(signals) || signals.length === 0) {
      return "";
    }

    return `
      <div class="sd-section-label">AI suspicious signals</div>
      <ul>${signals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}</ul>
    `;
  }

  function getRiskClass(aiAnalysis) {
    if (aiAnalysis.verdict === "LIKELY_SAFE" || aiAnalysis.riskLevel === "LOW") {
      return "safe";
    }

    if (aiAnalysis.verdict === "AI_NOT_CONFIGURED" || aiAnalysis.verdict === "AI_ERROR" || aiAnalysis.verdict === "UNCLEAR") {
      return "warning";
    }

    return "danger";
  }

  function formatAiVerdict(verdict) {
    if (verdict === "AI_NOT_CONFIGURED") {
      return "AI not configured";
    }

    if (verdict === "AI_ERROR") {
      return "AI error";
    }

    return formatCategory(verdict || "UNKNOWN");
  }

  function renderPartials(partials) {
    if (partials.length === 0) {
      return "";
    }

    return `
      <div class="sd-section-label">Other partial matches</div>
      ${partials.map((score) => `
        <div class="sd-partial">
          <strong>${formatCategory(score.category)}</strong>
          <span>${score.confidencePercentage.toFixed(2)}%</span>
          <small>${score.matchedPhrases.map(escapeHtml).join(", ")}</small>
        </div>
      `).join("")}
    `;
  }

  function formatCategory(category) {
    return category
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  createPanel();
})();
