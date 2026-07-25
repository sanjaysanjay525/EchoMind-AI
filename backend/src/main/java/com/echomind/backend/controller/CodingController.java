package com.echomind.backend.controller;

import com.echomind.backend.model.CodingQuestion;
import com.echomind.backend.model.CodingSession;
import com.echomind.backend.model.User;
import com.echomind.backend.repository.CodingQuestionRepository;
import com.echomind.backend.repository.UserRepository;
import com.echomind.backend.service.CodingService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coding")
public class CodingController {

    private final CodingService codingService;
    private final UserRepository userRepository;
    private final CodingQuestionRepository codingQuestionRepository;

    public CodingController(CodingService codingService,
                            UserRepository userRepository,
                            CodingQuestionRepository codingQuestionRepository) {
        this.codingService = codingService;
        this.userRepository = userRepository;
        this.codingQuestionRepository = codingQuestionRepository;
    }

    @PostMapping("/sessions")
    public ResponseEntity<?> startCodingSession(@RequestBody Map<String, Object> payload) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String difficulty = (String) payload.getOrDefault("difficulty", "Medium");
            
            @SuppressWarnings("unchecked")
            List<String> topicTags = (List<String>) payload.get("topicTags");

            CodingSession session = codingService.startSession(user.getId(), difficulty, topicTags);
            CodingQuestion question = codingQuestionRepository.findById(session.getCodingQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            return ResponseEntity.ok(new CodingSessionResponse(session, question));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/sessions/{sessionId}/submit")
    public ResponseEntity<?> submitCodingSession(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> payload) {
        try {
            String code = payload.get("code");
            String language = payload.get("language");
            if (code == null) {
                return ResponseEntity.badRequest().body("Code is required");
            }
            if (language == null) {
                language = "javascript";
            }

            CodingSession session = codingService.submitSession(sessionId, code, language);
            CodingQuestion question = codingQuestionRepository.findById(session.getCodingQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            return ResponseEntity.ok(new CodingSessionResponse(session, question));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<?> getCodingSession(@PathVariable String sessionId) {
        try {
            CodingSession session = codingService.getSessionDetails(sessionId);
            CodingQuestion question = codingQuestionRepository.findById(session.getCodingQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            return ResponseEntity.ok(new CodingSessionResponse(session, question));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodingSessionResponse {
        private CodingSession session;
        private CodingQuestion question;
    }
}
