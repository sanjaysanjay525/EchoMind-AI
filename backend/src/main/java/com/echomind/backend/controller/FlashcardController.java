package com.echomind.backend.controller;

import com.echomind.backend.model.Flashcard;
import com.echomind.backend.model.User;
import com.echomind.backend.repository.UserRepository;
import com.echomind.backend.service.FlashcardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flashcards")
public class FlashcardController {

    private final FlashcardService flashcardService;
    private final UserRepository userRepository;

    public FlashcardController(FlashcardService flashcardService, UserRepository userRepository) {
        this.flashcardService = flashcardService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<Flashcard>> getAllFlashcards() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(flashcardService.getAllFlashcards(user.getId()));
    }

    @GetMapping("/due")
    public ResponseEntity<List<Flashcard>> getDueFlashcards() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(flashcardService.getDueFlashcards(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Flashcard> createFlashcard(@RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser();
        String category = payload.getOrDefault("category", "General");
        String question = payload.get("question");
        String answer = payload.get("answer");

        if (question == null || answer == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(flashcardService.createFlashcard(user.getId(), category, question, answer));
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable String cardId) {
        flashcardService.deleteFlashcard(cardId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{cardId}/review")
    public ResponseEntity<Flashcard> reviewFlashcard(
            @PathVariable String cardId,
            @RequestBody Map<String, Object> payload) {
        try {
            int quality = ((Number) payload.getOrDefault("quality", 3)).intValue();
            if (quality < 0 || quality > 5) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(flashcardService.reviewFlashcard(cardId, quality));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
