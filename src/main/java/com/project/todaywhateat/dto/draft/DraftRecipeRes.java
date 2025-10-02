package com.project.todaywhateat.dto.draft;

import com.project.todaywhateat.domain.draft.DraftStatus;

import java.time.LocalDateTime;
import java.util.List;

public record DraftRecipeRes(
        Long id, String title, String description, String imageUrl,
        List<String> tags, DraftStatus status, String rejectionReason,
        Long publishedRecipeId,
        List<IngredientRes> ingredients, List<StepRes> steps,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public record IngredientRes(Long id, String name, String quantity, String unit, int sortOrder) {}
    public record StepRes(Long id, int stepOrder, String content) {}
}