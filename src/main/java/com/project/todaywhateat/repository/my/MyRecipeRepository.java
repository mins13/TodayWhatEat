package com.project.todaywhateat.repository.my;

import com.project.todaywhateat.domain.my.MyRecipe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyRecipeRepository extends JpaRepository<MyRecipe, Long> {
    Page<MyRecipe> findByUser_IdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
}