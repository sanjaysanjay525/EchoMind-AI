package com.echomind.backend.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "scheduled_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledSession {
    @Id
    private String id;

    private String userId;

    private String title;

    private String domain;

    private String difficulty;

    private LocalDateTime scheduledAt;

    private String notes;

    private LocalDateTime createdAt;
}
