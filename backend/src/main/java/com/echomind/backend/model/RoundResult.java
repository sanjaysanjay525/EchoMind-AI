package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Map;

@Document(collection = "round_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundResult {
    @Id
    private String id;
    private String sessionId;
    private String roundType; // APTITUDE, COMMUNICATION, CODING, ADVANCED
    private Object rawResponses; // dynamic responses object (like MCQ answers array or transcription string)
    private Integer score;
    private Map<String, Object> breakdown; // category-specific score breakdown
    private String aiEvaluationNotes;
    private Map<String, Object> engagementMetrics; // MediaPipe eye tracking & focus data
}
