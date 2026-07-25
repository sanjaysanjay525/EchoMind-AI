package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "weekly_digests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyDigest {
    @Id
    private String id;
    private String userId;
    private String weekOf; // Start of the week date "YYYY-MM-DD"
    private Integer sessionsCompleted;
    private Double avgScoreTrend; // difference in scores week-over-week
    private List<String> weakestCompetencies;
    private Integer flashcardStreak;
    private LocalDateTime generatedAt;
}
