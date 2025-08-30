package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.dto.response.RecipeListResponseDto;
import com.project.todaywhateat.repository.RecipeRepository;
import com.project.todaywhateat.service.RecipeEngageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeEngageController {
    private final RecipeEngageService service;
    private final RecipeRepository recipeRepository;

    // 좋아요 토글
    @PostMapping("/{id}/like/toggle")
    public Map<String,Object> toggleLike(@PathVariable Long id,
                                         @AuthenticationPrincipal String userId) { // ✅ expression 제거
        boolean liked = service.toggleLike(userId, id);
        long likes = recipeRepository.findById(id).orElseThrow().getLikesCount();
        return Map.of("liked", liked, "likes", likes);
    }

    // 좋아요 상태
    @GetMapping("/{id}/like/status")
    public Map<String,Object> likeStatus(@PathVariable Long id,
                                         @AuthenticationPrincipal String userId) { // ✅
        boolean liked = service.isLiked(userId, id);
        long likes = recipeRepository.findById(id).orElseThrow().getLikesCount();
        return Map.of("liked", liked, "likes", likes);
    }

    // 조회수 +1 (프론트에서 뷰 1회 판단 후 호출)
    @PostMapping("/{id}/view")
    public Map<String,Object> addView(@PathVariable Long id,
                                      @RequestHeader(value="X-View-Key", required=false) String viewKey,
                                      @AuthenticationPrincipal String userId) { // ✅
        service.addViewOnce(id, userId, viewKey);
        long views = recipeRepository.findById(id).orElseThrow().getViewCount();
        return Map.of("views", views);
    }

    // 정렬 목록(popular | view | default)
    @GetMapping(params = "sort")
    public List<RecipeListResponseDto> list(@RequestParam(defaultValue = "popular") String sort) {
        List<Recipe> list = switch (sort) {
            case "view"     -> recipeRepository.findAllOrderByViews();
            case "popular"  -> recipeRepository.findAllOrderByPopularity();
            default         -> recipeRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
        };
        return list.stream().map(RecipeListResponseDto::fromEntity).toList();
    }
}
