package com.project.todaywhateat.controller;

import com.project.todaywhateat.service.RecipeEngageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recipes")
public class RecipeActionController {
    private final RecipeEngageService engageService;

    @PostMapping("/{id}/like")
    public void like(@PathVariable Long id) {
        engageService.addLike(id); // 캐시 자동 무효화
    }

    @PostMapping("/{id}/view")
    public void view(@PathVariable Long id) {
        engageService.increaseView(id); // 캐시 자동 무효화
    }
}
