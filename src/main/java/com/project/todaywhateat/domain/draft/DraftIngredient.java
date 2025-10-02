package com.project.todaywhateat.domain.draft;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="draft_ingredient")
@Getter
@Setter
public class DraftIngredient {
    @Id @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch= FetchType.LAZY) @JoinColumn(name="draft_recipe_id")
    private DraftRecipe draft;

    @Column(nullable=false)
    private String name;

    private String quantity;  // "1"
    private String unit;      // "개"
    private int sortOrder = 0;
}
