package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.Recipe;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
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

}
