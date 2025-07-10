package com.project.todaywhateat.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recipe_ingredient")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String amount;

    @ManyToOne
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;
}
