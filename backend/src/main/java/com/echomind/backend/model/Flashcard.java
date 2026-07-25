package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "flashcards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flashcard {
    @Id
    private String id;
    private String userId;
    private String category;
    private String question;
    private String answer;

    // SM-2 Spaced Repetition Fields
    @Builder.Default
    private Double easeFactor = 2.5;

    @Builder.Default
    private Integer intervalDays = 0;

    @Builder.Default
    private Integer repetitions = 0;

    private LocalDateTime nextReviewDate;
    private LocalDateTime lastReviewedAt;
}
