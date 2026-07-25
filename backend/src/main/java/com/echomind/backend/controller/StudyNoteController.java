package com.echomind.backend.controller;

import com.echomind.backend.model.StudyNote;
import com.echomind.backend.model.User;
import com.echomind.backend.repository.StudyNoteRepository;
import com.echomind.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notes")
public class StudyNoteController {

    private final StudyNoteRepository studyNoteRepository;
    private final UserRepository userRepository;

    public StudyNoteController(StudyNoteRepository studyNoteRepository, UserRepository userRepository) {
        this.studyNoteRepository = studyNoteRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    @GetMapping
    public ResponseEntity<List<StudyNote>> getNotes() {
        User user = getCurrentUser();
        List<StudyNote> notes = studyNoteRepository.findByUserId(user.getId());
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<StudyNote> saveNote(@RequestBody StudyNote note) {
        User user = getCurrentUser();
        note.setUserId(user.getId());
        note.setUpdatedAt(LocalDateTime.now());
        StudyNote saved = studyNoteRepository.save(note);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable String id) {
        User user = getCurrentUser();
        Optional<StudyNote> noteOpt = studyNoteRepository.findById(id);
        if (noteOpt.isPresent() && noteOpt.get().getUserId().equals(user.getId())) {
            studyNoteRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(403).body("Access denied or note not found");
    }
}
