package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "generated_question_sets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedQuestionSet {
    @Id
    private String id; // unique cache key: session_questions_[sessionId]_[roundType] or global_questions_[role]_[difficulty]_[signature]_[roundType]
    private String roleId;
    private String difficultyLevel;
    private String resumeDomainSignature;
    private String roundType;
    private int reuseCount;
    private LocalDateTime generatedAt;
    private String questionsJson; 
}
