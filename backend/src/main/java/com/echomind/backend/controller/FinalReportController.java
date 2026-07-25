package com.echomind.backend.controller;

import com.echomind.backend.model.FinalReport;
import com.echomind.backend.service.FinalReportService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/report")
public class FinalReportController {

    private final FinalReportService finalReportService;

    public FinalReportController(FinalReportService finalReportService) {
        this.finalReportService = finalReportService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateReport(@RequestBody Map<String, String> payload) {
        String interviewId = payload.get("interviewId");
        if (interviewId == null) {
            return ResponseEntity.badRequest().body("interviewId is required");
        }
        try {
            FinalReport report = finalReportService.generateReport(interviewId);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error generating report: " + e.getMessage());
        }
    }

    @GetMapping("/{interviewId}")
    public ResponseEntity<?> getReport(@PathVariable String interviewId) {
        Optional<FinalReport> reportOpt = finalReportService.getReportByInterviewId(interviewId);
        if (reportOpt.isPresent()) {
            return ResponseEntity.ok(reportOpt.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/download/{interviewId}")
    public ResponseEntity<?> downloadReport(@PathVariable String interviewId) {
        Optional<FinalReport> reportOpt = finalReportService.getReportByInterviewId(interviewId);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        FinalReport report = reportOpt.get();
        if (report.getPdfPath() == null || report.getPdfPath().isEmpty()) {
            return ResponseEntity.badRequest().body("PDF not generated yet for this report.");
        }

        try {
            Path filePath = Paths.get(report.getPdfPath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error reading file: " + e.getMessage());
        }
    }
}
