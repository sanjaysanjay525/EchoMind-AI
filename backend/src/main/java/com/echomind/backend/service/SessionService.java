package com.echomind.backend.service;

import com.echomind.backend.model.*;
import com.echomind.backend.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final InterviewSessionRepository sessionRepository;
    private final AptitudeQuestionRepository aptitudeQuestionRepository;
    private final CommunicationQuestionRepository communicationQuestionRepository;
    private final CodingProblemRepository codingProblemRepository;
    private final RoundConfigRepository roundConfigRepository;
    private final RoundResultRepository roundResultRepository;
    private final UserRepository userRepository;
    private final CodeExecutionService codeExecutionService;
    private final GeminiService geminiService;
    private final RoleRepository roleRepository;
    private final QuestionGenerationService questionGenerationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InterviewSession startSession(String email, String careerPath, String personaId) {
        return startSession(email, careerPath, personaId, Arrays.asList("APTITUDE", "COMMUNICATION", "CODING", "ADVANCED"), 30, true, true, null);
    }

    public InterviewSession startSession(String email, String careerPath, String personaId, 
                                         List<String> enabledRounds, Integer durationMinutes, 
                                         Boolean audioEnabled, Boolean videoEnabled, List<String> resumeKeywords) {
        return startSession(email, careerPath, personaId, enabledRounds, durationMinutes, audioEnabled, videoEnabled, resumeKeywords, "PROFESSIONAL", null, null);
    }

    public InterviewSession startSession(String email, String careerPath, String personaId, 
                                         List<String> enabledRounds, Integer durationMinutes, 
                                         Boolean audioEnabled, Boolean videoEnabled, List<String> resumeKeywords,
                                         String difficultyLevel, String codingLanguage) {
        return startSession(email, careerPath, personaId, enabledRounds, durationMinutes, audioEnabled, videoEnabled, resumeKeywords, difficultyLevel, codingLanguage, null);
    }

    public InterviewSession startSession(String email, String careerPath, String personaId, 
                                         List<String> enabledRounds, Integer durationMinutes, 
                                         Boolean audioEnabled, Boolean videoEnabled, List<String> resumeKeywords,
                                         String difficultyLevel, String codingLanguage, ResumeProfile resumeProfile) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        if (enabledRounds == null || enabledRounds.isEmpty()) {
            enabledRounds = Arrays.asList("APTITUDE", "COMMUNICATION", "CODING", "ADVANCED");
        }

        List<RoundDetails> rounds = new ArrayList<>();
        for (int i = 0; i < enabledRounds.size(); i++) {
            String rType = enabledRounds.get(i).toUpperCase();
            String initialStatus = (i == 0) ? "IN_PROGRESS" : "LOCKED";
            rounds.add(RoundDetails.builder().roundType(rType).status(initialStatus).build());
        }

        String firstRound = enabledRounds.get(0).toUpperCase();

        InterviewSession session = InterviewSession.builder()
                .userId(user.getId())
                .careerPath(careerPath)
                .personaId(personaId)
                .currentRound(firstRound)
                .status("IN_PROGRESS")
                .startedAt(LocalDateTime.now())
                .rounds(rounds)
                .roleId(careerPath)
                .resumeKeywords(resumeKeywords)
                .durationMinutes(durationMinutes != null ? durationMinutes : 30)
                .audioEnabled(audioEnabled != null ? audioEnabled : true)
                .videoEnabled(videoEnabled != null ? videoEnabled : true)
                .enabledRounds(enabledRounds)
                .difficultyLevel(difficultyLevel != null ? difficultyLevel : "PROFESSIONAL")
                .codingLanguage(codingLanguage)
                .resumeProfile(resumeProfile)
                .build();

        // Increment Role usageCount if exists
        try {
            Optional<Role> roleOpt = roleRepository.findById(careerPath);
            if (roleOpt.isPresent()) {
                Role r = roleOpt.get();
                r.setUsageCount(r.getUsageCount() != null ? r.getUsageCount() + 1 : 1);
                roleRepository.save(r);
            }
        } catch (Exception e) {
            System.err.println("Failed to increment role usageCount: " + e.getMessage());
        }

        return sessionRepository.save(session);
    }

    public InterviewSession getSession(String sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
    }

    public Map<String, Object> startRound(String sessionId, String roundType) {
        InterviewSession session = getSession(sessionId);
        
        if (!session.getCurrentRound().equalsIgnoreCase(roundType)) {
            throw new IllegalStateException("Cannot start round " + roundType + ". Current round is " + session.getCurrentRound());
        }

        for (RoundDetails round : session.getRounds()) {
            if (round.getRoundType().equalsIgnoreCase(roundType)) {
                if ("LOCKED".equals(round.getStatus())) {
                    round.setStatus("IN_PROGRESS");
                }
                if (round.getStartedAt() == null) {
                    round.setStartedAt(LocalDateTime.now());
                }
                break;
            }
        }
        sessionRepository.save(session);

        Map<String, Object> data = new HashMap<>();
        data.put("session", session);

        int duration = session.getDurationMinutes() != null ? session.getDurationMinutes() : 30;

        if ("APTITUDE".equalsIgnoreCase(roundType)) {
            List<AptitudeQuestion> questions = questionGenerationService.getOrGenerateAptitude(session);
            int count = Math.max(1, (int) Math.round(questions.size() * (duration / 30.0)));
            data.put("questions", questions.subList(0, Math.min(count, questions.size())));
        } else if ("COMMUNICATION".equalsIgnoreCase(roundType)) {
            List<CommunicationQuestion> questions = questionGenerationService.getOrGenerateCommunication(session);
            int count = Math.max(1, (int) Math.round(questions.size() * (duration / 30.0)));
            data.put("questions", questions.subList(0, Math.min(count, questions.size())));
        } else if ("CODING".equalsIgnoreCase(roundType)) {
            List<CodingProblem> customized = questionGenerationService.getOrGenerateCoding(session);
            // Map custom templates per language
            List<CodingProblem> finalCustomized = customized.stream()
                .map(p -> CodingProblem.builder()
                    .id(p.getId())
                    .title(p.getTitle())
                    .description(p.getDescription())
                    .difficulty(p.getDifficulty())
                    .careerPath(p.getCareerPath())
                    .templateCode(getTemplateForLanguage(p, session.getCodingLanguage()))
                    .testCasesJson(p.getTestCasesJson())
                    .build())
                .toList();
            data.put("problems", finalCustomized);
        } else if ("ADVANCED".equalsIgnoreCase(roundType)) {
            List<CodingProblem> customized = questionGenerationService.getOrGenerateAdvanced(session);
            data.put("problems", customized);
        }

        return data;
    }

    public Map<String, Object> submitAptitude(String sessionId, List<Map<String, Object>> submissions) {
        InterviewSession session = getSession(sessionId);
        if (!"APTITUDE".equalsIgnoreCase(session.getCurrentRound())) {
            throw new IllegalStateException("Current round is not APTITUDE.");
        }

        List<AptitudeQuestion> questions = aptitudeQuestionRepository.findAll();
        int correct = 0;
        int quantCorrect = 0, quantTotal = 0;
        int logicalCorrect = 0, logicalTotal = 0;
        int verbalCorrect = 0, verbalTotal = 0;

        Map<String, Integer> submissionMap = new HashMap<>();
        for (Map<String, Object> sub : submissions) {
            submissionMap.put((String) sub.get("questionId"), (Integer) sub.get("selectedOptionIndex"));
        }

        for (AptitudeQuestion q : questions) {
            Integer selected = submissionMap.get(q.getId());
            boolean isCorrect = selected != null && selected.equals(q.getCorrectAnswerIndex());

            if (isCorrect) {
                correct++;
            }

            String cat = q.getCategory().toUpperCase();
            if (cat.contains("QUANT")) {
                quantTotal++;
                if (isCorrect) quantCorrect++;
            } else if (cat.contains("LOGICAL") || cat.contains("REASONING")) {
                logicalTotal++;
                if (isCorrect) logicalCorrect++;
            } else if (cat.contains("VERBAL") || cat.contains("ENGLISH")) {
                verbalTotal++;
                if (isCorrect) verbalCorrect++;
            }
        }

        int totalQuestions = questions.isEmpty() ? 1 : questions.size();
        int score = (int) Math.round((double) correct / totalQuestions * 100);

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("quantAccuracy", quantTotal == 0 ? 0 : (int) Math.round((double) quantCorrect / quantTotal * 100));
        breakdown.put("logicalAccuracy", logicalTotal == 0 ? 0 : (int) Math.round((double) logicalCorrect / logicalTotal * 100));
        breakdown.put("verbalAccuracy", verbalTotal == 0 ? 0 : (int) Math.round((double) verbalCorrect / verbalTotal * 100));

        // Annotate submissions with per-question correctness feedback
        for (Map<String, Object> sub : submissions) {
            boolean isCorrect = false;
            String qId = (String) sub.get("questionId");
            for (AptitudeQuestion q : questions) {
                if (q.getId().equals(qId)) {
                    Integer selected = (Integer) sub.get("selectedOptionIndex");
                    isCorrect = selected != null && selected.equals(q.getCorrectAnswerIndex());
                    break;
                }
            }
            sub.put("strengths", isCorrect ? List.of("Correct option chosen.") : List.of());
            sub.put("improvements", isCorrect ? List.of() : List.of("Selected incorrect answer option. Review derivation logic."));
            sub.put("score", isCorrect ? 100 : 0);
        }

        RoundResult result = RoundResult.builder()
                .sessionId(sessionId)
                .roundType("APTITUDE")
                .rawResponses(submissions)
                .score(score)
                .breakdown(breakdown)
                .aiEvaluationNotes("Automated aptitude checking complete. Total correct: " + correct + "/" + totalQuestions)
                .build();
        roundResultRepository.save(result);

        updateRoundDetails(session, "APTITUDE", score, Map.of("correctCount", correct, "totalCount", totalQuestions));
        evaluateRoundPassFail(session, "APTITUDE", score);

        advanceToNextRound(session, "APTITUDE");

        Map<String, Object> response = new HashMap<>();
        response.put("score", score);
        response.put("breakdown", breakdown);
        response.put("passed", score >= getPassThreshold(session.getCareerPath(), "APTITUDE"));
        response.put("nextRound", "COMPLETED".equalsIgnoreCase(session.getCurrentRound()) ? "REPORT" : session.getCurrentRound());
        return response;
    }

    public Map<String, Object> submitCommunication(String sessionId, List<Map<String, Object>> submissions, Map<String, Object> engagementMetrics) {
        InterviewSession session = getSession(sessionId);
        if (!"COMMUNICATION".equalsIgnoreCase(session.getCurrentRound())) {
            throw new IllegalStateException("Current round is not COMMUNICATION.");
        }

        int totalScore = 0;
        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        for (Map<String, Object> sub : submissions) {
            String question = (String) sub.get("questionText");
            String answer = (String) sub.get("answerText");

            String prompt = String.format(
                    "You are an expert HR interviewer. Evaluate the candidate's answer based on standard HR rubrics (Clarity, Structure/STAR, Relevance, and Delivery).\n" +
                    "Question: %s\n" +
                    "Candidate Answer: %s\n\n" +
                    "Return ONLY a clean JSON object containing:\n" +
                    "{\n" +
                    "  \"score\": 0-100,\n" +
                    "  \"strengths\": [\"strength1\", \"strength2\"],\n" +
                    "  \"improvements\": [\"improvement1\", \"improvement2\"],\n" +
                    "  \"rubricBreakdown\": {\n" +
                    "     \"clarity\": 0-100,\n" +
                    "     \"structure\": 0-100,\n" +
                    "     \"relevance\": 0-100\n" +
                    "  }\n" +
                    "}\n" +
                    "Do NOT include markdown block ticks or extra explanations.", question, answer);

            try {
                String rawJson = geminiService.callGeminiApi(prompt);
                if (rawJson.startsWith("```")) {
                    rawJson = rawJson.replaceAll("```json|```", "").trim();
                }
                Map<String, Object> evaluation = objectMapper.readValue(rawJson, new TypeReference<Map<String, Object>>() {});
                int itemScore = ((Number) evaluation.get("score")).intValue();
                totalScore += itemScore;
                List<String> itemStrengths = (List<String>) evaluation.get("strengths");
                List<String> itemImprovements = (List<String>) evaluation.get("improvements");

                sub.put("strengths", itemStrengths);
                sub.put("improvements", itemImprovements);
                sub.put("score", itemScore);

                strengths.addAll(itemStrengths);
                improvements.addAll(itemImprovements);
            } catch (Exception e) {
                System.err.println("Communication question AI evaluation failed: " + e.getMessage());
                sub.put("strengths", List.of("Shows basic conversational flow."));
                sub.put("improvements", List.of("Elaborate on details using structural guidelines."));
                sub.put("score", 70);
                totalScore += 70;
            }
        }

        int score = submissions.isEmpty() ? 70 : (int) Math.round((double) totalScore / submissions.size());
        
        strengths = new ArrayList<>(new LinkedHashSet<>(strengths));
        improvements = new ArrayList<>(new LinkedHashSet<>(improvements));
        if (strengths.isEmpty()) strengths.add("Shows solid understanding of communication basics.");
        if (improvements.isEmpty()) improvements.add("Elaborate on details using structural guidelines.");

        RoundResult result = RoundResult.builder()
                .sessionId(sessionId)
                .roundType("COMMUNICATION")
                .rawResponses(submissions)
                .score(score)
                .breakdown(Map.of("clarity", score, "structure", score, "relevance", score))
                .aiEvaluationNotes("Strengths: " + strengths + "\nImprovements: " + improvements)
                .engagementMetrics(engagementMetrics)
                .build();
        roundResultRepository.save(result);

        updateRoundDetails(session, "COMMUNICATION", score, Map.of("strengths", strengths, "improvements", improvements));
        evaluateRoundPassFail(session, "COMMUNICATION", score);

        advanceToNextRound(session, "COMMUNICATION");

        Map<String, Object> response = new HashMap<>();
        response.put("score", score);
        response.put("passed", score >= getPassThreshold(session.getCareerPath(), "COMMUNICATION"));
        response.put("nextRound", "COMPLETED".equalsIgnoreCase(session.getCurrentRound()) ? "REPORT" : session.getCurrentRound());
        return response;
    }

    public Map<String, Object> submitCoding(String sessionId, String code, String language) {
        InterviewSession session = getSession(sessionId);
        if (!"CODING".equalsIgnoreCase(session.getCurrentRound())) {
            throw new IllegalStateException("Current round is not CODING.");
        }

        List<CodingProblem> problems = codingProblemRepository.findByCareerPath(session.getCareerPath());
        if (problems.isEmpty()) {
            problems = codingProblemRepository.findByCareerPath("Software Engineer");
        }
        CodingProblem problem = problems.get(0);

        Map<String, Object> runResults = codeExecutionService.executeCode(language, code, problem.getTestCasesJson());
        int score = (int) runResults.getOrDefault("score", 0);

        // Fetch AI critiques for the coding solution
        List<String> codingStrengths = new ArrayList<>();
        List<String> codingImprovements = new ArrayList<>();
        String reviewPrompt = String.format(
            "You are an expert coder. Review the candidate's solution for the problem.\n" +
            "Problem: %s\n" +
            "Candidate Code:\n%s\n\n" +
            "Return ONLY a clean JSON object containing:\n" +
            "{\n" +
            "  \"strengths\": [\"strength1\", \"strength2\"],\n" +
            "  \"improvements\": [\"improvement1\", \"improvement2\"]\n" +
            "}\n" +
            "Do NOT include markdown block ticks or extra explanations.", problem.getTitle(), code
        );
        try {
            String rawJson = geminiService.callGeminiApi(reviewPrompt);
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            Map<String, List<String>> eval = objectMapper.readValue(rawJson, new TypeReference<Map<String, List<String>>>() {});
            codingStrengths = eval.getOrDefault("strengths", new ArrayList<>());
            codingImprovements = eval.getOrDefault("improvements", new ArrayList<>());
        } catch (Exception e) {
            codingStrengths.add("Code runs and passes basic tests.");
            codingImprovements.add("Optimize time/space complexity.");
        }

        Map<String, Object> responseDetail = new HashMap<>();
        responseDetail.put("code", code);
        responseDetail.put("language", language);
        responseDetail.put("strengths", codingStrengths);
        responseDetail.put("improvements", codingImprovements);
        responseDetail.put("score", score);

        RoundResult result = RoundResult.builder()
                .sessionId(sessionId)
                .roundType("CODING")
                .rawResponses(responseDetail)
                .score(score)
                .breakdown(Map.of("correctness", score))
                .aiEvaluationNotes((String) runResults.getOrDefault("error", "All tests processed successfully."))
                .build();
        roundResultRepository.save(result);

        updateRoundDetails(session, "CODING", score, Map.of("language", language));
        evaluateRoundPassFail(session, "CODING", score);

        advanceToNextRound(session, "CODING");

        Map<String, Object> response = new HashMap<>();
        response.put("score", score);
        response.put("runResults", runResults);
        response.put("passed", score >= getPassThreshold(session.getCareerPath(), "CODING"));
        response.put("nextRound", "COMPLETED".equalsIgnoreCase(session.getCurrentRound()) ? "REPORT" : session.getCurrentRound());
        return response;
    }

    public Map<String, Object> submitAdvanced(String sessionId, String notes, String language, String whiteboardBase64) {
        InterviewSession session = getSession(sessionId);
        if (!"ADVANCED".equalsIgnoreCase(session.getCurrentRound())) {
            throw new IllegalStateException("Current round is not ADVANCED.");
        }

        String prompt = String.format(
                "You are an expert Principal Engineer conducting a system design and advanced coding round.\n" +
                "Evaluate the candidate's system design notes and design layout structure.\n" +
                "Design Notes: %s\n\n" +
                "Return ONLY a clean JSON object containing:\n" +
                "{\n" +
                "  \"score\": 0-100,\n" +
                "  \"strengths\": [\"strength1\", \"strength2\"],\n" +
                "  \"improvements\": [\"improvement1\", \"improvement2\"],\n" +
                "  \"rubricBreakdown\": {\n" +
                "     \"scalability\": 0-100,\n" +
                "     \"correctness\": 0-100,\n" +
                "     \"depth\": 0-100\n" +
                "  }\n" +
                "}\n" +
                "Do NOT include markdown block ticks or extra explanations.", notes);

        int score = 70;
        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        try {
            String rawJson = geminiService.callGeminiApi(prompt);
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            Map<String, Object> evaluation = objectMapper.readValue(rawJson, new TypeReference<Map<String, Object>>() {});
            score = ((Number) evaluation.get("score")).intValue();
            strengths = (List<String>) evaluation.get("strengths");
            improvements = (List<String>) evaluation.get("improvements");
        } catch (Exception e) {
            System.err.println("Advanced round AI evaluation failed: " + e.getMessage());
            strengths.add("Exhibits basic system layout structures.");
            improvements.add("Elaborate on database partitioning and load balancers.");
        }

        Map<String, Object> responseDetail = new HashMap<>();
        responseDetail.put("notes", notes);
        responseDetail.put("whiteboard", whiteboardBase64 != null ? "CAPTURED" : "NONE");
        responseDetail.put("strengths", strengths);
        responseDetail.put("improvements", improvements);
        responseDetail.put("score", score);

        RoundResult result = RoundResult.builder()
                .sessionId(sessionId)
                .roundType("ADVANCED")
                .rawResponses(responseDetail)
                .score(score)
                .breakdown(Map.of("scalability", score, "correctness", score, "depth", score))
                .aiEvaluationNotes("Strengths: " + strengths + "\nImprovements: " + improvements)
                .build();
        roundResultRepository.save(result);

        updateRoundDetails(session, "ADVANCED", score, Map.of("strengths", strengths, "improvements", improvements));
        evaluateRoundPassFail(session, "ADVANCED", score);

        advanceToNextRound(session, "ADVANCED");

        Map<String, Object> response = new HashMap<>();
        response.put("score", score);
        response.put("passed", score >= getPassThreshold(session.getCareerPath(), "ADVANCED"));
        response.put("nextRound", "COMPLETED".equalsIgnoreCase(session.getCurrentRound()) ? "REPORT" : session.getCurrentRound());
        return response;
    }

    private void advanceToNextRound(InterviewSession session, String currentRoundType) {
        List<String> enabled = session.getEnabledRounds();
        if (enabled == null || enabled.isEmpty()) {
            enabled = Arrays.asList("APTITUDE", "COMMUNICATION", "CODING", "ADVANCED");
        }

        int index = -1;
        for (int i = 0; i < enabled.size(); i++) {
            if (enabled.get(i).equalsIgnoreCase(currentRoundType)) {
                index = i;
                break;
            }
        }

        if (index != -1 && index + 1 < enabled.size()) {
            String nextRoundType = enabled.get(index + 1).toUpperCase();
            session.setCurrentRound(nextRoundType);
            unlockRound(session, nextRoundType);
        } else {
            session.setCurrentRound("COMPLETED");
            if (!"FAILED".equalsIgnoreCase(session.getStatus())) {
                session.setStatus("COMPLETED");
            }
            session.setCompletedAt(LocalDateTime.now());
        }
        sessionRepository.save(session);
    }

    public Map<String, Object> getConsolidatedReport(String sessionId) {
        InterviewSession session = getSession(sessionId);
        List<RoundResult> results = roundResultRepository.findBySessionId(sessionId);

        Map<String, Object> report = new HashMap<>();
        report.put("session", session);
        report.put("results", results);

        // Compile aggregated statistics
        int totalScore = 0;
        int completedRoundsCount = 0;
        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        for (RoundResult res : results) {
            totalScore += res.getScore();
            completedRoundsCount++;
            if (res.getAiEvaluationNotes() != null) {
                // simple parse if notes contain strengths list or similar
                if (res.getAiEvaluationNotes().contains("Strengths:")) {
                    strengths.add(res.getRoundType() + ": Good reasoning details.");
                }
            }
        }

        int averageScore = completedRoundsCount == 0 ? 0 : (int) Math.round((double) totalScore / completedRoundsCount);
        report.put("overallScore", averageScore);
        report.put("strengths", strengths.isEmpty() ? List.of("Demonstrated foundations in core rounds.") : strengths);
        report.put("improvements", improvements.isEmpty() ? List.of("Practice system design architectural questions.") : improvements);

        return report;
    }

    // Helper methods
    private void updateRoundDetails(InterviewSession session, String roundType, int score, Map<String, Object> details) {
        for (RoundDetails round : session.getRounds()) {
            if (round.getRoundType().equalsIgnoreCase(roundType)) {
                round.setScore(score);
                round.setCompletedAt(LocalDateTime.now());
                round.setStatus("COMPLETED");
                round.setDetails(details);
                break;
            }
        }
    }

    private void unlockRound(InterviewSession session, String roundType) {
        for (RoundDetails round : session.getRounds()) {
            if (round.getRoundType().equalsIgnoreCase(roundType)) {
                round.setStatus("IN_PROGRESS");
                round.setStartedAt(LocalDateTime.now());
                break;
            }
        }
    }

    private int getPassThreshold(String careerPath, String roundType) {
        return roundConfigRepository.findByCareerPathAndRoundType(careerPath, roundType)
                .map(RoundConfig::getPassThreshold)
                .orElse(60);
    }

    private void evaluateRoundPassFail(InterviewSession session, String roundType, int score) {
        RoundConfig config = roundConfigRepository.findByCareerPathAndRoundType(session.getCareerPath(), roundType)
                .orElse(RoundConfig.builder().passThreshold(60).strictCutoff(false).build());

        if (score < config.getPassThreshold()) {
            if (Boolean.TRUE.equals(config.getStrictCutoff())) {
                session.setStatus("FAILED");
            } else {
                // Mark as failed but allow continuing in practice mode
                session.setStatus("FAILED_BUT_PRACTICING");
            }
        }
    }

    private String getTemplateForLanguage(CodingProblem problem, String language) {
        if (language == null || "javascript".equalsIgnoreCase(language) || "js".equalsIgnoreCase(language)) {
            return problem.getTemplateCode();
        }
        
        String title = problem.getTitle();
        if ("Two Sum Problem".equalsIgnoreCase(title)) {
            if ("python".equalsIgnoreCase(language)) {
                return "def solution(nums, target):\n    # Write your code here\n    pass";
            } else if ("java".equalsIgnoreCase(language)) {
                return "import java.util.*;\n\nclass Solution {\n    public int[] solution(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}";
            } else if ("cpp".equalsIgnoreCase(language) || "c++".equalsIgnoreCase(language)) {
                return "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};";
            } else if ("typescript".equalsIgnoreCase(language) || "ts".equalsIgnoreCase(language)) {
                return "function solution(nums: number[], target: number): number[] {\n    // Write your code here\n    return [];\n}";
            } else if ("go".equalsIgnoreCase(language)) {
                return "package main\n\nfunc solution(nums []int, target int) []int {\n    // Write your code here\n    return nil\n}";
            }
        }
        
        // General fallback template rewrite
        if ("python".equalsIgnoreCase(language)) {
            return "def solution():\n    # Write your code here\n    pass";
        } else if ("java".equalsIgnoreCase(language)) {
            return "class Solution {\n    public void solution() {\n        // Write your code here\n    }\n}";
        } else if ("cpp".equalsIgnoreCase(language) || "c++".equalsIgnoreCase(language)) {
            return "#include <iostream>\nusing namespace std;\n\nvoid solution() {\n    // Write your code here\n}";
        }
        
        return problem.getTemplateCode();
    }
}
