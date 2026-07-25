package com.echomind.backend.controller;

import com.echomind.backend.model.PlacementReadiness;
import com.echomind.backend.service.PlacementReadinessService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/readiness")
public class PlacementReadinessController {

    private final PlacementReadinessService placementReadinessService;

    public PlacementReadinessController(PlacementReadinessService placementReadinessService) {
        this.placementReadinessService = placementReadinessService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeReadiness(@RequestBody Map<String, String> payload) {
        String interviewId = payload.get("interviewId");
        if (interviewId == null) {
            return ResponseEntity.badRequest().body("interviewId is required");
        }
        try {
            PlacementReadiness readiness = placementReadinessService.analyzeReadiness(interviewId);
            return ResponseEntity.ok(readiness);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error analyzing readiness: " + e.getMessage());
        }
    }

    @GetMapping("/{interviewId}")
    public ResponseEntity<?> getReadiness(@PathVariable String interviewId) {
        Optional<PlacementReadiness> readinessOpt = placementReadinessService.getReadinessByInterviewId(interviewId);
        if (readinessOpt.isPresent()) {
            return ResponseEntity.ok(readinessOpt.get());
        }
        return ResponseEntity.notFound().build();
    }
}
