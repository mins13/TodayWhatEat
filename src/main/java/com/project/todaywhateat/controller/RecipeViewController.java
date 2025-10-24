package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.dto.RecipeDto;
import com.project.todaywhateat.dto.response.RecipeCardDto;
import com.project.todaywhateat.dto.response.RecipeListResponseDto;
import com.project.todaywhateat.repository.RecipeRepository;
import com.project.todaywhateat.service.view.RecipeListPageService;
import com.project.todaywhateat.service.view.RecipeViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeViewController {

    private final RecipeViewService recipeViewService;
    private final RecipeListPageService recipeListPageService;   // ✅ 주입
    private final RecipeRepository recipeRepository;

    /** (선택) 예전 전체목록 API를 쓰려면 경로 분리 */
    @GetMapping("/all")
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
        return recipeViewService.getRecipeDetail(id);
    }



    @GetMapping("/{id}/raw")
    public RecipeListResponseDto getRecipe(@PathVariable Long id) {
        Recipe recipe = recipeRepository.findByIdWithIngredients(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 없습니다: " + id));
        return RecipeListResponseDto.fromEntity(recipe);
    }

    @GetMapping
    public ResponseEntity<Page<RecipeCardDto>> list(
            @RequestParam(defaultValue = "popular") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        Page<RecipeCardDto> body =
                recipeListPageService.getCards(sort, page, size);

        // 선택: 클라이언트/프록시 캐시 10분
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(10, TimeUnit.MINUTES).cachePublic())
                .body(body);
    }


    @GetMapping("/{id}/recommendations")
    public ResponseEntity<List<RecipeListResponseDto>> getRecommendations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "3") int limit
    ) {
        try {
            return ResponseEntity.ok(recipeViewService.getRecommendationsByTags(id, limit));
        } catch (Exception e) {
            // log.warn("recommendations failed id={}, limit={}", id, limit, e);
            return ResponseEntity.ok(List.of()); // 500 대신 200 + []
        }
    }


}
