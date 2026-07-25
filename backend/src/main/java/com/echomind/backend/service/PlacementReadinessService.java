package com.echomind.backend.service;

import com.echomind.backend.model.*;
import com.echomind.backend.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PlacementReadinessService {

    private final PlacementReadinessRepository repository;
    private final FinalReportRepository finalReportRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PlacementReadinessService(PlacementReadinessRepository repository,
                                     FinalReportRepository finalReportRepository,
                                     GeminiService geminiService) {
        this.repository = repository;
        this.finalReportRepository = finalReportRepository;
        this.geminiService = geminiService;
    }

    public PlacementReadiness analyzeReadiness(String interviewId) {
        Optional<FinalReport> reportOpt = finalReportRepository.findByInterviewId(interviewId);
        if (reportOpt.isEmpty()) {
            throw new RuntimeException("Final Report not found. Please generate the report first.");
        }
        FinalReport report = reportOpt.get();

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert AI Career Coach. Analyze the following candidate performance metrics and feedback to predict their placement readiness. ");
        prompt.append("Output ONLY a valid JSON object with the following strict structure:\n");
        prompt.append("{\n");
        prompt.append("  \"readinessScore\": integer (0-100),\n");
        prompt.append("  \"confidenceLevel\": \"string (e.g. Low, Medium, High)\",\n");
        prompt.append("  \"hiringProbability\": \"string (e.g. Low, Moderate, High, Excellent)\",\n");
        prompt.append("  \"readinessCategory\": \"string (Not Ready, Beginner, Intermediate, Placement Ready, Highly Competitive)\",\n");
        prompt.append("  \"technicalSkillGaps\": [\"string\"],\n");
        prompt.append("  \"communicationGaps\": [\"string\"],\n");
        prompt.append("  \"confidenceIssues\": [\"string\"],\n");
        prompt.append("  \"interviewBehaviorIssues\": [\"string\"],\n");
        prompt.append("  \"recommendedRoles\": [\"string\"],\n");
        prompt.append("  \"sevenDayPlan\": \"string\",\n");
        prompt.append("  \"thirtyDayPlan\": \"string\",\n");
        prompt.append("  \"ninetyDayPlan\": \"string\"\n");
        prompt.append("}\n\n");
        prompt.append("Here is the candidate's performance data:\n");
        prompt.append("Overall Score: ").append(report.getOverallScore()).append("\n");
        prompt.append("Technical Score: ").append(report.getTechnicalScore()).append("\n");
        prompt.append("Communication Score: ").append(report.getCommunicationScore()).append("\n");
        prompt.append("Eye Contact Score: ").append(report.getEyeContactScore()).append("\n");
        prompt.append("Attention Score: ").append(report.getAttentionScore()).append("\n");
        prompt.append("Consistency Score: ").append(report.getConsistencyScore()).append("\n");
        
        if (report.getStrengths() != null) {
            prompt.append("Strengths: ").append(String.join(", ", report.getStrengths())).append("\n");
        }
        if (report.getWeaknesses() != null) {
            prompt.append("Weaknesses: ").append(String.join(", ", report.getWeaknesses())).append("\n");
        }

        PlacementReadiness readiness = new PlacementReadiness();
        readiness.setInterviewId(interviewId);
        readiness.setCreatedAt(LocalDateTime.now());

        try {
            String geminiResponse = geminiService.callGeminiApi(prompt.toString());
            String jsonStr = extractJsonFromResponse(geminiResponse);
            JsonNode rootNode = objectMapper.readTree(jsonStr);

            readiness.setReadinessScore(rootNode.path("readinessScore").asInt(70));
            readiness.setConfidenceLevel(rootNode.path("confidenceLevel").asText("Medium"));
            readiness.setHiringProbability(rootNode.path("hiringProbability").asText("Moderate"));
            readiness.setReadinessCategory(rootNode.path("readinessCategory").asText("Intermediate"));
            
            readiness.setTechnicalSkillGaps(extractListFromJsonArray(rootNode.path("technicalSkillGaps")));
            readiness.setCommunicationGaps(extractListFromJsonArray(rootNode.path("communicationGaps")));
            readiness.setConfidenceIssues(extractListFromJsonArray(rootNode.path("confidenceIssues")));
            readiness.setInterviewBehaviorIssues(extractListFromJsonArray(rootNode.path("interviewBehaviorIssues")));
            readiness.setRecommendedRoles(extractListFromJsonArray(rootNode.path("recommendedRoles")));
            
            PlacementReadiness.LearningPlan plan = PlacementReadiness.LearningPlan.builder()
                    .sevenDayPlan(rootNode.path("sevenDayPlan").asText("Review fundamentals"))
                    .thirtyDayPlan(rootNode.path("thirtyDayPlan").asText("Practice mock interviews"))
                    .ninetyDayPlan(rootNode.path("ninetyDayPlan").asText("Build advanced projects"))
                    .build();
                    
            readiness.setImprovementPlan(plan);

        } catch (Exception e) {
            System.err.println("Error parsing AI readiness response: " + e.getMessage());
            readiness.setReadinessScore(report.getOverallScore());
            readiness.setConfidenceLevel("Medium");
            readiness.setHiringProbability("Moderate");
            readiness.setReadinessCategory("Intermediate");
            readiness.setTechnicalSkillGaps(List.of("Needs deeper technical knowledge"));
            readiness.setCommunicationGaps(List.of("Reduce filler words"));
            readiness.setConfidenceIssues(List.of("Maintain eye contact"));
            readiness.setInterviewBehaviorIssues(List.of("Improve confidence"));
            readiness.setRecommendedRoles(List.of("Junior Developer"));
            
            PlacementReadiness.LearningPlan plan = PlacementReadiness.LearningPlan.builder()
                    .sevenDayPlan("Review basic concepts")
                    .thirtyDayPlan("Practice mock interviews")
                    .ninetyDayPlan("Build full stack projects")
                    .build();
            readiness.setImprovementPlan(plan);
        }

        return repository.save(readiness);
    }

    public Optional<PlacementReadiness> getReadinessByInterviewId(String interviewId) {
        return repository.findByInterviewId(interviewId);
    }

    private String extractJsonFromResponse(String response) {
        int startIndex = response.indexOf("{");
        int endIndex = response.lastIndexOf("}");
        if (startIndex != -1 && endIndex != -1) {
            return response.substring(startIndex, endIndex + 1);
        }
        return "{}";
    }

    private List<String> extractListFromJsonArray(JsonNode arrayNode) {
        List<String> list = new ArrayList<>();
        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode node : arrayNode) {
                list.add(node.asText());
            }
        }
        if (list.isEmpty()) {
            list.add("None identified");
        }
        return list;
    }
}
