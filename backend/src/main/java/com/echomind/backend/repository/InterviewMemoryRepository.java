package com.echomind.backend.repository;

import com.echomind.backend.model.InterviewMemory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewMemoryRepository extends MongoRepository<InterviewMemory, String> {
    List<InterviewMemory> findByInterviewIdOrderBySequenceNumberAsc(String interviewId);
}
