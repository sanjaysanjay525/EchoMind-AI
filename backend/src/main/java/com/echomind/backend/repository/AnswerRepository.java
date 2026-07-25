package com.echomind.backend.repository;

import com.echomind.backend.model.Answer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends MongoRepository<Answer, String> {
    List<Answer> findByInterviewId(String interviewId);
    void deleteByInterviewId(String interviewId);
}
