package com.echomind.backend.controller;

import com.echomind.backend.dto.AnalyticsResponse;
import com.echomind.backend.model.Interview;
import com.echomind.backend.model.Report;
import com.echomind.backend.model.User;
import com.echomind.backend.service.InterviewService;
import com.echomind.backend.service.ReportService;
import com.echomind.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;
    private final InterviewService interviewService;

    public ReportController(ReportService reportService, UserService userService, InterviewService interviewService) {
        this.reportService = reportService;
        this.userService = userService;
        this.interviewService = interviewService;
    }

    @GetMapping("/reports/interview/{interviewId}")
    public ResponseEntity<?> getReportByInterviewId(@PathVariable String interviewId) {
        return reportService.getReportByInterviewId(interviewId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/analytics")
    public ResponseEntity<AnalyticsResponse> getPlatformAnalytics() {
        List<User> users = userService.getAllUsers();
        List<Interview> interviews = interviewService.getAllInterviews();

        long totalUsers = users.stream().filter(u -> "ROLE_CANDIDATE".equals(u.getRole())).count();
        long totalInterviews = interviews.size();

        Map<String, Long> domainDistribution = new HashMap<>();
        double totalScoreSum = 0;
        long reportsCount = 0;

        for (Interview interview : interviews) {
            domainDistribution.put(interview.getDomain(), domainDistribution.getOrDefault(interview.getDomain(), 0L) + 1);
            var reportOpt = reportService.getReportByInterviewId(interview.getId());
            if (reportOpt.isPresent()) {
                totalScoreSum += reportOpt.get().getOverallScore();
                reportsCount++;
            }
        }

        double averageScore = reportsCount > 0 ? (totalScoreSum / reportsCount) : 0.0;

        AnalyticsResponse response = AnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .totalInterviews(totalInterviews)
                .averageScore(Math.round(averageScore * 10.0) / 10.0) // round to 1 decimal place
                .domainDistribution(domainDistribution)
                .build();

        return ResponseEntity.ok(response);
    }
}
