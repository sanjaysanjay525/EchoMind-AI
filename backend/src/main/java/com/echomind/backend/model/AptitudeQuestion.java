package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "aptitude_questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AptitudeQuestion {
    @Id
    private String id;
    private String category; // QUANT, LOGICAL, VERBAL
    private String difficulty; // Junior, Mid, Senior
    private String questionText;
    private List<String> options;
    private Integer correctAnswerIndex;
    private String roleId;
    private String source; // "batch_seeded"
}
