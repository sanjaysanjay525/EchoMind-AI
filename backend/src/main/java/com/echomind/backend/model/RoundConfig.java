package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "round_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundConfig {
    @Id
    private String id;
    private String careerPath;
    private String roundType; // APTITUDE, COMMUNICATION, CODING, ADVANCED
    private Integer passThreshold; // e.g., 60
    private Boolean strictCutoff;
}
