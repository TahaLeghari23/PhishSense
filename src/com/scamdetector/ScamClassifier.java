package com.scamdetector;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public class ScamClassifier {
    public List<CategoryScore> classify(String message) {
        String normalizedMessage = message.toLowerCase(Locale.ROOT);
        List<CategoryScore> scores = new ArrayList<>();

        for (ScamCategory category : ScamCategory.values()) {
            List<String> matches = new ArrayList<>();

            for (String phrase : category.getRedFlagPhrases()) {
                if (normalizedMessage.contains(phrase.toLowerCase(Locale.ROOT))) {
                    matches.add(phrase);
                }
            }

            if (!matches.isEmpty()) {
                double confidence = (matches.size() * 100.0) / category.getRedFlagPhrases().size();
                scores.add(new CategoryScore(category, List.copyOf(matches), confidence));
            }
        }

        scores.sort(Comparator.comparingDouble(CategoryScore::confidencePercentage).reversed()
                .thenComparing(score -> score.categoryName()));
        return scores;
    }

    public Optional<CategoryScore> verdict(String message) {
        return classify(message).stream().findFirst();
    }
}
