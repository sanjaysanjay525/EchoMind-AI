package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundDetails {
    private String roundType; // APTITUDE, COMMUNICATION, CODING, ADVANCED
    private String status; // LOCKED, IN_PROGRESS, COMPLETED, FAILED
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer score;
    private Map<String, Object> details; // Dynamic payload per round
}
