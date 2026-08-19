# PhishSense

PhishSense classifies suspicious messages into common scam categories using simple, explainable phrase matching.

The main usable version is now a **Gmail browser extension**. Open an email in Gmail, click the floating PhishSense panel, and it scans the visible message text.

The extension combines two layers:

1. **Local rule matching:** fast, explainable red-flag phrase matching.
2. **AI analysis:** optional Gemini-powered analysis that reads the message meaning, compares it with the local rule result, and returns a structured scam-risk verdict.

The Java command-line version is still included as a clean baseline implementation of the local phrase-matching layer.

The project is designed this way so you can explain both the transparent baseline and the AI improvement in an interview.

## Use it in Gmail

### Chrome or Edge

1. Open `chrome://extensions` or `edge://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder:

```text
gmail-extension
```

5. Open the extension's **AI settings** page.
6. Paste your Gemini API key.
7. Keep the default `gemini-3.5-flash` model, or change it if needed.
8. Open Gmail at https://mail.google.com.
9. Open an email.
10. Use the floating **PhishSense** panel in the bottom-right corner.

The local rule scan always runs in your browser. If AI is configured, the currently opened email text is sent to Gemini only when you click **Scan open email**.

For a production version, the API key should live on a backend server instead of being stored in the browser extension. For a student demo, the local options-page key is simpler and easier to run.

## Categories

- `PHISHING`
- `FAKE_DELIVERY`
- `ROMANCE_SCAM`
- `TECH_SUPPORT_SCAM`
- `PRIZE_LOTTERY_SCAM`

## How it works

The local classifier checks the input message against each category's red-flag phrase list using case-insensitive substring matching. Every category with at least one matched phrase receives a `CategoryScore`.

Confidence is calculated as:

```text
matched phrases / total phrases defined for that category * 100
```

The category with the highest confidence score is printed as the verdict. Other categories with at least one match are printed as partial matches.

The AI layer then asks a Gemini model to return structured JSON with:

- scam/not-scam verdict
- scam category
- risk level
- confidence percentage
- suspicious signals
- plain-English explanation
- recommended action

This improves detection because the AI can notice meaning and context even when the exact phrase list does not match.

The extension uses the Gemini API `generateContent` endpoint with JSON mode and a response schema so the UI can reliably display fields like verdict, category, confidence, signals, and recommended action.

## Phrase data sources

The `PHISHING` and `PRIZE_LOTTERY_SCAM` phrase lists were derived from recurring phrases and n-grams in spam-labeled rows from the UCI/Kaggle SMS Spam Collection dataset:

- Dataset URL: https://raw.githubusercontent.com/mohitgupta-1O1/Kaggle-SMS-Spam-Collection-Dataset-/master/spam.csv
- Dataset size in this CSV: 5,572 labeled SMS messages
- Spam rows used for phrase mining: 747

The dataset strongly represents prize, lottery, premium-rate, account-statement, and mobile-offer spam. It does not meaningfully cover modern fake delivery scams, romance scams, or tech support scams.

For that reason, `FAKE_DELIVERY`, `ROMANCE_SCAM`, and `TECH_SUPPORT_SCAM` use manually curated red-flag phrases based on common consumer-protection guidance and scam pattern descriptions, including:

- FTC consumer guidance on spam/scam texts and phishing patterns: https://consumer.ftc.gov/articles/how-recognize-and-report-spam-text-messages
- FTC guidance on romance scams: https://consumer.ftc.gov/articles/what-know-about-romance-scams
- FTC guidance on tech support scams: https://consumer.ftc.gov/articles/how-spot-avoid-and-report-tech-support-scams
- USPS guidance on package smishing: https://www.uspis.gov/news/scam-article/smishing-package-tracking-text-scams
- Gemini API content generation reference: https://ai.google.dev/api/generate-content

Those manually curated categories are clearly commented in `ScamCategory.java` as not dataset-derived.

## Compile and run the Java version

From the project folder:

### PowerShell

```powershell
New-Item -ItemType Directory -Force -Path out
javac -d out src\com\scamdetector\*.java
java -cp out com.scamdetector.Main
```

### Bash

```bash
mkdir -p out
javac -d out src/com/scamdetector/*.java
java -cp out com.scamdetector.Main
```

Type or paste a message at the prompt. Type `quit` to exit.

## Example

```text
Message> URGENT! You have won a guaranteed 1000 cash prize. To claim call now.
Verdict: PRIZE_LOTTERY_SCAM
Confidence: 14.29%
Matched phrases: won a guaranteed, to claim call
```

## Known limitations

- Exact-phrase substring matching is brittle. It can miss scams with misspellings, spacing tricks, punctuation changes, or obfuscation like `cl1ck h3re`.
- Confidence is based only on how much of a category phrase list matched, not on true probability.
- Some phrases are broad, so false positives are possible.
- The dataset is older and reflects the spam language in that collection.
- The AI layer can still be wrong, so the UI treats results as risk guidance rather than proof.
- The demo extension stores the API key locally in browser extension storage. A real production version should use a backend server.

Good next steps would be normalization for obfuscated text, fuzzy matching, URL/phone-number features, safer backend API-key handling, and evaluation against a labeled email dataset.
