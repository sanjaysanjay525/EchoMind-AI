package com.echomind.backend.repository;

import com.echomind.backend.model.PlacementReadiness;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlacementReadinessRepository extends MongoRepository<PlacementReadiness, String> {
    Optional<PlacementReadiness> findByInterviewId(String interviewId);
}
