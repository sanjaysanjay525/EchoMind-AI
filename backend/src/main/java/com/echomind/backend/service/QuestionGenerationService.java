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
@SuppressWarnings("unchecked")
public class QuestionGenerationService {

    private final GeminiService geminiService;
    private final CodeExecutionService codeExecutionService;
    private final GeneratedQuestionSetRepository generatedQuestionSetRepository;
    private final AptitudeQuestionRepository aptitudeQuestionRepository;
    private final CommunicationQuestionRepository communicationQuestionRepository;
    private final CodingProblemRepository codingProblemRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<AptitudeQuestion> getOrGenerateAptitude(InterviewSession session) {
        try {
            String json = getOrGenerateQuestionsJson(session, "APTITUDE");
            List<AptitudeQuestion> list = objectMapper.readValue(json, new TypeReference<List<AptitudeQuestion>>() {});
            // Set IDs dynamically if not present
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() == null) {
                    list.get(i).setId("apt-gen-" + session.getId() + "-" + i);
                }
            }
            return list;
        } catch (Exception e) {
            System.err.println("Failed to resolve dynamic Aptitude questions, falling back to static database: " + e.getMessage());
            List<AptitudeQuestion> fallback = aptitudeQuestionRepository.findAll();
            if (fallback.isEmpty()) {
                fallback = Arrays.asList(
                    AptitudeQuestion.builder()
                        .id("fall-1")
                        .category("QUANT")
                        .difficulty("Mid")
                        .questionText("If a train runs at 60 km/h, how long does it take to travel 120 km?")
                        .options(Arrays.asList("1 hour", "2 hours", "3 hours", "4 hours"))
                        .correctAnswerIndex(1)
                        .build()
                );
            }
            return fallback;
        }
    }

    public List<CommunicationQuestion> getOrGenerateCommunication(InterviewSession session) {
        try {
            String json = getOrGenerateQuestionsJson(session, "COMMUNICATION");
            List<CommunicationQuestion> list = objectMapper.readValue(json, new TypeReference<List<CommunicationQuestion>>() {});
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() == null) {
                    list.get(i).setId("comm-gen-" + session.getId() + "-" + i);
                }
            }
            return list;
        } catch (Exception e) {
            System.err.println("Failed to resolve dynamic Communication questions, falling back to static database: " + e.getMessage());
            List<CommunicationQuestion> fallback = communicationQuestionRepository.findByCareerPath(session.getCareerPath());
            if (fallback.isEmpty()) {
                fallback = communicationQuestionRepository.findByCareerPath("Software Engineer");
            }
            if (fallback.isEmpty()) {
                fallback = Arrays.asList(
                    CommunicationQuestion.builder()
                        .id("fall-comm-1")
                        .careerPath(session.getCareerPath())
                        .questionText("Tell me about a time you had to deal with a conflict inside your engineering team.")
                        .expectedThemes(Arrays.asList("conflict resolution", "collaboration", "empathy"))
                        .idealAnswerStructure("STAR")
                        .build()
                );
            }
            return fallback;
        }
    }

    public List<CodingProblem> getOrGenerateCoding(InterviewSession session) {
        try {
            String json = getOrGenerateQuestionsJson(session, "CODING");
            // The JSON was cached as a single CodingProblem but inside a list wrapper to be consistent with SessionService
            CodingProblem problem = objectMapper.readValue(json, CodingProblem.class);
            if (problem.getId() == null) {
                problem.setId("code-gen-" + session.getId());
            }
            return Collections.singletonList(problem);
        } catch (Exception e) {
            System.err.println("Failed to resolve dynamic Coding problems, falling back to static database: " + e.getMessage());
            List<CodingProblem> fallback = codingProblemRepository.findByCareerPath(session.getCareerPath());
            if (fallback.isEmpty()) {
                fallback = codingProblemRepository.findByCareerPath("Software Engineer");
            }
            if (fallback.isEmpty()) {
                fallback = Arrays.asList(
                    CodingProblem.builder()
                        .id("fall-code-1")
                        .title("Two Sum")
                        .description("Find two indices adding to target.")
                        .difficulty("Easy")
                        .careerPath(session.getCareerPath())
                        .templateCode("function solution(nums, target) {}")
                        .testCasesJson("[]")
                        .build()
                );
            }
            return fallback;
        }
    }

    public List<CodingProblem> getOrGenerateAdvanced(InterviewSession session) {
        try {
            String json = getOrGenerateQuestionsJson(session, "ADVANCED");
            CodingProblem problem = objectMapper.readValue(json, CodingProblem.class);
            if (problem.getId() == null) {
                problem.setId("adv-gen-" + session.getId());
            }
            return Collections.singletonList(problem);
        } catch (Exception e) {
            System.err.println("Failed to resolve dynamic Advanced problems, falling back to static database: " + e.getMessage());
            List<CodingProblem> fallback = codingProblemRepository.findByCareerPath(session.getCareerPath());
            if (fallback.isEmpty()) {
                fallback = codingProblemRepository.findByCareerPath("Software Engineer");
            }
            if (fallback.isEmpty()) {
                fallback = Arrays.asList(
                    CodingProblem.builder()
                        .id("fall-adv-1")
                        .title("Distributed Ledger System Design")
                        .description("Design a distributed scaling ledger service with high write throughput.")
                        .difficulty("Hard")
                        .careerPath(session.getCareerPath())
                        .templateCode("")
                        .testCasesJson("[]")
                        .build()
                );
            }
            return fallback;
        }
    }

    private String getOrGenerateQuestionsJson(InterviewSession session, String roundType) throws Exception {
        String sessionKey = "session_questions_" + session.getId() + "_" + roundType;

        // 1. Check if session-specific questions are already cached (page refresh scenario)
        Optional<GeneratedQuestionSet> sessionCached = generatedQuestionSetRepository.findById(sessionKey);
        if (sessionCached.isPresent()) {
            return sessionCached.get().getQuestionsJson();
        }

        // 2. Resolve global cache key if this round/profile supports global sharing
        boolean isAptitudeOrCoding = "APTITUDE".equalsIgnoreCase(roundType) || "CODING".equalsIgnoreCase(roundType);
        boolean hasNoResume = session.getResumeProfile() == null;
        boolean supportsGlobalCache = isAptitudeOrCoding || hasNoResume;

        String globalKey = null;
        if (supportsGlobalCache) {
            String signature = getResumeDomainSignature(session.getResumeProfile());
            globalKey = "global_questions_" + cleanCacheKey(session.getCareerPath()) + "_" +
                    session.getDifficultyLevel() + "_" + signature + "_" + roundType;

            Optional<GeneratedQuestionSet> globalCached = generatedQuestionSetRepository.findById(globalKey);
            if (globalCached.isPresent()) {
                GeneratedQuestionSet cachedSet = globalCached.get();
                if (cachedSet.getReuseCount() < 20) {
                    // Increment reuse count
                    cachedSet.setReuseCount(cachedSet.getReuseCount() + 1);
                    generatedQuestionSetRepository.save(cachedSet);

                    // Cache under session key
                    generatedQuestionSetRepository.save(GeneratedQuestionSet.builder()
                            .id(sessionKey)
                            .roleId(session.getCareerPath())
                            .difficultyLevel(session.getDifficultyLevel())
                            .roundType(roundType)
                            .questionsJson(cachedSet.getQuestionsJson())
                            .generatedAt(LocalDateTime.now())
                            .reuseCount(0)
                            .build());

                    return cachedSet.getQuestionsJson();
                }
            }
        }

        // 3. Generate fresh questions via LLM (with validation/retries for coding)
        String freshQuestionsJson = generateFreshQuestionsFromLLM(session, roundType);

        // 4. Save to session cache
        generatedQuestionSetRepository.save(GeneratedQuestionSet.builder()
                .id(sessionKey)
                .roleId(session.getCareerPath())
                .difficultyLevel(session.getDifficultyLevel())
                .roundType(roundType)
                .questionsJson(freshQuestionsJson)
                .generatedAt(LocalDateTime.now())
                .reuseCount(0)
                .build());

        // 5. Save to global cache if eligible
        if (supportsGlobalCache && globalKey != null) {
            generatedQuestionSetRepository.save(GeneratedQuestionSet.builder()
                    .id(globalKey)
                    .roleId(session.getCareerPath())
                    .difficultyLevel(session.getDifficultyLevel())
                    .resumeDomainSignature(getResumeDomainSignature(session.getResumeProfile()))
                    .roundType(roundType)
                    .questionsJson(freshQuestionsJson)
                    .generatedAt(LocalDateTime.now())
                    .reuseCount(0)
                    .build());
        }

        return freshQuestionsJson;
    }

    private String generateFreshQuestionsFromLLM(InterviewSession session, String roundType) throws Exception {
        if ("APTITUDE".equalsIgnoreCase(roundType)) {
            return generateAptitudeQuestions(session.getDifficultyLevel());
        } else if ("COMMUNICATION".equalsIgnoreCase(roundType)) {
            return generateCommunicationQuestions(session, session.getResumeProfile());
        } else if ("CODING".equalsIgnoreCase(roundType)) {
            return generateValidatedCodingQuestion(session, session.getResumeProfile());
        } else if ("ADVANCED".equalsIgnoreCase(roundType)) {
            return generateAdvancedQuestion(session, session.getResumeProfile());
        }
        throw new IllegalArgumentException("Unknown round type: " + roundType);
    }

    private String generateAptitudeQuestions(String difficulty) throws Exception {
        String prompt = String.format(
                "Generate a list of exactly 5 multiple choice aptitude questions matching target difficulty: %s.\n" +
                "Include a mix of quantitative, logical, and verbal categories.\n" +
                "Return ONLY a clean JSON array matching this schema precisely without markdown wraps (no ```json):\n" +
                "[\n" +
                "  {\n" +
                "    \"category\": \"[QUANT, LOGICAL, or VERBAL]\",\n" +
                "    \"difficulty\": \"%s\",\n" +
                "    \"questionText\": \"[Question prompt text]\",\n" +
                "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n" +
                "    \"correctAnswerIndex\": [0, 1, 2, or 3]\n" +
                "  }\n" +
                "]",
                difficulty, difficulty
        );
        String res = geminiService.callGeminiApi(prompt);
        return cleanJson(res);
    }

    private String generateCommunicationQuestions(InterviewSession session, ResumeProfile profile) throws Exception {
        String roleTitle = session.getCareerPath();
        String difficulty = session.getDifficultyLevel();

        String contextSection = "";
        if (profile != null) {
            contextSection = String.format(
                    "Candidate resume profile:\n" +
                    "- Past Roles: %s\n" +
                    "- Domains: %s\n" +
                    "- Notable Projects: %s\n" +
                    "- Skills: %s\n",
                    profile.getPastRoles(), profile.getDomains(), profile.getNotableProjects(), profile.getTechnicalSkills()
            );
        }

        String prompt = String.format(
                "You are a professional HR Mock Interviewer.\n" +
                "Generate exactly 3 behavioral communication questions tailored for a candidate interviewing for the role of '%s' (Difficulty: %s).\n" +
                "%s\n" +
                "Rules:\n" +
                "1. Tailor the questions to match the candidate's domains, past roles, or project themes without referencing personal identifiers.\n" +
                "2. Keep questions challenging, realistic, and focused on behavioral scenarios (STAR method).\n" +
                "Return ONLY a clean JSON array matching this schema precisely without markdown wraps:\n" +
                "[\n" +
                "  {\n" +
                "    \"careerPath\": \"%s\",\n" +
                "    \"questionText\": \"[Tailored behavioral question text]\",\n" +
                "    \"expectedThemes\": [\"theme1\", \"theme2\", \"theme3\"],\n" +
                "    \"idealAnswerStructure\": \"STAR\"\n" +
                "  }\n" +
                "]",
                roleTitle, difficulty, contextSection, roleTitle
        );
        String res = geminiService.callGeminiApi(prompt);
        return cleanJson(res);
    }

    private String generateValidatedCodingQuestion(InterviewSession session, ResumeProfile profile) throws Exception {
        int maxAttempts = 2;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                String rawJson = generateCodingQuestionCandidateJson(session, profile);
                Map<String, Object> problemMap = objectMapper.readValue(rawJson, Map.class);
                String refJS = (String) problemMap.get("referenceSolutionJavaScript");
                String testCases = (String) problemMap.get("testCasesJson");

                // Validate using javascript sandbox
                Map<String, Object> validationRun = codeExecutionService.executeCode("javascript", refJS, testCases);
                if (Boolean.TRUE.equals(validationRun.get("success")) && Integer.valueOf(100).equals(validationRun.get("score"))) {
                    // Success! Remove reference solution so candidate doesn't cheat and write back
                    problemMap.remove("referenceSolutionJavaScript");
                    return objectMapper.writeValueAsString(problemMap);
                }
                System.err.println("Attempt " + attempt + " failed coding validation tests logic: " + validationRun.get("error"));
            } catch (Exception e) {
                System.err.println("Attempt " + attempt + " failed to generate/parse coding: " + e.getMessage());
            }
        }
        throw new RuntimeException("Generated coding problem failed verification twice.");
    }

    private String generateCodingQuestionCandidateJson(InterviewSession session, ResumeProfile profile) throws Exception {
        String roleTitle = session.getCareerPath();
        String difficulty = session.getDifficultyLevel();
        String lang = session.getCodingLanguage() != null ? session.getCodingLanguage() : "JavaScript";

        String contextSection = "";
        if (profile != null) {
            contextSection = String.format(
                    "Candidate target domains: %s. Candidate skills: %s. Candidate projects: %s.\n" +
                    "Select a coding problem theme/domain loosely aligned with their background (e.g. log metrics matching Devops, ledger calculation matching Fintech, shopping cart matching e-commerce).",
                    profile.getDomains(), profile.getTechnicalSkills(), profile.getNotableProjects()
            );
        }

        String prompt = String.format(
                "You are a professional coding interviewer.\n" +
                "Generate ONE coding problem for a candidate interviewing for the role '%s' (Difficulty: %s) in programming language: %s.\n\n" +
                "%s\n\n" +
                "JSON Output Schema (Return ONLY this clean JSON object, no markdown code block formatting):\n" +
                "{\n" +
                "  \"title\": \"[Short problem title]\",\n" +
                "  \"description\": \"[Markdown description of problem, parameters, constraints, and 2 examples]\",\n" +
                "  \"difficulty\": \"[Easy, Medium, or Hard]\",\n" +
                "  \"careerPath\": \"%s\",\n" +
                "  \"templateCode\": \"[Starter code block skeleton for candidate in target language: %s]\",\n" +
                "  \"testCasesJson\": \"[JSON string containing exactly 3 test cases: [ { \\\"input\\\": \\\"[arg1, arg2]\\\", \\\"expected\\\": \\\"value\\\" }, ... ] ]\",\n" +
                "  \"referenceSolutionJavaScript\": \"[A complete working reference solution function in JavaScript/Node.js, named solution, to solve the problem]\"\n" +
                "}",
                roleTitle, difficulty, lang, contextSection, roleTitle, lang
        );
        String res = geminiService.callGeminiApi(prompt);
        return cleanJson(res);
    }

    private String generateAdvancedQuestion(InterviewSession session, ResumeProfile profile) throws Exception {
        String roleTitle = session.getCareerPath();
        String difficulty = session.getDifficultyLevel();

        String contextSection = "";
        if (profile != null) {
            contextSection = String.format(
                    "Candidate resume profile:\n" +
                    "- Technical Skills: %s\n" +
                    "- Domains: %s\n" +
                    "- Notable Projects: %s\n",
                    profile.getTechnicalSkills(), profile.getDomains(), profile.getNotableProjects()
            );
        }

        String prompt = String.format(
                "You are a Principal Software Architect.\n" +
                "Generate ONE advanced system architecture design challenge tailored for a candidate interviewing for the role '%s' at difficulty '%s'.\n" +
                "%s\n" +
                "Return ONLY a clean JSON object matching this schema precisely without markdown wraps:\n" +
                "{\n" +
                "  \"title\": \"[Advanced System Design Title]\",\n" +
                "  \"description\": \"[Detailed markdown description of the architectural requirements, expected traffic load, and scaling challenges candidate must address]\",\n" +
                "  \"difficulty\": \"[Medium or Hard]\",\n" +
                "  \"careerPath\": \"%s\",\n" +
                "  \"templateCode\": \"\",\n" +
                "  \"testCasesJson\": \"[]\"\n" +
                "}",
                roleTitle, difficulty, contextSection, roleTitle
        );
        String res = geminiService.callGeminiApi(prompt);
        return cleanJson(res);
    }

    private String cleanJson(String raw) {
        if (raw.startsWith("```")) {
            raw = raw.replaceAll("```json|```", "").trim();
        }
        return raw.trim();
    }

    private String getResumeDomainSignature(ResumeProfile profile) {
        if (profile == null) {
            return "no-resume";
        }
        List<String> list = new ArrayList<>();
        if (profile.getDomains() != null) {
            list.addAll(profile.getDomains());
        }
        if (profile.getTechnicalSkills() != null) {
            list.addAll(profile.getTechnicalSkills().subList(0, Math.min(3, profile.getTechnicalSkills().size())));
        }
        if (list.isEmpty()) {
            return "general";
        }
        Collections.sort(list);
        return cleanCacheKey(String.join("-", list));
    }

    private String cleanCacheKey(String str) {
        return str.toLowerCase().replaceAll("[^a-z0-9\\-_]", "_");
    }
}
