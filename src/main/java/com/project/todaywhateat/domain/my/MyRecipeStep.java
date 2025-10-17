package com.project.todaywhateat.domain.my;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

@Entity @Table(name="my_recipe_step")
@Getter @Setter
public class MyRecipeStep {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="my_recipe_id", nullable=false)
    private MyRecipe recipe;

    @Column(columnDefinition="TEXT", nullable=false) private String content;
    @Column(nullable=false) private int sortOrder = 1;
}