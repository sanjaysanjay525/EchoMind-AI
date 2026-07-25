package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "coding_problems")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingProblem {
    @Id
    private String id;
    private String title;
    private String description;
    private String difficulty; // Easy, Medium, Hard
    private String careerPath; // Software Engineer, UI/UX Designer, Game Developer
    private String templateCode; // starter code template for the editor
    private String testCasesJson; // input/output test cases array in JSON format
    private String roleId;
    private String source; // "batch_seeded"
    private String referenceSolutionJavaScript;
    private String language;
    private List<String> gradingCriteria;
    private List<String> idealTopicsCovered;
}
