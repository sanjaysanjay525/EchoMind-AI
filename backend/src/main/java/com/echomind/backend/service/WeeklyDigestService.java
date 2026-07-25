package com.echomind.backend.service;

import com.echomind.backend.model.FinalReport;
import com.echomind.backend.model.Interview;
import com.echomind.backend.model.Streak;
import com.echomind.backend.model.WeeklyDigest;
import com.echomind.backend.repository.FinalReportRepository;
import com.echomind.backend.repository.InterviewRepository;
import com.echomind.backend.repository.StreakRepository;
import com.echomind.backend.repository.WeeklyDigestRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class WeeklyDigestService {

    private final WeeklyDigestRepository weeklyDigestRepository;
    private final InterviewRepository interviewRepository;
    private final FinalReportRepository finalReportRepository;
    private final InterviewService interviewService;
    private final StreakRepository streakRepository;

    public WeeklyDigestService(WeeklyDigestRepository weeklyDigestRepository,
                               InterviewRepository interviewRepository,
                               FinalReportRepository finalReportRepository,
                               InterviewService interviewService,
                               StreakRepository streakRepository) {
        this.weeklyDigestRepository = weeklyDigestRepository;
        this.interviewRepository = interviewRepository;
        this.finalReportRepository = finalReportRepository;
        this.interviewService = interviewService;
        this.streakRepository = streakRepository;
    }

    public WeeklyDigest generateDigest(String userId) {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        String weekOfStr = monday.toString();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sevenDaysAgo = now.minusDays(7);
        LocalDateTime fourteenDaysAgo = now.minusDays(14);

        // Fetch all user interviews
        List<Interview> userInterviews = interviewRepository.findByUserId(userId);

        // Current week completed interviews
        List<Interview> currentWeekInterviews = userInterviews.stream()
                .filter(i -> "COMPLETED".equals(i.getStatus()) && i.getDate() != null && i.getDate().isAfter(sevenDaysAgo))
                .toList();

        // Prior week completed interviews
        List<Interview> priorWeekInterviews = userInterviews.stream()
                .filter(i -> "COMPLETED".equals(i.getStatus()) && i.getDate() != null && 
                             i.getDate().isAfter(fourteenDaysAgo) && i.getDate().isBefore(sevenDaysAgo))
                .toList();

        // Calculate average scores
        double avgScoreCurrentWeek = getAvgScoreForInterviews(currentWeekInterviews);
        double avgScorePriorWeek = getAvgScoreForInterviews(priorWeekInterviews);

        // Score trend on a 10-point scale (overallScore is out of 100)
        double scoreTrend = 0.0;
        if (avgScorePriorWeek > 0) {
            scoreTrend = (avgScoreCurrentWeek - avgScorePriorWeek) / 10.0;
        } else if (avgScoreCurrentWeek > 0) {
            scoreTrend = avgScoreCurrentWeek / 10.0; // initial baseline trend
        }

        // Round trend to 1 decimal place
        scoreTrend = Math.round(scoreTrend * 10.0) / 10.0;

        // Weakest competencies
        List<String> weakComp = interviewService.getUserWeakestCompetencies(userId, 2);
        if (weakComp.isEmpty()) {
            weakComp = List.of("Technical Accuracy", "Confidence Delivery");
        }

        // Streak
        int streakVal = streakRepository.findByUserId(userId)
                .map(Streak::getCurrentStreak)
                .orElse(0);

        // Save or update existing digest for the week
        Optional<WeeklyDigest> existing = weeklyDigestRepository.findByUserId(userId).stream()
                .filter(d -> weekOfStr.equals(d.getWeekOf()))
                .findFirst();

        WeeklyDigest digest = existing.orElse(new WeeklyDigest());
        digest.setUserId(userId);
        digest.setWeekOf(weekOfStr);
        digest.setSessionsCompleted(currentWeekInterviews.size());
        digest.setAvgScoreTrend(scoreTrend);
        digest.setWeakestCompetencies(weakComp);
        digest.setFlashcardStreak(streakVal);
        digest.setGeneratedAt(now);

        return weeklyDigestRepository.save(digest);
    }

    public Optional<WeeklyDigest> getLatestDigest(String userId) {
        // Generate on demand to ensure they get fresh data if they haven't visited or if it's due
        Optional<WeeklyDigest> latestOpt = weeklyDigestRepository.findFirstByUserIdOrderByGeneratedAtDesc(userId);
        if (latestOpt.isEmpty()) {
            try {
                return Optional.of(generateDigest(userId));
            } catch (Exception ex) {
                System.err.println("Failed to generate initial digest on demand: " + ex.getMessage());
                return Optional.empty();
            }
        }
        
        // If the generated digest is older than 24 hours, regenerate to update streak/sessions
        WeeklyDigest latest = latestOpt.get();
        if (latest.getGeneratedAt() != null && latest.getGeneratedAt().isBefore(LocalDateTime.now().minusHours(24))) {
            try {
                return Optional.of(generateDigest(userId));
            } catch (Exception ex) {
                System.err.println("Failed to regenerate aged digest: " + ex.getMessage());
            }
        }

        return latestOpt;
    }

    private double getAvgScoreForInterviews(List<Interview> interviews) {
        if (interviews.isEmpty()) {
            return 0.0;
        }
        List<String> ids = interviews.stream().map(Interview::getId).toList();
        List<FinalReport> reports = finalReportRepository.findByInterviewIdIn(ids);
        if (reports.isEmpty()) {
            return 0.0;
        }
        double sum = 0.0;
        int count = 0;
        for (FinalReport r : reports) {
            if (r.getOverallScore() != null) {
                sum += r.getOverallScore();
                count++;
            }
        }
        return count > 0 ? (sum / count) : 0.0;
    }
}
