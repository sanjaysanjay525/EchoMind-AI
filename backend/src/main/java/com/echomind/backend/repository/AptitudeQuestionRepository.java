package com.echomind.backend.repository;

import com.echomind.backend.model.AptitudeQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AptitudeQuestionRepository extends MongoRepository<AptitudeQuestion, String> {
    List<AptitudeQuestion> findByDifficulty(String difficulty);
    long countByRoleIdAndSource(String roleId, String source);
    void deleteByRoleIdAndSource(String roleId, String source);
}
