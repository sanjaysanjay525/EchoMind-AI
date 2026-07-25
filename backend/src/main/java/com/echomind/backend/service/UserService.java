package com.echomind.backend.service;

import com.echomind.backend.model.User;
import com.echomind.backend.repository.UserRepository;
import com.echomind.backend.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    public User register(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(user.getRole() == null ? "ROLE_CANDIDATE" : user.getRole());
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public String login(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return tokenProvider.generateToken(authentication);
    }

    public Optional<User> getProfile(String email) {
        return userRepository.findByEmail(email);
    }

    public User updateProfile(String email, User profileUpdates) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(profileUpdates.getName());
        if (profileUpdates.getPassword() != null && !profileUpdates.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(profileUpdates.getPassword()));
        }
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    public User updateUserRole(String id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }
}
