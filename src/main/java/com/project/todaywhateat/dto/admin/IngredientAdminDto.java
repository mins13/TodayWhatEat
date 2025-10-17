package com.project.todaywhateat.dto.admin;

import com.project.todaywhateat.domain.RecipeIngredient;

public record IngredientAdminDto(Long id, String name, String amount) {
    public static IngredientAdminDto from(RecipeIngredient g) {
        return new IngredientAdminDto(g.getId(), g.getName(), g.getAmount());
    }
}
