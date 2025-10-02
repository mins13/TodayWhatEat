package com.project.todaywhateat.domain.draft;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="draft_recipe")
@Getter
@Setter
public class DraftRecipe {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String authorUserId;          // 제출자 (JWT의 username/ID)

    @Column(nullable=false)
    private String title;

    @Column(columnDefinition="TEXT")
    private String description;

    private String imageUrl;

    @Column(columnDefinition="TEXT")
    private String tags;                  // "혼밥,간단"

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private DraftStatus status = DraftStatus.DRAFT;

    @Column(columnDefinition="TEXT")
    private String rejectionReason;

    private Long publishedRecipeId;       // 승인된 실제 레시피 ID

    @OneToMany(mappedBy="draft", cascade=CascadeType.ALL, orphanRemoval=true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<DraftIngredient> ingredients = new ArrayList<>();

    @OneToMany(mappedBy="draft", cascade=CascadeType.ALL, orphanRemoval=true)
    @OrderBy("stepOrder ASC")
    private List<DraftStep> steps = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void setChildrenOwner() {
        ingredients.forEach(i -> i.setDraft(this));
        steps.forEach(s -> s.setDraft(this));
    }
}