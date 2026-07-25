package com.echomind.backend.repository;

import com.echomind.backend.model.VisionAnalysis;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VisionAnalysisRepository extends MongoRepository<VisionAnalysis, String> {
    Optional<VisionAnalysis> findByInterviewId(String interviewId);
}
