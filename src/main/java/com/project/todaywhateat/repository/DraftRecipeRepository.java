package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.draft.DraftRecipe;
import com.project.todaywhateat.domain.draft.DraftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DraftRecipeRepository extends JpaRepository<DraftRecipe, Long> {
    Page<DraftRecipe> findByAuthorUserIdOrderByUpdatedAtDesc(String authorUserId, Pageable pageable);
    Page<DraftRecipe> findByStatusOrderByCreatedAtAsc(DraftStatus status, Pageable pageable);

    /** ✅ 나의 제출 목록(작성은 했지만 'DRAFT' 상태 제외) */
    Page<DraftRecipe> findByAuthorUserIdAndStatusNotOrderByUpdatedAtDesc(
            String authorUserId, DraftStatus status, Pageable pageable);

    /** ✅ 특정 MyRecipe에서 올린 최신 초안(있으면) */
    Optional<DraftRecipe> findTopByAuthorUserIdAndSourceMyRecipeIdOrderByUpdatedAtDesc(
            String authorUserId, Long sourceMyRecipeId);

    long countByStatus(DraftStatus status);


}
