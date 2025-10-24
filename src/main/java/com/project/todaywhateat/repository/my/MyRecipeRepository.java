package com.project.todaywhateat.repository.my;

import com.project.todaywhateat.domain.my.MyRecipe;
import com.project.todaywhateat.repository.projection.MyRecipeSummaryProj;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MyRecipeRepository extends JpaRepository<MyRecipe, Long> {

    Page<MyRecipe> findByUser_IdOrderByUpdatedAtDesc(Long userId, Pageable pageable);

    // ✅ JPQL 프로젝션: 엔티티 필드명 그대로 사용 (imageUrl -> mainImageUrl 별칭 매핑)
    @Query("""
        select 
            mr.id   as id,
            mr.title as title,
            mr.imageUrl as mainImageUrl
        from MyRecipe mr
        where mr.user.id = :userId
        order by mr.id desc
    """)
    List<MyRecipeSummaryProj> findSummariesByUserId(@Param("userId") Long userId);
}
