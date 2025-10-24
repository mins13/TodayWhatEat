package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.dto.response.RecipeCardDto;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
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
    @Query("select r from Recipe r")
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
        left join fetch r.ingredients ing
        left join fetch r.steps s
        left join fetch r.tags t
      where r.id = :id
    """)
    Optional<Recipe> findDetailById(@Param("id") Long id);

    @Query("""
       select distinct r
       from Recipe r
         join r.tags t
       where r.id <> :id
         and t.name in :names
    """)
    Page<Recipe> findSimilarByTags(@Param("id") Long id,
                                   @Param("names") Set<String> names,
                                   Pageable pageable);

    @Transactional
    @Modifying
    @Query("update Recipe r set r.likesCount = r.likesCount + :delta where r.id = :id")
    int addLikes(@Param("id") Long recipeId, @Param("delta") int delta);

    @Transactional
    @Modifying
    @Query("update Recipe r set r.viewCount = r.viewCount + 1 where r.id = :id")
    int incViews(@Param("id") Long recipeId);

    @Query("select r from Recipe r order by r.likesCount desc, r.id desc")
    List<Recipe> findAllOrderByPopularity();

    @Query("select r from Recipe r order by r.viewCount desc, r.id desc")
    List<Recipe> findAllOrderByViews();

    Page<Recipe> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query("""
      select new com.project.todaywhateat.dto.response.RecipeCardDto(
        r.id, r.title, r.image,
        coalesce(r.likesCount, 0L),
        coalesce(r.viewCount, 0L)
      )
      from Recipe r
      order by
        case when :sort = 'views' then r.viewCount end desc,
        case when :sort <> 'views' then r.likesCount end desc,
        r.id desc
    """)
    Page<RecipeCardDto> findCards(@Param("sort") String sort, Pageable pageable);


}