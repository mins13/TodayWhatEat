package com.project.todaywhateat.dto.my;

import java.util.List;

public record MyRecipeUpsertReq(
        String title,
        String imageUrl,
        List<IngredientItem> ingredients,
        List<StepItem> steps
){
    public record IngredientItem(String name, String quantity, String unit, Integer sortOrder) {}
    public record StepItem(String content, Integer sortOrder) {}
}