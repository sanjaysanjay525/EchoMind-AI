package com.echomind.backend.service;

import com.echomind.backend.model.InterviewCoaching;
import com.echomind.backend.model.InterviewContext;
import com.echomind.backend.repository.InterviewCoachingRepository;
import com.echomind.backend.repository.InterviewContextRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class InterviewCoachingService {

    private final InterviewCoachingRepository coachingRepository;
    private final InterviewContextRepository contextRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InterviewCoachingService(InterviewCoachingRepository coachingRepository,
                                    InterviewContextRepository contextRepository,
                                    GeminiService geminiService) {
        this.coachingRepository = coachingRepository;
        this.contextRepository = contextRepository;
        this.geminiService = geminiService;
    }

    public InterviewCoaching generateCoaching(String interviewId) {
        List<InterviewContext> contexts = contextRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
        if (contexts.isEmpty()) {
            throw new RuntimeException("No interview contexts found for interview: " + interviewId);
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert Interview Coach. I will provide a list of interview questions and the candidate's answers. ");
        prompt.append("Evaluate each using the STAR framework. Return a JSON object with this exact structure:\n");
        prompt.append("{\n");
        prompt.append("  \"questionCoachings\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"question\": \"string\",\n");
        prompt.append("      \"originalAnswer\": \"string\",\n");
        prompt.append("      \"whatWasGood\": \"string\",\n");
        prompt.append("      \"whatWasMissing\": \"string\",\n");
        prompt.append("      \"improvedAnswer\": \"string\",\n");
        prompt.append("      \"starScore\": integer (0-100),\n");
        prompt.append("      \"coachingFeedback\": \"string (e.g. STAR evaluation breakdown)\"\n");
        prompt.append("    }\n");
        prompt.append("  ],\n");
        prompt.append("  \"communicationTips\": [\"string\"],\n");
        prompt.append("  \"technicalTips\": [\"string\"],\n");
        prompt.append("  \"confidenceTips\": [\"string\"]\n");
        prompt.append("}\n\n");
        
        prompt.append("Here is the transcript:\n");
        for (int i = 0; i < contexts.size(); i++) {
            InterviewContext ctx = contexts.get(i);
            prompt.append("Q").append(i+1).append(": ").append(ctx.getQuestion()).append("\n");
            prompt.append("A").append(i+1).append(": ").append(ctx.getAnswer()).append("\n\n");
        }

        InterviewCoaching coaching = new InterviewCoaching();
        coaching.setInterviewId(interviewId);
        coaching.setCreatedAt(LocalDateTime.now());

        try {
            String geminiResponse = geminiService.callGeminiApi(prompt.toString());
            String jsonStr = extractJsonFromResponse(geminiResponse);
            JsonNode rootNode = objectMapper.readTree(jsonStr);

            List<InterviewCoaching.QuestionCoaching> qCoachings = new ArrayList<>();
            JsonNode qNodeArray = rootNode.path("questionCoachings");
            if (qNodeArray.isArray()) {
                for (JsonNode qNode : qNodeArray) {
                    InterviewCoaching.QuestionCoaching qc = InterviewCoaching.QuestionCoaching.builder()
                            .question(qNode.path("question").asText(""))
                            .originalAnswer(qNode.path("originalAnswer").asText(""))
                            .whatWasGood(qNode.path("whatWasGood").asText(""))
                            .whatWasMissing(qNode.path("whatWasMissing").asText(""))
                            .improvedAnswer(qNode.path("improvedAnswer").asText(""))
                            .starScore(qNode.path("starScore").asInt(70))
                            .coachingFeedback(qNode.path("coachingFeedback").asText(""))
                            .build();
                    qCoachings.add(qc);
                }
            }
            coaching.setQuestionCoachings(qCoachings);
            coaching.setCommunicationTips(extractListFromJsonArray(rootNode.path("communicationTips")));
            coaching.setTechnicalTips(extractListFromJsonArray(rootNode.path("technicalTips")));
            coaching.setConfidenceTips(extractListFromJsonArray(rootNode.path("confidenceTips")));

        } catch (Exception e) {
            System.err.println("Error parsing AI coaching response: " + e.getMessage());
            coaching.setQuestionCoachings(new ArrayList<>());
            coaching.setCommunicationTips(List.of("Speak clearly and confidently."));
            coaching.setTechnicalTips(List.of("Review the core concepts of the language/framework."));
            coaching.setConfidenceTips(List.of("Maintain eye contact and use open body language."));
        }

        return coachingRepository.save(coaching);
    }

    public Optional<InterviewCoaching> getCoachingByInterviewId(String interviewId) {
        return coachingRepository.findByInterviewId(interviewId);
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
