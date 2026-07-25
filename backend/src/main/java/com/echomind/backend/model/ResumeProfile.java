package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeProfile {
    private List<String> technicalSkills;
    private List<String> tools;
    private Integer yearsOfExperience;
    private List<String> pastRoles;
    private List<String> domains;
    private List<String> notableProjects;
}
