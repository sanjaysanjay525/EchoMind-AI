package com.echomind.backend.repository;

import com.echomind.backend.model.ResumeDraft;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeDraftRepository extends MongoRepository<ResumeDraft, String> {
    Optional<ResumeDraft> findByUserId(String userId);
}
