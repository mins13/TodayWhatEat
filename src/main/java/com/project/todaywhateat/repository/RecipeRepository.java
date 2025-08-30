package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.Recipe;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    boolean existsByTitle(String title);

    @EntityGraph(attributePaths = {"ingredients", "tags"})
    @Query("SELECT r FROM Recipe r")
    List<Recipe> findAllWithTagsAndIngredients();

    @Query("""
      select distinct r from Recipe r
      left join fetch r.ingredients ing
      where r.id = :id
    """)
    Optional<Recipe> findByIdWithIngredients(@Param("id") Long id);

    @EntityGraph(attributePaths = {"tags"})
    @Query("select r from Recipe r where r.id = :id")
    Optional<Recipe> findByIdWithTags(@Param("id") Long id);

    @Query("""
       select distinct r
       from Recipe r
         join r.tags t
       where r.id <> :id
         and t.name in :names
       """)
    List<Recipe> findSimilarByTags(@Param("id") Long id,
                                   @Param("names") Set<String> names,
                                   Pageable pageable);


    @Transactional
    @Modifying
    @Query("update Recipe r set r.likesCount = r.likesCount + :delta where r.id = :id")
    int addLikes(@Param("id") Long recipeId, @Param("delta") int delta);

    // 👀 조회수 +1
    @Transactional
    @Modifying
    @Query("update Recipe r set r.viewCount = r.viewCount + 1 where r.id = :id")
    int incViews(@Param("id") Long recipeId);

    // 🔀 정렬용
    @Query("select r from Recipe r order by r.likesCount desc, r.id desc")
    List<Recipe> findAllOrderByPopularity();

    @Query("select r from Recipe r order by r.viewCount desc, r.id desc")
    List<Recipe> findAllOrderByViews();

}
