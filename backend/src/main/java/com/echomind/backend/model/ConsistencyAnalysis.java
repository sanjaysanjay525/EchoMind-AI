package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "consistency_analysis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsistencyAnalysis {
    @Id
    private String id;
    
    private String interviewId;
    
    private Integer contradictionCount;
    
    private Integer consistencyScore;
    
    private String analysisSummary;
    
    private List<String> skillsIdentified;
    
    private List<String> projectsIdentified;
    
    private List<String> knowledgeAreas;
}
