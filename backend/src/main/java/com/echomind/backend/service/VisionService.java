package com.echomind.backend.service;

import com.echomind.backend.model.VisionAnalysis;
import com.echomind.backend.repository.VisionAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VisionService {

    private final VisionAnalysisRepository visionAnalysisRepository;

    public void saveMetrics(VisionAnalysis visionAnalysis) {
        Optional<VisionAnalysis> existing = visionAnalysisRepository.findByInterviewId(visionAnalysis.getInterviewId());
        if (existing.isPresent()) {
            VisionAnalysis update = existing.get();
            update.setEyeContactScore(visionAnalysis.getEyeContactScore());
            update.setAttentionScore(visionAnalysis.getAttentionScore());
            update.setFaceVisibilityScore(visionAnalysis.getFaceVisibilityScore());
            update.setLookingAwayCount(visionAnalysis.getLookingAwayCount());
            update.setAverageHeadTilt(visionAnalysis.getAverageHeadTilt());
            visionAnalysisRepository.save(update);
        } else {
            visionAnalysis.setCreatedAt(LocalDateTime.now());
            visionAnalysisRepository.save(visionAnalysis);
        }
    }

    public VisionAnalysis getReport(String interviewId) {
        return visionAnalysisRepository.findByInterviewId(interviewId)
                .orElseThrow(() -> new RuntimeException("Vision Analysis not found for interview: " + interviewId));
    }
}
