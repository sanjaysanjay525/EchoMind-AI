package com.echomind.backend.repository;

import com.echomind.backend.model.RoundResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface RoundResultRepository extends MongoRepository<RoundResult, String> {
    Optional<RoundResult> findBySessionIdAndRoundType(String sessionId, String roundType);
    List<RoundResult> findBySessionId(String sessionId);
}
