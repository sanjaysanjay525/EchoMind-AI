package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "interviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Interview {
    @Id
    private String id;
    
    private String userId;
    
    private String domain;
    
    private String difficulty;
    
    private LocalDateTime date;
    
    private Integer duration; // In seconds or minutes
    
    private String status; // IN_PROGRESS, COMPLETED

    private String mode; // basic or comprehensive

    private String interviewerGender; // male or female

    private String officeSetting; // office1, office2, office3

    private String language; // en or th

    private Boolean practiceMode; // true for Practice Mode, false/null for Graded Mode

    private java.util.List<String> customQuestions; // 2-3 custom questions generated from resume

    private String interviewerPersona; // Friendly HR, Technical Grillmaster, Skeptical Panel

    private String sessionType; // FULL or MICRO

    private java.util.List<String> targetedCompetencies;
}
