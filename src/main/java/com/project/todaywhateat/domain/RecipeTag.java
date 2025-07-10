package com.project.todaywhateat.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recipe_tag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;
}
