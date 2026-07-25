package com.echomind.backend.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String password;
}
