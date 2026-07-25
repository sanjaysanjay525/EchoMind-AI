package com.echomind.backend.controller;

import com.echomind.backend.model.VisionAnalysis;
import com.echomind.backend.service.VisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vision")
@RequiredArgsConstructor
public class VisionController {

    private final VisionService visionService;

    @PostMapping("/start")
    public ResponseEntity<?> startSession() {
        // Initializes vision tracking, we might not need to do anything server-side
        return ResponseEntity.ok().build();
    }

    @PostMapping("/metrics")
    public ResponseEntity<?> saveMetrics(@RequestBody VisionAnalysis visionAnalysis) {
        visionService.saveMetrics(visionAnalysis);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/report/{interviewId}")
    public ResponseEntity<VisionAnalysis> getReport(@PathVariable String interviewId) {
        return ResponseEntity.ok(visionService.getReport(interviewId));
    }
}
