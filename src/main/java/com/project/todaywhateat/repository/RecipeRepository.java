package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.Recipe;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    boolean existsByTitle(String title);

    @EntityGraph(attributePaths = {"ingredients", "tags"})
    @Query("SELECT r FROM Recipe r")
    List<Recipe> findAllWithTagsAndIngredients();

}
