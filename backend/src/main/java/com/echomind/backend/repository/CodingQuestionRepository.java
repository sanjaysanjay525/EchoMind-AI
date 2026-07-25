package com.echomind.backend.repository;

import com.echomind.backend.model.CodingQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodingQuestionRepository extends MongoRepository<CodingQuestion, String> {
    List<CodingQuestion> findByDifficulty(String difficulty);
    List<CodingQuestion> findByDifficultyAndTopicTagsIn(String difficulty, List<String> topicTags);
}
