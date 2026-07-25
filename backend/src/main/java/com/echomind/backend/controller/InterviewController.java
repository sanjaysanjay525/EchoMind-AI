package com.echomind.backend.controller;

import com.echomind.backend.dto.StartInterviewRequest;
import com.echomind.backend.dto.SubmitAnswerRequest;
import com.echomind.backend.dto.SubmitInterviewRequest;
import com.echomind.backend.dto.QuestionResponse;
import com.echomind.backend.model.Interview;
import com.echomind.backend.model.InterviewContext;
import com.echomind.backend.service.InterviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class InterviewController {

    private final InterviewService interviewService;
    private final com.echomind.backend.service.FinalReportService finalReportService;
    private final com.echomind.backend.repository.InterviewContextRepository contextRepository;

    public InterviewController(InterviewService interviewService,
                               com.echomind.backend.service.FinalReportService finalReportService,
                               com.echomind.backend.repository.InterviewContextRepository contextRepository) {
        this.interviewService = interviewService;
        this.finalReportService = finalReportService;
        this.contextRepository = contextRepository;
    }

    @PostMapping("/interviews/start")
    public ResponseEntity<?> startInterview(@Valid @RequestBody StartInterviewRequest request) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Interview interview = interviewService.startInterview(
                    email, 
                    request.getDomain(), 
                    request.getDifficulty(),
                    request.getMode(),
                    request.getInterviewerGender(),
                    request.getOfficeSetting(),
                    request.getLanguage(),
                    request.getPracticeMode(),
                    request.getCustomQuestions(),
                    request.getInterviewerPersona()
            );
            return ResponseEntity.ok(interview);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/interviews/{id}")
    public ResponseEntity<?> getInterview(@PathVariable String id) {
        try {
            Interview interview = interviewService.getInterviewById(id);
            return ResponseEntity.ok(interview);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/interviews/{id}/submit")
    public ResponseEntity<?> submitInterview(@PathVariable String id, @RequestBody SubmitInterviewRequest request) {
        try {
            Integer duration = request != null && request.getDuration() != null ? request.getDuration() : 0;
            Interview interview = interviewService.submitInterview(id, duration);
            return ResponseEntity.ok(interview);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/interviews/{id}/question")
    public ResponseEntity<?> getNextQuestion(@PathVariable String id) {
        try {
            String question = interviewService.getNextQuestion(id);
            return ResponseEntity.ok(new QuestionResponse(question));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/interviews/{id}/answer")
    public ResponseEntity<?> submitAnswer(@PathVariable String id, @RequestBody SubmitAnswerRequest request) {
        try {
            String feedback = interviewService.submitAnswer(id, request);
            return ResponseEntity.ok(java.util.Map.of("feedback", feedback));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/interviews/{id}/interrupt")
    public ResponseEntity<?> triggerInterruption(@PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
        try {
            String partialAnswer = payload.get("partialAnswer");
            String pushback = interviewService.triggerInterruption(id, partialAnswer);
            return ResponseEntity.ok(java.util.Map.of("question", pushback));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/interviews/coaching/rewrite")
    public ResponseEntity<?> generateAnswerRewrite(@RequestBody java.util.Map<String, String> payload) {
        try {
            String question = payload.get("question");
            String answer = payload.get("answer");
            String language = payload.get("language");
            String rewrite = interviewService.generateAnswerRewrite(question, answer, language);
            return ResponseEntity.ok(java.util.Map.of("rewrite", rewrite));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/interviews/{id}/contexts")
    public ResponseEntity<?> getInterviewContexts(@PathVariable String id) {
        try {
            return ResponseEntity.ok(interviewService.getInterviewContexts(id));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/interviews/history")
    public ResponseEntity<List<Interview>> getHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(interviewService.getHistory(email));
    }

    // Admin endpoints
    @GetMapping("/admin/interviews")
    public ResponseEntity<List<Interview>> getAllInterviews() {
        return ResponseEntity.ok(interviewService.getAllInterviews());
    }

    @PostMapping("/interviews/analyze-resume")
    public ResponseEntity<?> analyzeResume(@RequestBody java.util.Map<String, String> payload) {
        try {
            String resumeText = payload.get("resumeText");
            if (resumeText == null || resumeText.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Resume text is required");
            }
            java.util.Map<String, Object> analysis = interviewService.analyzeResume(resumeText);
            return ResponseEntity.ok(analysis);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/interviews/{sessionId}/responses/{responseId}/score-breakdown")
    public ResponseEntity<?> getResponseScoreBreakdown(
            @PathVariable String sessionId,
            @PathVariable String responseId) {
        try {
            InterviewContext ctx = contextRepository.findById(responseId)
                    .orElseThrow(() -> new RuntimeException("Response not found"));
            
            if (!sessionId.equals(ctx.getInterviewId())) {
                return ResponseEntity.badRequest().body("Response does not belong to this interview session");
            }

            InterviewContext.ScoreBreakdown breakdown = ctx.getScoreBreakdown();
            if (breakdown == null) {
                double defaultOverall = ctx.getScore() != null ? ctx.getScore() / 10.0 : 7.0;
                int intScore = ctx.getScore() != null ? (int) Math.round(ctx.getScore() / 10.0) : 7;
                breakdown = InterviewContext.ScoreBreakdown.builder()
                        .starStructure(InterviewContext.SubScore.builder().score(intScore * 10).weight(0.3).rationale("Acceptable response structure.").build())
                        .technicalAccuracy(InterviewContext.SubScore.builder().score(intScore * 10).weight(0.3).rationale("Response matches basic domain concepts.").build())
                        .communicationClarity(InterviewContext.SubScore.builder().score(intScore * 10).weight(0.2).rationale("Clear delivery and articulation.").build())
                        .confidenceDelivery(InterviewContext.SubScore.builder().score(intScore * 10).weight(0.2).rationale("Stable pace and tone.").build())
                        .build();
            }

            java.util.Map<String, Object> response = new java.util.HashMap<>();
            double overallScale10 = ctx.getScore() != null ? ctx.getScore() / 10.0 : 7.0;
            response.put("overallScore", overallScale10);

            java.util.Map<String, Object> bdMap = new java.util.HashMap<>();
            bdMap.put("starStructure", mapSubscoreToScale10(breakdown.getStarStructure()));
            bdMap.put("technicalAccuracy", mapSubscoreToScale10(breakdown.getTechnicalAccuracy()));
            bdMap.put("communicationClarity", mapSubscoreToScale10(breakdown.getCommunicationClarity()));
            bdMap.put("confidenceDelivery", mapSubscoreToScale10(breakdown.getConfidenceDelivery()));
            response.put("scoreBreakdown", bdMap);

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    private java.util.Map<String, Object> mapSubscoreToScale10(InterviewContext.SubScore subScore) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        if (subScore != null) {
            map.put("score", subScore.getScore() != null ? subScore.getScore() / 10 : 7);
            map.put("weight", subScore.getWeight());
            map.put("rationale", subScore.getRationale());
        } else {
            map.put("score", 7);
            map.put("weight", 0.2);
            map.put("rationale", "No rationale recorded.");
        }
        return map;
    }

    @PostMapping("/interviews/micro-session")
    public ResponseEntity<?> startMicroSession(@RequestBody java.util.Map<String, String> payload) {
        try {
            String domain = payload.get("roleId");
            if (domain == null) {
                domain = payload.get("domain");
            }
            if (domain == null || domain.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("roleId/domain is required");
            }
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Interview interview = interviewService.startMicroSession(email, domain);
            return ResponseEntity.ok(interview);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/personas")
    public ResponseEntity<?> listPersonas() {
        return ResponseEntity.ok(InterviewService.PERSONAS.values());
    }

    @GetMapping("/interviews/{sessionId}/benchmark")
    public ResponseEntity<?> getRolePercentile(@PathVariable String sessionId) {
        try {
            java.util.Map<String, Object> benchmark = finalReportService.getRolePercentile(sessionId);
            return ResponseEntity.ok(benchmark);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/users/weak-competencies")
    public ResponseEntity<?> getUserWeakestCompetencies() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            List<String> weak = interviewService.getUserWeakestCompetenciesByEmail(email, 2);
            return ResponseEntity.ok(weak);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
