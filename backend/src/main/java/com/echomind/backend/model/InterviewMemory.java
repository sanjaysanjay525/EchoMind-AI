package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "interview_memory")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewMemory {
    @Id
    private String id;
    
    private String interviewId;
    
    private String question;
    
    private String answer;
    
    private String topic;
    
    private Integer sequenceNumber;
    
    private LocalDateTime createdAt;
}
