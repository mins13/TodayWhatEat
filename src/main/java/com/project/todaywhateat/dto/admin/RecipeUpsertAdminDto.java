package com.project.todaywhateat.dto.admin;

import java.util.List;

public record RecipeUpsertAdminDto(
        String title,
        String image,
        List<String> steps,
        List<Ing> ingredients
) {
    public record Ing(String name, String amount) {}
}