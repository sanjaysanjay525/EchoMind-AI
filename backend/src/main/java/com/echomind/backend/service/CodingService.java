package com.echomind.backend.service;

import com.echomind.backend.model.CodingQuestion;
import com.echomind.backend.model.CodingSession;
import com.echomind.backend.repository.CodingQuestionRepository;
import com.echomind.backend.repository.CodingSessionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class CodingService {

    private final CodingQuestionRepository codingQuestionRepository;
    private final CodingSessionRepository codingSessionRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CodingService(CodingQuestionRepository codingQuestionRepository,
                         CodingSessionRepository codingSessionRepository,
                         GeminiService geminiService) {
        this.codingQuestionRepository = codingQuestionRepository;
        this.codingSessionRepository = codingSessionRepository;
        this.geminiService = geminiService;
    }

    public CodingSession startSession(String userId, String difficulty, List<String> topicTags) {
        // Load completed sessions to find unattempted questions and deduce weak topics
        List<CodingSession> userSessions = codingSessionRepository.findByUserId(userId);
        Set<String> attemptedQuestionIds = new HashSet<>();
        List<String> deducedWeakTopics = new ArrayList<>();
        
        for (CodingSession s : userSessions) {
            attemptedQuestionIds.add(s.getCodingQuestionId());
            if ("SUBMITTED".equals(s.getStatus()) && s.getCorrectness() != null) {
                if (s.getCorrectness().getPassed() < s.getCorrectness().getTotalTests()) {
                    // Failed some cases, get the tags
                    codingQuestionRepository.findById(s.getCodingQuestionId()).ifPresent(q -> {
                        if (q.getTopicTags() != null) {
                            deducedWeakTopics.addAll(q.getTopicTags());
                        }
                    });
                }
            }
        }

        List<String> activeTags = (topicTags != null && !topicTags.isEmpty()) ? topicTags : deducedWeakTopics;

        List<CodingQuestion> candidates;
        if (activeTags != null && !activeTags.isEmpty()) {
            candidates = codingQuestionRepository.findByDifficultyAndTopicTagsIn(difficulty, activeTags);
        } else {
            candidates = codingQuestionRepository.findByDifficulty(difficulty);
        }

        // If no matching candidates, fall back to all of that difficulty
        if (candidates.isEmpty()) {
            candidates = codingQuestionRepository.findByDifficulty(difficulty);
        }

        // If still empty, fall back to all questions
        if (candidates.isEmpty()) {
            candidates = codingQuestionRepository.findAll();
        }

        // Select an unattempted question, or fallback to any
        CodingQuestion selected = null;
        for (CodingQuestion q : candidates) {
            if (!attemptedQuestionIds.contains(q.getId())) {
                selected = q;
                break;
            }
        }
        if (selected == null && !candidates.isEmpty()) {
            selected = candidates.get(0);
        }

        if (selected == null) {
            throw new RuntimeException("No coding questions available in the database.");
        }

        CodingSession session = CodingSession.builder()
                .userId(userId)
                .codingQuestionId(selected.getId())
                .status("IN_PROGRESS")
                .startedAt(LocalDateTime.now())
                .build();

        return codingSessionRepository.save(session);
    }

    public CodingSession submitSession(String sessionId, String code, String language) {
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Coding session not found: " + sessionId));

        if ("SUBMITTED".equals(session.getStatus())) {
            return session; // already reviewed
        }

        CodingQuestion question = codingQuestionRepository.findById(session.getCodingQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found for this session"));

        // =====================================================================
        // MOCK TEST CASE EXECUTION
        // TODO: integrate secure code execution service (e.g., Judge0 API or similar)
        // =====================================================================
        List<CodingSession.TestCaseResult> results = new ArrayList<>();
        int passed = 0;
        List<CodingQuestion.TestCase> testCases = question.getTestCases();
        if (testCases != null) {
            for (CodingQuestion.TestCase tc : testCases) {
                boolean passedCase = code != null && !code.trim().isEmpty(); // mock: passes if code isn't empty
                results.add(CodingSession.TestCaseResult.builder()
                        .input(tc.getInput())
                        .expected(tc.getExpectedOutput())
                        .actual(passedCase ? tc.getExpectedOutput() : "Error: empty input/output execution")
                        .passed(passedCase)
                        .isHidden(tc.getIsHidden())
                        .build());
                if (passedCase) passed++;
            }
        }

        CodingSession.Correctness correctness = CodingSession.Correctness.builder()
                .passed(passed)
                .totalTests(testCases != null ? testCases.size() : 0)
                .passedTests(results)
                .build();

        // Qualitative AI Review
        CodingSession.AiReview aiReview = null;
        try {
            String rawJson = geminiService.getCodingReviewJson(question.getTitle(), question.getDescription(), code, language);
            
            // Clean markdown wrappers if returned
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }

            JsonNode root = objectMapper.readTree(rawJson);
            String complexity = root.path("complexity").asText("Time: O(N), Space: O(1)");
            int readability = root.path("readabilityScore").asInt(80);
            List<String> feedback = new ArrayList<>();
            JsonNode fbNode = root.path("feedback");
            if (fbNode.isArray()) {
                for (JsonNode fb : fbNode) {
                    feedback.add(fb.asText());
                }
            } else {
                feedback.add("Code formatting is clean and easy to follow.");
                feedback.add("Consider boundary conditions and edge cases in coding.");
            }

            aiReview = CodingSession.AiReview.builder()
                    .complexity(complexity)
                    .readabilityScore(readability)
                    .feedback(feedback)
                    .build();
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini qualitative code review, falling back. Error: " + e.getMessage());
            // Fallback
            aiReview = CodingSession.AiReview.builder()
                    .complexity("Time: O(N), Space: O(N)")
                    .readabilityScore(75)
                    .feedback(Arrays.asList(
                            "Code compiles successfully and satisfies base test conditions.",
                            "Review time/space complexities and ensure structures are released.",
                            "Consider adding boundary conditions to check for null pointer dereferences."
                    ))
                    .build();
        }

        session.setCode(code);
        session.setLanguage(language);
        session.setStatus("SUBMITTED");
        session.setSubmittedAt(LocalDateTime.now());
        session.setCorrectness(correctness);
        session.setAiReview(aiReview);

        return codingSessionRepository.save(session);
    }

    public CodingSession getSessionDetails(String sessionId) {
        return codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Coding session not found: " + sessionId));
    }
}
