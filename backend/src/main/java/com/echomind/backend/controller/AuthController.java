package com.echomind.backend.controller;

import com.echomind.backend.dto.AuthResponse;
import com.echomind.backend.dto.LoginRequest;
import com.echomind.backend.dto.RegisterRequest;
import com.echomind.backend.model.User;
import com.echomind.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = User.builder()
                    .name(registerRequest.getName())
                    .email(registerRequest.getEmail())
                    .password(registerRequest.getPassword())
                    .role(registerRequest.getRole())
                    .build();
            User savedUser = userService.register(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String jwt = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
            User userProfile = userService.getProfile(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("Profile not found"));

            return ResponseEntity.ok(new AuthResponse(jwt, userProfile.getName(), userProfile.getEmail(), userProfile.getRole()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Invalid email or password");
        }
    }
}
