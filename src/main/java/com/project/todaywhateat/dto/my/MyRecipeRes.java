package com.project.todaywhateat.dto.my;

import java.time.LocalDateTime;
import java.util.List;

public record MyRecipeRes(
        Long id, String title, String imageUrl, String visibility,
        List<IngredientRes> ingredients, List<StepRes> steps,
        LocalDateTime createdAt, LocalDateTime updatedAt
){
    public record IngredientRes(Long id, String name, String quantity, String unit, int sortOrder) {}
    public record StepRes(Long id, String content, int sortOrder) {}
}