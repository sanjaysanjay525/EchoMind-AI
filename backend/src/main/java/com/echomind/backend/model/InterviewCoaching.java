package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "interview_coaching")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewCoaching {
    @Id
    private String id;
    
    private String interviewId;
    
    private List<QuestionCoaching> questionCoachings;
    
    private List<String> communicationTips;
    private List<String> technicalTips;
    private List<String> confidenceTips;
    
    private LocalDateTime createdAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionCoaching {
        private String question;
        private String originalAnswer;
        private String whatWasGood;
        private String whatWasMissing;
        private String improvedAnswer;
        private Integer starScore;
        private String coachingFeedback;
    }
}
