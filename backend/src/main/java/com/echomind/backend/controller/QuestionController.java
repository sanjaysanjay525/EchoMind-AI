package com.echomind.backend.controller;

import com.echomind.backend.model.Question;
import com.echomind.backend.repository.QuestionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionRepository questionRepository;

    public QuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @GetMapping("/{domain}")
    public ResponseEntity<List<Question>> getQuestionsByDomain(@PathVariable String domain) {
        return ResponseEntity.ok(questionRepository.findByDomain(domain));
    }
}
