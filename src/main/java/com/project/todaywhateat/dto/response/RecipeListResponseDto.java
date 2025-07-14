package com.project.todaywhateat.dto.response;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.domain.RecipeTag;
import lombok.Builder;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Getter
@Builder
public class RecipeListResponseDto {
    private Long id;
    private String title;
    private String imageUrl;
    private List<String> ingredients;
    private List<String> tags;

    public static RecipeListResponseDto fromEntity(Recipe recipe) {
        return RecipeListResponseDto.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .imageUrl(recipe.getImage())
                .ingredients(
                        recipe.getIngredients().stream()
                                .map(i -> i.getName())
                                .distinct()// getName()은 실제 필드명에 맞게 수정!
                                .collect(Collectors.toList())
                ).tags(recipe.getTags() != null
                        ? recipe.getTags().stream()
                        .filter(Objects::nonNull) // ✅ null 제거
                        .map(RecipeTag::getName)
                        .distinct()
                        .collect(Collectors.toList())
                        : new ArrayList<>()
                )
                .build();

    }

}
