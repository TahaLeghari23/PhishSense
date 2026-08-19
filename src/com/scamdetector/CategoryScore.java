package com.scamdetector;

import java.util.List;

public record CategoryScore(
        ScamCategory category,
        List<String> matchedPhrases,
        double confidencePercentage
) {
    public String categoryName() {
        return category.name();
    }
}
