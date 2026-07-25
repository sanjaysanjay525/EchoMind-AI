package com.echomind.backend.repository;

import com.echomind.backend.model.GeneratedQuestionSet;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GeneratedQuestionSetRepository extends MongoRepository<GeneratedQuestionSet, String> {
}
