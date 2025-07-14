package com.project.todaywhateat.service.view;

import com.project.todaywhateat.domain.FridgeIngredient;
import com.project.todaywhateat.dto.response.RecipeListResponseDto;
import com.project.todaywhateat.repository.FridgeIngredientRepository;
import com.project.todaywhateat.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeViewService {

    private final RecipeRepository recipeRepository;
    private final FridgeIngredientRepository fridgeIngredientRepository;

    public List<RecipeListResponseDto> getAllRecipes() {
        return recipeRepository.findAllWithTagsAndIngredients().stream()
                .map(RecipeListResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<RecipeListResponseDto> getFilteredRecipesByFridge(String userId, int minCount) {
        List<FridgeIngredient> fridge = fridgeIngredientRepository.findByUserId(userId);
        Set<String> myIngredients = fridge.stream()
                .map(i -> i.getIngredientName().trim())
                .collect(Collectors.toSet());

        return recipeRepository.findAllWithTagsAndIngredients().stream()
                .filter(recipe -> {
                    long matchCount = recipe.getIngredients().stream()
                            .map(i -> i.getName().trim())
                            .filter(myIngredients::contains)
                            .count();
                    return matchCount >= minCount;
                })
                .map(RecipeListResponseDto::fromEntity)
                .collect(Collectors.toList());
    }



}
