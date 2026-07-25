package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    private String id;
    private String domain;
    private String questionText;
    private String difficulty;
    private java.util.List<String> competencyTags;
}
