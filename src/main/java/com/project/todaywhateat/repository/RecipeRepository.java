package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    boolean existsByTitle(String title);  // 중복 방지용
}
