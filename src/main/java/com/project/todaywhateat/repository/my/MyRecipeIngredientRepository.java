package com.project.todaywhateat.repository.my;

import com.project.todaywhateat.domain.my.MyRecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MyRecipeIngredientRepository extends JpaRepository<MyRecipeIngredient, Long> {
    List<MyRecipeIngredient> findByRecipe_IdOrderBySortOrderAsc(Long myRecipeId);
}