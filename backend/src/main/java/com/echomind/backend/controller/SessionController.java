package com.echomind.backend.controller;

import com.echomind.backend.model.InterviewSession;
import com.echomind.backend.model.ResumeProfile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.echomind.backend.model.RoundConfig;
import com.echomind.backend.repository.RoundConfigRepository;
import com.echomind.backend.service.SessionService;
import com.echomind.backend.service.FinalReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final RoundConfigRepository roundConfigRepository;
    private final FinalReportService finalReportService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/sessions/start")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> startSession(@RequestBody Map<String, Object> payload) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            String careerPath = (String) payload.get("careerPath");
            String personaId = (String) payload.get("personaId");
            List<String> enabledRounds = (List<String>) payload.get("enabledRounds");
            Integer durationMinutes = (Integer) payload.get("durationMinutes");
            Boolean audioEnabled = (Boolean) payload.get("audioEnabled");
            Boolean videoEnabled = (Boolean) payload.get("videoEnabled");
            List<String> resumeKeywords = (List<String>) payload.get("resumeKeywords");
            String difficultyLevel = (String) payload.get("difficultyLevel");
            String codingLanguage = (String) payload.get("codingLanguage");

            ResumeProfile resumeProfile = null;
            if (payload.containsKey("resumeProfile") && payload.get("resumeProfile") != null) {
                resumeProfile = objectMapper.convertValue(payload.get("resumeProfile"), ResumeProfile.class);
            }

            InterviewSession session = sessionService.startSession(
                email, careerPath, personaId, 
                enabledRounds, durationMinutes, 
                audioEnabled, videoEnabled, resumeKeywords,
                difficultyLevel, codingLanguage, resumeProfile
            );
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/sessions/{sessionId}/round/current")
    public ResponseEntity<?> getCurrentRound(@PathVariable String sessionId) {
        try {
            InterviewSession session = sessionService.getSession(sessionId);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/sessions/{sessionId}/round/{roundType}/start")
    public ResponseEntity<?> startRound(@PathVariable String sessionId, @PathVariable String roundType) {
        try {
            Map<String, Object> roundData = sessionService.startRound(sessionId, roundType);
            return ResponseEntity.ok(roundData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/sessions/{sessionId}/round/aptitude/submit")
    public ResponseEntity<?> submitAptitude(@PathVariable String sessionId, @RequestBody List<Map<String, Object>> submissions) {
        try {
            Map<String, Object> result = sessionService.submitAptitude(sessionId, submissions);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/sessions/{sessionId}/round/communication/submit")
    public ResponseEntity<?> submitCommunication(@PathVariable String sessionId, @RequestBody Map<String, Object> payload) {
        try {
            List<Map<String, Object>> submissions = (List<Map<String, Object>>) payload.get("submissions");
            Map<String, Object> engagementMetrics = (Map<String, Object>) payload.get("engagementMetrics");
            Map<String, Object> result = sessionService.submitCommunication(sessionId, submissions, engagementMetrics);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/sessions/{sessionId}/round/coding/submit")
    public ResponseEntity<?> submitCoding(@PathVariable String sessionId, @RequestBody Map<String, String> payload) {
        try {
            String code = payload.get("code");
            String language = payload.get("language");
            Map<String, Object> result = sessionService.submitCoding(sessionId, code, language);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/sessions/{sessionId}/round/advanced/submit")
    public ResponseEntity<?> submitAdvanced(@PathVariable String sessionId, @RequestBody Map<String, String> payload) {
        try {
            String notes = payload.get("notes");
            String language = payload.get("language");
            String whiteboardBase64 = payload.get("whiteboardBase64");
            Map<String, Object> result = sessionService.submitAdvanced(sessionId, notes, language, whiteboardBase64);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/sessions/{sessionId}/report")
    public ResponseEntity<?> getReport(@PathVariable String sessionId) {
        try {
            Map<String, Object> report = sessionService.getConsolidatedReport(sessionId);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/sessions/{sessionId}/report/download")
    public ResponseEntity<?> downloadConsolidatedReport(@PathVariable String sessionId) {
        try {
            Map<String, Object> reportData = sessionService.getConsolidatedReport(sessionId);
            byte[] pdfBytes = finalReportService.generateConsolidatedPdfBytes(reportData);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Consolidated_Report_" + sessionId + ".pdf\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error generating PDF: " + e.getMessage());
        }
    }

    // Admin endpoints for RoundConfig
    @GetMapping("/admin/configs")
    public ResponseEntity<List<RoundConfig>> getAllConfigs() {
        return ResponseEntity.ok(roundConfigRepository.findAll());
    }

    @PostMapping("/admin/configs")
    public ResponseEntity<RoundConfig> saveConfig(@RequestBody RoundConfig config) {
        return ResponseEntity.ok(roundConfigRepository.save(config));
    }
}
