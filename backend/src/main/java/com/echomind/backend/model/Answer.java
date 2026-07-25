package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Answer {
    @Id
    private String id;
    private String interviewId;
    private String questionId;
    private String answerText;
    private LocalDateTime timestamp;
}
