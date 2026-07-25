package com.echomind.backend.controller;

import com.echomind.backend.model.ScheduledSession;
import com.echomind.backend.model.User;
import com.echomind.backend.repository.ScheduledSessionRepository;
import com.echomind.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class SchedulerController {

    private final ScheduledSessionRepository scheduledSessionRepository;
    private final UserRepository userRepository;

    public SchedulerController(ScheduledSessionRepository scheduledSessionRepository,
                               UserRepository userRepository) {
        this.scheduledSessionRepository = scheduledSessionRepository;
        this.userRepository = userRepository;
    }

    // ─── POST /api/schedule ─────────────────────────────────────────────────────
    @PostMapping("/schedule")
    public ResponseEntity<?> createSession(@RequestBody Map<String, String> body) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found."));
        }
        String userId = userOpt.get().getId();

        LocalDateTime scheduledAt = null;
        try {
            if (body.get("scheduledAt") != null) {
                scheduledAt = LocalDateTime.parse(body.get("scheduledAt"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid scheduledAt format. Use ISO-8601 (e.g. 2025-08-01T14:30:00)."));
        }

        ScheduledSession session = ScheduledSession.builder()
                .userId(userId)
                .title(body.get("title"))
                .domain(body.get("domain"))
                .difficulty(body.get("difficulty"))
                .scheduledAt(scheduledAt)
                .notes(body.get("notes"))
                .createdAt(LocalDateTime.now())
                .build();

        ScheduledSession saved = scheduledSessionRepository.save(session);
        return ResponseEntity.ok(saved);
    }

    // ─── GET /api/schedule ──────────────────────────────────────────────────────
    @GetMapping("/schedule")
    public ResponseEntity<?> getUserSessions() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found."));
        }
        String userId = userOpt.get().getId();

        List<ScheduledSession> sessions = scheduledSessionRepository.findByUserId(userId);
        sessions.sort(Comparator.comparing(
                s -> s.getScheduledAt() != null ? s.getScheduledAt() : LocalDateTime.MIN));

        return ResponseEntity.ok(sessions);
    }

    // ─── DELETE /api/schedule/{id} ──────────────────────────────────────────────
    @DeleteMapping("/schedule/{id}")
    public ResponseEntity<?> deleteSession(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found."));
        }
        String userId = userOpt.get().getId();

        Optional<ScheduledSession> sessionOpt = scheduledSessionRepository.findById(id);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ScheduledSession session = sessionOpt.get();
        if (!userId.equals(session.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("error", "You are not authorized to delete this session."));
        }

        scheduledSessionRepository.delete(session);
        return ResponseEntity.ok(Map.of("message", "Session deleted successfully."));
    }
}
