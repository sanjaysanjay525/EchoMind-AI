package com.echomind.backend.repository;

import com.echomind.backend.model.CodingProblem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CodingProblemRepository extends MongoRepository<CodingProblem, String> {
    List<CodingProblem> findByCareerPath(String careerPath);
    List<CodingProblem> findByCareerPathAndDifficulty(String careerPath, String difficulty);
    long countByRoleIdAndSource(String roleId, String source);
    void deleteByRoleIdAndSource(String roleId, String source);
}
