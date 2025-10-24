// src/main/java/com/project/todaywhateat/domain/Recipe.java
package com.project.todaywhateat.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "recipes")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String title;

    // 프론트의 mainImageUrl에 대응되는 실제 컬럼
    private String image;

    // 🔹 작성자 식별자(로그인 사용자 id와 매칭)
    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "likes_count", nullable = false)
    private long likesCount;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    /* ===== 연관관계 ===== */
    @OneToMany(mappedBy = "recipe",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    @BatchSize(size = 100)
    @JsonIgnore
    @Builder.Default
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @OneToMany(mappedBy = "recipe",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC")
    @BatchSize(size = 100)
    @JsonIgnore
    @Builder.Default
    private List<RecipeStep> steps = new ArrayList<>();

    @OneToMany(mappedBy = "recipe",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    @BatchSize(size = 100)
    @JsonIgnore
    @Builder.Default
    private Set<RecipeTag> tags = new HashSet<>();
}
