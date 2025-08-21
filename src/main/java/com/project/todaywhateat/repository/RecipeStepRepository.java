package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.RecipeStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecipeStepRepository extends JpaRepository<RecipeStep, Long> {
    @Query("""
      select s from RecipeStep s
      where s.recipe.id = :recipeId
      order by s.stepOrder asc
    """)
    List<RecipeStep> findByRecipeIdOrderByStep(@Param("recipeId") Long recipeId);
}
