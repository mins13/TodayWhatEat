package com.project.todaywhateat.domain.draft;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="draft_step")
@Getter
@Setter
public class DraftStep {
    @Id @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch= FetchType.LAZY) @JoinColumn(name="draft_recipe_id")
    private DraftRecipe draft;

    private int stepOrder;

    @Column(columnDefinition="TEXT", nullable=false)
    private String content;
}