package com.echomind.backend.controller;

import com.echomind.backend.model.InterviewMemory;
import com.echomind.backend.service.MemoryEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MemoryController {

    private final MemoryEngineService memoryEngineService;

    public MemoryController(MemoryEngineService memoryEngineService) {
        this.memoryEngineService = memoryEngineService;
    }

    @PostMapping("/memory/store")
    public ResponseEntity<?> storeMemory(@RequestBody Map<String, Object> request) {
        try {
            String interviewId = (String) request.get("interviewId");
            String question = (String) request.get("question");
            String answer = (String) request.get("answer");
            String topic = (String) request.get("topic");
            Integer sequenceNumber = (Integer) request.get("sequenceNumber");

            memoryEngineService.storeMemory(interviewId, question, answer, topic, sequenceNumber);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/memory/{interviewId}")
    public ResponseEntity<List<InterviewMemory>> getInterviewMemory(@PathVariable String interviewId) {
        return ResponseEntity.ok(memoryEngineService.getInterviewMemories(interviewId));
    }
}
