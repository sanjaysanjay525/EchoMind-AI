package com.echomind.backend.repository;

import com.echomind.backend.model.StudyNote;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface StudyNoteRepository extends MongoRepository<StudyNote, String> {
    List<StudyNote> findByUserId(String userId);
}
