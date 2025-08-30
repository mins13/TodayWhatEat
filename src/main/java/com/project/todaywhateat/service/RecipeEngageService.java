package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.RecipeLike;
import com.project.todaywhateat.repository.RecipeLikeRepository;
import com.project.todaywhateat.repository.RecipeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecipeEngageService {
    private final RecipeRepository recipeRepository;
    private final RecipeLikeRepository likeRepository;

    @Transactional
    public boolean toggleLike(String userId, Long recipeId) {
        if (likeRepository.existsByRecipe_IdAndUserId(recipeId, userId)) {
            likeRepository.deleteByRecipeIdAndUserId(recipeId, userId);
            recipeRepository.addLikes(recipeId, -1);
            return false; // now unliked
        } else {
            RecipeLike like = new RecipeLike();
            like.setUserId(userId);
            // 영속 프록시로 참조 세팅 (쿼리 안나감)
            like.setRecipe(recipeRepository.getReferenceById(recipeId));
            likeRepository.save(like);
            recipeRepository.addLikes(recipeId, +1);
            return true; // now liked
        }
    }

    public boolean isLiked(String userId, Long recipeId) {
        return likeRepository.existsByRecipe_IdAndUserId(recipeId, userId);
    }

    @Transactional
    public void addViewOnce(Long recipeId, String userId, String viewKey) { // ✅ userId를 String으로
        // 여기서는 중복 조회 방지 로직을 프론트에서 처리하므로 단순 +1
        recipeRepository.incViews(recipeId);
    }
}
