package com.echomind.backend.service;

import com.echomind.backend.model.*;
import com.echomind.backend.dto.SubmitAnswerRequest;
import com.echomind.backend.repository.InterviewRepository;
import com.echomind.backend.repository.UserRepository;
import com.echomind.backend.repository.InterviewContextRepository;
import com.echomind.backend.repository.QuestionRepository;
import com.echomind.backend.repository.StreakRepository;
import com.echomind.backend.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final ReportService reportService;
    private final GeminiService geminiService;
    private final InterviewContextRepository contextRepository;
    private final MemoryEngineService memoryEngineService;
    private final ConsistencyAnalyzerService consistencyAnalyzerService;
    private final QuestionRepository questionRepository;
    private final StreakRepository streakRepository;
    private final RoleRepository roleRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();


    private static final List<String> ENGLISH_CURVEBALLS = List.of(
        "If you discovered a colleague with 10 years of tenure violating a minor company policy, would you report them or talk to them first?",
        "If you found a critical bug in production right before release but your manager told you to ignore it to meet the deadline, what would you do?",
        "Imagine you are given a project with an impossible deadline and zero budget. How do you negotiate with your stakeholders?",
        "If a client demands a feature that is highly unethical but extremely profitable, how do you handle the situation?",
        "Explain a time when you had to work with a teammate whose work style was completely opposite to yours."
    );

    private static final List<String> THAI_CURVEBALLS = List.of(
        "หากคุณพบว่าเพื่อนร่วมงานที่ทำงานมา 10 ปีละเมิดกฎเล็กๆ น้อยๆ ของบริษัท คุณจะรายงานต่อหัวหน้างานหรือพูดคุยกับเขาเป็นการส่วนตัวก่อน",
        "หากคุณพบข้อผิดพลาดร้ายแรง (critical bug) ในระบบจำลองก่อนขึ้นระบบจริง แต่หัวหน้างานสั่งให้ปล่อยผ่านไปก่อนเพื่อรักษาตารางเวลา คุณจะทำอย่างไร",
        "หากคุณได้รับมอบหมายงานที่มีกำหนดส่งที่เป็นไปไม่ได้เลยและไม่มีงบประมาณ คุณจะมีวิธีการเจรจากับผู้มีส่วนได้ส่วนเสียอย่างไร",
        "หากลูกค้าต้องการฟีเจอร์ที่ขัดต่อจรรยาบรรณวิชาชีพแต่สร้างกำไรมหาศาล คุณจะจัดการกับปัญหานี้อย่างไร",
        "ช่วยเล่าเหตุการณ์ที่คุณต้องร่วมงานกับเพื่อนร่วมทีมที่มีวิธีการทำงานตรงกันข้ามกับคุณอย่างสิ้นเชิงและวิธีการรับมือของคุณ"
    );

    public InterviewService(InterviewRepository interviewRepository, 
                            UserRepository userRepository, 
                            ReportService reportService, 
                            GeminiService geminiService, 
                            InterviewContextRepository contextRepository,
                            MemoryEngineService memoryEngineService,
                            ConsistencyAnalyzerService consistencyAnalyzerService,
                            QuestionRepository questionRepository,
                            StreakRepository streakRepository,
                            RoleRepository roleRepository) {
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.reportService = reportService;
        this.geminiService = geminiService;
        this.contextRepository = contextRepository;
        this.memoryEngineService = memoryEngineService;
        this.consistencyAnalyzerService = consistencyAnalyzerService;
        this.questionRepository = questionRepository;
        this.streakRepository = streakRepository;
        this.roleRepository = roleRepository;
    }

    public Interview startInterview(String email, String domain, String difficulty, String mode, String interviewerGender, String officeSetting, String language, Boolean practiceMode, List<String> customQuestions, String interviewerPersona) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Increment Role usageCount if exists
        try {
            java.util.Optional<Role> roleOpt = roleRepository.findById(domain);
            if (roleOpt.isPresent()) {
                Role r = roleOpt.get();
                r.setUsageCount(r.getUsageCount() != null ? r.getUsageCount() + 1 : 1);
                roleRepository.save(r);
            }
        } catch (Exception e) {
            System.err.println("Failed to increment role usageCount in startInterview: " + e.getMessage());
        }

        // Streak updating logic
        try {
            java.time.LocalDate today = java.time.LocalDate.now();
            Streak streak = streakRepository.findByUserId(user.getId())
                    .orElse(Streak.builder()
                            .userId(user.getId())
                            .currentStreak(0)
                            .lastActiveDate(today.minusDays(2))
                            .build());
            
            if (streak.getLastActiveDate().isBefore(today)) {
                if (streak.getLastActiveDate().equals(today.minusDays(1))) {
                    streak.setCurrentStreak(streak.getCurrentStreak() + 1);
                } else if (!streak.getLastActiveDate().equals(today)) {
                    streak.setCurrentStreak(1);
                }
                streak.setLastActiveDate(today);
                streakRepository.save(streak);
            }
        } catch (Exception e) {
            System.err.println("Failed to update user streak: " + e.getMessage());
        }

        Interview interview = Interview.builder()
                .userId(user.getId())
                .domain(domain)
                .difficulty(difficulty)
                .mode(mode != null ? mode : "basic")
                .interviewerGender(interviewerGender != null ? interviewerGender : "female")
                .officeSetting(officeSetting != null ? officeSetting : "modern_office")
                .language(language != null ? language : "en")
                .practiceMode(practiceMode != null ? practiceMode : false)
                .customQuestions(customQuestions)
                .interviewerPersona(interviewerPersona != null ? interviewerPersona : "Friendly HR")
                .date(LocalDateTime.now())
                .status("IN_PROGRESS")
                .duration(0)
                .build();

        return interviewRepository.save(interview);
    }

    public Interview submitInterview(String interviewId, Integer duration) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        if ("COMPLETED".equals(interview.getStatus())) {
            throw new RuntimeException("Interview is already completed.");
        }

        interview.setStatus("COMPLETED");
        interview.setDuration(duration);
        Interview savedInterview = interviewRepository.save(interview);

        // Generate Report
        reportService.generateReport(savedInterview);

        // Analyze Consistency
        List<InterviewMemory> memories = memoryEngineService.getInterviewMemories(interviewId);
        consistencyAnalyzerService.analyzeConsistency(interviewId, memories);

        return savedInterview;
    }

    public Interview getInterviewById(String id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
    }

    public List<Interview> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return interviewRepository.findByUserId(user.getId());
    }

    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    public String getNextQuestion(String interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
        
        List<InterviewContext> history = contextRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
        
        if (!history.isEmpty()) {
            InterviewContext lastContext = history.get(history.size() - 1);
            if (lastContext.getAnswer() == null || lastContext.getAnswer().trim().isEmpty()) {
                return lastContext.getQuestion();
            }
        }
        
        boolean isFollowUp = false;
        int followUpCount = 0;
        
        if ("MICRO".equalsIgnoreCase(interview.getSessionType())) {
            if (history.size() >= 5) {
                return "COMPLETED";
            }
        } else {
            if (!history.isEmpty()) {
                InterviewContext lastContext = history.get(history.size() - 1);
                if ("comprehensive".equalsIgnoreCase(interview.getMode())) {
                    boolean lastWasFollowUp = lastContext.getIsFollowUp() != null && lastContext.getIsFollowUp();
                    int lastFollowUpCount = lastContext.getFollowUpCount() != null ? lastContext.getFollowUpCount() : 0;
                    
                    double followUpProb = 0.5;
                    if (interview.getInterviewerPersona() != null) {
                        InterviewerPersonaPreset preset = PERSONAS.get(interview.getInterviewerPersona());
                        if (preset == null) {
                            preset = PERSONAS.values().stream()
                                    .filter(p -> p.getDisplayName().equalsIgnoreCase(interview.getInterviewerPersona()))
                                    .findFirst()
                                    .orElse(null);
                        }
                        if (preset != null) {
                            followUpProb = preset.getFollowUpProbability();
                        }
                    }

                    if (!lastWasFollowUp) {
                        isFollowUp = true;
                        followUpCount = 1;
                    } else if (lastFollowUpCount == 1) {
                        if (Math.random() < followUpProb) {
                            isFollowUp = true;
                            followUpCount = 2;
                        }
                    }
                }
            }
            
            long primaryCount = history.stream()
                    .filter(ctx -> ctx.getIsFollowUp() == null || !ctx.getIsFollowUp())
                    .count();
            
            if (!isFollowUp && primaryCount >= 5) {
                return "COMPLETED";
            }
        }
        
        // Determine current effective difficulty
        String currentDiff = interview.getDifficulty(); // Default base difficulty
        List<InterviewContext> answeredHistory = history.stream()
                .filter(ctx -> ctx.getAnswer() != null && !ctx.getAnswer().trim().isEmpty() && ctx.getScore() != null)
                .toList();

        if (!answeredHistory.isEmpty()) {
            String lastEffective = answeredHistory.get(answeredHistory.size() - 1).getEffectiveDifficulty();
            if (lastEffective != null) {
                currentDiff = lastEffective;
            }
            
            if (answeredHistory.size() >= 2) {
                InterviewContext last1 = answeredHistory.get(answeredHistory.size() - 1);
                InterviewContext last2 = answeredHistory.get(answeredHistory.size() - 2);
                
                int score1 = last1.getScore() != null ? last1.getScore() : 75;
                int score2 = last2.getScore() != null ? last2.getScore() : 75;
                
                if (score1 >= 80 && score2 >= 80) {
                    if ("Junior".equalsIgnoreCase(currentDiff)) {
                        currentDiff = "Mid";
                    } else if ("Mid".equalsIgnoreCase(currentDiff)) {
                        currentDiff = "Senior";
                    }
                } else if (score1 <= 55 && score2 <= 55) {
                    if ("Senior".equalsIgnoreCase(currentDiff)) {
                        currentDiff = "Mid";
                    } else if ("Mid".equalsIgnoreCase(currentDiff)) {
                        currentDiff = "Junior";
                    }
                }
            }
        }

        String targetDomain = interview.getDomain();
        try {
            java.util.Optional<Role> roleOpt = roleRepository.findById(interview.getDomain());
            if (roleOpt.isPresent()) {
                Role r = roleOpt.get();
                if (r.getQuestionThemes() != null && !r.getQuestionThemes().isEmpty()) {
                    targetDomain = r.getTitle() + " (focusing on topics: " + String.join(", ", r.getQuestionThemes()) + ")";
                } else {
                    targetDomain = r.getTitle();
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to resolve dynamic role description: " + e.getMessage());
        }

        String questionText;
        boolean isCurveball = false;

        if ("MICRO".equalsIgnoreCase(interview.getSessionType())) {
            List<String> customQs = interview.getCustomQuestions();
            if (customQs != null && history.size() < customQs.size()) {
                questionText = customQs.get(history.size());
            } else {
                questionText = "Can you explain a challenging technical project you worked on recently?";
            }
        } else if (history.size() == 2) {
            isCurveball = true;
            if ("th".equalsIgnoreCase(interview.getLanguage())) {
                int randIndex = (int) (Math.random() * THAI_CURVEBALLS.size());
                questionText = THAI_CURVEBALLS.get(randIndex);
                String suffix = "female".equalsIgnoreCase(interview.getInterviewerGender()) ? "ค่ะ" : "ครับ";
                if (!questionText.endsWith(suffix)) {
                    questionText += " " + suffix;
                }
            } else {
                int randIndex = (int) (Math.random() * ENGLISH_CURVEBALLS.size());
                questionText = ENGLISH_CURVEBALLS.get(randIndex);
            }
        } else if (isFollowUp) {
            questionText = geminiService.generateFollowUpQuestion(targetDomain, currentDiff, history, interview.getInterviewerPersona());
        } else {
            List<Question> bank = questionRepository.findByDomain(interview.getDomain());
            List<String> askedQuestions = history.stream().map(InterviewContext::getQuestion).toList();
            
            List<String> availableCustom = java.util.Collections.emptyList();
            if (interview.getCustomQuestions() != null) {
                availableCustom = interview.getCustomQuestions().stream()
                        .filter(q -> askedQuestions.stream().noneMatch(asked -> asked.contains(q) || q.contains(asked)))
                        .toList();
            }
            
            List<Question> available = bank.stream()
                    .filter(q -> askedQuestions.stream().noneMatch(asked -> asked.contains(q.getQuestionText()) || q.getQuestionText().contains(asked)))
                    .toList();
            
            if (!availableCustom.isEmpty()) {
                questionText = availableCustom.get(0);
            } else if (!available.isEmpty()) {
                int randIndex = (int) (Math.random() * available.size());
                questionText = available.get(randIndex).getQuestionText();
            } else {
                questionText = geminiService.generateFirstQuestion(targetDomain, currentDiff, interview.getInterviewerPersona());
            }
            
            if ("th".equalsIgnoreCase(interview.getLanguage())) {
                String genderSuffix = "female".equalsIgnoreCase(interview.getInterviewerGender()) ? "khâ" : "khráp";
                String translationPrompt = String.format(
                    "You are an expert interviewer with the following persona: %s.\n" +
                    "Translate/phrase this interview question into natural, polite Thai for a mock interview context.\n" +
                    "Question: %s\n" +
                    "Use gender-polite particles: End the question with '%s'.\n" +
                    "Apply the persona tone: Friendly HR should use supportive and warm phrasing; Technical Grillmaster should be direct, strict, and precise; Skeptical Panel should use formal and analytical phrasing.\n" +
                    "Return ONLY the Thai question text without any extra conversational filler.",
                    interview.getInterviewerPersona(), questionText, genderSuffix
                );
                try {
                    questionText = geminiService.callGeminiApi(translationPrompt);
                } catch (Exception e) {
                    System.err.println("Failed to translate question to Thai: " + e.getMessage());
                }
            }
        }
        
        List<String> expectedKeywords = geminiService.generateExpectedKeywords(questionText, interview.getLanguage());

        InterviewContext context = InterviewContext.builder()
                .interviewId(interviewId)
                .question(questionText)
                .sequenceNumber(history.size() + 1)
                .isFollowUp(isFollowUp)
                .followUpCount(followUpCount)
                .isCurveball(isCurveball)
                .effectiveDifficulty(currentDiff)
                .expectedKeywords(expectedKeywords)
                .build();
                
        contextRepository.save(context);
        return questionText;
    }

    public String submitAnswer(String interviewId, SubmitAnswerRequest request) {
        List<InterviewContext> history = contextRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
        if (history.isEmpty()) throw new RuntimeException("No active question to answer");
        
        InterviewContext currentContext = history.get(history.size() - 1);
        currentContext.setAnswer(request.getAnswerText());
        
        Interview interview = interviewRepository.findById(interviewId).orElseThrow();

        // Evaluate the answer and store feedback
        String feedback = geminiService.evaluateAnswer(
                currentContext.getQuestion(), 
                request.getAnswerText(), 
                interview.getLanguage(), 
                interview.getInterviewerGender(),
                currentContext.getEffectiveDifficulty() != null ? currentContext.getEffectiveDifficulty() : interview.getDifficulty(),
                interview.getInterviewerPersona(),
                request.getCoveredKeywords()
        );

        int overallScore = 75;
        String feedbackText = feedback;
        InterviewContext.ScoreBreakdown scoreBreakdown = null;

        try {
            com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(feedback);
            feedbackText = rootNode.path("feedback").asText(feedback);
            com.fasterxml.jackson.databind.JsonNode bdNode = rootNode.path("scoreBreakdown");
            
            int starScore = bdNode.path("starStructure").path("score").asInt(7);
            String starRationale = bdNode.path("starStructure").path("rationale").asText("Good structure.");
            
            int techScore = bdNode.path("technicalAccuracy").path("score").asInt(7);
            String techRationale = bdNode.path("technicalAccuracy").path("rationale").asText("Technical points are standard.");
            
            int commScore = bdNode.path("communicationClarity").path("score").asInt(7);
            String commRationale = bdNode.path("communicationClarity").path("rationale").asText("Explanation is clear.");
            
            int confScore = bdNode.path("confidenceDelivery").path("score").asInt(7);
            String confRationale = bdNode.path("confidenceDelivery").path("rationale").asText("Delivery pacing is acceptable.");

            double weightedScore = (starScore * 0.3 + techScore * 0.3 + commScore * 0.2 + confScore * 0.2) * 10;
            overallScore = (int) Math.round(weightedScore);

            scoreBreakdown = InterviewContext.ScoreBreakdown.builder()
                .starStructure(InterviewContext.SubScore.builder().score(starScore * 10).weight(0.3).rationale(starRationale).build())
                .technicalAccuracy(InterviewContext.SubScore.builder().score(techScore * 10).weight(0.3).rationale(techRationale).build())
                .communicationClarity(InterviewContext.SubScore.builder().score(commScore * 10).weight(0.2).rationale(commRationale).build())
                .confidenceDelivery(InterviewContext.SubScore.builder().score(confScore * 10).weight(0.2).rationale(confRationale).build())
                .build();

        } catch (Exception e) {
            System.err.println("Error parsing evaluation JSON from Gemini: " + e.getMessage());
            // Safe fallback parsing for legacy "SCORE: X\nFEEDBACK: Y" if Gemini output was in old format:
            if (feedback != null && feedback.contains("SCORE:") && feedback.contains("FEEDBACK:")) {
                try {
                    int scoreIdx = feedback.indexOf("SCORE:");
                    int feedbackIdx = feedback.indexOf("FEEDBACK:");
                    if (scoreIdx < feedbackIdx) {
                        String scoreStr = feedback.substring(scoreIdx + 6, feedbackIdx).trim();
                        overallScore = Integer.parseInt(scoreStr.replaceAll("[^0-9]", ""));
                        feedbackText = feedback.substring(feedbackIdx + 9).trim();
                    } else {
                        String scoreStr = feedback.substring(scoreIdx + 6).trim();
                        overallScore = Integer.parseInt(scoreStr.replaceAll("[^0-9]", ""));
                        feedbackText = feedback.substring(feedbackIdx + 9, scoreIdx).trim();
                    }
                } catch (Exception ex) {
                    System.err.println("Failed to parse legacy format: " + ex.getMessage());
                }
            }
            // Populate a default breakdown so the UI has valid fields
            scoreBreakdown = InterviewContext.ScoreBreakdown.builder()
                .starStructure(InterviewContext.SubScore.builder().score(overallScore).weight(0.3).rationale("Acceptable response structure.").build())
                .technicalAccuracy(InterviewContext.SubScore.builder().score(overallScore).weight(0.3).rationale("Response matches basic domain concepts.").build())
                .communicationClarity(InterviewContext.SubScore.builder().score(overallScore).weight(0.2).rationale("Clear delivery and articulation.").build())
                .confidenceDelivery(InterviewContext.SubScore.builder().score(overallScore).weight(0.2).rationale("Stable pace and tone.").build())
                .build();
        }

        currentContext.setFeedback(feedbackText);
        currentContext.setScore(overallScore);
        currentContext.setScoreBreakdown(scoreBreakdown);
        currentContext.setSilenceSeconds(request.getSilenceSeconds());
        currentContext.setGazeAwayEvents(request.getGazeAwayEvents());
        currentContext.setCoveredKeywords(request.getCoveredKeywords());
        currentContext.setDeliveryScore(request.getDeliveryScore());
        currentContext.setWpm(request.getWpm());
        currentContext.setPauseCount(request.getPauseCount());
        currentContext.setInterrupted(request.getInterrupted());
        currentContext.setIsCurveball(request.getIsCurveball());
        
        contextRepository.save(currentContext);

        memoryEngineService.storeMemory(
                interviewId,
                currentContext.getQuestion(),
                request.getAnswerText(),
                interview.getDomain(),
                currentContext.getSequenceNumber()
        );
        
        return feedbackText;
    }

    public List<InterviewContext> getInterviewContexts(String interviewId) {
        return contextRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
    }

    public java.util.Map<String, Object> analyzeResume(String resumeText) {
        String prompt = String.format(
            "You are an expert career consultant and technical interviewer.\n" +
            "Analyze the following candidate resume or job description text and output a JSON response containing:\n" +
            "1. 'suggestedDomain': Must be exactly one of: 'Software Engineer', 'UI/UX Designer', or 'Game Developer' (choose the closest matching one based on keywords and experience).\n" +
            "2. 'tailoredQuestions': A list of exactly 3 tailored technical or role-specific questions (maximum 30 words per question) that test the candidate on the skills highlighted in their resume.\n\n" +
            "Resume / Job Description Text:\n%s\n\n" +
            "Output ONLY the JSON object. Do not include markdown formatting, backticks like ```json, or any extra text.",
            resumeText
        );
        
        try {
            String rawJson = geminiService.callGeminiApi(prompt);
            
            // Clean markdown wrap if any
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            
            // Parse JSON using ObjectMapper
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(rawJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
        } catch (Exception e) {
            System.err.println("Failed to analyze resume with Gemini: " + e.getMessage());
            // Fallback response
            return java.util.Map.of(
                "suggestedDomain", "Software Engineer",
                "tailoredQuestions", List.of(
                    "Based on your profile, explain your experience with system optimization and debugging.",
                    "How do you handle technical debt and code review processes in your projects?",
                    "Describe a time you solved a challenging technical issue in your previous work."
                )
            );
        }
    }

    public String triggerInterruption(String interviewId, String partialAnswer) {
        List<InterviewContext> history = contextRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
        if (history.isEmpty()) throw new RuntimeException("No active question to interrupt");
        
        InterviewContext currentContext = history.get(history.size() - 1);
        currentContext.setAnswer(partialAnswer);
        currentContext.setInterrupted(true);
        currentContext.setScore(45);
        currentContext.setFeedback("Interrupted mid-sentence. Challenged with pushback question.");
        contextRepository.save(currentContext);
        
        Interview interview = interviewRepository.findById(interviewId).orElseThrow();
        
        String pushbackText = geminiService.generateInterruptionPushback(
            currentContext.getQuestion(),
            partialAnswer,
            interview.getLanguage(),
            interview.getInterviewerPersona()
        );
        
        InterviewContext pushbackContext = InterviewContext.builder()
                .interviewId(interviewId)
                .question(pushbackText)
                .sequenceNumber(history.size() + 1)
                .isFollowUp(true)
                .followUpCount((currentContext.getFollowUpCount() != null ? currentContext.getFollowUpCount() : 0) + 1)
                .effectiveDifficulty(currentContext.getEffectiveDifficulty() != null ? currentContext.getEffectiveDifficulty() : interview.getDifficulty())
                .expectedKeywords(geminiService.generateExpectedKeywords(pushbackText, interview.getLanguage()))
                .build();
                
        contextRepository.save(pushbackContext);
        
        return pushbackText;
    }

    public String generateAnswerRewrite(String question, String answer, String language) {
        return geminiService.generateAnswerRewrite(question, answer, language);
    }

    public List<String> getUserWeakestCompetencies(String userId, int limit) {
        List<Interview> userInterviews = interviewRepository.findByUserId(userId);
        if (userInterviews.isEmpty()) {
            return Arrays.asList("technicalAccuracy", "starStructure");
        }

        double starSum = 0; int starCount = 0;
        double techSum = 0; int techCount = 0;
        double commSum = 0; int commCount = 0;
        double confSum = 0; int confCount = 0;

        for (Interview interview : userInterviews) {
            List<InterviewContext> contexts = contextRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
            for (InterviewContext ctx : contexts) {
                InterviewContext.ScoreBreakdown breakdown = ctx.getScoreBreakdown();
                if (breakdown != null) {
                    if (breakdown.getStarStructure() != null && breakdown.getStarStructure().getScore() != null) {
                        starSum += breakdown.getStarStructure().getScore();
                        starCount++;
                    }
                    if (breakdown.getTechnicalAccuracy() != null && breakdown.getTechnicalAccuracy().getScore() != null) {
                        techSum += breakdown.getTechnicalAccuracy().getScore();
                        techCount++;
                    }
                    if (breakdown.getCommunicationClarity() != null && breakdown.getCommunicationClarity().getScore() != null) {
                        commSum += breakdown.getCommunicationClarity().getScore();
                        commCount++;
                    }
                    if (breakdown.getConfidenceDelivery() != null && breakdown.getConfidenceDelivery().getScore() != null) {
                        confSum += breakdown.getConfidenceDelivery().getScore();
                        confCount++;
                    }
                }
            }
        }

        Map<String, Double> averages = new HashMap<>();
        averages.put("starStructure", starCount > 0 ? (starSum / starCount) : 75.0);
        averages.put("technicalAccuracy", techCount > 0 ? (techSum / techCount) : 75.0);
        averages.put("communicationClarity", commCount > 0 ? (commSum / commCount) : 75.0);
        averages.put("confidenceDelivery", confCount > 0 ? (confSum / confCount) : 75.0);

        return averages.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .limit(limit)
                .map(Map.Entry::getKey)
                .toList();
    }

    public Interview startMicroSession(String email, String domain) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> weakComp = getUserWeakestCompetencies(user.getId(), 2);

        List<Question> bank = questionRepository.findByDomain(domain);
        
        List<Question> filtered = bank.stream()
                .filter(q -> q.getCompetencyTags() != null && q.getCompetencyTags().stream().anyMatch(weakComp::contains))
                .toList();

        List<Question> selected = new ArrayList<>(filtered);
        
        if (selected.size() < 5) {
            List<Question> remaining = bank.stream()
                    .filter(q -> !selected.contains(q))
                    .toList();
            selected.addAll(remaining);
        }

        Collections.shuffle(selected);
        List<String> microQuestions = selected.stream()
                .limit(5)
                .map(Question::getQuestionText)
                .toList();

        if (microQuestions.isEmpty()) {
            microQuestions = Arrays.asList(
                "Can you explain a challenging technical problem you solved recently?",
                "How do you ensure code quality and handle peer reviews in your team?",
                "What is your approach to learning new technologies quickly?",
                "Describe a situation where you had to work with tight deadlines and high pressure.",
                "How do you balance structural design perfection with shipping velocity?"
            );
        }

        Interview interview = Interview.builder()
                .userId(user.getId())
                .domain(domain)
                .difficulty("Medium")
                .mode("basic")
                .interviewerGender("female")
                .officeSetting("modern_office")
                .language("en")
                .practiceMode(true)
                .customQuestions(microQuestions)
                .interviewerPersona("SUPPORTIVE_COACH")
                .date(LocalDateTime.now())
                .status("IN_PROGRESS")
                .duration(0)
                .sessionType("MICRO")
                .targetedCompetencies(weakComp)
                .build();

        return interviewRepository.save(interview);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewerPersonaPreset {
        private String id;
        private String displayName;
        private String description;
        private double followUpProbability;
        private String iconKey;
        private String systemPromptFragment;
    }

    public static final Map<String, InterviewerPersonaPreset> PERSONAS = Map.of(
        "STRICT_BAR_RAISER", InterviewerPersonaPreset.builder()
                .id("STRICT_BAR_RAISER")
                .displayName("Strict Bar Raiser")
                .description("Demanding, critical, focused on high standards and behavior validation. Expects deep explanations.")
                .followUpProbability(0.7)
                .iconKey("bar_raiser_icon")
                .systemPromptFragment("You are a strict Amazon Bar-Raiser interviewer. Keep your tone demanding, critical, and objective. Push back whenever an answer lacks measurable depth or STAR structure.")
                .build(),
        "FRIENDLY_STARTUP_FOUNDER", InterviewerPersonaPreset.builder()
                .id("FRIENDLY_STARTUP_FOUNDER")
                .displayName("Friendly Startup Founder")
                .description("Empathetic, collaborative, growth-focused, and highly conversational.")
                .followUpProbability(0.3)
                .iconKey("founder_icon")
                .systemPromptFragment("You are a friendly startup founder. Keep your tone collaborative, vision-oriented, positive, and conversational. Ask about agility and passion.")
                .build(),
        "RAPID_FIRE_TECHNICAL", InterviewerPersonaPreset.builder()
                .id("RAPID_FIRE_TECHNICAL")
                .displayName("Rapid-Fire Technical Grinder")
                .description("Fast-paced technical validator, focusing on precise details, optimizations, and syntax.")
                .followUpProbability(0.6)
                .iconKey("grinder_icon")
                .systemPromptFragment("You are a rapid-fire technical interviewer. Keep your tone precise, direct, and swift. Focus purely on technical accuracy, optimizations, and deep concept definitions.")
                .build(),
        "SUPPORTIVE_COACH", InterviewerPersonaPreset.builder()
                .id("SUPPORTIVE_COACH")
                .displayName("Supportive Coach")
                .description("Patient, instructional, warm, and highly encouraging.")
                .followUpProbability(0.2)
                .iconKey("coach_icon")
                .systemPromptFragment("You are a supportive and warm career coach. Keep your tone encouraging, constructive, helpful, and highly positive. Nudge the candidate gently.")
                .build()
    );

    public List<String> getUserWeakestCompetenciesByEmail(String email, int limit) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return getUserWeakestCompetencies(user.getId(), limit);
    }
}
