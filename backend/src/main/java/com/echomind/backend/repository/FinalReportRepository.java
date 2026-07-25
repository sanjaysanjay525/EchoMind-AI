package com.echomind.backend.repository;

import com.echomind.backend.model.FinalReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;


@Repository
public interface FinalReportRepository extends MongoRepository<FinalReport, String> {
    Optional<FinalReport> findByInterviewId(String interviewId);
    List<FinalReport> findByInterviewIdIn(List<String> interviewIds);
}
