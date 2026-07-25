package com.echomind.backend.controller;

import com.echomind.backend.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final GeminiService geminiService;

    public ChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "").trim();

        if (message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("reply", "Please provide a message."));
        }

        String systemPrompt = "You are EchoMind AI Assistant. Help candidates with interview prep, " +
                "platform navigation, resume advice. Keep responses under 80 words and actionable. " +
                "Platform features: Mock interviews, Resume Builder, Resume Analyzer, Coaching, " +
                "Role Search, Analytics, Leaderboard, Scheduler.";

        String fullPrompt = systemPrompt + "\n\nUser: " + message;

        try {
            String response = geminiService.callGeminiApi(fullPrompt);
            return ResponseEntity.ok(Map.of("reply", response));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("reply",
                    "I'm having trouble connecting right now. Please try again in a moment!"));
        }
    }
}
