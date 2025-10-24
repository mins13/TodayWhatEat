package com.project.todaywhateat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RecipeSummaryDto {
    private Long id;
    private String title;
    // 프론트는 mainImageUrl을 기대하므로 이름 유지
    private String mainImageUrl;
}