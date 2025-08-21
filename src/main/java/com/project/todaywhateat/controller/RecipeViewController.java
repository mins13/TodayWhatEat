package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.RecipeDto;
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



    @GetMapping("/{id}")
    public RecipeDto getRecipeById(@PathVariable Long id) {
        return recipeViewService.getRecipeDetail(id);  // ✅ 목록 DTO → 상세 DTO로 변경
    }

    @GetMapping("/{id}/recommendations")
    public List<RecipeListResponseDto> getRecommendations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "3") int limit
    ) {
        return recipeViewService.getRecommendationsByTags(id, limit);
    }



}
