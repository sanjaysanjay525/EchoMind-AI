package com.echomind.backend.controller;

import com.echomind.backend.model.Answer;
import com.echomind.backend.repository.AnswerRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/answers")
public class AnswerController {

    private final AnswerRepository answerRepository;

    public AnswerController(AnswerRepository answerRepository) {
        this.answerRepository = answerRepository;
    }

    @PostMapping
    public ResponseEntity<Answer> submitAnswer(@Valid @RequestBody Answer request) {
        request.setTimestamp(LocalDateTime.now());
        Answer savedAnswer = answerRepository.save(request);
        return ResponseEntity.ok(savedAnswer);
    }

    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<List<Answer>> getAnswersByInterviewId(@PathVariable String interviewId) {
        return ResponseEntity.ok(answerRepository.findByInterviewId(interviewId));
    }
}
