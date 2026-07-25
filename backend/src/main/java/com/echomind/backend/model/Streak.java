package com.echomind.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "streaks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Streak {
    @Id
    private String id;
    
    private String userId;
    
    private Integer currentStreak;
    
    private LocalDate lastActiveDate;
}
