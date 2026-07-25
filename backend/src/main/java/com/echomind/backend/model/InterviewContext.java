package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "interview_contexts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewContext {
    @Id
    private String id;
    
    private String interviewId;
    
    private String question;
    
    private String answer;
    
    private String feedback;
    
    private Integer sequenceNumber;

    private Boolean isFollowUp;

    private Integer followUpCount;

    private Integer score; // 0 to 100

    private String effectiveDifficulty; // Junior, Mid, Senior

    private java.util.List<String> expectedKeywords;

    private java.util.List<String> coveredKeywords;

    private Boolean interrupted;

    private Boolean isCurveball;

    private Integer deliveryScore;

    private Integer wpm;

    private Integer pauseCount;

    private Double silenceSeconds;

    private Integer gazeAwayEvents;

    private ScoreBreakdown scoreBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreBreakdown {
        private SubScore starStructure;
        private SubScore technicalAccuracy;
        private SubScore communicationClarity;
        private SubScore confidenceDelivery;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubScore {
        private Integer score;
        private Double weight;
        private String rationale;
    }
}
