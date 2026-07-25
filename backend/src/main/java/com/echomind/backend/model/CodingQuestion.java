package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Document(collection = "coding_questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingQuestion {
    @Id
    private String id;
    private String title;
    private String description;
    private String difficulty; // Easy, Medium, Hard
    private List<String> topicTags;
    private Map<String, String> starterCode; // keys: javascript, python, java
    private List<TestCase> testCases;
    private Integer timeLimitMinutes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCase {
        private String input;
        private String expectedOutput;
        private Boolean isHidden;
    }
}
