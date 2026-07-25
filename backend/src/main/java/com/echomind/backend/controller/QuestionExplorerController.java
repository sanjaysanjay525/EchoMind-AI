package com.echomind.backend.controller;

import com.echomind.backend.model.Question;
import com.echomind.backend.model.CodingProblem;
import com.echomind.backend.repository.QuestionRepository;
import com.echomind.backend.repository.CodingProblemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/questions-catalog")
public class QuestionExplorerController {

    private final QuestionRepository questionRepository;
    private final CodingProblemRepository codingProblemRepository;

    public QuestionExplorerController(QuestionRepository questionRepository, CodingProblemRepository codingProblemRepository) {
        this.questionRepository = questionRepository;
        this.codingProblemRepository = codingProblemRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCatalog(
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String difficulty) {
        
        List<Map<String, Object>> catalog = new ArrayList<>();

        // 1. Fetch general questions
        List<Question> generalQuestions = questionRepository.findAll();
        for (Question q : generalQuestions) {
            // Apply filtering in memory
            if (domain != null && !domain.equalsIgnoreCase("All") && !q.getDomain().equalsIgnoreCase(domain)) {
                continue;
            }
            if (difficulty != null && !difficulty.equalsIgnoreCase("All") && !q.getDifficulty().equalsIgnoreCase(difficulty)) {
                continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", q.getId());
            map.put("title", "Behavioral / Theoretical Q&A");
            map.put("description", q.getQuestionText());
            map.put("domain", q.getDomain());
            map.put("difficulty", q.getDifficulty());
            map.put("type", "Theoretical");
            catalog.add(map);
        }

        // 2. Fetch coding problems
        List<CodingProblem> codingProblems = codingProblemRepository.findAll();
        for (CodingProblem cp : codingProblems) {
            // Apply filtering in memory
            if (domain != null && !domain.equalsIgnoreCase("All") && !cp.getCareerPath().equalsIgnoreCase(domain)) {
                continue;
            }
            if (difficulty != null && !difficulty.equalsIgnoreCase("All") && !cp.getDifficulty().equalsIgnoreCase(difficulty)) {
                continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", cp.getId());
            map.put("title", cp.getTitle());
            map.put("description", cp.getDescription());
            map.put("domain", cp.getCareerPath());
            map.put("difficulty", cp.getDifficulty());
            map.put("type", "Coding");
            map.put("templateCode", cp.getTemplateCode());
            catalog.add(map);
        }

        return ResponseEntity.ok(catalog);
    }
}
