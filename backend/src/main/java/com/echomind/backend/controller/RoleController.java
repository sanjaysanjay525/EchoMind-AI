package com.echomind.backend.controller;

import com.echomind.backend.model.Role;
import com.echomind.backend.model.RoundConfig;
import com.echomind.backend.repository.RoleRepository;
import com.echomind.backend.repository.RoundConfigRepository;
import com.echomind.backend.service.GeminiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;
    private final RoundConfigRepository roundConfigRepository;
    private final GeminiService geminiService;

    private final Map<String, List<LocalDateTime>> rateLimitMap = new ConcurrentHashMap<>();

    private boolean isPlausibleJobTitle(String q) {
        if (q == null) return false;
        String val = q.trim();
        if (val.length() < 3 || val.length() > 60) return false;
        // Basic letters + spaces + standard punctuations matching plausible job titles
        return val.matches("^[a-zA-Z0-9\\s\\-\\.\\/\\+\\(\\)\\{\\}]+$");
    }

    @GetMapping("/roles/search")
    public ResponseEntity<?> searchRoles(
            @RequestParam(value = "q", required = false, defaultValue = "") String query,
            @RequestParam(value = "category", required = false, defaultValue = "") String category) {
        
        // If empty query, return all roles sorted by usageCount in descending order
        if (query.trim().isEmpty()) {
            List<Role> all = roleRepository.findAll();
            all.sort((a, b) -> Integer.compare(
                b.getUsageCount() != null ? b.getUsageCount() : 0, 
                a.getUsageCount() != null ? a.getUsageCount() : 0
            ));
            Map<String, Object> response = new HashMap<>();
            response.put("exactMatches", all);
            response.put("suggestion", null);
            return ResponseEntity.ok(response);
        }

        List<Role> matches = roleRepository.searchRoles(query);
        if (matches.isEmpty() && isPlausibleJobTitle(query)) {
            Map<String, Object> suggestion = new HashMap<>();
            suggestion.put("available", true);
            suggestion.put("query", query.trim());
            
            Map<String, Object> response = new HashMap<>();
            response.put("exactMatches", Collections.emptyList());
            response.put("suggestion", suggestion);
            return ResponseEntity.ok(response);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("exactMatches", matches);
        response.put("suggestion", null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/roles/generate")
    public ResponseEntity<?> generateRole(@RequestBody Map<String, String> payload) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        String title = payload.get("title");
        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Role title is required.");
        }
        title = title.trim();

        // Plausibility Check
        if (!isPlausibleJobTitle(title)) {
            return ResponseEntity.badRequest().body("Invalid or implausible job role title.");
        }

        // Rate Limiter Check (max 5 per user email per hour)
        LocalDateTime now = LocalDateTime.now();
        List<LocalDateTime> timestamps = rateLimitMap.computeIfAbsent(email, k -> new CopyOnWriteArrayList<>());
        timestamps.removeIf(t -> t.isBefore(now.minusHours(1)));
        if (timestamps.size() >= 5) {
            return ResponseEntity.status(429).body("Rate limit exceeded. Maximum 5 generated roles per hour.");
        }

        // Caching Check
        String cleanedId = title.toLowerCase().replaceAll("[^a-z0-9]", "-");
        Optional<Role> existing = roleRepository.findById(cleanedId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }

        // Build Gemini Generation Prompt
        String prompt = String.format(
            "You are an expert HR recruitment profile analyzer.\n" +
            "Draft a standard corporate job role definition matching the user query: \"%s\".\n\n" +
            "Return ONLY a clean JSON object. Do not include markdown wraps or explanations. Output schema must match:\n" +
            "{\n" +
            "  \"title\": \"[Plausible Title matching capitalization, e.g. Solutions Architect]\",\n" +
            "  \"category\": \"[Pick from: Tech & Engineering, Product & Design, Business & Analytics, Marketing & Sales, Customer-Facing, HR & Admin, or 'Other']\",\n" +
            "  \"description\": \"[1-2 sentences summarizing core duties]\",\n" +
            "  \"keywords\": [\"keyword1\", \"keyword2\", ... (3 to 5 keywords)],\n" +
            "  \"questionThemes\": [\"theme1\", \"theme2\", ... (3 to 5 topic areas for technical questions)]\n" +
            "}",
            title
        );

        try {
            String rawJson = geminiService.callGeminiApi(prompt);
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            ObjectMapper mapper = new ObjectMapper();
            Role template = mapper.readValue(rawJson, Role.class);
            
            // Populate system attributes
            template.setId(cleanedId);
            template.setSource("ai_generated");
            template.setGeneratedAt(now);
            template.setUsageCount(0);
            
            // Cache role
            Role saved = roleRepository.save(template);
            
            // Populate default configurations matching rounds config expectations
            if (roundConfigRepository.findByCareerPathAndRoundType(saved.getId(), "APTITUDE").isEmpty()) {
                roundConfigRepository.save(RoundConfig.builder().careerPath(saved.getId()).roundType("APTITUDE").passThreshold(60).strictCutoff(false).build());
                roundConfigRepository.save(RoundConfig.builder().careerPath(saved.getId()).roundType("COMMUNICATION").passThreshold(60).strictCutoff(false).build());
                roundConfigRepository.save(RoundConfig.builder().careerPath(saved.getId()).roundType("CODING").passThreshold(60).strictCutoff(false).build());
                roundConfigRepository.save(RoundConfig.builder().careerPath(saved.getId()).roundType("ADVANCED").passThreshold(60).strictCutoff(false).build());
            }

            // Log timestamp for rate limiting
            timestamps.add(now);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Failed to dynamically generate role details: " + e.getMessage());
            return ResponseEntity.status(500).body("Role profiling failed: " + e.getMessage());
        }
    }
}
