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

    private String image;

    @Column(name = "likes_count", nullable = false)
    private long likesCount;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    /* ===== 연관관계 (단 한 번만 선언) ===== */
    @OneToMany(mappedBy = "recipe",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    @BatchSize(size = 100)
    @JsonIgnore        // 리스트 응답에서 지연 로딩 방지
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
