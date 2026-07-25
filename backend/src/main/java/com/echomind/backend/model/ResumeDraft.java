package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "resume_drafts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeDraft {
    @Id
    private String id;
    private String userId;
    private String templateId; // Classic, Modern, Minimal, Technical
    private Map<String, Object> sections; // contact, summary, experience, education, skills, projects
    private String status; // DRAFT, COMPLETE
    private LocalDateTime createdAt;
}
