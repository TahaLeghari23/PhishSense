const DEFAULT_MODEL = "gemini-3.5-flash";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === "AI_ANALYZE_EMAIL") {
    analyzeEmailWithAi(message.payload)
      .then((analysis) => sendResponse({ ok: true, analysis }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

async function analyzeEmailWithAi(payload) {
  const settings = await chrome.storage.local.get(["geminiApiKey", "geminiModel"]);
  const apiKey = settings.geminiApiKey;
  const model = normalizeModelName(settings.geminiModel || DEFAULT_MODEL);

  if (!apiKey) {
    return {
      configured: false,
      verdict: "AI_NOT_CONFIGURED",
      scamCategory: "UNKNOWN",
      riskLevel: "UNKNOWN",
      confidencePercentage: 0,
      explanation: "Add a Gemini API key in the extension options to enable AI analysis.",
      suspiciousSignals: [],
      recommendedAction: "Use the local rule matches for now, or configure AI analysis.",
      ruleVerdictUsed: payload.ruleVerdict || "NONE"
    };
  }

  const modelName = model.replace(/^models\//, "");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: [
              "You are PhishSense, a careful email scam-risk classifier.",
              "Analyze only the supplied email text and local rule-match summary.",
              "Return conservative, structured JSON. Do not invent facts.",
              "Treat the result as user-safety guidance, not a legal or financial determination.",
              "If the email is benign or evidence is weak, say so."
            ].join(" ")
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: buildAnalysisPrompt(payload)
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            verdict: { type: "STRING" },
            scamCategory: { type: "STRING" },
            riskLevel: { type: "STRING" },
            confidencePercentage: { type: "NUMBER" },
            explanation: { type: "STRING" },
            suspiciousSignals: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            recommendedAction: { type: "STRING" },
            ruleVerdictUsed: { type: "STRING" }
          },
          required: [
            "verdict",
            "scamCategory",
            "riskLevel",
            "confidencePercentage",
            "explanation",
            "suspiciousSignals",
            "recommendedAction",
            "ruleVerdictUsed"
          ]
        }
      }
    })
  });

  const responseBody = await response.json();

  if (!response.ok) {
    const message = responseBody.error?.message || `Gemini request failed with status ${response.status}`;
    throw new Error(message);
  }

  return parseStructuredOutput(responseBody);
}

function buildAnalysisPrompt(payload) {
  const ruleSummary = JSON.stringify(payload.ruleScores || [], null, 2);
  const emailText = String(payload.emailText || "").slice(0, 12000);

  return [
    "Classify this Gmail message for scam/spam risk.",
    "",
    "Allowed scam categories:",
    "PHISHING, FAKE_DELIVERY, ROMANCE_SCAM, TECH_SUPPORT_SCAM, PRIZE_LOTTERY_SCAM, OTHER, NONE, UNKNOWN",
    "",
    "Use only these verdict values: LIKELY_SCAM, SUSPICIOUS, LIKELY_SAFE, UNCLEAR.",
    "Use only these riskLevel values: LOW, MEDIUM, HIGH, UNKNOWN.",
    "Return confidencePercentage as a number from 0 to 100.",
    "Limit suspiciousSignals to at most 6 short strings.",
    "",
    "Local rule-match summary:",
    ruleSummary,
    "",
    "Email text:",
    emailText
  ].join("\n");
}

function normalizeModelName(model) {
  if (!model || model === "gemini-2.5-flash" || model === "models/gemini-2.5-flash") {
    return DEFAULT_MODEL;
  }

  return model;
}

function parseStructuredOutput(responseBody) {
  const outputText = responseBody.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    ?.join("")
    ?.trim();

  if (!outputText) {
    throw new Error("Gemini response did not include readable output text.");
  }

  return JSON.parse(outputText);
}
