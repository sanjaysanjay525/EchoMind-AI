package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "final_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalReport {
    @Id
    private String id;
    
    private String interviewId;
    
    private Integer technicalScore;
    
    private Integer communicationScore;
    
    private Integer eyeContactScore;
    
    private Integer attentionScore;
    
    private Integer consistencyScore;
    
    private Integer overallScore;
    
    private List<String> strengths;
    
    private List<String> weaknesses;
    
    private Roadmap roadmap;
    
    private String summary;
    
    private String pdfPath;
    
    private LocalDateTime createdAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Roadmap {
        private String oneWeekPlan;
        private String oneMonthPlan;
        private String threeMonthPlan;
    }
}
