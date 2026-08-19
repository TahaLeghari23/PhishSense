package com.scamdetector;

import java.util.List;

public enum ScamCategory {
    PHISHING(List.of(
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
    )),

    FAKE_DELIVERY(List.of(
            // Manually curated, not dataset-derived.
            // Based on common consumer-protection guidance about package-delivery smishing:
            // fake missed deliveries, redelivery fees, address verification, and suspicious links.
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
    )),

    ROMANCE_SCAM(List.of(
            // Manually curated, not dataset-derived.
            // Based on common romance-scam warning patterns: fast emotional attachment,
            // excuses for not meeting, emergency money requests, and gift-card/crypto pressure.
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
    )),

    TECH_SUPPORT_SCAM(List.of(
            // Manually curated, not dataset-derived.
            // Based on common tech-support scam patterns: fake infection alerts,
            // remote-access requests, urgent support calls, and payment for bogus fixes.
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
    )),

    PRIZE_LOTTERY_SCAM(List.of(
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
    ));

    private final List<String> redFlagPhrases;

    ScamCategory(List<String> redFlagPhrases) {
        this.redFlagPhrases = redFlagPhrases;
    }

    public List<String> getRedFlagPhrases() {
        return redFlagPhrases;
    }
}
