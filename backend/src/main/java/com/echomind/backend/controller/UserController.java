package com.echomind.backend.controller;

import com.echomind.backend.dto.ProfileUpdateRequest;
import com.echomind.backend.model.User;
import com.echomind.backend.model.Streak;
import com.echomind.backend.repository.StreakRepository;
import com.echomind.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;
    private final StreakRepository streakRepository;

    public UserController(UserService userService, StreakRepository streakRepository) {
        this.userService = userService;
        this.streakRepository = streakRepository;
    }

    @GetMapping("/users/streak")
    public ResponseEntity<?> getUserStreak() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getProfile(email)
                .map(user -> {
                    Streak streak = streakRepository.findByUserId(user.getId())
                            .orElse(Streak.builder()
                                    .userId(user.getId())
                                    .currentStreak(0)
                                    .build());
                    return ResponseEntity.ok(streak);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/profile")
    public ResponseEntity<?> getUserProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getProfile(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody ProfileUpdateRequest request) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User userUpdates = User.builder()
                    .name(request.getName())
                    .password(request.getPassword())
                    .build();
            User updatedUser = userService.updateProfile(email, userUpdates);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Admin endpoints
    @GetMapping("/admin/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().build();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/admin/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String id, @RequestParam String role) {
        try {
            User updatedUser = userService.updateUserRole(id, role);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
