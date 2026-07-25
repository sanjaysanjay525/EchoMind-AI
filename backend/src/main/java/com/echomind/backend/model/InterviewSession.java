package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "interview_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSession {
    @Id
    private String id;
    private String userId;
    private String careerPath;
    private String personaId;
    private String currentRound; // APTITUDE, COMMUNICATION, CODING, ADVANCED, COMPLETED
    private String status; // IN_PROGRESS, COMPLETED, FAILED
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<RoundDetails> rounds;

    private String roleId;
    private List<String> resumeKeywords;
    private Integer durationMinutes;
    private Boolean audioEnabled;
    private Boolean videoEnabled;
    private List<String> enabledRounds;
    private String difficultyLevel;
    private String codingLanguage;
    private ResumeProfile resumeProfile;
}
