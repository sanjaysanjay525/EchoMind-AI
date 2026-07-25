package com.echomind.backend.repository;

import com.echomind.backend.model.WeeklyDigest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyDigestRepository extends MongoRepository<WeeklyDigest, String> {
    List<WeeklyDigest> findByUserId(String userId);
    Optional<WeeklyDigest> findFirstByUserIdOrderByGeneratedAtDesc(String userId);
}
