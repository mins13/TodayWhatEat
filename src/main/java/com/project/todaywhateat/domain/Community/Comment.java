package com.project.todaywhateat.domain.Community;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="comments")
@Getter
@Setter
public class Comment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="post_id", nullable=false)
    private Post post;
    private Long userId; // nullable
    @Column(nullable=false, length=50) private String authorName;
    @Lob @Column(nullable=false)       private String content;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();
    @Column(nullable=false) private LocalDateTime updatedAt = LocalDateTime.now();
    @PreUpdate void onUpdate(){ this.updatedAt = LocalDateTime.now(); }
}