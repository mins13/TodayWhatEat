package com.project.todaywhateat.dto.draft;

import java.util.List;

public record DraftRecipeUpsertReq(
        String title,
        String description,
        String imageUrl,
        List<IngredientItem> ingredients,
        List<StepItem> steps,
        List<String> tags // ["혼밥","간단"]
) {
    public record IngredientItem(String name, String quantity, String unit, Integer sortOrder) {}
    public record StepItem(Integer stepOrder, String content) {}
}