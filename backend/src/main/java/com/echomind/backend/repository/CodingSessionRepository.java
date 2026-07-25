package com.echomind.backend.repository;

import com.echomind.backend.model.CodingSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodingSessionRepository extends MongoRepository<CodingSession, String> {
    List<CodingSession> findByUserId(String userId);
    List<CodingSession> findByUserIdAndStatus(String userId, String status);
}
