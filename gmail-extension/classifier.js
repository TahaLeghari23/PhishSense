(function exposeScamDetector(global) {
  const SCAM_CATEGORIES = {
    PHISHING: [
      // Dataset-derived from recurring phrases in UCI/Kaggle SMS spam rows.
      "account statement",
      "private your",
      "identifier code",
      "unredeemed bonus points",
      "call mobileupd8",
      "update now",
      "latest colour mobiles",
      "customer service representative",
      "we tried to contact you",
      "reply to our offer",
      "urgent",
      "valid 12hrs",
      "call from landline",
      "national rate"
    ],

    FAKE_DELIVERY: [
      // Manually curated, not dataset-derived.
      // Common package-delivery smishing red flags: missed delivery,
      // redelivery fee, address verification, payment, and suspicious links.
      "package could not be delivered",
      "delivery attempt failed",
      "schedule redelivery",
      "redelivery fee",
      "confirm your address",
      "verify shipping address",
      "parcel is on hold",
      "tracking number",
      "customs fee",
      "delivery requires payment",
      "click to reschedule"
    ],

    ROMANCE_SCAM: [
      // Manually curated, not dataset-derived.
      // Common romance scam patterns: fast attachment, excuses for not meeting,
      // emergency money requests, gift cards, crypto, and travel problems.
      "i love you",
      "send me money",
      "gift card",
      "wire transfer",
      "crypto investment",
      "emergency medical",
      "stuck overseas",
      "can't video call",
      "my camera is broken",
      "need money for a flight",
      "trust me with this investment"
    ],

    TECH_SUPPORT_SCAM: [
      // Manually curated, not dataset-derived.
      // Common fake support patterns: infection warnings, remote access,
      // fake Microsoft/Windows help, and gift-card payment requests.
      "your computer is infected",
      "virus detected",
      "call microsoft support",
      "windows support",
      "remote access",
      "install anydesk",
      "install teamviewer",
      "security warning",
      "your device has been locked",
      "pay with gift cards",
      "refund department",
      "technical support agent"
    ],

    PRIZE_LOTTERY_SCAM: [
      // Dataset-derived from recurring phrases in UCI/Kaggle SMS spam rows.
      "won a guaranteed",
      "prize guaranteed",
      "guaranteed 1000 cash",
      "bonus caller prize",
      "selected to receive",
      "await collection",
      "claim code",
      "final notice to collect",
      "this is the 2nd attempt",
      "trying to contact you",
      "mobile number has been awarded",
      "complimentary trip",
      "prize jackpot",
      "to claim call"
    ]
  };

  function classify(message) {
    const normalizedMessage = String(message || "").toLowerCase();

    return Object.entries(SCAM_CATEGORIES)
      .map(([category, phrases]) => {
        const matchedPhrases = phrases.filter((phrase) =>
          normalizedMessage.includes(phrase.toLowerCase())
        );

        return {
          category,
          matchedPhrases,
          confidencePercentage: (matchedPhrases.length / phrases.length) * 100
        };
      })
      .filter((score) => score.matchedPhrases.length > 0)
      .sort((left, right) => {
        const confidenceDifference = right.confidencePercentage - left.confidencePercentage;
        return confidenceDifference || left.category.localeCompare(right.category);
      });
  }

  global.ScamDetector = {
    categories: SCAM_CATEGORIES,
    classify
  };
})(globalThis);
