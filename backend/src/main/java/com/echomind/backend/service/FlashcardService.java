package com.echomind.backend.service;

import com.echomind.backend.model.Flashcard;
import com.echomind.backend.repository.FlashcardRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;

    public FlashcardService(FlashcardRepository flashcardRepository) {
        this.flashcardRepository = flashcardRepository;
    }

    public List<Flashcard> getAllFlashcards(String userId) {
        List<Flashcard> cards = flashcardRepository.findByUserId(userId);
        if (cards.isEmpty()) {
            List<Flashcard> seeds = flashcardRepository.findByUserId("default_seed");
            if (!seeds.isEmpty()) {
                for (Flashcard s : seeds) {
                    Flashcard userCard = Flashcard.builder()
                            .userId(userId)
                            .category(s.getCategory())
                            .question(s.getQuestion())
                            .answer(s.getAnswer())
                            .easeFactor(2.5)
                            .intervalDays(0)
                            .repetitions(0)
                            .nextReviewDate(LocalDateTime.now())
                            .build();
                    flashcardRepository.save(userCard);
                }
                cards = flashcardRepository.findByUserId(userId);
            }
        }
        for (Flashcard c : cards) {
            sanitizeFlashcard(c);
        }
        return cards;
    }

    public List<Flashcard> getDueFlashcards(String userId) {
        List<Flashcard> all = getAllFlashcards(userId);
        LocalDateTime now = LocalDateTime.now();
        
        // Filter manually to ensure we support safety backfills for empty date fields
        return all.stream()
                .peek(this::sanitizeFlashcard)
                .filter(c -> c.getNextReviewDate().isBefore(now) || c.getNextReviewDate().isEqual(now))
                .sorted((a, b) -> a.getNextReviewDate().compareTo(b.getNextReviewDate())) // most overdue first
                .toList();
    }

    public Flashcard createFlashcard(String userId, String category, String question, String answer) {
        Flashcard card = Flashcard.builder()
                .userId(userId)
                .category(category)
                .question(question)
                .answer(answer)
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(LocalDateTime.now())
                .build();
        return flashcardRepository.save(card);
    }

    public void deleteFlashcard(String cardId) {
        flashcardRepository.deleteById(cardId);
    }

    public Flashcard reviewFlashcard(String cardId, int quality) {
        Flashcard card = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Flashcard not found: " + cardId));
        
        sanitizeFlashcard(card);

        // SM-2 Spaced Repetition calculation
        double easeFactor = card.getEaseFactor();
        int intervalDays = card.getIntervalDays();
        int repetitions = card.getRepetitions();

        if (quality < 3) {
            repetitions = 0;
            intervalDays = 1;
        } else {
            if (repetitions == 0) {
                intervalDays = 1;
            } else if (repetitions == 1) {
                intervalDays = 6;
            } else {
                intervalDays = (int) Math.round(intervalDays * easeFactor);
            }
            repetitions += 1;
        }

        easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

        card.setEaseFactor(easeFactor);
        card.setIntervalDays(intervalDays);
        card.setRepetitions(repetitions);
        card.setLastReviewedAt(LocalDateTime.now());
        card.setNextReviewDate(LocalDateTime.now().plusDays(intervalDays));

        return flashcardRepository.save(card);
    }

    private void sanitizeFlashcard(Flashcard card) {
        if (card.getEaseFactor() == null) card.setEaseFactor(2.5);
        if (card.getIntervalDays() == null) card.setIntervalDays(0);
        if (card.getRepetitions() == null) card.setRepetitions(0);
        if (card.getNextReviewDate() == null) card.setNextReviewDate(LocalDateTime.now());
    }
}
