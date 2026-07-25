package com.echomind.backend.controller;

import com.echomind.backend.model.ResumeDraft;
import com.echomind.backend.model.User;
import com.echomind.backend.repository.UserRepository;
import com.echomind.backend.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ResumeDraftController {

    private final ResumeService resumeService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user details not found."));
    }

    @GetMapping("/resumes/draft")
    public ResponseEntity<?> getDraft() {
        try {
            User user = getAuthenticatedUser();
            ResumeDraft draft = resumeService.getOrCreateDraft(user.getId());
            return ResponseEntity.ok(draft);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resumes/draft")
    public ResponseEntity<?> saveDraft(@RequestBody ResumeDraft draftPayload) {
        try {
            User user = getAuthenticatedUser();
            ResumeDraft saved = resumeService.saveDraft(user.getId(), draftPayload);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resumes/draft/improve-section")
    public ResponseEntity<?> improveSection(@RequestBody Map<String, String> payload) {
        try {
            String type = payload.get("type");
            String text = payload.get("text");
            String improved = resumeService.improveSection(type, text);
            return ResponseEntity.ok(Map.of("improvedText", improved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/resumes/draft/export-pdf")
    public ResponseEntity<byte[]> exportPdf() {
        try {
            User user = getAuthenticatedUser();
            byte[] pdfBytes = resumeService.exportPdf(user.getId());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Resume.pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
