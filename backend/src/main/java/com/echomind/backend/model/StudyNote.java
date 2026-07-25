package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "study_notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyNote {
    @Id
    private String id;
    
    private String userId;
    
    private String title;
    
    private String category; // Coding, System Design, Behavioral, Aptitude
    
    private String content; // Markdown text content
    
    private LocalDateTime updatedAt;
}
