package com.echomind.backend.repository;

import com.echomind.backend.model.InterviewContext;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewContextRepository extends MongoRepository<InterviewContext, String> {
    List<InterviewContext> findByInterviewIdOrderBySequenceNumberAsc(String interviewId);
}
