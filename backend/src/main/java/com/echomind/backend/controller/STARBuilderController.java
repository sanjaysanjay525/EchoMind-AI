package com.echomind.backend.controller;

import com.echomind.backend.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/star-builder")
public class STARBuilderController {

    private final GeminiService geminiService;

    public STARBuilderController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluateSTAR(@RequestBody Map<String, String> payload) {
        String situation = payload.get("situation");
        String task = payload.get("task");
        String action = payload.get("action");
        String result = payload.get("result");

        if (situation == null || task == null || action == null || result == null) {
            return ResponseEntity.badRequest().body("Situation, Task, Action, and Result are all required fields.");
        }

        String prompt = "Evaluate this candidate's behavioral interview response structured using the STAR method.\n\n" +
                "SITUATION: " + situation + "\n" +
                "TASK: " + task + "\n" +
                "ACTION: " + action + "\n" +
                "RESULT: " + result + "\n\n" +
                "Analyze and return a JSON response containing:\n" +
                "1. score (integer 0-100 based on STAR framework completeness and descriptive detail)\n" +
                "2. frameworkRating (string e.g. Excellent, Good, Weak)\n" +
                "3. feedback (detailed textual assessment explaining if the action was clear and if results were properly quantified)\n" +
                "4. improvementTips (array of 3 actionable suggestions to improve the impact of this answer)\n" +
                "Return ONLY valid JSON. No markdown or backticks.";

        try {
            String aiResponse = geminiService.callGeminiApi(prompt);
            // clean potential markdown wrappers
            String clean = aiResponse.trim();
            if (clean.startsWith("```json")) clean = clean.substring(7);
            if (clean.endsWith("```")) clean = clean.substring(0, clean.length() - 3);
            
            return ResponseEntity.ok(Map.of("evaluation", clean.trim()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("STAR evaluation failed: " + e.getMessage());
        }
    }
}
