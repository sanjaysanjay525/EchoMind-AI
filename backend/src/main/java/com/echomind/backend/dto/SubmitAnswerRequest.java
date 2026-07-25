package com.echomind.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitAnswerRequest {
    @NotBlank(message = "Question ID is required")
    private String questionId;
    
    @NotBlank(message = "Answer text is required")
    private String answerText;
    
    private String audioPath;

    private java.util.List<String> coveredKeywords;

    private Integer deliveryScore;

    private Integer wpm;

    private Integer pauseCount;

    private Boolean interrupted;

    private Boolean isCurveball;

    private Double silenceSeconds;

    private Integer gazeAwayEvents;
}
