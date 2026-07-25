package com.echomind.backend.repository;

import com.echomind.backend.model.ConsistencyAnalysis;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConsistencyAnalysisRepository extends MongoRepository<ConsistencyAnalysis, String> {
    Optional<ConsistencyAnalysis> findByInterviewId(String interviewId);
}
