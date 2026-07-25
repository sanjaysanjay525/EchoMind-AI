package com.echomind.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class AnalyticsResponse {
    private long totalUsers;
    private long totalInterviews;
    private double averageScore;
    private Map<String, Long> domainDistribution;
}
