package com.project.todaywhateat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class RecipeDto {
    private Long id;
    private String title;
    private String image;
    private List<IngredientDto> ingredients;
    private List<String> steps;
    private List<String> tags;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class IngredientDto {
        private String name;
        private String amount;
    }
}
