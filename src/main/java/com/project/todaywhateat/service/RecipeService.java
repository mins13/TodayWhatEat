package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.domain.RecipeIngredient;
import com.project.todaywhateat.domain.RecipeStep;
import com.project.todaywhateat.domain.RecipeTag;
import com.project.todaywhateat.dto.RecipeDto;
import com.project.todaywhateat.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;

    public void saveRecipe(RecipeDto dto) {
        Recipe recipe = Recipe.builder()
                .title(dto.getTitle())
                .image(dto.getImage())
                .build();

        // Ingredient 저장
        List<RecipeIngredient> ingredientList = dto.getIngredients().stream()
                .map(ing -> RecipeIngredient.builder()
                        .name(ing.getName())
                        .amount(ing.getAmount())
                        .recipe(recipe)
                        .build())
                .collect(Collectors.toList());
        recipe.setIngredients(ingredientList);

        // Step 저장
        List<RecipeStep> stepList = new ArrayList<>();
        for (int i = 0; i < dto.getSteps().size(); i++) {
            stepList.add(RecipeStep.builder()
                    .stepOrder(i + 1)
                    .description(dto.getSteps().get(i))
                    .recipe(recipe)
                    .build());
        }
        recipe.setSteps(stepList);

        // Tag 저장
        List<RecipeTag> tagList = dto.getTags().stream()
                .map(tag -> RecipeTag.builder()
                        .name(tag)
                        .recipe(recipe)
                        .build())
                .collect(Collectors.toList());
        recipe.setTags((Set<RecipeTag>) tagList);

        recipeRepository.save(recipe);
    }

    public boolean existsByTitle(String title) {
        return recipeRepository.existsByTitle(title);
    }
}
