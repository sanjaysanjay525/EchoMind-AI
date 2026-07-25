package com.echomind.backend.repository;

import com.echomind.backend.model.Interview;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends MongoRepository<Interview, String> {
    List<Interview> findByUserId(String userId);
    List<Interview> findByDomain(String domain);
}
