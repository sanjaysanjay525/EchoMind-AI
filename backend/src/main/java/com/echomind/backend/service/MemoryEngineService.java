package com.echomind.backend.service;

import com.echomind.backend.model.InterviewMemory;
import com.echomind.backend.repository.InterviewMemoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MemoryEngineService {

    private final InterviewMemoryRepository memoryRepository;

    public MemoryEngineService(InterviewMemoryRepository memoryRepository) {
        this.memoryRepository = memoryRepository;
    }

    public void storeMemory(String interviewId, String question, String answer, String topic, Integer sequenceNumber) {
        InterviewMemory memory = InterviewMemory.builder()
                .interviewId(interviewId)
                .question(question)
                .answer(answer)
                .topic(topic)
                .sequenceNumber(sequenceNumber)
                .createdAt(LocalDateTime.now())
                .build();
        memoryRepository.save(memory);
    }

    public List<InterviewMemory> getInterviewMemories(String interviewId) {
        return memoryRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
    }
}
