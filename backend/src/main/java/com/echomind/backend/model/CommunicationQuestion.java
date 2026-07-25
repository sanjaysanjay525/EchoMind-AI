package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "communication_questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationQuestion {
    @Id
    private String id;
    private String careerPath; // Software Engineer, UI/UX Designer, Game Developer
    private String questionText;
    private List<String> expectedThemes;
    private String idealAnswerStructure; // STAR or other
    private String roleId;
    private String source; // "batch_seeded"
}
