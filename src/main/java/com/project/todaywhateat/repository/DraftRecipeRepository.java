package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.draft.DraftRecipe;
import com.project.todaywhateat.domain.draft.DraftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DraftRecipeRepository extends JpaRepository<DraftRecipe, Long> {
    Page<DraftRecipe> findByAuthorUserIdOrderByUpdatedAtDesc(String authorUserId, Pageable pageable);
    Page<DraftRecipe> findByStatusOrderByCreatedAtAsc(DraftStatus status, Pageable pageable);
}
