package com.project.todaywhateat.domain.my;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

@Entity @Table(name="my_recipe_ingredient")
@Getter @Setter
public class MyRecipeIngredient {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="my_recipe_id", nullable=false)
    private MyRecipe recipe;

    @Column(nullable=false) private String name;
    private String quantity;
    private String unit;
    @Column(nullable=false) private int sortOrder = 1;
}