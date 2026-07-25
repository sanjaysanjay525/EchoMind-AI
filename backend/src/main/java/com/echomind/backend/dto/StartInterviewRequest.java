package com.echomind.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StartInterviewRequest {
    @NotBlank(message = "Domain is required")
    private String domain;
    
    @NotBlank(message = "Difficulty is required")
    private String difficulty;

    private String mode;
    private String interviewerGender;
    private String officeSetting;
    private String language;
    private Boolean practiceMode;
    private java.util.List<String> customQuestions;
    private String interviewerPersona;
}
