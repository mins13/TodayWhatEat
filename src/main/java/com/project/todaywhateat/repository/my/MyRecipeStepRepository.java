package com.project.todaywhateat.repository.my;


import com.project.todaywhateat.domain.my.MyRecipeStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MyRecipeStepRepository extends JpaRepository<MyRecipeStep, Long> {
    List<MyRecipeStep> findByRecipe_IdOrderBySortOrderAsc(Long myRecipeId);
}