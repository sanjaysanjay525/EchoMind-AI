package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "vision_analysis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisionAnalysis {
    @Id
    private String id;
    
    private String interviewId;
    
    private Integer eyeContactScore;
    
    private Integer attentionScore;
    
    private Integer faceVisibilityScore;
    
    private Integer lookingAwayCount;

    private Integer averageHeadTilt;
    
    private LocalDateTime createdAt;
}
