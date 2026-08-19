package com.scamdetector;

import java.util.List;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        ScamClassifier classifier = new ScamClassifier();
        Scanner scanner = new Scanner(System.in);

        System.out.println("PhishSense - paste a suspicious text message, or type \"quit\" to exit.");

        while (true) {
            System.out.print("\nMessage> ");

            if (!scanner.hasNextLine()) {
                break;
            }

            String message = scanner.nextLine().trim();

            if (message.equalsIgnoreCase("quit")) {
                System.out.println("Goodbye.");
                break;
            }

            if (message.isBlank()) {
                System.out.println("Please paste a non-empty message.");
                continue;
            }

            List<CategoryScore> scores = classifier.classify(message);

            if (scores.isEmpty()) {
                System.out.println("Verdict: No scam category matched.");
                System.out.println("Confidence: 0.00%");
                continue;
            }

            CategoryScore verdict = scores.getFirst();
            printScore("Verdict", verdict);

            if (scores.size() > 1) {
                System.out.println("\nOther partial matches:");
                for (int i = 1; i < scores.size(); i++) {
                    printScore("- Partial", scores.get(i));
                }
            }
        }
    }

    private static void printScore(String label, CategoryScore score) {
        System.out.printf("%s: %s%n", label, score.categoryName());
        System.out.printf("Confidence: %.2f%%%n", score.confidencePercentage());
        System.out.println("Matched phrases: " + String.join(", ", score.matchedPhrases()));
    }
}
