package com.echomind.backend.controller;

import com.echomind.backend.model.Interview;
import com.echomind.backend.model.Report;
import com.echomind.backend.model.User;
import com.echomind.backend.repository.InterviewRepository;
import com.echomind.backend.repository.UserRepository;
import com.echomind.backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class LeaderboardController {

    private final UserRepository userRepository;
    private final InterviewRepository interviewRepository;
    private final ReportService reportService;

    public LeaderboardController(UserRepository userRepository,
                                 InterviewRepository interviewRepository,
                                 ReportService reportService) {
        this.userRepository = userRepository;
        this.interviewRepository = interviewRepository;
        this.reportService = reportService;
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        // Get all candidates
        List<User> candidates = userRepository.findAll().stream()
                .filter(u -> "ROLE_CANDIDATE".equals(u.getRole()))
                .collect(Collectors.toList());

        List<Map<String, Object>> entries = new ArrayList<>();

        for (User user : candidates) {
            // Get all interviews for this user
            List<Interview> interviews = interviewRepository.findByUserId(user.getId());

            // Filter completed interviews
            List<Interview> completed = interviews.stream()
                    .filter(i -> "COMPLETED".equalsIgnoreCase(i.getStatus()))
                    .collect(Collectors.toList());

            if (completed.isEmpty()) continue;

            // Get report scores
            List<Integer> scores = new ArrayList<>();
            for (Interview interview : completed) {
                Optional<Report> report = reportService.getReportByInterviewId(interview.getId());
                report.map(Report::getOverallScore).ifPresent(scores::add);
            }

            if (scores.isEmpty()) continue;

            double avgScore = scores.stream().mapToInt(Integer::intValue).average().orElse(0.0);

            Map<String, Object> entry = new HashMap<>();
            entry.put("name", user.getName() != null ? user.getName() : "Anonymous");
            entry.put("emailMasked", maskEmail(user.getEmail()));
            entry.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
            entry.put("totalInterviews", completed.size());
            entry.put("badge", getBadge(avgScore));
            entries.add(entry);
        }

        // Sort by avgScore descending, take top 20
        entries.sort((a, b) -> Double.compare((Double) b.get("avgScore"), (Double) a.get("avgScore")));
        List<Map<String, Object>> top20 = entries.stream().limit(20).collect(Collectors.toList());

        // Assign ranks
        for (int i = 0; i < top20.size(); i++) {
            top20.get(i).put("rank", i + 1);
        }

        return ResponseEntity.ok(top20);
    }

    private String maskEmail(String email) {
        if (email == null || email.length() < 4) return "***";
        int atIndex = email.indexOf('@');
        if (atIndex < 3) return email.substring(0, atIndex) + "***@" + email.substring(atIndex + 1);
        String domain = email.substring(atIndex + 1);
        return email.substring(0, 3) + "***@" + domain;
    }

    private String getBadge(double avgScore) {
        if (avgScore >= 90) return "Elite";
        if (avgScore >= 80) return "Expert";
        if (avgScore >= 70) return "Advanced";
        if (avgScore >= 60) return "Proficient";
        return "Beginner";
    }
}
