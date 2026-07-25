package com.echomind.backend.controller;

import com.echomind.backend.model.ConsistencyAnalysis;
import com.echomind.backend.model.InterviewMemory;
import com.echomind.backend.service.ConsistencyAnalyzerService;
import com.echomind.backend.service.MemoryEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ConsistencyController {

    private final ConsistencyAnalyzerService consistencyAnalyzerService;
    private final MemoryEngineService memoryEngineService;

    public ConsistencyController(ConsistencyAnalyzerService consistencyAnalyzerService, MemoryEngineService memoryEngineService) {
        this.consistencyAnalyzerService = consistencyAnalyzerService;
        this.memoryEngineService = memoryEngineService;
    }

    @PostMapping("/consistency/analyze")
    public ResponseEntity<?> analyzeConsistency(@RequestBody Map<String, String> request) {
        try {
            String interviewId = request.get("interviewId");
            List<InterviewMemory> memories = memoryEngineService.getInterviewMemories(interviewId);
            ConsistencyAnalysis analysis = consistencyAnalyzerService.analyzeConsistency(interviewId, memories);
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/consistency/report/{interviewId}")
    public ResponseEntity<?> getConsistencyReport(@PathVariable String interviewId) {
        ConsistencyAnalysis report = consistencyAnalyzerService.getReport(interviewId);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(report);
    }
}
