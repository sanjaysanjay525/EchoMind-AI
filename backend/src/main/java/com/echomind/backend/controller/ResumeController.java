package com.echomind.backend.controller;

import com.echomind.backend.service.ResumeParsingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeParsingService resumeParsingService;

    @PostMapping("/resumes/parse")
    public ResponseEntity<?> parseResume(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty.");
            }
            List<String> keywords = resumeParsingService.parseAndExtractKeywords(file);
            return ResponseEntity.ok(Map.of("keywords", keywords));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resumes/analyze")
    public ResponseEntity<?> analyzeResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("desiredRole") String desiredRole,
            @RequestParam(value = "jobDescription", required = false) String jobDescription) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty.");
            }
            Map<String, Object> analysis = resumeParsingService.analyzeResume(file, desiredRole, jobDescription);
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resumes/parse-structured")
    public ResponseEntity<?> parseStructuredResume(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty.");
            }
            Map<String, Object> structured = resumeParsingService.parseStructured(file);
            return ResponseEntity.ok(structured);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resumes/parse-profile")
    public ResponseEntity<?> parseResumeProfile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty.");
            }
            com.echomind.backend.model.ResumeProfile profile = resumeParsingService.extractResumeProfile(file);
            if (profile == null) {
                return ResponseEntity.badRequest().body("Failed to extract resume profile.");
            }
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
