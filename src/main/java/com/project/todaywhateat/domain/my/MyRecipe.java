package com.project.todaywhateat.domain.my;

import com.project.todaywhateat.domain.User;
import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList; import java.util.List;

@Entity @Table(name="my_recipe")
@Getter @Setter
public class MyRecipe {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false) private String title;
    private String imageUrl;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(nullable = false) private String visibility = "PRIVATE";

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<MyRecipeIngredient> ingredients = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<MyRecipeStep> steps = new ArrayList<>();

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;

    public void bindChildren() {
        ingredients.forEach(i -> i.setRecipe(this));
        steps.forEach(s -> s.setRecipe(this));
    }
}