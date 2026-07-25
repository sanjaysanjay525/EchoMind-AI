package com.echomind.backend.controller;

import com.echomind.backend.model.InterviewCoaching;
import com.echomind.backend.service.InterviewCoachingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/coaching")
public class InterviewCoachingController {

    private final InterviewCoachingService coachingService;

    public InterviewCoachingController(InterviewCoachingService coachingService) {
        this.coachingService = coachingService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateCoaching(@RequestBody Map<String, String> payload) {
        String interviewId = payload.get("interviewId");
        if (interviewId == null) {
            return ResponseEntity.badRequest().body("interviewId is required");
        }
        try {
            InterviewCoaching coaching = coachingService.generateCoaching(interviewId);
            return ResponseEntity.ok(coaching);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error generating coaching: " + e.getMessage());
        }
    }

    @GetMapping("/{interviewId}")
    public ResponseEntity<?> getCoaching(@PathVariable String interviewId) {
        Optional<InterviewCoaching> coachingOpt = coachingService.getCoachingByInterviewId(interviewId);
        if (coachingOpt.isPresent()) {
            return ResponseEntity.ok(coachingOpt.get());
        }
        return ResponseEntity.notFound().build();
    }
}
