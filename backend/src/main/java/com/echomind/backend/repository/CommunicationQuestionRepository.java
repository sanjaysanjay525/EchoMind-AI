package com.echomind.backend.repository;

import com.echomind.backend.model.CommunicationQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommunicationQuestionRepository extends MongoRepository<CommunicationQuestion, String> {
    List<CommunicationQuestion> findByCareerPath(String careerPath);
    long countByRoleIdAndSource(String roleId, String source);
    void deleteByRoleIdAndSource(String roleId, String source);
}
