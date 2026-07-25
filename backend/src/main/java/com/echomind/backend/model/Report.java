package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {
    @Id
    private String id;
    
    private String interviewId;
    
    private Integer technicalScore;
    
    private Integer communicationScore;
    
    private Integer overallScore;
    
    private List<String> strengths;
    
    private List<String> weaknesses;
    
    private List<String> suggestions;

    private String studyPlan;

    private List<String> unlockedBadges;
}
