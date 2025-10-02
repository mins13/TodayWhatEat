package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    // 레시피 ID로 조회 + id 오름차순 정렬
    List<RecipeIngredient> findByRecipe_IdOrderByIdAsc(Long recipeId);
}
