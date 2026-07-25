package com.echomind.backend.service;

import com.echomind.backend.model.ConsistencyAnalysis;
import com.echomind.backend.model.InterviewMemory;
import com.echomind.backend.repository.ConsistencyAnalysisRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ConsistencyAnalyzerService {

    private final GeminiService geminiService;
    private final ConsistencyAnalysisRepository consistencyAnalysisRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ConsistencyAnalyzerService(GeminiService geminiService, ConsistencyAnalysisRepository consistencyAnalysisRepository) {
        this.geminiService = geminiService;
        this.consistencyAnalysisRepository = consistencyAnalysisRepository;
    }

    public ConsistencyAnalysis analyzeConsistency(String interviewId, List<InterviewMemory> memoryList) {
        if (memoryList == null || memoryList.isEmpty()) {
            return saveEmptyAnalysis(interviewId);
        }

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Analyze the following interview conversation for consistency, contradictions, and extract knowledge graph entities. ");
        promptBuilder.append("Output ONLY a valid JSON object with the following structure:\n");
        promptBuilder.append("{\n");
        promptBuilder.append("  \"contradictionCount\": integer,\n");
        promptBuilder.append("  \"consistencyScore\": integer (0-100),\n");
        promptBuilder.append("  \"analysisSummary\": \"string\",\n");
        promptBuilder.append("  \"skillsIdentified\": [\"string\"],\n");
        promptBuilder.append("  \"projectsIdentified\": [\"string\"],\n");
        promptBuilder.append("  \"knowledgeAreas\": [\"string\"]\n");
        promptBuilder.append("}\n\n");
        promptBuilder.append("Here is the conversation history:\n\n");

        for (InterviewMemory mem : memoryList) {
            promptBuilder.append("Question ").append(mem.getSequenceNumber()).append(": ").append(mem.getQuestion()).append("\n");
            promptBuilder.append("Answer ").append(mem.getSequenceNumber()).append(": ").append(mem.getAnswer()).append("\n\n");
        }

        try {
            String geminiResponse = geminiService.callGeminiApi(promptBuilder.toString());
            String jsonStr = extractJsonFromResponse(geminiResponse);
            JsonNode rootNode = objectMapper.readTree(jsonStr);

            ConsistencyAnalysis analysis = ConsistencyAnalysis.builder()
                    .interviewId(interviewId)
                    .contradictionCount(rootNode.path("contradictionCount").asInt(0))
                    .consistencyScore(rootNode.path("consistencyScore").asInt(100))
                    .analysisSummary(rootNode.path("analysisSummary").asText(""))
                    .skillsIdentified(extractListFromJsonArray(rootNode.path("skillsIdentified")))
                    .projectsIdentified(extractListFromJsonArray(rootNode.path("projectsIdentified")))
                    .knowledgeAreas(extractListFromJsonArray(rootNode.path("knowledgeAreas")))
                    .build();

            return consistencyAnalysisRepository.save(analysis);

        } catch (Exception e) {
            System.err.println("Error analyzing consistency: " + e.getMessage());
            return saveEmptyAnalysis(interviewId);
        }
    }

    public ConsistencyAnalysis getReport(String interviewId) {
        return consistencyAnalysisRepository.findByInterviewId(interviewId).orElse(null);
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
        return list;
    }

    private ConsistencyAnalysis saveEmptyAnalysis(String interviewId) {
        ConsistencyAnalysis analysis = ConsistencyAnalysis.builder()
                .interviewId(interviewId)
                .contradictionCount(0)
                .consistencyScore(100)
                .analysisSummary("No data to analyze.")
                .skillsIdentified(new ArrayList<>())
                .projectsIdentified(new ArrayList<>())
                .knowledgeAreas(new ArrayList<>())
                .build();
        return consistencyAnalysisRepository.save(analysis);
    }
}
