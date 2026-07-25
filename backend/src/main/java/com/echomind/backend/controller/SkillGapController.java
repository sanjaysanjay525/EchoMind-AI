package com.echomind.backend.controller;

import com.echomind.backend.model.Interview;
import com.echomind.backend.model.Report;
import com.echomind.backend.repository.InterviewRepository;
import com.echomind.backend.service.GeminiService;
import com.echomind.backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class SkillGapController {

    private final ReportService reportService;
    private final InterviewRepository interviewRepository;
    private final GeminiService geminiService;

    public SkillGapController(ReportService reportService,
                              InterviewRepository interviewRepository,
                              GeminiService geminiService) {
        this.reportService = reportService;
        this.interviewRepository = interviewRepository;
        this.geminiService = geminiService;
    }

    @GetMapping("/skill-gap/{interviewId}")
    public ResponseEntity<?> getSkillGap(@PathVariable String interviewId) {
        // 1. Get report for interviewId
        Optional<Report> reportOpt = reportService.getReportByInterviewId(interviewId);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Report report = reportOpt.get();

        // 2. Get interview to find domain
        Optional<Interview> interviewOpt = interviewRepository.findById(interviewId);
        String domain = interviewOpt.map(Interview::getDomain).orElse("General");
        int overallScore = report.getOverallScore() != null ? report.getOverallScore() : 0;

        // 3. Build Gemini prompt
        String prompt = String.format(
            "Analyze this mock interview for a %s role. Overall score: %d. " +
            "Generate a JSON skill gap analysis with: " +
            "weakAreas (array of {skill, score 0-100, recommendation}), " +
            "strongAreas (array of strings), " +
            "nextSteps (array of 3-5 actionable strings), " +
            "resources (array of {title, url, type: youtube/docs/article}). " +
            "Return ONLY valid JSON, no markdown.",
            domain, overallScore
        );

        // 4. Call Gemini
        try {
            String analysis = geminiService.callGeminiApi(prompt);
            return ResponseEntity.ok(Map.of(
                "analysis", analysis,
                "domain", domain,
                "overallScore", overallScore
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "analysis", "{}",
                "domain", domain,
                "overallScore", overallScore,
                "error", "Analysis service temporarily unavailable."
            ));
        }
    }
}
