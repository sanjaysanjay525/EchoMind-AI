package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "placement_readiness")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementReadiness {
    @Id
    private String id;
    
    private String interviewId;
    
    private Integer readinessScore;
    
    private String confidenceLevel;
    
    private String hiringProbability;
    
    private List<String> technicalSkillGaps;
    
    private List<String> communicationGaps;
    
    private List<String> confidenceIssues;
    
    private List<String> interviewBehaviorIssues;
    
    private List<String> recommendedRoles;
    
    private String readinessCategory;
    
    private LearningPlan improvementPlan;
    
    private LocalDateTime createdAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningPlan {
        private String sevenDayPlan;
        private String thirtyDayPlan;
        private String ninetyDayPlan;
    }
}
