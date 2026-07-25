package com.echomind.backend.repository;

import com.echomind.backend.model.ScheduledSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduledSessionRepository extends MongoRepository<ScheduledSession, String> {
    List<ScheduledSession> findByUserId(String userId);
}
