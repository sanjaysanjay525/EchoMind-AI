package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "roles")
public class Role {
    @Id
    private String id;
    private String title;
    private String category;
    private String description;
    private List<String> keywords;
    private String source; // "curated" | "ai_generated"
    private java.time.LocalDateTime generatedAt;
    private Integer usageCount;
    private List<String> questionThemes;
}
