package com.echomind.backend.controller;

import com.echomind.backend.model.User;
import com.echomind.backend.model.WeeklyDigest;
import com.echomind.backend.repository.UserRepository;
import com.echomind.backend.service.WeeklyDigestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/digest")
public class WeeklyDigestController {

    private final WeeklyDigestService weeklyDigestService;
    private final UserRepository userRepository;

    public WeeklyDigestController(WeeklyDigestService weeklyDigestService, UserRepository userRepository) {
        this.weeklyDigestService = weeklyDigestService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/generate")
    public ResponseEntity<WeeklyDigest> generateDigest() {
        User user = getAuthenticatedUser();
        WeeklyDigest digest = weeklyDigestService.generateDigest(user.getId());
        return ResponseEntity.ok(digest);
    }

    @GetMapping("/latest")
    public ResponseEntity<WeeklyDigest> getLatestDigest() {
        User user = getAuthenticatedUser();
        return weeklyDigestService.getLatestDigest(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
