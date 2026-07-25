package com.echomind.backend.repository;

import com.echomind.backend.model.Flashcard;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlashcardRepository extends MongoRepository<Flashcard, String> {
    List<Flashcard> findByUserId(String userId);
    List<Flashcard> findByUserIdAndNextReviewDateBefore(String userId, LocalDateTime dateTime);
}
