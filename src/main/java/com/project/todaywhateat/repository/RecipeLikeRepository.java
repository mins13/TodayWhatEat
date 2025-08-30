package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.RecipeLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.transaction.Transactional;

public interface RecipeLikeRepository extends JpaRepository<RecipeLike, Long> {

    // 파생쿼리는 연관 필드 경로에 '_' 사용
    boolean existsByRecipe_IdAndUserId(Long recipeId, String userId);

    @Transactional @Modifying
    @Query("delete from RecipeLike rl where rl.recipe.id = :recipeId and rl.userId = :userId")
    int deleteByRecipeIdAndUserId(@Param("recipeId") Long recipeId,
                                  @Param("userId") String userId);

    long countByRecipe_Id(Long recipeId);
}
