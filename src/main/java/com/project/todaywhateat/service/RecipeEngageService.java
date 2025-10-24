package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.RecipeLike;
import com.project.todaywhateat.repository.RecipeLikeRepository;
import com.project.todaywhateat.repository.RecipeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecipeEngageService {
    private final RecipeRepository recipeRepository;
    private final RecipeLikeRepository likeRepository;

    /** ✅ 좋아요 토글 후 캐시 전체 무효화 */
    @Transactional
    @CacheEvict(cacheNames = {"home:recipe-cards", "recipe:list"}, allEntries = true)
    public boolean toggleLike(String userId, Long recipeId) {
        if (likeRepository.existsByRecipe_IdAndUserId(recipeId, userId)) {
            likeRepository.deleteByRecipeIdAndUserId(recipeId, userId);
            recipeRepository.addLikes(recipeId, -1);
            return false;
        } else {
            var like = new RecipeLike();
            like.setUserId(userId);
            like.setRecipe(recipeRepository.getReferenceById(recipeId));
            likeRepository.save(like);
            recipeRepository.addLikes(recipeId, +1);
            return true;
        }
    }

    public boolean isLiked(String userId, Long recipeId) {
        return likeRepository.existsByRecipe_IdAndUserId(recipeId, userId);
    }

    /** ✅ 조회수 +1 후 캐시 무효화 */
    @Transactional
    @CacheEvict(cacheNames = {"home:recipe-cards", "recipe:list"}, allEntries = true)
    public void addViewOnce(Long recipeId, String userId, String viewKey) {
        recipeRepository.incViews(recipeId);
    }

    /** (선택) 개별 +1 API들을 계속 쓴다면 동일하게 두 캐시를 모두 비우기 */
    @Transactional
    @CacheEvict(cacheNames = {"home:recipe-cards", "recipe:list"}, allEntries = true)
    public void addLike(Long recipeId) {
        int updated = recipeRepository.addLikes(recipeId, 1);
        if (updated == 0) throw new IllegalArgumentException("레시피가 없습니다: " + recipeId);
    }

    @Transactional
    @CacheEvict(cacheNames = {"home:recipe-cards", "recipe:list"}, allEntries = true)
    public void increaseView(Long recipeId) {
        int updated = recipeRepository.incViews(recipeId);
        if (updated == 0) throw new IllegalArgumentException("레시피가 없습니다: " + recipeId);
    }
}
