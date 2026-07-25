package com.echomind.backend.repository;

import com.echomind.backend.model.InterviewCoaching;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterviewCoachingRepository extends MongoRepository<InterviewCoaching, String> {
    Optional<InterviewCoaching> findByInterviewId(String interviewId);
}
