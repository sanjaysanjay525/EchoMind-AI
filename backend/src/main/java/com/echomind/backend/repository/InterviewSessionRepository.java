package com.echomind.backend.repository;

import com.echomind.backend.model.InterviewSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewSessionRepository extends MongoRepository<InterviewSession, String> {
    List<InterviewSession> findByUserId(String userId);
}
