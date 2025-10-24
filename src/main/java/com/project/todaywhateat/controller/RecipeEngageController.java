package com.project.todaywhateat.controller;

import com.project.todaywhateat.repository.RecipeRepository;
import com.project.todaywhateat.service.RecipeEngageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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


}
