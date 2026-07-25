package com.echomind.backend.controller;

import com.echomind.backend.model.Interview;
import com.echomind.backend.model.Streak;
import com.echomind.backend.model.User;
import com.echomind.backend.repository.InterviewRepository;
import com.echomind.backend.repository.StreakRepository;
import com.echomind.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class StreakController {

    private final StreakRepository streakRepository;
    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;

    private static final Set<Integer> MILESTONE_VALUES = new HashSet<>(
            Arrays.asList(3, 7, 14, 30, 50, 100));

    public StreakController(StreakRepository streakRepository,
                            InterviewRepository interviewRepository,
                            UserRepository userRepository) {
        this.streakRepository = streakRepository;
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/streak")
    public ResponseEntity<Map<String, Object>> getStreak() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found."));
        }
        String userId = userOpt.get().getId();

        // Count total completed interviews
        List<Interview> interviews = interviewRepository.findByUserId(userId);
        long totalInterviews = interviews.stream()
                .filter(i -> "COMPLETED".equalsIgnoreCase(i.getStatus()))
                .count();

        // Fetch streak record
        Optional<Streak> streakOpt = streakRepository.findByUserId(userId);

        int currentStreak = 0;
        String lastActiveDate = null;

        if (streakOpt.isPresent()) {
            Streak streak = streakOpt.get();
            currentStreak = streak.getCurrentStreak() != null ? streak.getCurrentStreak() : 0;
            lastActiveDate = streak.getLastActiveDate() != null
                    ? streak.getLastActiveDate().toString()
                    : null;
        }

        // Use currentStreak as approximation for longestStreak
        int longestStreak = currentStreak;
        boolean milestoneReached = MILESTONE_VALUES.contains(currentStreak);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("currentStreak", currentStreak);
        response.put("lastActiveDate", lastActiveDate);
        response.put("totalInterviews", (int) totalInterviews);
        response.put("longestStreak", longestStreak);
        response.put("milestoneReached", milestoneReached);

        return ResponseEntity.ok(response);
    }
}
