package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.response.RecipeListResponseDto;
import com.project.todaywhateat.service.view.RecipeViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeViewController {

    private final RecipeViewService recipeViewService;

    @GetMapping
    public List<RecipeListResponseDto> getAllRecipes() {
        return recipeViewService.getAllRecipes();
    }

    @GetMapping("/filter")
    public List<RecipeListResponseDto> getFilteredRecipes(
            @RequestParam String userId,
            @RequestParam int minCount) {
        return recipeViewService.getFilteredRecipesByFridge(userId, minCount);
    }

}
