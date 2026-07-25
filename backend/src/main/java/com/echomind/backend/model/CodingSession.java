package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "coding_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingSession {
    @Id
    private String id;
    private String userId;
    private String codingQuestionId;
    private String code;
    private String language;
    private String status; // IN_PROGRESS, SUBMITTED
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Correctness correctness;
    private AiReview aiReview;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Correctness {
        private Integer passed;
        private Integer totalTests;
        private List<TestCaseResult> passedTests;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCaseResult {
        private String input;
        private String expected;
        private String actual;
        private Boolean passed;
        private Boolean isHidden;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiReview {
        private String complexity;
        private Integer readabilityScore; // out of 100
        private List<String> feedback; // 2-3 lines
    }
}
