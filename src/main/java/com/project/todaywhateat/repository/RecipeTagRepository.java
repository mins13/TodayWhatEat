package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.RecipeTag;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;



public interface RecipeTagRepository extends JpaRepository<RecipeTag, Long> {
    @Query("select t from RecipeTag t where t.recipe.id = :recipeId")
    List<RecipeTag> findByRecipeId(@Param("recipeId") Long recipeId);

    @Transactional @Modifying
    void deleteByRecipe_Id(Long recipeId);
}
