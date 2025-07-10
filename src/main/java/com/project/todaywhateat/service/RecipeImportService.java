package com.project.todaywhateat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.todaywhateat.dto.RecipeDto;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

//@Service
@RequiredArgsConstructor
public class RecipeImportService {

    private final RecipeService recipeService;

    @PostConstruct
    public void importRecipesFromJson() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        InputStream is = getClass().getResourceAsStream("/recipes.json");

        if (is == null) {
            System.out.println("❌ JSON 파일을 찾을 수 없습니다.");
            return;
        }

        List<RecipeDto> recipes = objectMapper.readValue(
                is,
                new TypeReference<List<RecipeDto>>() {}
        );

        int inserted = 0;
        for (RecipeDto recipe : recipes) {
            if (!recipeService.existsByTitle(recipe.getTitle())) {
                recipeService.saveRecipe(recipe);
                inserted++;
            }
        }

        System.out.println("✅ 중복 없이 저장된 레시피 수: " + inserted);
    }
}
