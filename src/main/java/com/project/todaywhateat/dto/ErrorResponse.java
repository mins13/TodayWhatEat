package com.project.todaywhateat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.Map;

@Getter
@AllArgsConstructor
public class ErrorResponse {
    private Map<String, String> errors;
}