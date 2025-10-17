package com.project.todaywhateat.dto.admin;

import com.project.todaywhateat.domain.Recipe;

public record RecipeLiteAdminDto(
        Long id, String title, String image, long likesCount, long viewCount
) {
    public static RecipeLiteAdminDto from(Recipe r) {
        return new RecipeLiteAdminDto(r.getId(), r.getTitle(), r.getImage(), r.getLikesCount(), r.getViewCount());
    }
}