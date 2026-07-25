package com.echomind.backend.service;

import com.echomind.backend.model.*;
import com.echomind.backend.repository.ReportRepository;
import com.echomind.backend.repository.StreakRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final com.echomind.backend.repository.InterviewContextRepository contextRepository;
    private final GeminiService geminiService;
    private final StreakRepository streakRepository;

    public ReportService(ReportRepository reportRepository, 
                         com.echomind.backend.repository.InterviewContextRepository contextRepository,
                         GeminiService geminiService,
                         StreakRepository streakRepository) {
        this.reportRepository = reportRepository;
        this.contextRepository = contextRepository;
        this.geminiService = geminiService;
        this.streakRepository = streakRepository;
    }

    public Report generateReport(Interview interview) {
        List<InterviewContext> answers = contextRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        int technicalScore = calculateTechnicalScore(answers);
        int communicationScore = calculateCommunicationScore(answers);
        int overallScore = (technicalScore + communicationScore) / 2;

        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        populateFeedback(interview.getDomain(), overallScore, strengths, weaknesses, suggestions);

        // Generate Study Plan if score is under 85
        String studyPlan = null;
        if (overallScore < 85) {
            studyPlan = generateStudyPlan(answers, interview.getDomain(), interview.getLanguage());
        }

        // Award Badges
        List<String> unlockedBadges = new ArrayList<>();
        if ("Senior".equalsIgnoreCase(interview.getDifficulty()) && overallScore >= 80) {
            unlockedBadges.add("Ace Candidate");
        }

        boolean hasPauses = false;
        int totalDeliveryScore = 0;
        int count = 0;
        for (InterviewContext ctx : answers) {
            if (ctx.getPauseCount() != null && ctx.getPauseCount() > 0) {
                hasPauses = true;
            }
            if (ctx.getDeliveryScore() != null) {
                totalDeliveryScore += ctx.getDeliveryScore();
                count++;
            }
        }
        int avgDelivery = count > 0 ? (totalDeliveryScore / count) : 0;
        if (!hasPauses && avgDelivery >= 80) {
            unlockedBadges.add("Smooth Talker");
        }

        try {
            streakRepository.findByUserId(interview.getUserId()).ifPresent(s -> {
                if (s.getCurrentStreak() >= 3) {
                    unlockedBadges.add("Dedicated Candidate");
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to fetch streak for badges: " + e.getMessage());
        }

        Report report = Report.builder()
                .interviewId(interview.getId())
                .technicalScore(technicalScore)
                .communicationScore(communicationScore)
                .overallScore(overallScore)
                .strengths(strengths)
                .weaknesses(weaknesses)
                .suggestions(suggestions)
                .studyPlan(studyPlan)
                .unlockedBadges(unlockedBadges)
                .build();

        return reportRepository.save(report);
    }

    public Optional<Report> getReportByInterviewId(String interviewId) {
        return reportRepository.findByInterviewId(interviewId);
    }

    private int calculateTechnicalScore(List<InterviewContext> answers) {
        int base = 70;
        int answersCount = 0;
        int longAnswersCount = 0;
        int keywordMatches = 0;

        List<String> techKeywords = Arrays.asList(
                "class", "object", "complexity", "dependency", "injection", "sql", "nosql", "database", "pattern",
                "dom", "react", "rest", "api", "state", "cors", "jwt", "token", "session",
                "supervised", "unsupervised", "overfitting", "confusion", "precision", "recall", "tree", "regularization",
                "join", "data", "cleaning", "eda", "exploratory", "missing",
                "star", "leadership", "goal", "conflict", "career", "company", "team"
        );

        for (InterviewContext ansObj : answers) {
            if (ansObj.getAnswer() != null) {
                String ans = ansObj.getAnswer().toLowerCase();
                if (!ans.trim().isEmpty()) {
                    answersCount++;
                    if (ans.length() > 100) {
                        longAnswersCount++;
                    }
                    for (String kw : techKeywords) {
                        if (ans.contains(kw)) {
                            keywordMatches++;
                        }
                    }
                }
            }
        }

        int score = base + (answersCount * 3) + (longAnswersCount * 2) + Math.min(keywordMatches * 1, 10);
        return Math.min(score, 98);
    }

    private int calculateCommunicationScore(List<InterviewContext> answers) {
        int base = 65;
        int answersCount = 0;
        int longAnswersCount = 0;

        for (InterviewContext ansObj : answers) {
            if (ansObj.getAnswer() != null) {
                String ans = ansObj.getAnswer().trim();
                if (!ans.isEmpty()) {
                    answersCount++;
                    if (ans.split("\\s+").length > 25) {
                        longAnswersCount++;
                    }
                }
            }
        }

        int score = base + (answersCount * 4) + (longAnswersCount * 3);
        return Math.min(score, 95);
    }

    private void populateFeedback(String domain, int score, List<String> strengths, List<String> weaknesses, List<String> suggestions) {
        switch (domain) {
            case "Software Engineer":
                strengths.add("Good understanding of core object-oriented programming concepts.");
                strengths.add("Able to explain complexity, threads, and concurrency trade-offs clearly.");
                if (score > 85) strengths.add("Strong explanation of memory management and garbage collection.");
                
                weaknesses.add("Could explain deadlock prevention mechanisms in deeper detail.");
                weaknesses.add("Hash tables collision handling logic could be structured more clearly.");
                
                suggestions.add("Practice explaining database indexing and query optimization structures.");
                suggestions.add("Review advanced multi-threading synchronization patterns.");
                break;
 
            case "UI/UX Designer":
                strengths.add("Solid understanding of user-centered design principles and usability testing.");
                strengths.add("Exhibited strong competency using industry standard tools like Figma.");
                if (score > 85) strengths.add("Strong designer-to-developer handoff methodologies.");
                
                weaknesses.add("Could explain the difference between wireframes, mockups, and interactive prototypes in more depth.");
                weaknesses.add("A/B testing criteria could be explained with clearer metric indicators.");
                
                suggestions.add("Create high-fidelity design systems with reusable components.");
                suggestions.add("Practice conducting usability studies and documenting user persona mapping.");
                break;
 
            case "Game Developer":
                strengths.add("Solid understanding of the game loop lifecycle and rendering updates.");
                strengths.add("Demonstrated knowledge of entity component system (ECS) architectures.");
                if (score > 85) strengths.add("Strong awareness of performance optimization and level streaming.");
                
                weaknesses.add("Could explain physics integration and collision detection boundaries in more detail.");
                weaknesses.add("Torso/torquing mechanics or math behind rendering offsets were omitted.");
                
                suggestions.add("Practice profiling frame rates and diagnosing draw calls in Unreal or Unity.");
                suggestions.add("Review spatial partitioning structures like octrees and quadtrees.");
                break;
 
            default:
                strengths.add("Demonstrated baseline domain knowledge.");
                weaknesses.add("Answers could be more detailed and structured.");
                suggestions.add("Focus on practicing responses under timed constraints.");
        }
    }

    public String generateStudyPlan(List<InterviewContext> contexts, String domain, String language) {
        StringBuilder answerLogs = new StringBuilder();
        for (InterviewContext ctx : contexts) {
            answerLogs.append(String.format("Q: %s\nScore: %d\nFeedback: %s\n\n", ctx.getQuestion(), ctx.getScore() != null ? ctx.getScore() : 70, ctx.getFeedback()));
        }

        String prompt = String.format(
            "You are a Senior Technical Coach.\n" +
            "Based on the candidate's performance in a mock interview for the '%s' domain, formulate a highly tailored 2-3 day spaced study plan targeting their weakest topics.\n" +
            "Interview Question Logs:\n%s\n\n" +
            "Formulate the response in clear Markdown with days headers (e.g. ## Day 1). Focus strictly on resources, revision tasks, and practice exercises. Maximum 150 words total.\n" +
            "Do not add introductory or meta remarks.",
            domain, answerLogs.toString()
        );

        if ("th".equalsIgnoreCase(language)) {
            prompt += "\nPlease write the response in polite Thai language.";
        }

        try {
            return geminiService.callGeminiApi(prompt);
        } catch (Exception e) {
            System.err.println("Failed to generate study plan: " + e.getMessage());
            return "Study plan service is currently warming up. Check back shortly!";
        }
    }
}
