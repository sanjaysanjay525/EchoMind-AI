package com.echomind.backend.repository;

import com.echomind.backend.model.RoundConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface RoundConfigRepository extends MongoRepository<RoundConfig, String> {
    Optional<RoundConfig> findByCareerPathAndRoundType(String careerPath, String roundType);
    List<RoundConfig> findByCareerPath(String careerPath);
}
