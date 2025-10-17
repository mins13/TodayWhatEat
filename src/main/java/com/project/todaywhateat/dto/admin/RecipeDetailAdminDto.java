package com.project.todaywhateat.dto.admin;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.domain.RecipeStep;

import java.util.List;

public record RecipeDetailAdminDto(
        Long id, String title, String image, long likesCount, long viewCount,
        List<String> steps
) {
    public static RecipeDetailAdminDto from(Recipe r, List<RecipeStep> steps) {
        return new RecipeDetailAdminDto(
                r.getId(), r.getTitle(), r.getImage(), r.getLikesCount(), r.getViewCount(),
                steps.stream().map(RecipeStep::getDescription).toList()
        );
    }
}